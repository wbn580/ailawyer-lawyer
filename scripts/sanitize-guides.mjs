import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../public/', import.meta.url);
const publicDir = fileURLToPath(root);
const guideDirs = [path.join(publicDir, 'guides'), path.join(publicDir, 'zh', 'guides')];

const jurisdictions = {
  us: { en: 'United States', zh: '美国', official: [['USAGov legal aid', 'https://www.usa.gov/legal-aid'], ['USAGov courts directory', 'https://www.usa.gov/courts']] },
  uk: { en: 'United Kingdom', zh: '英国', official: [['GOV.UK justice', 'https://www.gov.uk/browse/justice'], ['GOV.UK legal aid', 'https://www.gov.uk/check-legal-aid']] },
  eu: { en: 'European Union', zh: '欧盟', official: [['European e-Justice Portal', 'https://e-justice.europa.eu/'], ['Your Europe', 'https://europa.eu/youreurope/citizens/index_en.htm']] },
  au: { en: 'Australia', zh: '澳大利亚', official: [['Attorney-General’s Department legal assistance', 'https://www.ag.gov.au/legal-system/legal-assistance-services'], ['Australian Government services', 'https://www.australia.gov.au/']] },
  ca: { en: 'Canada', zh: '加拿大', official: [['Department of Justice Canada', 'https://www.justice.gc.ca/eng/'], ['Canada legal and justice information', 'https://www.canada.ca/en/services/policing/justice.html']] },
  cn: { en: 'China', zh: '中国', official: [['12348 China Legal Services', 'https://www.12348.gov.cn/'], ['National laws and regulations database', 'https://flk.npc.gov.cn/']] },
};

const topicRoutes = {
  consumer: {
    au: ['ACCC consumer information', 'https://www.accc.gov.au/consumers'],
    ca: ['Office of Consumer Affairs', 'https://ised-isde.canada.ca/site/office-consumer-affairs/en'],
    uk: ['GOV.UK consumer protection', 'https://www.gov.uk/consumer-protection-rights'],
  },
  employment: {
    au: ['Fair Work Ombudsman', 'https://www.fairwork.gov.au/'],
    ca: ['Canada workplace information', 'https://www.canada.ca/en/services/jobs/workplace.html'],
    uk: ['GOV.UK employment tribunals', 'https://www.gov.uk/employment-tribunals'],
  },
  immigration: {
    au: ['Department of Home Affairs', 'https://immi.homeaffairs.gov.au/'],
    ca: ['Immigration, Refugees and Citizenship Canada', 'https://www.canada.ca/en/services/immigration-citizenship.html'],
    uk: ['GOV.UK visas and immigration', 'https://www.gov.uk/browse/visas-immigration'],
    us: ['USCIS', 'https://www.uscis.gov/'],
  },
  family: {
    au: ['Federal Circuit and Family Court of Australia', 'https://www.fcfcoa.gov.au/'],
    ca: ['Department of Justice Canada family law', 'https://www.justice.gc.ca/eng/fl-df/'],
    uk: ['GOV.UK divorce and separation', 'https://www.gov.uk/divorce'],
  },
};

