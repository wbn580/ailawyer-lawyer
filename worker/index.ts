// ailawyer-lawyer —— 静态资产 + D1 运行时文章层（R254 通用模板实例）
//
// 由 cowork-cloud-tools/scripts/d1_runtime_scaffold.py 从模板生成，手工缝合自
// 原 src/worker.js（保留在原地未删除）的两段自定义逻辑：
//   1. www.ailawyer.lawyer -> ailawyer.lawyer 的 308 重定向。
//   2. 严格 CSP 安全头（含内联脚本 sha256 哈希白名单）+ 按内容类型分流的
//      Cache-Control 覆盖策略，套在本文件*全部*响应路径上（静态资产、D1
//      文章、sitemap/llms），不是只套资产响应。D1 渲染的文章正文模板本身不
//      引入新的内联 <script>，未新增哈希。
// 模板正本：cowork-cloud-tools/scripts/templates/d1-runtime/worker-index.ts.tmpl
// 参照实现与设计说明：site-builds/course-org-cn/worker/index.ts
//
// 设计原则是**只做加法**：
//   1. 任何请求先走静态资产，已构建页面行为与接入前完全一致，零回归。
//   2. 只有静态资产 404 时，才回落到 D1 查文章。D1 只承载"还没进构建产物"
//      的新文章；URL 集合永远只增不减。
//   3. Worker 绝不改写任何已存在于构建产物里的路径（云构建等价闸按
//      dist manifest 逐文件核 sha256，运行时改写会让 promote 被拒）。
//      对外的 /sitemap.xml 与 /llms.txt 由本 Worker 用静态正本 + D1 现合成。
//
// 渲染走服务端：首屏 HTML 就是完整正文，不依赖前端 JS 二次拉取。
import { HEAD, TAIL } from "./template";

// 原有逻辑（历史 src/worker.js）：script-src hashes 覆盖本站少量静态内联
// <script> 块（footer year fill、hero suggestion chips、nav scroll state、
// back-to-top、scroll reveal）。这些是跨页复用的模板脚本，不是逐页动态内容，
// 只有这段模板脚本本身改了才需要重新生成。
// 重新生成：node scripts/list-inline-script-hashes.mjs
const INLINE_SCRIPT_HASHES = [
  "'sha256-kQkbDlAyRAVCXi4u51ZtXon85dQ42YBM1jerHwNX95M='", // index.html: yr + chips(en) + nav + totop + reveal
  "'sha256-VJoduXWmQMirCf2lY3bTSyomckAv621Jg+Z2RmJ8sKk='", // zh/index.html: yr + chips(zh) + nav + totop + reveal
  "'sha256-LmmMmGD1iVm6NfEuKiKCYzvXqK8/4cqOde1Y+eZA2Es='", // simple pages: yr only
  "'sha256-i1s9qfum2Us918hCBnHCBlbgPwlt3DhtB+ga3nFSCnA='", // how-it-works pages: yr + reveal
  "'sha256-wRVTDHGAbXZqhQeDMqpAEEH5IThJlwxtlaIeDfcI36E='", // article/guide pages: footer year span
];

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://static.cloudflareinsights.com ${INLINE_SCRIPT_HASHES.join(" ")}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data:; connect-src 'self' https://chat.ailawyer.lawyer; upgrade-insecure-requests`,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
};

// 原有逻辑（历史 src/worker.js）：把 SECURITY_HEADERS 套到*任意*响应上，并按
// 内容类型覆盖 Cache-Control（HTML/文本/XML 不缓存，静态资源长缓存）。
// D1 文章、sitemap/llms 合成响应都要经过这层，不能只包静态资产响应。
function withSecurityHeaders(response: Response, url: URL): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  const contentType = headers.get("Content-Type") || "";
  if (
    contentType.includes("text/html") ||
    contentType.includes("text/plain") ||
    contentType.includes("xml")
  ) {
    headers.set("Cache-Control", "no-cache");
  } else if (/\.(?:css|js|svg|jpg|jpeg|png|webp|woff2?)$/i.test(url.pathname)) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// 2026-08-21 事故防复发（ca-edu-pl）：不用 Fetcher/D1Database 这两个
// Cloudflare 环境的全局环境类型——它们要靠站内装了 @cloudflare/workers-types
// 才存在，本批要接入的站里不是每一个都装了这个包。部分 astro 站的构建脚本
// 带严格类型检查（astro check / tsc --noEmit），缺这个包会直接编译失败，
// 云构建 fail closed（ca-edu-pl 实测踩过，生产未受影响）。
// 这里改成只描述实际用到的方法签名的最小结构类型，不依赖任何外部类型包，
// 对任何站的 TypeScript 环境都成立。
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results?: T[] }>;
}
interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatement;
}
interface FetcherLike {
  fetch(request: Request): Promise<Response>;
}

export interface Env {
  ASSETS: FetcherLike;
  DB: D1DatabaseLike;
}

