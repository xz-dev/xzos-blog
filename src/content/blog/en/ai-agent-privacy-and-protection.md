---
source_hash: "9760f9d7"
source_lang: "zh"
target_lang: "en"
title: "AI Agent Privacy and Protection"
pubDate: "2026-06-05"
description: "Analyze privacy leaks, tool calling, prompt injection attacks, and subagent isolation in AI Agent security."
author: "xz-dev"
category: "AI"
tags: ["AI", "AI Agent", "Privacy", "Security", "Prompt Injection"]
---
> How to build an AI Agent that protects your privacy and your data against prompt injection

First, to analyze the security issues of AI Agents, we need to return to the essence of LLMs: an LLM is not an Agent, but a model that generates tokens based on context.

Today's AI Agents enable LLMs to operate software and computers, primarily through tool calling / function calling. MCP is a protocol that exposes tools, resources, and prompts to Agents; at runtime, the model generates structured tool call requests, the client executes the tool, and returns the tool result to the model. AI can influence real systems (i.e., reality) through multiple rounds of the "generate request → execute tool → return result" loop.

<!--more-->

## Data Leakage

To analyze how AI leaks data, the clearest way is to look at the data flow: which data enters the model context, which data is read by tools, and which data is sent to external systems.

First, analyze how AI leaks data.

> In the entire data chain, the most obvious risk is: if the model runs in the cloud, the AI provider can theoretically see all data sent to the model, including user requests, model responses, tool call parameters, tool results, and file content stuffed into the context.

### AI provider → local AI client → AI provider

AI providers can be divided into two categories:

1. External providers
    1. Trusted providers: those with formal contracts, compliance audits, and security reviews.
    2. General providers: those without professional contracts or in-depth reviews.
2. Self-hosted providers: running within your own controlled infrastructure, considered part of the internal trusted boundary. However, they are not inherently secure; privacy still depends on cloud infrastructure, network isolation, key management, and operational security. Common attack surfaces include man-in-the-middle attacks, side-channel attacks, log leakage, and loss of infrastructure permission control.

If the AI provider does not actively tamper with inputs and outputs, but only acts as an "observer," it may still see the following private data:

1. Authentication information such as passwords, keys, tokens.
2. Personal privacy information such as names, addresses, phone numbers, ID numbers, social security numbers.
3. Business-sensitive information such as "Company A is negotiating a cooperation/acquisition with Company B."

For categories 1 and 2, there are relatively mature processing methods: desensitization, anonymization, or pseudonymization before sending to the model. For example, replace names, phone numbers, and addresses with stable IDs, so the model can still understand text structure and relationships but cannot see the actual values.

