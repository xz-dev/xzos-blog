---
source_hash: "cd66d5cf"
title: "The Revolution of Manual Testing in the AI Era"
pubDate: "2025-07-18"
description: "While GitHub Copilot was automating manual testing for me, I invented an AI Agent for manual testing. Explore how to leverage AI tools to enhance testing efficiency."
author: "xz-dev"
category: "AI"
tags: ["AI", "AI Agent", "MCP", "Prompt"]
---

> While I was writing this document, GitHub Copilot was automating manual testing for me
>
> You could say I invented an AI Agent for manual testing.

## Preface

Since GPT emerged, many have claimed programmers will become obsolete. But few have noticed that software testing is actually the first internet profession impacted by this era.

I predict that, like power plant workers, software test engineers will transition from hands-on practitioners to supervisors of AI testing - but humans won't disappear from this field.

<!--more-->

## Background

As you may know, I'm a programmer.

Originally, I was developing an AI-powered tool for Microsoft that automatically generates automated test code. But one day, leadership suddenly decided we couldn't complete the program within the 20-day deadline. So I was assigned an "urgent" temporary testing task: manually test 400 Microsoft Graph API endpoints within 20 days.

This wasn't difficult per se, but required carefully studying how to call each endpoint, understanding their purposes, and setting up pre-test environments - none of which was simple.

Moreover, I hate manual work. Manual means intently wasting time learning skills and knowledge I'll never use again.

## Solution

### Premises

- I must perform manual testing - automating 400 endpoints would require staggering amounts of code, including error redundancy and auto-generated documentation
- I must not actually perform manual testing
- When AI makes mistakes, I need to correct it immediately

So what does this look like? Exactly - AI-assisted programming tools.

### Approach

- Which AI to use: GitHub Copilot
- Documentation tool: VSCode, pandoc (markdown to docx)
- Helping AI understand requirements: Separate prompt.md and example.md format documents
- Enabling AI to operate testing tools: MCP tools (playwright, which wasn't good enough)

### Implementation

#### MCP Tools

##### [Auto Azure Export](https://github.com/MS-Xiangzhe/auto_azure_export)

playwright-mcp was sufficient, but considering the massive documentation and test cases, it wasn't ideal for specific requirements.

As a mediocre prompt engineer, I needed AI to access minimal data to prevent wild mistakes.

So I spent an hour using GitHub Copilot to create a playwright-based MCP wrapper with only essential functions:

- Set request URL
- Set request method (GET/POST/...)
- Set request body
- Click send button
- Get HTTP status code
- Get HTTP response body

##### [Playwright MCP](https://github.com/microsoft/playwright-mcp)

Allows AI to consult documentation when encountering issues.

### Optimization

#### prompt.md

Express thoughts conversationally with one idea per line:

```
You are a professional tester needing to test Microsoft Graph API documentation.
You must use MCP tools for testing.
Before starting, explain how you'll begin.
Complete only one API endpoint's testing and documentation at a time, then ask if I want to continue.
Use mem.json to remember/update important knowledge.
...
```

Then let AI optimize this prompt itself. It will review all files and restate instructions in its own understandable format, like numbering test steps 1. 2. ...

prompt.md's key role is establishing strict standardization. No matter how many times conversations restart, AI maintains consistent workflow - foundational for large-scale application.

##### Key Prompts

- Role (current AIs are hybrid experts - ensure yours always invokes the right specialized model while saving token search time)
- Restate before starting (prevents AI from going rogue and wasting tokens)
- Complete only small tasks at once (prevents AI from suddenly rambling/crashing/network errors... wasting your time)

#### mem.json

Lets AI improve gradually like human testers, becoming increasingly accurate.

Through mem.json mechanism, AI transforms from "memory-less" tool to "learning assistant" that accumulates experience and avoids repeating mistakes.

This makes AI testing efficiency increase over time.

#### Complete System

![AI Agent for Test: VSCode + GitHub Copilot + MCP](/images/blog/ai-driven-manual-testing-revolution/diagram.png)

## Try It Out

[Download sample project azure_graph_api.zip](https://web.archive.org/web/20250813221116/https://xzos.net/wp-content/uploads/2025/07/azure_graph_api.zip)

Unzip it, check ai_prompt/ask_ai.txt, use sonnet 4, and experience the "magic."

## Summary

- First determine your AI model and stick with it. For prompts, the model matters. Same prompts might make GPT o4 start rambling.
- Prompts are "memory." For AI, prompts are crucial. AI isn't human - they can't truly "remember" through conversation. We need files to help.
- Know when to abandon your AI. When it suddenly acts dumb, don't try to "save" your context. Restart with your docs and mem.json.
- AI isn't great at following rules. Often it improvises, hence needing points 2 and 3 plus a less "intelligent" MCP.

### Further Improvements?

- More automation. Deploy a local AI Agent to automate VSCode GUI inputs ("continue" clicks), monitor Copilot, and alert us when errors occur - achieving the "supervisor" era of manual testing.
- Custom MCP for documentation formatting. For long-term tools, implement doc-generation MCP since you won't want AI randomly changing formats or needing constant monitoring.

### The Future?

I believe future AI will recognize when to write its own MCPs to standardize its behavior.

## Final Thoughts

Perhaps someday, computing power will make program optimization unnecessary, with AI generating all code. GitHub or similar platforms may shift focus from sharing code logic to sharing prompts and AI models.