const topics = {
  consumer: {
    match: /consumer-refunds-warranties/,
    enTitle: 'Consumer refunds and warranties: a safe starting point',
    zhTitle: '消费者退款与保修：安全的起点',
    enDirect: 'A consumer dispute usually turns on what was promised, what was supplied, the condition of the goods or service, and which local consumer regime applies. Preserve the transaction record and use the current official complaint route before assuming a remedy.',
    zhDirect: '消费者争议通常取决于商家承诺、实际交付、商品或服务状况，以及当地适用的消费者规则。先保留交易记录，并通过当前官方投诉入口核对，不要预先假定一定能获得哪种救济。',
    evidenceEn: ['Receipt, invoice or payment record', 'Product description, advertisement or written promise', 'Photos, inspection notes and a dated fault timeline', 'Messages showing when and how the issue was raised'],
    evidenceZh: ['收据、发票或付款记录', '商品说明、广告或书面承诺', '照片、检查记录和按日期整理的问题时间线', '显示何时、如何提出问题的沟通记录'],
  },
  family: {
    match: /divorce-child-support-basics/,
    enTitle: 'Divorce and child arrangements: what to organise first',
    zhTitle: '离婚与子女安排：先整理什么',
    enDirect: 'Family-law processes differ sharply by location and circumstances. Start by identifying the court or service with jurisdiction, any existing order, immediate safety concerns and the documents needed for qualified advice.',
    zhDirect: '家庭法律程序会因地点和具体情况而明显不同。先确认有管辖权的法院或服务、是否已有命令、是否存在即时安全风险，以及咨询专业人士所需的文件。',
    evidenceEn: ['Marriage, separation and residence records', 'Existing court orders or filed documents', 'A child-focused chronology of care arrangements', 'Financial records relevant to the issue, kept private'],
    evidenceZh: ['婚姻、分居和居住记录', '现有法院命令或已提交文件', '围绕子女照护安排整理的时间线', '与问题有关的财务记录，并注意保密'],
  },
  inheritance: {
    match: /(inheritance-basics|wills-inheritance-basics)/,
    enTitle: 'Wills and inheritance: an evidence-first checklist',
    zhTitle: '遗嘱与继承：先核对证据',
    enDirect: 'An estate question depends on the deceased person’s jurisdiction, the existence and validity of a will, the assets and liabilities, and who has authority to act. Do not distribute or dispose of property until the responsible process is confirmed.',
    zhDirect: '遗产问题取决于逝者所属法域、是否存在有效遗嘱、资产与负债，以及谁有权处理。未确认负责程序前，不要分配或处置财产。',
    evidenceEn: ['Original will and any later version', 'Death certificate and identity records held securely', 'Asset, debt and ownership records', 'Existing probate, administration or court documents'],
    evidenceZh: ['遗嘱原件及任何较新版本', '妥善保存的死亡证明与身份记录', '资产、债务与所有权记录', '现有认证、遗产管理或法院文件'],
  },
  deposit: {
    match: /security-deposit-refund/,
    enTitle: 'Rental deposit dispute: facts and evidence to preserve',
    zhTitle: '租房押金争议：应保留的事实与证据',
    enDirect: 'A deposit dispute usually turns on the tenancy terms, the property condition at each handover, payment records, notices and the local tenancy forum. Build a dated evidence pack before contacting the responsible service.',
    zhDirect: '押金争议通常取决于租约条款、交接时的房屋状况、付款记录、通知以及当地租务处理机构。联系负责服务前，先建立按日期整理的证据包。',
    evidenceEn: ['Signed tenancy agreement and deposit receipt', 'Entry and exit condition reports', 'Dated photographs or videos', 'Repair, cleaning and correspondence records'],
    evidenceZh: ['已签署租约与押金收据', '入住和退租状况报告', '带日期的照片或视频', '维修、清洁和沟通记录'],
  },
  claims: {
    match: /(small-claims-court|small-claims-procedure)/,
    enTitle: 'Small claims: prepare before choosing a court route',
    zhTitle: '小额索赔：选择程序前先准备',
    enDirect: 'Whether a dispute belongs in a small-claims process depends on the location, claim type, parties and current court rules. Confirm the responsible court and its current forms, fees, limits and service rules directly before filing.',
    zhDirect: '争议能否进入小额索赔程序，取决于地点、请求类型、双方身份及当前法院规则。提交前应直接向负责法院核对现行表格、费用、金额范围和送达规则。',
    evidenceEn: ['Contract, invoice or other source of the obligation', 'A dated chronology and calculation with supporting records', 'Correspondence showing attempts to resolve the issue', 'Names of witnesses and original documents, kept securely'],
    evidenceZh: ['合同、发票或义务来源文件', '按日期整理的经过和有记录支持的计算', '显示曾尝试解决问题的沟通记录', '证人信息与原始文件，并妥善保存'],
  },
  traffic: {
    match: /(traffic-fine-appeal|traffic-ticket-appeal|traffic-ticket-pcn-appeal)/,
    enTitle: 'Traffic notice review: check the issuing authority first',
    zhTitle: '交通罚单复核：先确认签发机构',
    enDirect: 'A traffic notice may follow an administrative, court or local-authority route. Identify the issuing body, notice type, alleged event and current review channel before responding; do not rely on a deadline remembered from another place.',
    zhDirect: '交通通知可能适用行政、法院或地方机构程序。回应前应确认签发机构、通知类型、所称事件和当前复核入口，不要套用其他地区记忆中的期限。',
    evidenceEn: ['The complete notice and envelope or delivery record', 'Photographs, video or location records obtained lawfully', 'Vehicle, driver and payment records relevant to the notice', 'A factual chronology without speculation'],
    evidenceZh: ['完整通知及信封或送达记录', '依法取得的照片、视频或位置记录', '与通知有关的车辆、驾驶和付款记录', '不含推测的事实时间线'],
  },
  employment: {
    match: /(unfair-dismissal|employment-rights)/,
    enTitle: 'Dismissal and workplace dispute: an evidence-first guide',
    zhTitle: '解雇与工作争议：证据优先指南',
    enDirect: 'A workplace dispute depends on where the work was performed, employment status, the documents and reasons given, and the responsible workplace body. Preserve records and verify the current route promptly without assuming an outcome.',
    zhDirect: '工作争议取决于实际工作地点、用工身份、相关文件与给出的理由，以及负责的劳动机构。应及时保留记录并核对当前入口，不要预设结果。',
    evidenceEn: ['Employment contract, policies and role description', 'Termination, warning or change letters', 'Payslips, rosters and leave records', 'A dated chronology of meetings and messages'],
    evidenceZh: ['劳动合同、政策和岗位说明', '终止、警告或变更通知', '工资单、排班和休假记录', '会议与沟通的日期时间线'],
  },
  immigration: {
    match: /visa-immigration-basics/,
    enTitle: 'Visa and immigration questions: verify the official route',
    zhTitle: '签证与移民问题：核对官方入口',
    enDirect: 'Immigration status and options depend on the destination authority’s current rules and the person’s full circumstances. Use the official application or review portal and qualified advice for a personal assessment; do not treat a general guide as an eligibility decision.',
    zhDirect: '移民身份与可选路径取决于目的地机构的当前规则和完整个人情况。个案评估应使用官方申请或复核入口并咨询具备相应资质的专业人士，不要把一般指南当作资格结论。',
    evidenceEn: ['Current passport and status documents, kept private', 'Official application, decision or request letters', 'A dated travel and status history', 'Documents named by the responsible authority’s current checklist'],
    evidenceZh: ['当前护照与身份文件，并注意保密', '官方申请、决定或补件通知', '按日期整理的旅行与身份记录', '负责机构当前清单所列文件'],
  },
};