const ORIGIN = "https://ailawyer.lawyer";
const SEG = "zh/articles"; // 文章 URL 段（sites.yaml render_url_segment）
const SITEMAP_BASE = "/sitemap-base.xml"; // 构建产物里的 sitemap 静态正本路径
const LLMS_BASE = "/llms-base.txt"; // 构建产物里的 llms 静态正本路径
const SITEMAP_TRAILING = true; // 合成 sitemap loc 是否带尾斜杠
const DATE_STYLE = "iso"; // "zh" | "iso"

// R254 Phase 1（root 布局，无前缀根级文章）：SEG="" 时不能再照旧拼出
// "^/" + "" + "/(...)" = "^//(...)" 这种永远匹配不到任何 URL 的双斜杠正则
// （2026-08-21 本地脚本实测确认过，不是理论风险）。SEG_SEGMENTS 为空数组时
// 前缀直接是空串；与 articlePath() 共用同一份 SEG_SEGMENTS/SEG_PREFIX，
// 两处判空逻辑必须一致，不能各写一套自己算。
const SEG_SEGMENTS = SEG.split("/").filter(Boolean); // [] = root 布局
const SEG_PREFIX = SEG_SEGMENTS.length ? "/" + SEG_SEGMENTS.join("/") : ""; // URL 拼接用，不转义
function escapeReSegment(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const ARTICLE_RE = new RegExp(
  "^" +
    (SEG_SEGMENTS.length ? "/" + SEG_SEGMENTS.map(escapeReSegment).join("/") : "") +
    "/([A-Za-z0-9][A-Za-z0-9._-]*)/?$",
);
function articlePath(slug: string): string {
  return `${SEG_PREFIX}/${slug}`;
}
// root 布局下 ARTICLE_RE 会匹配任意根级单段路径；已构建的静态页面在
// assetRes 阶段就直接返回（见文件头三条硬约束），不会走到这里，唯一新增
// 行为是对更多路径多做一次 D1 查询尝试。RESERVED_ROOT_SLUGS 是双重防呆：
// 即使发布脚本手滑用了保留字当 slug，这里也直接拒绝当文章处理，不查 D1。
// 只在 root 布局（!SEG）下生效——flat 布局天然带 seg 前缀命名空间隔离，
// 不需要这层校验。
const RESERVED_ROOT_SLUGS = new Set<string>(["404", "_astro", "about", "assets", "categories", "category", "contact", "css", "disclaimer", "en", "favicon", "favicon.ico", "fonts", "images", "img", "js", "llms.txt", "offline", "page", "pages", "privacy", "robots", "robots.txt", "search", "sitemap", "sitemap.xml", "static", "tag", "tags", "tw", "zh", "zh-cn", "zh-tw"]);

interface ArticleRow {
  slug: string;
  title: string;
  description: string;
  category: string;
  body_html: string;
  published_at: string;
  updated_at: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// "2026-07-08" -> "2026年7月8日"（zh 站与静态文章页的日期写法保持一致）
function cnDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日`;
}

function renderArticle(a: ArticleRow): string {
  // 模板里 canonical 一律存成不带尾斜杠的 {{CANONICAL}}（带尾斜杠的位置
  // 在切模板时自然保留成 "{{CANONICAL}}/"），这里只填 base 形式即可。
  const canonicalBase = `${ORIGIN}${articlePath(a.slug)}`;
  const dateIso = (a.published_at || "").slice(0, 10);
  const dateDisplay = DATE_STYLE === "zh" ? cnDate(dateIso) : dateIso;
  const head = HEAD
    .split("{{CANONICAL}}").join(escapeHtml(canonicalBase))
    // 分享按钮把 canonical 做了 URL 百分号编码（微博/QQ/X/邮件分享链接），
    // gen-article-template.mjs 切模板时已整体换成这个占位符，见该文件
    // 2026-08-21 事故防复发注释。
    .split("{{CANONICAL_ENC}}").join(encodeURIComponent(`${canonicalBase}/`))
    .split("{{DESC}}").join(escapeHtml(a.description))
    .split("{{TITLE}}").join(escapeHtml(a.title))
    .split("{{DATE_ISO_FULL}}").join(escapeHtml(`${dateIso}T00:00:00Z`))
    .split("{{DATE_ISO}}").join(escapeHtml(dateIso))
    .split("{{DATE}}").join(escapeHtml(dateDisplay))
    .split("{{CATEGORY_SUFFIX}}").join(
      a.category ? `<span> · ${escapeHtml(a.category)}</span>` : "",
    );
  return head + a.body_html + TAIL;
}

const HTML_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  // 暂不加边缘缓存：先保证"发布即可见"可被无歧义验证（同 course-org-cn）。
  "cache-control": "public, max-age=0, must-revalidate",
};

function escapeXml(s: string): string {
  return escapeHtml(s).replace(/'/g, "&apos;");
}

// 取构建产物里的静态正本
async function fetchBase(env: Env, url: URL, path: string): Promise<string | null> {
  const res = await env.ASSETS.fetch(new Request(new URL(path, url.origin).toString()));
  return res.ok ? await res.text() : null;
}

// 只取索引需要的字段——sitemap/llms 用不到正文，带上 body_html 会随文章
// 数量增长把每次爬虫拉取变成全库正文扫描。
type ArticleIndexRow = Pick<ArticleRow, "slug" | "title" | "published_at" | "updated_at">;

async function listArticles(env: Env): Promise<ArticleIndexRow[]> {
  const res = await env.DB.prepare(
    `SELECT slug, title, published_at, updated_at
       FROM articles WHERE status = 'published' ORDER BY published_at DESC`,
  ).all<ArticleIndexRow>();
  return res.results ?? [];
}

// 正本 + D1 新文章合成 sitemap。正本里已有的 slug 不重复登记（静态优先）。
function composeSitemap(base: string, rows: ArticleIndexRow[]): string {
  const extra = rows
    .filter((r) => !base.includes(articlePath(r.slug)))
    .map((r) => {
      const loc = `${ORIGIN}${articlePath(r.slug)}${SITEMAP_TRAILING ? "/" : ""}`;
      return (
        `<url><loc>${escapeXml(loc)}</loc>` +
        `<lastmod>${escapeXml((r.updated_at || r.published_at).slice(0, 10))}</lastmod></url>`
      );
    });
  if (!extra.length) return base;
  const close = base.lastIndexOf("</urlset>");
  if (close < 0) return base;
  return base.slice(0, close) + extra.join("\n") + "\n" + base.slice(close);
}

// 保留正本里的条目，把 D1 新文章追加在后面。
function composeLlms(base: string, rows: ArticleIndexRow[]): string {
  const extra = rows
    .filter((r) => !base.includes(articlePath(r.slug)))
    .map((r) => `- [${r.title}](${ORIGIN}${articlePath(r.slug)}${SITEMAP_TRAILING ? "/" : ""})`);
  if (!extra.length) return base;
  return base.replace(/\s+$/, "") + "\n" + extra.join("\n") + "\n";
}

async function lookupArticle(env: Env, slug: string): Promise<ArticleRow | null> {
  const row = await env.DB.prepare(
    `SELECT slug, title, description, category, body_html, published_at, updated_at
       FROM articles WHERE slug = ? AND status = 'published'`,
  ).bind(slug).first<ArticleRow>();
  return row ?? null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 原有逻辑（历史 src/worker.js）：www 裸重定向到根域名，对所有请求生效，
    // 不看资产是否存在，所以放在 ASSETS.fetch 之前；重定向响应本身不加
    // SECURITY_HEADERS（与原逻辑一致）。
    if (url.hostname === "www.ailawyer.lawyer") {
      url.hostname = "ailawyer.lawyer";
      return Response.redirect(url.toString(), 308);
    }

    const assetRes = await env.ASSETS.fetch(request);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return withSecurityHeaders(assetRes, url);
    }

    // 静态资产命中就直接返回；只有 404 才回落 D1
    if (assetRes.status !== 404) return withSecurityHeaders(assetRes, url);

    // /sitemap.xml 与 /llms.txt 刻意不在构建产物里，永远走到这里现合成
    const feed =
      url.pathname === "/sitemap.xml"
        ? { base: SITEMAP_BASE, type: "application/xml; charset=utf-8", compose: composeSitemap }
        : url.pathname === "/llms.txt"
          ? { base: LLMS_BASE, type: "text/plain; charset=utf-8", compose: composeLlms }
          : null;

    if (feed) {
      const base = await fetchBase(env, url, feed.base);
      if (base === null) return withSecurityHeaders(assetRes, url);
      let body = base;
      // D1 出问题时退回静态正本，不要让索引文件跟着挂
      try {
        body = feed.compose(base, await listArticles(env));
      } catch {}
      return withSecurityHeaders(
        new Response(body, {
          headers: { "content-type": feed.type, "cache-control": "public, max-age=0, must-revalidate" },
        }),
        url,
      );
    }

    const m = ARTICLE_RE.exec(url.pathname);
    if (!m) return withSecurityHeaders(assetRes, url);
    // root 布局保留字双重防呆（见 ARTICLE_RE 上方注释）；flat 布局有 seg
    // 前缀天然隔离，不需要这层校验。
    if (!SEG && RESERVED_ROOT_SLUGS.has(m[1])) return withSecurityHeaders(assetRes, url);

    try {
      const article = await lookupArticle(env, m[1]);
      if (!article) return withSecurityHeaders(assetRes, url);
      return withSecurityHeaders(
        new Response(renderArticle(article), { headers: HTML_HEADERS }),
        url,
      );
    } catch {
      return withSecurityHeaders(assetRes, url);
    }
  },
};
