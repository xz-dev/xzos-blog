/**
 * 基于 pi（coding agent CLI 的 print 模式）的翻译引擎
 *
 * 流程：
 * 1. 通读全文，产出主题简报与术语表（保证每段译文贴合主题、术语统一）
 * 2. 按二级标题逐段翻译（带上一段译文作为衔接上下文），结构校验不通过则重试
 * 3. 整篇通读审校一轮；审校稿若丢失结构（链接/标题/代码块/more 标记），回退到逐段稿
 *
 * 不持有任何 API Key：模型与凭据全部由本机 pi 配置解析。
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export type Language = 'zh' | 'en' | 'zh-CN' | 'other';

export interface PiConfig {
  /** pi 可执行文件 */
  bin: string;
  /** pi 模型（--model） */
  model: string;
  /** 显式加载的扩展（pi 以 -ne 启动，只加载这些，例如模型 provider 扩展） */
  extensions: string[];
  /** 单次调用超时（毫秒） */
  timeoutMs: number;
}

const DEFAULT_MODEL = 'deepseek-v4.1-flash';
const DEFAULT_EXTENSION = join(homedir(), '.pi/agent/git/github.com/xz-dev/openai-api-pi-extension');

/** 从环境解析 pi 配置；本机没有 pi 时返回 null（例如 CI 构建） */
export function resolvePiConfig(env: Record<string, string | undefined>): PiConfig | null {
  const bin = env.PI_TRANSLATE_BIN || 'pi';
  const probe = spawnSync(bin, ['--version'], { encoding: 'utf-8' });
  if (probe.error || probe.status !== 0) return null;

  const extensions = env.PI_TRANSLATE_EXTENSIONS !== undefined
    ? env.PI_TRANSLATE_EXTENSIONS.split(',').map(s => s.trim()).filter(Boolean)
    : existsSync(DEFAULT_EXTENSION) ? [DEFAULT_EXTENSION] : [];

  return {
    bin,
    model: env.PI_TRANSLATE_MODEL || DEFAULT_MODEL,
    extensions,
    timeoutMs: Number(env.PI_TRANSLATE_TIMEOUT_MS) || 15 * 60 * 1000,
  };
}

/** 以无工具、无会话、无上下文文件的纯 LLM 方式调用 pi，返回最终回答文本 */
function runPi(
  pi: PiConfig,
  systemPrompt: string,
  input: string,
  thinking: 'low' | 'medium' | 'high'
): Promise<string> {
  const args = [
    '--print', '--no-session', '--offline',
    '--model', pi.model, '--thinking', thinking,
    '--no-tools', '--no-skills', '--no-prompt-templates', '--no-context-files', '--no-mcp', '--no-themes',
    '-ne', ...pi.extensions.flatMap(e => ['-e', e]),
    '--system-prompt', systemPrompt,
    '',
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(pi.bin, args, { stdio: ['pipe', 'pipe', 'pipe'], cwd: homedir() });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`pi timed out after ${pi.timeoutMs}ms`));
    }, pi.timeoutMs);

    child.stdout.on('data', d => { stdout += d; });
    child.stderr.on('data', d => { stderr += d; });
    child.on('error', err => { clearTimeout(timer); reject(err); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) {
        const msg = stderr.split('\n').filter(l => l && !l.startsWith('Warning: No models match')).join('\n');
        reject(new Error(`pi exited ${code}: ${msg.slice(-1000)}`));
        return;
      }
      resolve(stdout.trim());
    });
    child.stdin.end(input);
  });
}

// ============ 提示词 ============

const LANGUAGE_DETECTION_PROMPT = `判断 Markdown 正文的主要自然语言，只输出 zh、en 或 other 之一。
中文夹杂英文技术词算 zh；忽略代码块、URL、产品名与技术标识符。不要解释。`;

const langName = (lang: Language) =>
  lang === 'en' ? 'English' : lang === 'other' ? 'the source language' : 'Simplified Chinese (简体中文)';