function esc(value) { return String(value).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

function topicFor(name) {
  return Object.entries(topics).find(([, topic]) => topic.match.test(name));
}

function officialLinks(topicKey, jurisdictionKey, lang) {
  const base = [...jurisdictions[jurisdictionKey].official];
  const extra = topicRoutes[topicKey]?.[jurisdictionKey];
  if (extra) base.unshift(extra);
  return base.slice(0, 3).map(([label, url]) => `<li><a href="${url}" rel="noopener">${esc(label)}</a> — ${lang === 'zh' ? '行动前查看该机构的当前页面。' : 'Check the body’s current page before acting.'}</li>`).join('');
}

function articleHtml(topicKey, topic, jurisdictionKey, lang) {
  const j = jurisdictions[jurisdictionKey];
  const title = lang === 'zh' ? topic.zhTitle : topic.enTitle;
  const direct = lang === 'zh' ? topic.zhDirect : topic.enDirect;
  const evidence = lang === 'zh' ? topic.evidenceZh : topic.evidenceEn;
  const evidenceItems = evidence.map((item) => `<li>${esc(item)}</li>`).join('');
  const jName = lang === 'zh' ? j.zh : j.en;
  if (lang === 'zh') {
    return `<article class="doc">
  <h1>${esc(title)}</h1>
  <div class="updated">一般信息指南 · ${esc(jName)} · 2026-08-03 审核</div>
  <div class="callout"><i class="ti ti-alert-triangle"></i> 直接回答：${esc(direct)}</div>
  <h2>先确认哪些事实</h2>
  <p>先确认适用国家、州省或地区、负责机构、争议或决定的类型，以及是否已经收到正式通知或法院文件。不要在本站提交姓名、证件号、地址、案号或保密文件。</p>
  <h2>应保留的证据</h2><ul>${evidenceItems}</ul>
  <h2>更稳妥的下一步</h2>
  <ol><li>只按原始记录整理一页事实时间线，把事实与猜测分开。</li><li>到负责机构官网核对当前程序、表格、费用和期限；不要依赖旧文章或其他地区的数字。</li><li>后果重大、已有正式文件或可能临近期限时，尽快让当地合资格律师查看原件。</li></ol>
  <h2>官方入口</h2><ul>${officialLinks(topicKey, jurisdictionKey, lang)}</ul>
  <div class="faq"><h2>常见问题</h2><dl><dt>这篇指南能判断我的个案结果吗？</dt><dd>不能。它只能帮助整理一般问题和证据；个案判断需要完整资料和当地专业资格。</dd><dt>为什么不写具体金额或期限？</dt><dd>这些数字会变化，也可能因地区和程序不同。应以负责机构当前页面或正式文件为准。</dd><dt>可以把个人文件发给助手吗？</dt><dd>不可以。请删除姓名、证件号、地址、案号和其他个人或保密资料，只描述一般问题结构。</dd></dl></div>
  <div class="article-cta"><p>让 AILawyer 帮你把一般问题整理成事实、证据和官方入口。请勿发送个人或保密资料。</p><button data-open-assistant>问 AILawyer ↘</button></div>
  <p style="font-size:13px;color:var(--faint)">仅为 ${esc(jName)} 一般法律信息，不构成法律意见。各地规则不同且会变化；采取行动前请向负责机构或当地合资格律师核对当前程序。</p>
</article>`;
  }
  return `<article class="doc">
  <h1>${esc(title)}</h1>
  <div class="updated">General information guide · ${esc(jName)} · reviewed 3 August 2026</div>
  <div class="callout"><i class="ti ti-alert-triangle"></i> Direct answer: ${esc(direct)}</div>
  <h2>Facts to establish first</h2>
  <p>Identify the country, state, province or region, the responsible body, the type of dispute or decision, and whether any formal notice or court paper has arrived. Do not submit names, identity numbers, addresses, case numbers or confidential documents here.</p>
  <h2>Evidence to preserve</h2><ul>${evidenceItems}</ul>
  <h2>A safer next-step sequence</h2>
  <ol><li>Build a one-page dated chronology from original records and separate facts from assumptions.</li><li>Check the responsible body’s current process, forms, fees and deadlines; do not rely on an old article or a figure from another jurisdiction.</li><li>If consequences are serious, formal papers have arrived or a deadline may be approaching, ask a qualified local lawyer to review the originals promptly.</li></ol>
  <h2>Official routes to check</h2><ul>${officialLinks(topicKey, jurisdictionKey, lang)}</ul>
  <div class="faq"><h2>Common questions</h2><dl><dt>Can this guide decide my case?</dt><dd>No. It can organise a general issue and evidence, but applying law to a person’s full circumstances requires qualified local advice.</dd><dt>Why are there no fixed fees, limits or deadlines?</dt><dd>Those figures change and can differ by location and procedure. The responsible body’s current page or formal notice controls.</dd><dt>Should I send documents to the assistant?</dt><dd>No. Remove names, identity numbers, addresses, case numbers and all personal or confidential information. Describe only the general structure of the issue.</dd></dl></div>
  <div class="article-cta"><p>Ask AILawyer to organise a general question into facts, evidence and an official route. Do not send personal or confidential information.</p><button data-open-assistant>Ask AILawyer ↘</button></div>
  <p style="font-size:13px;color:var(--faint)">General ${esc(jName)} legal information only, not legal advice. Rules vary and change; verify the current procedure with the responsible official body or a qualified local lawyer before acting.</p>
</article>`;
}

function addHeadAssets(html) {
  html = html.replace(/<script type="application\/ld\+json">\s*\{[\s\S]*?"@type":"FAQPage"[\s\S]*?<\/script>\s*/g, '');
  if (!/rel="icon"/.test(html)) html = html.replace('</head>', '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n</head>');
  if (!/rel="manifest"/.test(html)) html = html.replace('</head>', '<link rel="manifest" href="/site.webmanifest">\n</head>');
  if (!/property="og:image"/.test(html)) html = html.replace('</head>', '<meta property="og:image" content="https://ailawyer.lawyer/og.jpg">\n<meta property="og:image:type" content="image/jpeg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="https://ailawyer.lawyer/og.jpg">\n</head>');
  if (!/application\/ld\+json/.test(html) && /<(?:article|main) class="doc\b/.test(html)) {
    const headline = (html.match(/<h1>([\s\S]*?)<\/h1>/) || [,'AI Lawyer Bench guide'])[1].replace(/<[^>]+>/g, '').trim();
    const url = (html.match(/<link rel="canonical" href="([^"]+)"/) || [,'https://ailawyer.lawyer/'])[1];
    const inLanguage = (html.match(/<html lang="([^"]+)"/) || [,'en'])[1];
    const type = /<main class="doc\b/.test(html) ? 'CollectionPage' : 'Article';
    const schema = JSON.stringify({ '@context': 'https://schema.org', '@type': type, headline, url, inLanguage, publisher: { '@type': 'Organization', name: 'AI Lawyer Bench', url: 'https://ailawyer.lawyer/' }, description: 'General legal information only; not legal advice.' });
    html = html.replace('</head>', `<script type="application/ld+json">${schema}</script>\n</head>`);
  }
  return html;
}

function normaliseMetaDescription(html, fullPath = '') {
  const match = html.match(/<meta\s+name="description"\s+content="([^"]*)">/i);
  if (!match) return html;
  const lang = /<html\s+lang="zh/i.test(html) ? 'zh' : 'en';
  let value = match[1].trim();
  if (fullPath.endsWith(`${path.sep}index.html`) && path.dirname(fullPath) === publicDir) {
    value = 'Ask a legal question in plain language. AILawyer helps organise jurisdiction, facts, evidence and official sources without providing personalised legal advice.';
  } else if (lang === 'zh' && value.length < 50) {
    value += ' 本站仅提供一般法律信息，不构成法律意见；采取行动前请核对负责机构的当前规则。';
  } else if (value.length > 200) {
    const clipped = value.slice(0, 165);
    const boundary = clipped.lastIndexOf(' ');
    value = `${clipped.slice(0, boundary > 120 ? boundary : 165).replace(/[;,\s]+$/, '')}.`;
  }
  return html.replace(match[0], `<meta name="description" content="${value}">`);
}

let rewritten = 0;
for (const dir of guideDirs) {
  if (!fs.existsSync(dir)) continue;
  const lang = dir.includes(`${path.sep}zh${path.sep}`) ? 'zh' : 'en';
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.html') && name !== 'index.html')) {
    const match = file.match(/-(us|uk|eu|au|ca|cn)\.html$/);
    const topicMatch = topicFor(file);
    if (!match || !topicMatch) throw new Error(`No safe template mapping for ${path.join(dir, file)}`);
    const [topicKey, topic] = topicMatch;
    const jurisdictionKey = match[1];
    const fullPath = path.join(dir, file);
    let html = fs.readFileSync(fullPath, 'utf8');
    const pageTitle = lang === 'zh' ? topic.zhTitle : topic.enTitle;
    const pageDescription = lang === 'zh'
      ? `${topic.zhTitle}。先整理事实与证据，再通过负责机构的当前页面或当地合资格律师核对程序；本站不提供个案法律意见。`
      : `${topic.enTitle}. Organise facts and evidence, then verify the current procedure with the responsible official body or a qualified local lawyer.`;
    html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(pageTitle)} — AILawyer</title>`);
    html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(pageDescription)}">`);
    if (!/property="og:title"/.test(html)) html = html.replace('</head>', `<meta property="og:title" content="${esc(pageTitle)} — AILawyer">\n<meta property="og:description" content="${esc(pageDescription)}">\n<meta property="og:type" content="article">\n</head>`);
    html = html.replace(/<article class="doc">[\s\S]*?<\/article>/, articleHtml(topicKey, topic, jurisdictionKey, lang));
    html = html.replace(/if you choose to leave a contact for follow-up, it&#39;s used only to arrange that\./gi, 'the assistant does not collect or retain chat content or contact details.');
    html = normaliseMetaDescription(addHeadAssets(html), fullPath);
    fs.writeFileSync(fullPath, html);
    rewritten++;
  }
}

