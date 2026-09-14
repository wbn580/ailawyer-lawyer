// [seo-2026] 文章SEO技术标准 §3.1/§3.6 构建期补齐（2026-09-15）。
// 本站页面是预渲染 HTML 直拷进 dist，没有可改的布局模板；逐页改 public/**/*.html
// 会与写手/正文改动撞同一批文件。这里在构建时对 dist 做确定性注入，云构建跑同一段
// 代码，等价闸的逐字节哈希照样对得上（与 cw-mobile-nav 同一做法）。
//   1. robots 预览控制：已有 robots meta 且非 noindex → 并入三条指令；没有 → 插入；
//      noindex 页一律不加。
//   2. Article/BlogPosting/NewsArticle JSON-LD：缺 dateModified 时回落 datePublished
//      （没有 datePublished 就不编造日期）；缺 author 时补站点 Organization。
// 幂等：重复运行结果不变。用法：node scripts/seo-2026-inject.mjs <dist> "<站点名>"
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIST = process.argv[2] || 'dist';
const SITE_NAME = process.argv[3];
if (!SITE_NAME) { console.error('[seo-2026] 缺站点名参数'); process.exit(1); }
const DIRECTIVES = 'max-snippet:-1, max-image-preview:large, max-video-preview:-1';
const ART_TYPES = new Set(['Article', 'BlogPosting', 'NewsArticle']);

function patchRobots(html) {
  const re = /<meta\s+[^>]*name=["']robots["'][^>]*>/i;
  const m = re.exec(html);
  if (m) {
    const tag = m[0];
    if (/noindex/i.test(tag) || /max-snippet/i.test(tag)) return html;
    const next = tag.replace(/content=(["'])([^"']*)\1/i, (_a, q, v) => `content=${q}${v.trim() ? `${v.trim()}, ` : ''}${DIRECTIVES}${q}`);
    return html.replace(tag, next);
  }
  const i = html.search(/<\/head>/i);
  if (i < 0) return html;
  return `${html.slice(0, i)}<meta name="robots" content="index, follow, ${DIRECTIVES}" />${html.slice(i)}`;
}

function fixNode(node) {
  if (!node || typeof node !== 'object') return false;
  let changed = false;
  if (Array.isArray(node)) { for (const n of node) changed = fixNode(n) || changed; return changed; }
  const t = node['@type'];
  if ((Array.isArray(t) ? t : [t]).some((x) => ART_TYPES.has(x))) {
    if (!node.dateModified && node.datePublished) { node.dateModified = node.datePublished; changed = true; }
    if (!node.author) { node.author = { '@type': 'Organization', name: SITE_NAME }; changed = true; }
  }
  if (Array.isArray(node['@graph'])) changed = fixNode(node['@graph']) || changed;
  return changed;
}

function patchSchema(html) {
  return html.replace(/(<script[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi, (all, open, body, close) => {
    let data;
    try { data = JSON.parse(body); } catch { return all; }
    // 转义 "<"：原块里若有 "<\/script>" 之类，JSON.parse 后再原样输出会提前闭合 <script>。
    return fixNode(data) ? `${open}${JSON.stringify(data).replace(/</g, '\\u003c')}${close}` : all;
  });
}

let pages = 0, changedPages = 0;
async function walk(dir) {
  for (const ent of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) { await walk(p); continue; }
    if (!ent.name.endsWith('.html')) continue;
    pages++;
    const html = await readFile(p, 'utf8');
    const out = patchSchema(patchRobots(html));
    if (out !== html) { await writeFile(p, out, 'utf8'); changedPages++; }
  }
}
await walk(DIST);
console.log(`[seo-2026] ${changedPages}/${pages} html patched`);
