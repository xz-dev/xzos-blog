/**
 * Astro Integration: 自动翻译内容（增强版）
 * 
 * 功能：
 * 1. 自动检测文章语言（从 frontmatter 或 AI 检测）
 * 2. 支持双向翻译：中文↔英文
 * 3. 智能生成副本：英文原文生成英文副本，中文原文生成中文副本
 * 4. 增量翻译：通过源文件哈希避免重复翻译
 * 
 * 通过本机 pi CLI 调用模型（见 pi-translate.ts），不持有 API Key
 * 支持多个 content collection（blog, pages 等）
 */
import type { AstroIntegration } from 'astro';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { loadEnv } from 'vite';
import {
  detectLanguage,
  resolvePiConfig,
  translateMarkdown,
  type Language,
  type PiConfig,
} from './pi-translate';

// ============ 类型定义 ============

/** 翻译目录配置 */
interface TranslateDir {
  /** 源目录 */
  source: string;
  /** 英文目标目录 */
  targetEn: string;
  /** 简体中文目标目录 */
  targetZhCN: string;
  /** 描述（用于日志） */
  name: string;
}

interface TranslateOptions {
  /** pi 模型（默认从环境变量 PI_TRANSLATE_MODEL 读取，否则 deepseek-v4.1-flash） */
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
    targetEn: 'src/content/blog/en',
    targetZhCN: 'src/content/blog/zh-CN',
    name: 'Blog Posts',
  },
  {
    source: 'src/content/pages',
    targetEn: 'src/content/pages/en',
    targetZhCN: 'src/content/pages/zh-CN',
    name: 'Static Pages',
  },
];

// ============ 工具函数 ============

/** 计算内容哈希（前8位） */
function computeHash(content: string): string {
  return createHash('md5').update(content).digest('hex').slice(0, 8);
}

