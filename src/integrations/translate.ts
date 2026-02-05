/**
 * Astro Integration: 自动翻译内容
 * 使用硅基流动 API (DeepSeek-V3) 将中文内容翻译为英文
 * 通过源文件哈希实现增量翻译
 * 支持多个 content collection（blog, pages 等）
 */
import type { AstroIntegration } from 'astro';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { loadEnv } from 'vite';

// ============ 配置 ============
const SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1';
const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V3';

const SYSTEM_PROMPT = `You are a professional translator. Translate the Chinese markdown content to English.

OUTPUT: Return a COMPLETE, valid markdown file with frontmatter.

RULES:
1. Output must start with --- and end frontmatter with --- on its own line
2. Translate title and description to English
3. Keep these values EXACTLY as-is: pubDate, updatedDate, author, category, tags, heroImage
4. Preserve ALL markdown formatting (headers, code blocks, links, images)
5. Keep code snippets, URLs, file paths, Base64 strings UNCHANGED
6. Output ONLY the markdown file, no explanations or comments

Example output format:
---
title: "Translated Title"
description: "Translated description"
pubDate: "2024-01-01"
author: "original"
tags: ["tag1", "tag2"]
---

Translated content here...`;

/** 翻译目录配置 */
interface TranslateDir {
  /** 源目录 */
  source: string;
  /** 目标目录 */
  target: string;
  /** 描述（用于日志） */
  name: string;
}

interface TranslateOptions {
  /** 硅基流动 API Key（默认从环境变量读取） */
  apiKey?: string;
  /** 使用的模型 */
  model?: string;
  /** 要翻译的目录列表 */
  directories?: TranslateDir[];
  /** 强制重新翻译所有文件 */
  force?: boolean;
  /** 是否启用（可用于在开发时禁用） */
  enabled?: boolean;
}

/** 默认翻译目录 */
const DEFAULT_DIRECTORIES: TranslateDir[] = [
  {
    source: 'src/content/blog',
    target: 'src/content/blog/en',
    name: 'Blog Posts',
  },
  {
    source: 'src/content/pages',
    target: 'src/content/pages/en',
    name: 'Static Pages',
  },
];

/** 计算内容哈希（前8位） */
function computeHash(content: string): string {
  return createHash('md5').update(content).digest('hex').slice(0, 8);
}

