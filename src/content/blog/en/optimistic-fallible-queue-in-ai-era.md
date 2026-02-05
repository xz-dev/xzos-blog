---
source_hash: "2a08119f"
title: "Optimistic and Fail-able Queues in the AI Era"
pubDate: "2026-02-04"
description: "Thoughts on fixing concurrent write issues for MCP's official Memory Server: When users shift from humans to AI, we can proactively embrace probabilistic approaches."
author: "xz-dev"
category: "AI"
tags: ["AI", "MCP", "System Design", "Chaos Testing", "Concurrency Control"]
---

> This article stems from reflections while fixing concurrent write issues for MCP's official Memory Server [PR #3286](https://github.com/modelcontextprotocol/servers/pull/3286).
>
> Background: AI frequently calls MCP for memory storage, and simultaneous writes to the same file by multiple AI clients can directly corrupt the file format.

## Choosing a Solution

The obvious choice: pessimistic locking.

How could we possibly allow memory—something so important—to be lost or fail during read/write operations?

But does MCP itself need to guarantee this? If we think of MCP Tool as the internet and AI as the application layer, MCP only needs to provide a "best-effort" service.

The core issue: concurrent writes corrupt files, while reads far outnumber writes. If we queue both reads and writes with locks, we're essentially implementing pessimistic locking—the most conservative and "reliable" approach, but one that completely forgets MCP Tool's original purpose: it's a tool designed for AI.

### Write-Only Locking

What if we only lock writes?

Two immediate problems arise:

1. Read-write disorder
2. Heavy writes/slow IO will cause timeout failures (you could remove timeouts, but MCP Client will inevitably have them. When AI encounters timeouts, it will retry—turning into users repeatedly pressing request buttons to DDoS your server)

The essence of these problems: uncertainty in final states.

But AI is inherently built to handle uncertainty. When AI reads code or documents, it's transforming complex, uncertain "noise" into concise answers.

So how would AI handle these issues?

**Read-write disorder**: If AI finds that a write succeeded but the read data is incorrect (read-before-write), it will simply read again—no big deal.

**Timeouts**: If the MCP function times out, AI will retry—again, no big deal.

## Design

### AI's Stability Prerequisite

But all this depends on MCP's behavior being "stable"—failed operations must return failures, not silence, and successful operations must return success. Otherwise, AI will start DDoSing, making everything worse.

At the code level, this means distinguishing between "lock acquisition failure" and "business logic failure"—these send different signals to AI.

### Usage Scenarios

MCP SDK follows JSON-RPC's out-of-order sending standard, so even single AI Clients can fail. This is why [PR #3060](https://github.com/modelcontextprotocol/servers/pull/3060) exists.

But obviously, multiple AI Clients are the norm.

The problem: When MCP Server uses stdio transport, it launches a separate process for each AI client:

```
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│  Claude Code    │   │   Claude Code   │   │   Claude Code   │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│mcp-server-memory│   │mcp-server-memory│   │mcp-server-memory│
│   (Process A)   │   │   (Process B)   │   │   (Process C)   │
│ [In-memory lock]│   │ [In-memory lock]│   │ [In-memory lock]│
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └──────────┬──────────┴──────────┬──────────┘
                    ▼                     ▼
              ┌─────────────────────────────────┐
              │         memory.json             │
              │   (STILL VULNERABLE TO RACES!)  │
              └─────────────────────────────────┘
```

[PR #3060](https://github.com/modelcontextprotocol/servers/pull/3060) uses in-memory locks—each process has its own lock, unaware of others. So multiple AI clients writing to the same file can still corrupt it.

### Solution

We can't rely on in-memory locks since they're hard to share across processes.

Instead, we can use filesystem-based locks. Since we're not refactoring the storage layer, SQLite and Redis are off the table—a simple file lock suffices.

So we finally start coding—it's straightforward: a file lock.

The logic code is complete.

## Writing Tests

### Stress Testing

How can we have locks without stress tests? Here's how we design them.

Core principle: Successes must succeed, failures must fail.

We need a test to stress our local filesystem (preferably a slow one, not memfs), then set extremely low timeouts when IO load spikes.

Initially, I called this "chaos testing," but "stress testing" is more accurate—chaos testing typically injects random failures, while we're applying controlled high concurrency.

I designed two stress tests:

1. **Single-process concurrency**: 10 threads performing 1000 async writes
2. **Multi-process concurrency**: 5 independent processes, each writing 2000 times, simulating real multi-AI-client scenarios

Success criteria: Verify that the memory file contains all successfully written data and nothing else—only successful data exists.

#### Necessity of Stress Testing

Prevent failure spirals where the system degrades uncontrollably until service stops.

1. Retry-induced self-DDoS
2. Failed state updates leading to cascading failures—like [Cloudflare's November 2025 outage](https://blog.cloudflare.com/18-november-2025-outage/), where a key lesson was quickly stopping "failure" propagation.

#### Informing the Solution

High-latency IO reminds us of NFS.

Lock configuration must consider NFS compatibility (it might run on NFS, so we must avoid timeout-induced infinite failures):

Why set stale timeout to 60 seconds? NFS has an acregmax attribute cache defaulting to 60 seconds. If stale is shorter, another process might see a 50-second-old cached file modification time and mistakenly think the lock expired—when it's still active.

Heartbeat at 10 seconds keeps the lock "fresh," ensuring it isn't falsely judged as expired despite NFS caching delays.

Exponential backoff retry: Starts at 50ms for fast local locks; caps around 51s for high-latency NFS—sufficient.

For local disks, these settings are harmless—the only cost is waiting 60 seconds (not 10) for lock release after a crash, which is acceptable.

### Chaos Testing

A thought experiment (no code—too many tests might block the PR).

Scenario: MCP Tool crashes mid-write to the memory file.

Result: Memory file corruption.

#### Informing the Solution

Thus, we need atomic writes.

I initially implemented: write to a temp file, then rename. Simple, but edge cases complicate things.

Core issue: `fs.rename` depends on filesystem implementations. On most journaling filesystems (ext4, XFS, NTFS), rename is atomic—either complete or nonexistent. But only if **source and target are on the same filesystem**.

If the temp file is in `/tmp` and the target in `/home` (likely different mounts), `fs.rename` degrades to "copy + delete"—atomicity vanishes.

Solution: Temp files must reside in the target directory. But this introduces new problems: naming collisions, permission inheritance, cleanup... Too many edge cases, so we switched to a third-party library (write-file-atomic).

Notably, I disabled post-write fsync (which ensures writes survive power loss). Why? Because tests showed fsync increased write times from 3ms to 300ms on Windows—slowing our already-slow locks and increasing failures under high IO load.

This is a tradeoff: Accept tiny power-loss risks for fewer timeout failures.

More importantly, it's about responsibility boundaries. Ensuring filesystem consistency after power loss is the OS's job, not the application's. Infinite responsibility expansion leads to bloated software.

## Conclusion

Before, we "had to" accept probabilistic behavior. Now, we can "proactively embrace" it—because users have shifted from humans to AI.

Where software once needed machine-like precision, it can now operate probabilistically. This isn't regression—it's liberation, because AI users themselves work probabilistically.

Thus, AI-native software tests shouldn't verify "absolute correctness," but "reliable probability distributions + clear failure signals."

This is why queues can be optimistic and locks can fail—as long as we guarantee: successes succeed, failures fail, never silent.

Be optimistic, but avoid failure spirals.