for (const fullPath of walkHtml(publicDir)) {
  const original = fs.readFileSync(fullPath, 'utf8');
  let html = original;
  if (fullPath.includes(`${path.sep}zh${path.sep}articles${path.sep}`)) {
    html = html.replaceAll('https://ailawyer.lawyer/articles/', 'https://ailawyer.lawyer/zh/articles/');
    if (!/<meta\s+name="robots"/i.test(html)) {
      html = html.replace('</head>', '<meta name="robots" content="noindex,follow">\n</head>');
    }
    html = html.replace(/<body(?![^>]*data-pagefind-ignore)/i, '<body data-pagefind-ignore');
  }
  const next = normaliseMetaDescription(addHeadAssets(html), fullPath)
    .replace(/If you choose to leave a contact for follow-up, it(?:'|&#39;)s used only to arrange that\./gi, 'The assistant does not collect or retain chat content or contact details.')
    .replace(/The tool doesn(?:'|&#39;)t ask for personal details to answer you\./gi, 'The assistant does not collect or retain chat content or contact details.');
  if (next !== original) fs.writeFileSync(fullPath, next);
}

console.log(JSON.stringify({ rewritten_guides: rewritten, html_pages_checked: walkHtml(publicDir).length }));

// R254（D1 运行时接入后）：public/sitemap.xml 与 public/llms.txt 已被
// d1_runtime_scaffold.py 的 split_feeds 步骤改名为 *-base 正本——它们不再是
// 构建产物，运行时由 Worker 用 *-base 正本 + D1 新文章现合成。这里改成兼容
// 两种命名（新老站仓通用），且产出统一写回 llms-base.txt，不再生成
// public/llms.txt（否则会重新变成构建产物，盖掉 Worker 合成的版本）。
const sitemapPath = fs.existsSync(path.join(publicDir, 'sitemap-base.xml'))
  ? path.join(publicDir, 'sitemap-base.xml')
  : path.join(publicDir, 'sitemap.xml');
const sitemap = fs.readFileSync(sitemapPath, 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
const pageLines = urls.map((url) => {
  const pathname = new URL(url).pathname;
  const relative = pathname === '/' ? 'index.html' : pathname.endsWith('/') ? `${pathname.slice(1)}index.html` : pathname.slice(1);
  const full = path.join(publicDir, relative);
  const title = fs.existsSync(full) ? ((fs.readFileSync(full, 'utf8').match(/<title>([\s\S]*?)<\/title>/) || [,'AILawyer guide'])[1].replace(/<[^>]+>/g, '').trim()) : 'AILawyer guide';
  return `- ${title}: ${url}`;
});
const llms = [
  '# AILawyer / AI Lawyer Bench', '',
  '> Plain-language, evidence-first general legal information across the United States, United Kingdom, European Union, Australia, Canada and China. Not a law firm and not legal advice.', '',
  '## Identity and boundaries',
  '- Public product: AILawyer at ailawyer.lawyer',
  '- Editorial handle: AI Lawyer Bench',
  '- The assistant organises jurisdiction, facts, evidence and official routes.',
  '- It does not provide personalised legal advice, predict outcomes, calculate deadlines or fees, draft formal documents, collect contact details or retain chat content.',
  '- Current rules must be verified with the responsible official body or a qualified local lawyer.', '',
  '## Public pages', ...pageLines, ''
].join('\n');
const llmsOutPath = fs.existsSync(path.join(publicDir, 'llms-base.txt'))
  ? path.join(publicDir, 'llms-base.txt')
  : path.join(publicDir, 'llms.txt');
fs.writeFileSync(llmsOutPath, llms);

function walkHtml(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walkHtml(full) : entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
  });
}