const briefPrompt = (target: Language) => `You are the lead translator of a personal technical blog.
Read the whole article and prepare a translation brief for translating it into ${langName(target)}.

Output, in ${langName(target)}, plain text only:
1. THEME: the article's core argument in 2-3 sentences.
2. VOICE: author's tone and register (e.g. reflective, colloquial, ironic) and how to carry it over.
3. GLOSSARY: recurring key terms and coined metaphors, one per line as "source → translation", chosen so they read naturally and stay consistent across the whole piece.

No preamble, no closing remarks.`;

const SEGMENT_RULES = `Translation standard — 信、达、雅:
- 信 (faithfulness): keep every claim, example, nuance, joke and hedge. Never add, drop, summarize or "improve" content.
- 达 (fluency): write idiomatic prose a native reader would write; restructure sentences freely, but keep paragraph boundaries.
- 雅 (elegance): match the author's voice; render metaphors and coined terms so they land in the target language, following the glossary.
- Every sentence must serve the article's THEME in the brief; resolve ambiguous wording in the direction of that theme.

Markdown must survive byte-for-byte where it is not prose:
- Keep headings levels, lists, blockquote markers, tables, HTML tags/comments (e.g. <!--more-->, <details>, <summary>) and blank-line structure.
- Keep URLs, code blocks, inline code, file paths, commands and identifiers unchanged. Link text may be translated only when it is prose; repo/PR names stay as-is.
- Quoted chat lines keep their speaker names (translate role words like "我" → "Me").

Output ONLY the translated Markdown of the SEGMENT. No notes, no fences around the output.`;

const segmentPrompt = (target: Language) =>
  `You are translating one segment of a blog article into ${langName(target)}.\n\n${SEGMENT_RULES}`;

const reviewPrompt = (target: Language) => `You are the final copy editor of a ${langName(target)} translation of a blog article.
You receive the brief, the SOURCE article and the DRAFT translation (translated segment by segment).

Read the whole draft against the source and output the full revised translation:
- fix mistranslations, omissions and additions (信);
- smooth seams between segments, unify terminology with the glossary and keep one consistent voice (达、雅);
- make sure every paragraph serves the article's theme.

Keep all Markdown structure, URLs, code and HTML (including <!--more-->) exactly as in the draft.
Do not shorten. Output ONLY the full revised Markdown body, no notes.`;

const metaPrompt = (target: Language) => `Translate the blog post title and description into ${langName(target)}, following the brief (信达雅, consistent with the glossary).
Output exactly two lines and nothing else:
title: <translated title>
description: <translated description>`;

// ============ 结构工具 ============

function splitFrontmatter(content: string): { frontmatter: string; body: string } {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return m ? { frontmatter: m[1], body: content.slice(m[0].length) } : { frontmatter: '', body: content };
}

/** 按二级标题切段（跳过代码块内的 #） */
function splitSegments(body: string): string[] {
  const segments: string[] = [];
  let current: string[] = [];
  let inFence = false;
  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence && /^## /.test(line) && current.some(l => l.trim())) {
      segments.push(current.join('\n'));
      current = [];
    }
    current.push(line);
  }
  if (current.some(l => l.trim())) segments.push(current.join('\n'));
  return segments;
}