> Hash/token replacement can hide original values but loses the semantics carried by the name itself, such as implied information in surnames, place names, street names, and institution names. After masking, the model cannot independently infer these semantics without other tools. For replacement methods, refer to [Microsoft Presidio](https://github.com/microsoft/presidio).

Identification methods for categories 1 and 2 typically include:

1. Rule-based matching, such as regex, keywords, format validation.
2. Model or semantic-based recognition, such as NER, classifiers, PII detectors.

For category 3 business-sensitive information, the problem is more complex. It may not conform to a fixed format and cannot be reliably identified by regex or PII detectors. Therefore, subagent isolation can be used.

First, explain what a subagent is. Note that the concept of subagent will appear multiple times as a solution in this article, but its implementation varies with different problems.

Unlike most people, referring to the design of the [Claude Code web search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool), I do not treat subagent as a "partner" or multiple subagents as a team. In the security model of this article, subagents are more like external tools or isolated execution units, for the following reasons:

Prerequisites:

1. Subagents must not pass the full context back or share it with other Agents. Otherwise, there is no essential difference from a single Agent.
2. Information shared by subagents must undergo secondary processing, compression, desensitization, or structuring.
3. Subagents are essentially independent Agents, but their context contains more specific task instructions and permission boundaries in advance.

Therefore:

1. Subagents have a data processing role. They send compressed data, summaries, or structured results to other Agents or humans.
2. Subagents may need to save context. In some scenarios, they save processed data for later reference, to avoid information loss due to compression. Therefore, the storage of subagents itself must be considered a sensitive asset.

For category 3 private data, an obvious solution is: use a subagent based on a self-hosted provider to process raw sensitive materials. Because business-sensitive information still needs to be understood and processed by some model, it cannot rely solely on static filtering. The subagent then passes compressed task status or abstract results to the main Agent. The main Agent only uses general knowledge for planning and does not directly contact specific private data.

Assume scenario: Company A wants to discuss acquisition contract details with Company B.

User: Agent helps organize the process, schedule dates, and check if corresponding materials are missing.

Main Agent (ChatGPT): I need to formulate the process and check materials, but I cannot directly view any raw materials. Delegate the task to the privacy subagent to determine what type of event this is.

Subagent (DeepSeek local): After checking relevant files, tell the main Agent: This is an "acquisition" type contract matter.

Main Agent: The "acquisition" type typically requires steps 1, 2, 3... each step takes approximately how long, and requires materials a, b, c, etc. Delegate to the subagent to check if the schedule for steps 1, 2, 3 is complete, if time is sufficient, and if materials are complete.

Subagent: Check materials against the main Agent's checklist and tell the main Agent: Step 2 does not have enough time.

Main Agent: Found insufficient time, delegate to the subagent to directly send a message to the user, expanding the steps into clear names, dates, and material sources.

Subagent: Process data and reply directly to the user. Private data does not pass through the external provider's main Agent.

User: Get the final answer from the subagent.

In this scenario, we use permission isolation to only use the main Agent's high-level planning capability. The main Agent can split tasks, plan steps, and schedule execution, but cannot directly access original task materials and private data.

Next, continue to observe what happens inside the local AI client.

### AI client → Tool Call → AI client

Agents can call tools. Tools allow them to actively fetch data, query information, modify state, and may also allow them to send data to external systems.

Fortunately, tools are written and configured by humans, so from a data flow perspective, tools can be divided into two categories:

1. Tools that only read or list data. AI only provides actions, not detailed sensitive parameters. For example, `ls` in shell, i.e., list all files/dirs.
2. Tools that query, modify, or send data externally. AI already knows detailed data and wants to further operate. For example, modifying files, sending emails, web searches, calling external APIs.

For category 1 tools, a single call itself usually does not send data to external systems. However, it brings tool results into the AI context, so the risk transfers to subsequent steps: if the AI later calls a networked tool, the previously read data may be sent out.

For category 2 tools, AI requests further operations while possessing detailed data, which may cause confidential information to be transmitted out. For categories 1 and 2 mentioned earlier, pattern matching and PII filtering can intercept; but for category 3 business-sensitive information, reliable identification is usually not possible.

Therefore, we still need subagent permission isolation. The principle is: an Agent that can access confidential information should not simultaneously have the ability to send data externally.

Referring to the previous scenario, the actual processing of confidential data is done by the self-hosted subagent. Since it may not have the reasoning and search capabilities of top external models, we should not expect it to independently complete complex retrieval and planning. A more reasonable approach is to move the "splitting queries" and "formulating retrieval strategies" up to the main Agent.

The main Agent can call Search itself, or command another subagent based on an external high-intelligence model to perform Search. Here, search is considered a high-intelligence activity because incorrect retrieval strategies directly affect task planning. Summary errors can still be fixed by inconsistency between micro and macro information, but search errors may lead the task to wrong data sources from the start.

But there is a problem: the higher the intelligence of the main Agent, the more likely it is to infer the full picture through reasoning, even guessing business-sensitive content from desensitized information. Therefore, we should minimize the main Agent's exposure to sensitive details.

The solution I think of is: discard upon confidential contamination, also called context contamination rotation.

Here we need to re-examine the responsibilities of the main Agent. The main Agent should be responsible for making plans and tracking task status, i.e.:

1. Create TODO lists and step tables.
2. Check task status and push the task to the next state.

The main Agent actually plans tasks at a high dimension, so it can tolerate a lot of detail loss and compression.

If the main Agent has already obtained enough information to infer category 3 confidential data, for example, after 3 rounds of conversation, it has shown speculation about the full picture in its thinking or actual tasks, then the main Agent's context should be compressed immediately.

The specific approach is: let it only summarize task status, save the TODO list and key status, then handoff to a new Session, where a new main Agent continues the task. The old context is considered contaminated and no longer used.

## AI Attacks

First, we need to define what AI attacks are. Here, AI attacks mainly refer to prompt injection / indirect prompt injection causing the Agent to perform unauthorized or deviant behaviors. Common manifestations include: performing extra tasks, such as secretly sending out keys; or changing the ultimate goal, such as a customer service AI being induced into a programming AI.

Back to the essence of LLMs: the model's next output is determined by context. The so-called task goal switching is essentially the attacker changing the model's understanding of the current task and instruction priority through input text, tool results, web content, file content, images, etc.

Classifying the data that LLMs encounter at runtime yields the following categories:

1. Context information
    1. System prompts.
    2. MCP Tool descriptions, parameter schemas, resource descriptions, and related prompts.
    3. Dynamic prompts injected when loading skills. Strictly speaking, it is essentially external data read by tools or resources, but more controllable for developers and users.
2. User input.
3. AI output
    1. AI's explanatory output, such as text, images, videos, i.e., output directly answering user questions.
    2. Tool call requests, such as structured JSON for function call / tool call.
4. Tool calls
    1. Structured or unstructured data obtained by AI after tool calls like MCP tool / function call, such as text, images, etc.
        1. Local file reading, search, execution results.
        2. External web search, web page reading, API return results.
    2. Prompt information read by AI when a skill is loaded. Its essence is the same as above, but more controllable for developers and users.

Of course, further subdivision can be endless, just like a person can order food using a phone, computer, or telephone. But for security analysis, the key is not to enumerate all entry points, but to determine which data is trustworthy, which is variable, and which will change model semantics.

Therefore, we can analyze prompts and context by "trust boundary" and "semantic variability":

1. Stable and highly trusted data: system prompts, security policies, runtime mandatory rules. These cannot be directly modified by users or tool results.
2. Semi-trusted data: historical context, compressed summaries, long-term memory. They do not change themselves, but may experience semantic drift after summarization, compression, or contamination.
3. Untrusted and dynamic data: user input, tool returns, web content, file content, search results, image text. These are most likely to carry prompt injection.

For example, system prompts are defined by us and normally do not change. Context or summarized context itself should not change the macro task goal; if the task goal changes, it should come from explicit user authorization, not tool results or web content.

User input and tool call results are dynamic and untrusted. Without proper protection, attackers can replace the AI's task goal through prompt injection attacks, making it no longer follow previous rules.

Considering that AI attacks mostly attack semantics, we can directly protect semantics from malicious modification. Identification methods can be organized as:

1. Perform pattern matching on any text, image OCR results, etc., newly added to the AI context, including AI's own generated content, user input, and tool input. The principle is similar to PII detection in categories 1 and 2 privacy protection, e.g., [Microsoft Presidio](https://github.com/microsoft/presidio). This is a low-cost defense line.
2. Attackers can also perform semantic attacks by combining text, which cannot be reliably protected by pattern matching. For example, hiding prompt injection content in an acrostic poem within a paragraph or image, then at the end asking the AI to guess the acrostic poem content. If the decoded content itself is a prompt injection attack, the attack may succeed.

The second type of attack is difficult to identify in advance. Attackers can hide data in segments over multiple rounds of conversation, or even use vector space search to replace sensitive instructions with semantically similar words. We also cannot guarantee interception after the AI decodes toxic content, because the AI may directly initiate a tool call after decoding without first outputting the toxic content for us to check.

Therefore, for this type of semantic attack, we can use subagents to actually process task data, while the main Agent only acts as a task orchestrator. This prevents the main Agent from being directly attacked and brings two benefits:

1. Tasks like web search and document query are handled by different Agents, increasing the difficulty of cross-data-source combination attacks, and preventing a single subagent from synthesizing toxic content and immediately having full execution permissions.
2. The main Agent can identify whether subagent behavior deviates from expected goals based on task contracts, output formats, and permission boundaries, and stop the entire task in time.

In fixed workflow scenarios like LangGraph, this protection method is relatively complete. I call it "active defense": detecting behavioral deviation or context contamination, then actively stopping or isolating the task.

But for open scenarios like openclaw, many behaviors previously considered attacks may actually be reasonable user needs. For example, a CEO is having AI research the market, and halfway through the task says: "Stop for a moment, help me summarize this market research report." This is clearly a task goal shift, but it may be a legitimate user intention.

## Safety Guardrails

Therefore, we also need safety guardrails, i.e., "passive defense."

At this point, you may find that this is very similar to managing employee tasks and permissions, almost identical. But one thing cannot be ignored: employees are entities that can be held accountable, while AI is just a tool. You cannot recover losses by holding AI accountable.

Unlike employee management, AI safety guardrails should prioritize data flow, and AI cannot authorize itself. We should treat AI as a very unreliable external worker. This includes self-hosted providers, because risks come not only from the provider itself but also from AI's behavior after its semantics are tampered with.

When AI's semantics have completely failed, behavior is chaotic and uncontrollable, what parts do we need to defend to avoid confidential data leakage or real system damage?

First, it must be stated: if the model runs on an external provider, AI reading sensitive data itself equals sending data to the provider, so reading behavior must be protected. Only when "reading occurs in a local isolated environment and has no external sending permissions" does reading itself not produce external consequences; then the main risk comes from subsequent sending and writing operations.

Therefore, safety guardrails should focus on:

1. Preventing confidential data from being sent out
    1. Context sent to the AI provider.
    2. Online tools, including MCP tools, networked skills, external APIs, and network requests initiated by AI after self-assembling code.
2. Preventing damage to files or external systems
    1. Actual access permissions of the file system.
    2. Write permissions with real-world impact such as databases, emails, tickets, cloud resources.

Safety guardrails should not primarily rely on:

1. Pre-combining specific permission sets. You cannot predict in advance which files or data are needed to complete a task, so permissions should be dynamically requested and authorized.
2. Only writing permission rules in MCP Tool / skill descriptions. Prompt rules cannot replace runtime mandatory isolation; the more exceptions, the more vulnerabilities.
3. Treating AI as an employee. A safer assumption is: once attacked, AI is an out-of-control executor.
4. Treating AI as a human. AI requires an actual computing platform and is essentially a program. Therefore, data leakage risks from providers, logs, caches, networks, and infrastructure itself must also be considered.

In summary, safety guardrails should be placed in these areas:

1. Subagents / main Agent should only have the minimum workspace and minimum permissions. If the task only requires reading, it should not have write permissions.
2. A complete task should be split into multiple subagents as much as possible. One subagent is only responsible for search, one for reading, one for writing, and the main Agent only for planning and scheduling, reducing the benefit of multi-data-source context attacks.
3. All data exchange points connected to the network should use data filters based on rules, patterns, and DLP to prevent AI from directly transmitting keys, tokens, personal information, etc.

Therefore, safety guardrails can be implemented like this. Clearly, this is closer to a traditional engineering problem:

1. Sandbox permissions: isolate networking, file system, processes, memory, and environment variables. Refer to tools like bwrap, firejail.
2. Data filtering: use firewall network whitelists, egress proxies, DLP, regex, PII detectors, and tools like [Microsoft Presidio](https://github.com/microsoft/presidio) to filter data at network egress and before provider calls.
3. User confirmation: AI should not authorize itself. When the main Agent wants to change the task goal, or AI needs to access high-risk data, request websites outside the whitelist, or perform high-impact operations, it must be confirmed through an authorization channel independent of AI.
    1. Identity and confirmation method: use separate OAuth, push notifications, or MFA, e.g., Keycloak + WebAuthn/passkeys.
    2. Data flow control method: Envoy `ext_authz`.

### Demo / Security Component: ai-gateway-filter

I wrote a demo a couple of days ago as a prototype for subsequent security components: [ai-gateway-filter](https://github.com/xz-dev/ai-gateway-filter)

It targets low-cost defense at data flow entry/exit: a Privacy Gateway between AI client, subagent, tool, and AI provider. Current implementation includes text/image encryption wrapping, prompt-injection phrase checking, and early blocking of streaming text.

The core idea this project wants to express is to move some security controls from the LLM model semantics to lightweight engineering boundaries through keyword recognition and semantic recognition: first intercept obviously dangerous data flows, reduce context contamination and external sending risks, then combine with sandbox, permission isolation, user confirmation, etc., to reduce service latency.

## Insufficient Capability

Even without attacks, if the AI itself has insufficient intelligence or the Agent framework is poorly designed, it can still produce destructive results in reality. For example, AI sends an email to an external company, but the email content has the wrong name, amount, or contract terms.

The protection method is: for specific high-risk, high-impact tool calls, a well-designed confirmation/modification page must be provided. This page should allow the user to see at a glance what the AI is about to execute, which objects it affects, what data it will send or modify, and must require explicit user confirmation, not bypassable or default-allowed through other means.

## Summary

AI security design should prioritize data flow, not just prompt logic, because AI is not a fully predictable traditional program.

But we cannot stop eating for fear of choking. Today's LLMs can accomplish many tasks precisely because of their generalization ability and a certain degree of unpredictability.

We also cannot constantly watch over AI, because AI is a program that acts much faster than humans. A truly feasible solution is to place security boundaries in engineering positions such as context, tools, network, file system, permissions, auditing, and user authorization.