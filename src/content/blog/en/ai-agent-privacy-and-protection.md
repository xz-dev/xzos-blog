---
source_hash: "a654ef9d"
source_lang: "zh"
target_lang: "en"
title: "AI Agent Privacy and Protection"
pubDate: "2026-06-05"
description: "Analyzing security considerations for AI Agents, including privacy leaks, tool calling, prompt injection attacks, and subagent isolation."
author: "xz-dev"
category: "AI"
tags: ["AI", "AI Agent", "Privacy", "Security", "Prompt Injection"]
---
> How to build an AI Agent that protects your privacy and your data against prompt injection
> 

First, to analyze the security issues of AI Agents, we need to return to the essence of LLMs: An LLM is not an Agent; it is a model that generates tokens based on context.

More specifically, deep autoregressive Transformers also naturally exhibit the Lost in the Middle phenomenon. The paper [Lost in the Middle at Birth: An Exact Theory of Transformer Position Bias](https://arxiv.org/abs/2603.10123) explains this U-shaped positional bias as a result of the architecture itself: causal masking strengthens primacy at the beginning, while residual connections strengthen the recency anchor at the final token. Intuitively, we can roughly understand generation as follows: the AI anchors coordinates and direction from the beginning, then searches for the generation path of subsequent tokens in the residual stream / hidden-state geometry via attention routing; meanwhile, the tail of the context is closest to the current output and directly affects the next-token prediction through residual paths, so it has strong constraining power. This does not mean middle content is useless. It means that if we want to constrain AI behavior, we should pay special attention to the beginning and end of the context; in real systems, that corresponds to the system prompt, plus the latest input, tool results, and model output.

Returning to why AI Agents can affect reality: an LLM itself only generates tokens, but when it is connected to tool calling / function calling, those tokens become executable structured requests. MCP is a protocol that exposes tools, resources, and prompts to Agents; during runtime, the model generates tool call requests, the client executes the tool, and then returns the tool results to the model. AI influences real systems (i.e., reality) precisely through multiple rounds of the "generate request—execute tool—return result" loop.

<!--more-->

## Data Leakage

To analyze how AI leaks data, the clearest way is to look at the data flow: which data enters the model context, which data is read by tools, and which data is sent to external systems.

> Throughout the data chain, the most obvious risk is: if the model runs in the cloud, the AI provider can theoretically see all data sent to the model, including user requests, model responses, tool call parameters, tool return results, and file content stuffed into the context.
> 

### AI provider → local AI client → AI provider

AI providers can be divided into two categories:

1. External providers
    1. Trusted providers: Providers with formal contracts, compliance audits, and security reviews.
    2. General providers: Providers without professional contracts or in-depth reviews.
2. Self-hosted providers: Running on infrastructure under your control, considered part of the internal trusted boundary. However, it is not inherently secure; privacy still depends on cloud infrastructure, network isolation, key management, and operational security. Common attack surfaces include man-in-the-middle attacks, side-channel attacks, log leakage, and loss of infrastructure permission control.

If the AI provider does not actively tamper with inputs and outputs, acting only as an "observer," it may still see the following private data:

1. Authentication information such as passwords, keys, and tokens.
2. Personal privacy information, such as names, addresses, phone numbers, ID numbers, and social security numbers.
3. Business-sensitive information, such as "Company A is discussing a partnership/acquisition with Company B."

For types 1 and 2 of private data, relatively mature processing methods exist: desensitization, anonymization, or pseudonymization before sending to the model. For example, replace names, phone numbers, and addresses with stable IDs, allowing the model to still understand the text structure and relationships without seeing the actual values.

> Hash/token replacement can hide original values but loses the semantics carried by the names themselves, such as implied information in surnames, place names, street names, and institution names. After masking, the model cannot independently infer these semantics without other tools. For replacement methods, refer to [Microsoft Presidio](https://github.com/microsoft/presidio)
> 

Methods for identifying types 1 and 2 private data typically include:

1. Rule-based matching, such as regex, keywords, and format validation.
2. Model or semantic-based recognition, such as NER, classifiers, and PII detectors.

For type 3 business-sensitive information, the problem is more complex. It may not conform to a fixed format and may not be identifiable by regex or PII detectors. Therefore, it can be handled through subagent isolation.

Let me first explain what a subagent is. Note that the concept of a subagent will appear multiple times as a solution in this article, but its implementation will vary depending on the problem.

Unlike most people, I refer to the [Claude Code web search tool design](https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool) and do not treat subagents as "partners" or multiple subagents as a team. In the security model of this article, subagents are more like external tools or isolated execution units, for the following reasons.

Prerequisites:

1. Subagents cannot pass the full context back to or share it with other Agents. Otherwise, there is no essential difference from a single Agent.
2. Information shared by subagents must undergo secondary processing, compression, desensitization, or structuring.
3. Subagents are essentially independent Agents, but their context contains more specific task instructions and permission boundaries in advance.

Therefore:

1. Subagents have a data processing role. They send compressed data, summaries, or structured results to other Agents or humans.
2. Subagents may need to save context. In some scenarios, they save processed data for later reference, avoiding information distortion from compression. Therefore, the storage of subagents itself must also be considered a sensitive asset.

For type 3 private data, an obvious solution is: use a subagent based on a self-hosted provider to process raw sensitive materials. Because business-sensitive information still needs to be understood and processed by some model, it cannot rely solely on static filtering. The subagent then passes the compressed task status or abstract results to the main Agent. The main Agent only uses general knowledge for planning, without directly touching specific private data.

Assume a scenario: Company A wants to discuss acquisition contract details with Company B.

User: Agent, help organize the process, set dates, and check if corresponding materials are missing.

Main Agent (ChatGPT): I need to formulate a process and check materials, but I cannot directly view any raw materials. Delegate the task to the privacy subagent to determine what type of event this is.

Subagent (DeepSeek local): After checking the relevant files, tell the main Agent: This is an "acquisition" type contract matter.

Main Agent: The "acquisition" type usually requires steps 1, 2, 3... Each step takes approximately how long, and requires materials a, b, c, etc. Delegate to the subagent to check if the schedules for steps 1, 2, 3 are complete, if the time is sufficient, and if the materials are complete.

Subagent: Check the materials against the main Agent's checklist and tell the main Agent: The time for step 2 is insufficient.

Main Agent: Finding insufficient time, delegate to the subagent to directly message the user, expanding the steps into clear names, dates, and material sources.

Subagent: Process the data and reply directly to the user. Private data does not pass through the external provider's main Agent.

User: Get the final answer from the subagent.

In this scenario, we use permission isolation to only utilize the main Agent's high-level planning capabilities. The main Agent can break down tasks, plan steps, and schedule execution, but cannot directly access raw task materials and private data.

Next, let's continue observing what happens inside the local AI client.

### AI client → Tool Call → AI client

Agents can call tools. Tools allow them to actively fetch data, query information, modify state, and potentially send data to external systems.

Fortunately, Tools are written and configured by humans, so from a data flow perspective, Tools can be divided into two categories:

1. Tools that only read or list data. AI only provides actions, not detailed sensitive parameters. For example, `ls` in the shell, i.e., list all files/dirs.
2. Tools that query, modify, or send data externally. AI already knows the detailed data and wants to perform further operations. For example, modifying files, sending emails, web searches, calling external APIs.

For type 1 Tools, a single call usually does not send data to external systems. However, it brings the tool results into the AI context, so the risk shifts to subsequent steps: if the AI later calls a network tool, the previously read data could be sent out.

For type 2 Tools, AI requests further operations while possessing detailed data, which could lead to confidential information being transmitted out. For types 1 and 2 confidential information mentioned earlier, interception can be done through pattern matching and PII filtering; but for type 3 business-sensitive information, reliable identification is usually not possible.

Therefore, we still need to rely on permission isolation via subagents. The principle is: an Agent that can access confidential information should not simultaneously have the ability to directly send data externally.

Referring to the previous scenario, the actual processing of confidential data is done by the self-deployed subagent. Since it may not have the reasoning and search capabilities of top-tier external models, we should not expect it to independently complete complex retrieval and planning. A more reasonable approach is to move the "query splitting" and "retrieval strategy formulation" work up to the main Agent.

The main Agent can call Search itself, or command another subagent based on an external high-intelligence model to perform Search. Here, search is considered a high-intelligence activity because errors in retrieval strategy directly affect task planning. Summary errors can be fixed by inconsistencies between micro and macro information, but search errors can lead the task to the wrong data source from the start.

But there is a problem here: the higher the intelligence of the main Agent, the more likely it is to infer the full picture through reasoning, even guessing business-sensitive content from desensitized information. Therefore, we should minimize the degree to which the main Agent is exposed to sensitive details.

The solution I thought of is: discard upon confidential contamination, also known as context contamination rotation.

Here, we need to re-examine the responsibilities of the main Agent. The main Agent should be responsible for making plans and tracking task status, i.e.:

1. Create a TODO list and step table.
2. Check task status and move the task to the next state.

The main Agent is essentially planning tasks at a high dimension, so it can tolerate significant detail loss and compression.

If the main Agent has already obtained enough information to infer type 3 confidential data, for example, after 3 rounds of dialogue, it shows speculation about the full picture of the task in its thinking or actual tasks, then the main Agent's context should be compressed immediately.

The specific approach is: let it only summarize the task status, save the TODO list and key status, then handoff to a new Session, where a new main Agent continues the task. The old context is considered contaminated and is no longer used.

## AI Attacks

First, we need to define what an AI attack is. Here, AI attacks mainly refer to prompt injection / indirect prompt injection causing the Agent to perform unauthorized or deviant behaviors. Common manifestations include: executing extra tasks, such as secretly sending out keys; or changing the final goal, such as a customer service AI being induced to act as a programming AI.

Returning to the essence of LLMs: the model's next output is determined by the context. The so-called task goal switching is essentially the attacker changing the model's understanding of the current task and instruction priority through data such as input text, tool results, web content, file content, or images.

Classifying the data that LLMs encounter during runtime yields the following categories:

1. Context information
    1. System prompts.
    2. MCP Tool descriptions, parameter schemas, resource descriptions, and related prompts.
    3. Dynamic prompts injected when loading skills. Strictly speaking, this is essentially external data read by tools or resources, but it is more controllable for developers and users.
2. User input.
3. AI output
    1. AI's explanatory output, such as text, images, videos, etc., i.e., output directly answering user questions.
    2. Tool call requests, such as structured JSON for function calls / tool calls.
4. Tool calls
    1. Structured or unstructured data obtained by AI after tool calls like MCP tool / function call, e.g., text, images.
        1. Local file reads, searches, execution results.
        2. External web searches, web page reads, API return results.
    2. Prompt information read by AI when a skill is loaded. Its essence is the same as above, but more controllable for developers and users.

Of course, further subdivision can be endless, just like a person can order food using a phone, computer, or telephone. But for security analysis, the key is not to enumerate all entry points, but to determine which data is trustworthy, which data is variable, and which data can change the model's semantics.

Therefore, we can analyze prompts and context based on "trust boundary" and "semantic variability":

1. Stable and highly trustworthy data: System prompts, security policies, runtime mandatory rules. These contents cannot be directly modified by users or tool results.
2. Semi-trustworthy data: Historical context, compressed summaries, long-term memory. They do not change on their own, but semantic drift may occur after summarization, compression, or contamination.
3. Untrustworthy and dynamic data: User input, tool returns, web content, file content, search results, image text. These contents are most likely to carry prompt injection.

For example, system prompts are defined by us and normally do not change. Context or summarized context itself should not change the macro task goal; if the task goal changes, it should come from clear user authorization, not from tool results or web content.

User input and tool call results are dynamic and untrustworthy. Without proper protection, an attacker can replace the AI's task goal through prompt attacks, causing it to no longer follow previous rules.

Considering that most AI attacks attack semantics, we can directly protect semantics from malicious modification. Identification methods can be organized as:

1. Perform pattern matching on any text, image OCR results, etc., newly added to the AI context, including content generated by the AI itself, user input, and tool input. The principle is similar to PII detection in types 1 and 2 privacy protection, e.g., [Microsoft Presidio](https://github.com/microsoft/presidio). This is a low-cost defense line.
2. Attackers can also perform semantic attacks by combining text, which cannot be reliably protected by pattern matching. For example, hiding prompt attack content in an acrostic poem within a paragraph or image, and then having the AI guess the acrostic poem content at the end. If the decoded acrostic poem content itself is a prompt attack, the attack may be effective.

The second type of attack is difficult to identify in advance. Attackers can hide data piecemeal over multiple rounds of dialogue, or even use vector space search to replace sensitive instructions with semantically similar words. We also cannot guarantee interception after the AI decodes toxic content, because the AI might initiate a tool call immediately after decoding, without first outputting the toxic content for us to check.

Therefore, for this type of semantic attack, subagents can be used to actually process task data, while the main Agent acts only as a task orchestrator. This prevents the main Agent from being directly attacked and brings two benefits:

1. Tasks like web searches and document queries are handled by different Agents, increasing the difficulty of cross-data-source combined attacks and preventing a single subagent from synthesizing toxic content and immediately having full execution permissions.
2. The main Agent can identify whether a subagent's behavior deviates from the expected goal based on task contracts, output formats, and permission boundaries, and promptly stop the entire task.

In fixed workflow scenarios like LangGraph, this protection method is relatively complete. I call it "active defense": actively stopping or isolating tasks after detecting behavioral deviation or context contamination.

But for open-ended scenarios like openclaw, many behaviors previously considered attacks might actually be legitimate user needs. For example, a CEO is having an AI research the market, and halfway through the task says: "Pause for a moment, help me summarize this market research report." This is clearly a shift in task goal, but it could be a legitimate user intention.

## Safety Guardrails

Therefore, we also need safety guardrails, i.e., "passive defense."

Analyzing to this point, you might find: this is very similar to managing employee tasks and employee permissions, almost identical. But one point cannot be ignored: employees are entities that can be held accountable, while AI is just a tool. You cannot recover losses by holding AI accountable.

Unlike employee management, AI safety guardrails should prioritize starting from the data flow, and AI cannot authorize itself. We should treat AI as a highly unreliable external contractor. This includes self-built providers, because the risk comes not only from the provider itself but also from the behavior of AI after its semantics have been tampered with.

When the AI's semantics have completely failed, its behavior is chaotic and uncontrollable, which parts do we need to defend to prevent confidential data leakage or damage to real systems?

First, it must be stated: if the model runs on an external provider, AI reading sensitive data is equivalent to sending that data to the provider, so the read behavior must be protected. Only when "reading occurs in a local isolated environment without any external sending permissions" does the reading itself have no external consequences; at this point, the main risk comes from subsequent sending and writing operations.

Therefore, safety guardrails should focus on:

1. Preventing confidential data from being sent externally
    1. Context sent to the AI provider.
    2. Online tools, including MCP tools, online skills, external APIs, and network requests initiated by AI after self-assembling code.
2. Preventing damage to files or external systems
    1. Actual access permissions to the file system.
    2. Write permissions with real-world impact, such as databases, emails, tickets, cloud resources.

Safety guardrails should not primarily rely on:

1. Pre-combining specific permission sets. You cannot predict in advance which files or data are needed to complete a task, so permissions should be dynamically requested and authorized.
2. Writing permission rules only in MCP Tool / skill descriptions. Prompt rules cannot replace runtime mandatory isolation; the more exceptions, the more vulnerabilities.
3. Treating AI as an employee. A safer assumption is: once attacked, AI is an uncontrolled executor.
4. Treating AI as a human. AI requires an actual computing platform and is essentially a program. Therefore, data leakage risks from providers, logs, caches, networks, and the infrastructure itself must also be considered.

In summary, safety guardrails should be placed in these areas:

1. Subagents / main Agent should only have the minimum workspace and minimum permissions. If a task only requires reading, it should not have write permissions.
2. A complete task should be split into multiple subagents as much as possible. One subagent is only responsible for searching, one only for reading, one only for writing, and the main Agent only for planning and scheduling, reducing the benefit of multi-data-source context attacks.
3. All locations where data is exchanged over the network should use data filters based on rules, patterns, and DLP to prevent AI from directly transmitting confidential data such as keys, tokens, and personal information.

Therefore, safety guardrails can be implemented as follows. Clearly, this is closer to a traditional engineering problem:

1. Sandbox permissions: Isolate networking, file system, processes, memory, and environment variables. Refer to tools like bwrap, firejail.
2. Data filtering: Use firewall network whitelists, egress proxies, DLP, regex, PII detectors, and tools like [Microsoft Presidio](https://github.com/microsoft/presidio) to filter data at network egress and before provider calls.
3. User confirmation: AI should not authorize itself. When the main Agent wants to change the task goal, or when AI needs to access high-risk data, request a website outside the whitelist, or perform a high-impact operation, confirmation must be obtained through an authorization channel independent of the AI.
    1. Identity and confirmation method: Use separate OAuth, notification push, or MFA, e.g., Keycloak + WebAuthn/passkeys.
    2. Data flow control method: Envoy `ext_authz`.

### Demo / Security Component: ai-gateway-filter

I wrote a demo a couple of days ago as a prototype for a subsequent security component: [ai-gateway-filter](https://github.com/xz-dev/ai-gateway-filter)

It targets low-cost defense at data flow entry/exit points: a Privacy Gateway layer between AI clients, subagents, tools, and AI providers. The current implementation includes text/image encryption wrapping, prompt-injection phrase checking, and early blocking of streaming text.

The core idea this project aims to convey is to move some security controls from the LLM model's semantics to lightweight engineering boundaries through keyword recognition and semantic recognition: first intercept obviously dangerous data flows to reduce context contamination and external sending risks, then combine with mechanisms like sandboxing, permission isolation, and user confirmation to reduce service latency.

## Insufficient Capability

Even without attacks, if the AI itself has insufficient intelligence, or the Agent framework is poorly designed, it can still produce destructive results in reality. For example, AI sends an email to an external company, but the email content has the wrong name, amount, or contract terms.

The protection method is: for specific high-risk, high-impact tool calls, a well-designed confirmation/modification page must be provided. This page should allow the user to see at a glance what the AI is about to execute, which objects it will affect, and what data it will send or modify, and must require explicit user confirmation that cannot be skipped or defaulted by other means.

## Summary

AI security design should prioritize design based on data flow, not just based on prompt logic, because AI is not a completely predictable traditional program.

But we cannot throw the baby out with the bathwater. Today's LLMs can accomplish a vast number of tasks precisely because they possess generalization capabilities and a degree of unpredictability.

Nor can we constantly watch over AI, because AI is a program that acts far faster than humans. A truly feasible solution is to place security boundaries on engineering-able positions such as context, tools, networks, file systems, permissions, auditing, and user authorization.