/** 不应被翻译改变的结构指纹 */
function fingerprint(md: string) {
  const urls = (md.match(/\]\(([^)\s]+)/g) ?? []).sort().join('\n');
  return {
    urls,
    headings: (md.match(/^#{1,6} /gm) ?? []).length,
    fences: (md.match(/^\s*(```|~~~)/gm) ?? []).length,
    more: (md.match(/<!--\s*more\s*-->/g) ?? []).length,
    details: (md.match(/<\/?details>/g) ?? []).length,
  };
}

function structureDiff(source: string, translated: string): string | null {
  const a = fingerprint(source);
  const b = fingerprint(translated);
  const diffs = (Object.keys(a) as (keyof typeof a)[]).filter(k => a[k] !== b[k]);
  return diffs.length ? diffs.join(', ') : null;
}

function stripOuterFence(text: string): string {
  const m = text.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/);
  return m ? m[1] : text;
}

// ============ 对外接口 ============

export async function detectLanguage(content: string, pi: PiConfig): Promise<Language> {
  const langMatch = content.match(/^lang:\s*["']?(zh|en|zh-CN|zh-TW|other)["']?\s*$/m);
  if (langMatch) {
    const lang = langMatch[1];
    if (lang.startsWith('zh')) return 'zh';
    if (lang === 'en') return 'en';
    return 'other';
  }
  const sample = splitFrontmatter(content).body.slice(0, 4000);
  const result = (await runPi(pi, LANGUAGE_DETECTION_PROMPT, sample, 'low')).toLowerCase();
  if (result.startsWith('zh')) return 'zh';
  if (result.startsWith('en')) return 'en';
  return 'other';
}

/** 翻译整篇 Markdown，返回带 frontmatter 的完整文件（元数据由调用方插入） */
export async function translateMarkdown(content: string, pi: PiConfig, target: Language): Promise<string> {
  const { frontmatter, body } = splitFrontmatter(content);

  const brief = await runPi(pi, briefPrompt(target), content, 'high');
  console.log('      📝 Brief ready');

  // frontmatter：只翻 title/description，其余字段原样保留
  let newFrontmatter = frontmatter;
  const title = frontmatter.match(/^title:\s*(.*)$/m)?.[1];
  const description = frontmatter.match(/^description:\s*(.*)$/m)?.[1];
  if (title || description) {
    const meta = await runPi(
      pi,
      metaPrompt(target),
      `BRIEF:\n${brief}\n\ntitle: ${title ?? ''}\ndescription: ${description ?? ''}`,
      'high'
    );
    // 模型可能输出已加引号的 JSON 字符串，也可能是裸文本（内部可含引号）
    const q = (s: string) => {
      const t = s.trim();
      try {
        const parsed = JSON.parse(t);
        if (typeof parsed === 'string') return JSON.stringify(parsed);
      } catch {}
      return JSON.stringify(t);
    };
    const newTitle = meta.match(/^title:\s*(.+)$/m)?.[1];
    const newDesc = meta.match(/^description:\s*(.+)$/m)?.[1];
    if (title && newTitle) newFrontmatter = newFrontmatter.replace(/^title:.*$/m, () => `title: ${q(newTitle)}`);
    if (description && newDesc) newFrontmatter = newFrontmatter.replace(/^description:.*$/m, () => `description: ${q(newDesc)}`);
  }

  // 逐段翻译
  const segments = splitSegments(body);
  const translated: string[] = [];
  for (const [i, segment] of segments.entries()) {
    const previous = translated.at(-1)?.slice(-1500) ?? '(start of article)';
    const input = `BRIEF:\n${brief}\n\nPREVIOUS TRANSLATED TEXT (for continuity only, do not output):\n${previous}\n\nSEGMENT ${i + 1}/${segments.length}:\n${segment}`;
    let out = '';
    for (let attempt = 1; attempt <= 2; attempt++) {
      out = stripOuterFence(await runPi(pi, segmentPrompt(target), input, 'high'));
      const diff = structureDiff(segment, out);
      if (!diff) break;
      console.log(`      ⚠️  Segment ${i + 1} structure mismatch (${diff}), attempt ${attempt}`);
    }
    translated.push(out);
    console.log(`      ✏️  Segment ${i + 1}/${segments.length}`);
  }
  const draft = translated.join('\n\n');

  // 整篇通读审校
  let finalBody = draft;
  try {
    const reviewed = stripOuterFence(await runPi(
      pi,
      reviewPrompt(target),
      `BRIEF:\n${brief}\n\nSOURCE:\n${body}\n\nDRAFT:\n${draft}`,
      'high'
    ));
    const diff = structureDiff(draft, reviewed);
    if (diff || reviewed.length < draft.length * 0.85) {
      console.log(`      ⚠️  Review pass rejected (${diff ?? 'too short'}), keeping segment draft`);
    } else {
      finalBody = reviewed;
      console.log('      🔎 Review pass applied');
    }
  } catch (error) {
    console.log(`      ⚠️  Review pass failed, keeping segment draft: ${error instanceof Error ? error.message : error}`);
  }

  return `---\n${newFrontmatter.trim()}\n---\n\n${finalBody.trim()}\n`;
}