/** 从翻译文件中提取源文件哈希 */
function getSourceHash(content: string): string | null {
  const match = content.match(/^source_hash:\s*["']?([a-f0-9]+)["']?\s*$/m);
  return match?.[1] ?? null;
}

/** 
 * 程序化插入 source_hash 到翻译结果中
 * 确保 source_hash 始终正确，不依赖 LLM 输出
 */
function insertSourceHash(content: string, hash: string): string {
  // 匹配 frontmatter
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  
  if (match) {
    let frontmatter = match[1];
    // 移除 LLM 可能生成的 source_hash（如果有）
    frontmatter = frontmatter.replace(/^source_hash:.*\r?\n?/m, '');
    // 获取 frontmatter 之后的内容
    const rest = content.slice(match[0].length);
    // 重新组装，source_hash 放在最前面
    return `---\nsource_hash: "${hash}"\n${frontmatter.trim()}\n---${rest}`;
  }
  
  // 如果没有 frontmatter，创建一个
  return `---\nsource_hash: "${hash}"\n---\n\n${content}`;
}

/** 调用硅基流动 API 翻译 */
async function translateContent(
  content: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch(`${SILICONFLOW_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content },
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Translation API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const result = data.choices?.[0]?.message?.content?.trim();
  
  if (!result) {
    throw new Error('Empty translation result');
  }

  // 打印 token 使用情况
  if (data.usage) {
    console.log(`    Tokens: ${data.usage.prompt_tokens} in / ${data.usage.completion_tokens} out`);
  }

  return result;
}

/** 检查是否需要翻译 */
async function shouldTranslate(
  sourceContent: string,
  targetPath: string,
  force: boolean
): Promise<{ needed: boolean; reason: string }> {
  const sourceHash = computeHash(sourceContent);

  if (force) {
    return { needed: true, reason: `Force mode (hash: ${sourceHash})` };
  }

  if (!existsSync(targetPath)) {
    return { needed: true, reason: 'Target file does not exist' };
  }

  const targetContent = await readFile(targetPath, 'utf-8');
  const existingHash = getSourceHash(targetContent);

  if (!existingHash) {
    return { needed: true, reason: 'No source_hash in target file' };
  }

  if (existingHash !== sourceHash) {
    return { needed: true, reason: `Source changed (${existingHash} → ${sourceHash})` };
  }

  return { needed: false, reason: `Up to date (hash: ${sourceHash})` };
}

/** 翻译单个文件 */
async function translateFile(
  sourcePath: string,
  targetPath: string,
  apiKey: string,
  model: string,
  force: boolean
): Promise<boolean> {
  const filename = basename(sourcePath);
  const sourceContent = await readFile(sourcePath, 'utf-8');
  const sourceHash = computeHash(sourceContent);

  const { needed, reason } = await shouldTranslate(sourceContent, targetPath, force);
  
  if (!needed) {
    console.log(`  ⏭️  ${filename}: ${reason}`);
    return false;
  }

  console.log(`  🔄 ${filename}: ${reason}`);
  console.log(`    Translating with ${model}...`);

  const translated = await translateContent(sourceContent, apiKey, model);

  // 程序化插入 source_hash，确保稳定性
  const result = insertSourceHash(translated, sourceHash);

  await writeFile(targetPath, result, 'utf-8');
  console.log(`    ✅ Saved to ${basename(targetPath)}`);

  return true;
}

/** 翻译一个目录 */
async function translateDirectory(
  dir: TranslateDir,
  apiKey: string,
  model: string,
  force: boolean
): Promise<{ translated: number; skipped: number; errors: number }> {
  const { source: sourceDir, target: targetDir, name } = dir;
  
  console.log(`\n📁 ${name}`);
  console.log(`   Source: ${sourceDir}`);
  console.log(`   Target: ${targetDir}\n`);

  // 检查源目录是否存在
  if (!existsSync(sourceDir)) {
    console.log(`   ⚠️  Source directory does not exist, skipping...`);
    return { translated: 0, skipped: 0, errors: 0 };
  }

  // 确保目标目录存在
  if (!existsSync(targetDir)) {
    await mkdir(targetDir, { recursive: true });
  }

  // 获取所有 markdown 文件
  const files = await readdir(sourceDir);
  const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  if (mdFiles.length === 0) {
    console.log(`   No markdown files found`);
    return { translated: 0, skipped: 0, errors: 0 };
  }

  console.log(`   Found ${mdFiles.length} files\n`);

  let translated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of mdFiles) {
    const sourcePath = join(sourceDir, file);
    const targetPath = join(targetDir, file);

    try {
      const wasTranslated = await translateFile(
        sourcePath,
        targetPath,
        apiKey,
        model,
        force
      );
      
      if (wasTranslated) {
        translated++;
        // 添加延迟避免 API 限流
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        skipped++;
      }
    } catch (error) {
      errors++;
      console.error(`  ❌ ${file}: ${error instanceof Error ? error.message : error}`);
    }
  }

  return { translated, skipped, errors };
}

/** Astro Integration */
export default function translateIntegration(options: TranslateOptions = {}): AstroIntegration {
  const {
    model = DEFAULT_MODEL,
    directories = DEFAULT_DIRECTORIES,
    force = false,
    enabled = true,
  } = options;

  return {
    name: 'astro-translate',
    hooks: {
      'astro:build:start': async () => {
        if (!enabled) {
          console.log('[translate] Disabled, skipping...');
          return;
        }

        // 加载 .env 文件
        const env = loadEnv('production', process.cwd(), '');
        const apiKey = options.apiKey || env.SILICONFLOW_API_KEY || process.env.SILICONFLOW_API_KEY;

        if (!apiKey) {
          console.log('[translate] No SILICONFLOW_API_KEY found, skipping translation...');
          console.log('[translate] Set SILICONFLOW_API_KEY in .env or env var to enable auto-translation');
          return;
        }

        console.log('\n[translate] Starting content translation...');
        console.log(`[translate] Model: ${model}`);
        console.log(`[translate] Directories: ${directories.length}`);

        let totalTranslated = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (const dir of directories) {
          const { translated, skipped, errors } = await translateDirectory(
            dir,
            apiKey,
            model,
            force
          );
          totalTranslated += translated;
          totalSkipped += skipped;
          totalErrors += errors;
        }

        console.log(`\n[translate] Done! Translated: ${totalTranslated}, Skipped: ${totalSkipped}, Errors: ${totalErrors}\n`);
      },
    },
  };
}