/** 从翻译文件中提取源文件哈希 */
function getSourceHash(content: string): string | null {
  const match = content.match(/^source_hash:\s*["']?([a-f0-9]+)["']?\s*$/m);
  return match?.[1] ?? null;
}

/** 从 frontmatter 中提取字段值 */
function getFrontmatterField(content: string, field: string): string | null {
  const match = content.match(new RegExp(`^${field}:\\s*["']?([^"'\\n]+)["']?\\s*$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

/** 已有翻译文件如果显式声明了错误 lang，需要重新生成 */
function hasMismatchedLang(content: string, targetLang: Language): boolean {
  const lang = getFrontmatterField(content, 'lang');
  return Boolean(lang && lang !== targetLang);
}

/** 
 * 程序化插入元数据到 frontmatter
 * 确保元数据始终正确，不依赖 LLM 输出
 */
function insertMetadata(
  content: string,
  metadata: {
    source_hash: string;
    source_lang: Language;
    target_lang: Language;
    is_copy?: boolean;
  }
): string {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  
  if (match) {
    let frontmatter = match[1];
    
    // 移除 LLM 可能生成的元数据
    frontmatter = frontmatter.replace(/^source_hash:.*\r?\n?/m, '');
    frontmatter = frontmatter.replace(/^source_lang:.*\r?\n?/m, '');
    frontmatter = frontmatter.replace(/^target_lang:.*\r?\n?/m, '');
    frontmatter = frontmatter.replace(/^is_copy:.*\r?\n?/m, '');
    frontmatter = frontmatter.replace(/^lang:.*\r?\n?/m, '');
    
    // 获取 frontmatter 之后的内容
    const rest = content.slice(match[0].length);
    
    // 构建元数据
    const metadataLines = [
      `source_hash: "${metadata.source_hash}"`,
      `source_lang: "${metadata.source_lang}"`,
      `target_lang: "${metadata.target_lang}"`,
      `lang: "${metadata.target_lang}"`,
    ];
    
    if (metadata.is_copy) {
      metadataLines.push(`is_copy: true`);
    }
    
    // 重新组装
    return `---\n${metadataLines.join('\n')}\n${frontmatter.trim()}\n---${rest}`;
  }
  
  // 如果没有 frontmatter，创建一个
  const metadataLines = [
    `source_hash: "${metadata.source_hash}"`,
    `source_lang: "${metadata.source_lang}"`,
    `target_lang: "${metadata.target_lang}"`,
    `lang: "${metadata.target_lang}"`,
  ];
  
  if (metadata.is_copy) {
    metadataLines.push(`is_copy: true`);
  }
  
  return `---\n${metadataLines.join('\n')}\n---\n\n${content}`;
}

// ============ 文件操作函数 ============

/** 检查是否需要翻译 */
async function shouldTranslate(
  sourceContent: string,
  targetPath: string,
  force: boolean,
  sourceLang: Language,
  targetLang: Language
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

  if (hasMismatchedLang(targetContent, targetLang)) {
    return { needed: true, reason: `Target lang metadata mismatch (expected: ${targetLang})` };
  }

  if (existingHash !== sourceHash) {
    return { needed: true, reason: `Source changed (${existingHash} → ${sourceHash})` };
  }

  return { needed: false, reason: `Up to date (hash: ${sourceHash})` };
}

/** 检查是否需要复制 */
async function shouldCopy(
  sourceContent: string,
  targetPath: string,
  force: boolean,
  targetLang: Language
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

  if (hasMismatchedLang(targetContent, targetLang)) {
    return { needed: true, reason: `Target lang metadata mismatch (expected: ${targetLang})` };
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
  pi: PiConfig,
  sourceLang: Language,
  targetLang: Language,
  sourceHash: string
): Promise<void> {
  const sourceContent = await readFile(sourcePath, 'utf-8');
  
  console.log(`    Translating ${sourceLang} → ${targetLang} with pi:${pi.model}...`);
  
  const translated = await translateMarkdown(sourceContent, pi, targetLang);

  // 程序化插入元数据，确保稳定性
  const result = insertMetadata(translated, {
    source_hash: sourceHash,
    source_lang: sourceLang,
    target_lang: targetLang,
    is_copy: false,
  });

  await writeFile(targetPath, result, 'utf-8');
  console.log(`    ✅ Saved to ${basename(targetPath)}`);
}

/** 复制文件作为语言版本副本 */
async function copyFileAsVersion(
  sourcePath: string,
  targetPath: string,
  sourceHash: string,
  sourceLang: Language,
  targetLang: Language
): Promise<void> {
  const sourceContent = await readFile(sourcePath, 'utf-8');
  
  // 在 frontmatter 中添加元数据
  const result = insertMetadata(sourceContent, {
    source_hash: sourceHash,
    source_lang: sourceLang,
    target_lang: targetLang,
    is_copy: true,
  });
  
  await writeFile(targetPath, result, 'utf-8');
  console.log(`    📋 Copied to ${basename(targetPath)}`);
}

/** 快速检查是否需要处理（不调用 AI） */
async function needsProcessing(
  sourceContent: string,
  enPath: string,
  zhCNPath: string,
  force: boolean
): Promise<boolean> {
  if (force) return true;
  
  const sourceHash = computeHash(sourceContent);
  
  // 检查英文目标
  if (!existsSync(enPath)) return true;
  const enContent = await readFile(enPath, 'utf-8');
  const enHash = getSourceHash(enContent);
  if (!enHash || enHash !== sourceHash || hasMismatchedLang(enContent, 'en')) return true;
  
  // 检查中文目标
  if (!existsSync(zhCNPath)) return true;
  const zhCNContent = await readFile(zhCNPath, 'utf-8');
  const zhCNHash = getSourceHash(zhCNContent);
  if (!zhCNHash || zhCNHash !== sourceHash || hasMismatchedLang(zhCNContent, 'zh-CN')) return true;
  
  return false;
}

/** 处理单个文件的翻译和副本生成 */
async function processFile(
  sourcePath: string,
  targetDirs: { en: string; zhCN: string },
  pi: PiConfig,
  force: boolean
): Promise<{ translated: number; copied: number; skipped: number }> {
  const filename = basename(sourcePath);
  const sourceContent = await readFile(sourcePath, 'utf-8');
  const sourceHash = computeHash(sourceContent);
  
  const enPath = join(targetDirs.en, filename);
  const zhCNPath = join(targetDirs.zhCN, filename);
  
  // 快速检查：如果两个目标都是最新的，直接跳过（不调用 AI）
  if (!await needsProcessing(sourceContent, enPath, zhCNPath, force)) {
    console.log(`  ⏭️  ${filename}: Up to date (hash: ${sourceHash})`);
    return { translated: 0, copied: 0, skipped: 2 };
  }
  
  // 需要处理，才检测语言
  console.log(`  🔍 ${filename}: Detecting language...`);
  const sourceLang = await detectLanguage(sourceContent, pi);
  console.log(`     Detected: ${sourceLang}`);
  
  let translated = 0;
  let copied = 0;
  let skipped = 0;
  
  // 根据源语言决定操作
  if (sourceLang === 'zh') {
    // 中文原文：翻译成英文，复制到 zh-CN
    const translateCheck = await shouldTranslate(sourceContent, enPath, force, sourceLang, 'en');
    if (translateCheck.needed) {
      await translateFile(sourcePath, enPath, pi, sourceLang, 'en', sourceHash);
      translated++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // API 延迟
    } else {
      console.log(`  ⏭️  ${filename} (en): ${translateCheck.reason}`);
      skipped++;
    }
    
    const copyCheck = await shouldCopy(sourceContent, zhCNPath, force, 'zh-CN');
    if (copyCheck.needed) {
      await copyFileAsVersion(sourcePath, zhCNPath, sourceHash, 'zh', 'zh-CN');
      copied++;
    } else {
      console.log(`  ⏭️  ${filename} (zh-CN): ${copyCheck.reason}`);
      skipped++;
    }
    
  } else if (sourceLang === 'en') {
    // 英文原文：复制到 en，翻译成简中
    const copyCheck = await shouldCopy(sourceContent, enPath, force, 'en');
    if (copyCheck.needed) {
      await copyFileAsVersion(sourcePath, enPath, sourceHash, 'en', 'en');
      copied++;
    } else {
      console.log(`  ⏭️  ${filename} (en): ${copyCheck.reason}`);
      skipped++;
    }
    
    const translateCheck = await shouldTranslate(sourceContent, zhCNPath, force, sourceLang, 'zh-CN');
    if (translateCheck.needed) {
      await translateFile(sourcePath, zhCNPath, pi, sourceLang, 'zh-CN', sourceHash);
      translated++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // API 延迟
    } else {
      console.log(`  ⏭️  ${filename} (zh-CN): ${translateCheck.reason}`);
      skipped++;
    }
    
  } else {
    // 其他语言：翻译成英文和简中
    const translateEnCheck = await shouldTranslate(sourceContent, enPath, force, sourceLang, 'en');
    if (translateEnCheck.needed) {
      await translateFile(sourcePath, enPath, pi, sourceLang, 'en', sourceHash);
      translated++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // API 延迟
    } else {
      console.log(`  ⏭️  ${filename} (en): ${translateEnCheck.reason}`);
      skipped++;
    }
    
    const translateZhCheck = await shouldTranslate(sourceContent, zhCNPath, force, sourceLang, 'zh-CN');
    if (translateZhCheck.needed) {
      await translateFile(sourcePath, zhCNPath, pi, sourceLang, 'zh-CN', sourceHash);
      translated++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // API 延迟
    } else {
      console.log(`  ⏭️  ${filename} (zh-CN): ${translateZhCheck.reason}`);
      skipped++;
    }
  }
  
  return { translated, copied, skipped };
}

/** 翻译一个目录 */
async function translateDirectory(
  dir: TranslateDir,
  pi: PiConfig,
  force: boolean
): Promise<{ translated: number; copied: number; skipped: number }> {
  const { source: sourceDir, targetEn, targetZhCN, name } = dir;
  
  console.log(`\n📁 ${name}`);
  console.log(`   Source: ${sourceDir}`);
  console.log(`   Target EN: ${targetEn}`);
  console.log(`   Target zh-CN: ${targetZhCN}\n`);

  // 检查源目录是否存在
  if (!existsSync(sourceDir)) {
    console.log(`   ⚠️  Source directory does not exist, skipping...`);
    return { translated: 0, copied: 0, skipped: 0 };
  }

  // 确保目标目录存在
  if (!existsSync(targetEn)) {
    await mkdir(targetEn, { recursive: true });
  }
  if (!existsSync(targetZhCN)) {
    await mkdir(targetZhCN, { recursive: true });
  }

  // 获取所有 markdown 文件（排除子目录）
  const allFiles = await readdir(sourceDir);
  const mdFiles = allFiles.filter(f => 
    (f.endsWith('.md') || f.endsWith('.mdx')) && 
    f !== 'en' && f !== 'zh-CN' // 排除语言子目录
  );

  if (mdFiles.length === 0) {
    console.log(`   No markdown files found`);
    return { translated: 0, copied: 0, skipped: 0 };
  }

  console.log(`   Found ${mdFiles.length} files\n`);

  let totalTranslated = 0;
  let totalCopied = 0;
  let totalSkipped = 0;

  for (const file of mdFiles) {
    const sourcePath = join(sourceDir, file);
    
    try {
      const { translated, copied, skipped } = await processFile(
        sourcePath,
        { en: targetEn, zhCN: targetZhCN },
        pi,
        force
      );
      
      totalTranslated += translated;
      totalCopied += copied;
      totalSkipped += skipped;
      
      console.log(''); // 空行分隔
    } catch (error) {
      console.error(`  ❌ ${file}: ${error instanceof Error ? error.message : error}`);
      totalSkipped += 2; // 两个目标都失败
    }
  }

  return { 
    translated: totalTranslated, 
    copied: totalCopied, 
    skipped: totalSkipped 
  };
}

// ============ Astro Integration ============

export default function translateIntegration(options: TranslateOptions = {}): AstroIntegration {
  const {
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
        const pi = resolvePiConfig({ ...env, ...process.env, ...(options.model ? { PI_TRANSLATE_MODEL: options.model } : {}) });

        if (!pi) {
          console.log('[translate] pi CLI not found, skipping translation (committed translations are used as-is)...');
          return;
        }

        console.log('\n[translate] Starting content translation...');
        console.log(`[translate] Engine: pi --model ${pi.model}`);
        console.log(`[translate] Extensions: ${pi.extensions.join(', ') || '(none)'}`);
        console.log(`[translate] Directories: ${directories.length}`);
        console.log(`[translate] Mode: ${force ? 'Force (re-translate all)' : 'Incremental'}`);

        let totalTranslated = 0;
        let totalCopied = 0;
        let totalSkipped = 0;

        for (const dir of directories) {
          const { translated, copied, skipped } = await translateDirectory(
            dir,
            pi,
            force
          );
          totalTranslated += translated;
          totalCopied += copied;
          totalSkipped += skipped;
        }

        console.log(`\n[translate] Done!`);
        console.log(`  Translated: ${totalTranslated}`);
        console.log(`  Copied: ${totalCopied}`);
        console.log(`  Skipped: ${totalSkipped}\n`);
      },
    },
  };
}
