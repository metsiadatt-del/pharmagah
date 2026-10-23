import { modules, escapeHTML as esc, buildQuery, parseResults, validateReport, plainText, reportParagraphs, warning } from './core.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  pill: '<path d="m9 15 6-6M5 19a5.66 5.66 0 0 1 0-8l6-6a5.66 5.66 0 0 1 8 8l-6 6a5.66 5.66 0 0 1-8 0Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  book: '<path d="M12 5C9 3 5 3 2 4v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
  folder: '<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
  chart: '<path d="M4 3v18h17M9 16v-4m5 4V8m5 8V4"/>',
  settings: '<path d="m9 3-1 3-3 1-2 4 2 2v4l4 3 3-1 3 1 4-3v-4l2-2-2-4-3-1-1-3Z"/><circle cx="12" cy="12" r="3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3v.01"/>',
  arrow: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  chevron: '<path d="m14 7-5 5 5 5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  shield: '<path d="m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Z"/><path d="m8 12 3 3 5-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v6h16v-6"/>',
  wifi: '<path d="M2 8a16 16 0 0 1 20 0M5 12a11 11 0 0 1 14 0m-11 4a6 6 0 0 1 8 0m-4 4h.01"/>',
  heart: '<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 1 10 8 16 7-6 13-11 8-16Z"/><path d="M3 12h5l2-4 4 8 2-4h5"/>',
  stethoscope: '<path d="M5 3v5a5 5 0 0 0 10 0V3M3 3h4m6 0h4M10 13v3a5 5 0 0 0 10 0v-3"/><circle cx="20" cy="10" r="2"/>',
  drop: '<path d="M12 2s-8 9-8 14a8 8 0 0 0 16 0c0-5-8-14-8-14Z"/><path d="M8 16a4 4 0 0 0 4 4"/>',
  activity: '<path d="M2 12h5l3-9 4 18 3-9h5"/>',
  shuffle: '<path d="M3 6h3c5 0 7 12 12 12h3m-4-4 4 4-4 4M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3m-4-4 4 4-4 4"/>',
  spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  external: '<path d="M14 3h7v7m0-7L10 14M10 3H3v18h18v-7"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  file: '<path d="M14 2H4v20h16V8l-6-6Zm0 0v6h6M8 13h8m-8 4h6"/>'
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
const fa = n => Number(n).toLocaleString('fa-IR');
const date = d => new Date(d).toLocaleDateString('fa-IR', { day: 'numeric', month: 'long', year: 'numeric' });
let reports = [], storageAvailable = true;
try { reports = JSON.parse(localStorage.getItem('pharmagah-reports') || '[]').filter(validateReport); } catch { storageAvailable = false; }
let state = { page: 'home', module: 'pharma', active: null, busy: false, search: '', archiveFilter: 'all', draft: '', type: 'all', years: '5' };
let controller;
let offlineReady = false;
let toastTimer;
const app = document.querySelector('#app');
function toast(text) { const el = document.querySelector('#toast'); el.textContent = text; el.classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 5000); }
function persist() { try { localStorage.setItem('pharmagah-reports', JSON.stringify(reports)); storageAvailable = true; return true; } catch { storageAvailable = false; toast('ذخیره‌سازی مرورگر در دسترس نیست یا پر شده؛ برای نگهداری گزارش، خروجی بگیرید.'); return false; } }
function nav(id, name, sym, extra = '') { return `<button class="nav-item ${state.page === id ? 'active' : ''}" data-page="${id}">${icon(sym)}<span>${name}</span>${extra}</button>`; }
function shell() {
  app.innerHTML = `<aside class="sidebar" id="sidebar">
    <a class="brand" href="#" data-page="home"><span class="brand-mark">${icon('pill')}</span><span><strong>فارم<span>‌آگاه</span></strong><small>دستیار پژوهش پزشکی</small></span></a>
    <button class="new-research" data-action="new">${icon('plus')} پژوهش جدید</button>
    <div class="nav-label">فضای پژوهش</div>
    <nav aria-label="منوی اصلی">${nav('home', 'میز پژوهش', 'grid')}${nav('archive', 'پژوهش‌های من', 'folder', `<span class="nav-count">${fa(reports.length)}</span>`)}${nav('sources', 'کتابخانهٔ منابع', 'book')}</nav>
    <div class="sidebar-divider"></div><div class="nav-label">ابزارهای پژوهش</div>
    <nav>${nav('exports', 'گزارش‌ها و خروجی‌ها', 'file')}<button class="nav-item" data-action="offline">${icon('wifi')}<span>دسترسی آفلاین</span><span class="mini-dot"></span></button></nav>
    <div class="sidebar-bottom"><div class="local-card"><span class="local-icon">${icon('shield')}</span><strong>دانش شما، همراه شما</strong><p>پژوهش‌ها روی همین مرورگر نگهداری می‌شوند.</p><span>${icon('check')} بدون نیاز به حساب کاربری</span></div><button class="nav-item" data-action="help">${icon('help')}<span>راهنما و نکات استفاده</span></button><div class="profile"><div class="avatar">پ</div><div><strong>پژوهشگر</strong><small>فضای شخصی پژوهش</small></div><button class="icon-button" data-action="settings" aria-label="تنظیمات">${icon('settings')}</button></div></div>
  </aside><div class="main-shell"><header class="topbar"><div class="breadcrumb"><button class="icon-button mobile-menu" data-action="menu" aria-label="باز کردن منو">${icon('menu')}</button><span>فضای کاری</span>${icon('chevron')}<strong>${({home:'میز پژوهش',archive:'پژوهش‌های من',sources:'کتابخانهٔ منابع',exports:'گزارش‌ها و خروجی‌ها',report:'گزارش پژوهش'})[state.page]}</strong></div><div class="topbar-actions"><span class="connection ${navigator.onLine ? '' : 'disconnected'}"><i></i>${navigator.onLine ? 'آنلاین' : 'آفلاین'}</span><span class="top-divider"></span><button class="icon-button" data-action="help" aria-label="راهنما">${icon('help')}</button><div class="small-avatar">پ</div></div></header><main id="content">${renderPage()}</main><footer><span>فارم‌آگاه <span class="footer-dot">·</span> همراه پژوهش، نه جایگزین قضاوت بالینی</span><span>دقت در شواهد. اطمینان در پژوهش.</span></footer></div>`;
  bind();
}
function pageHeading(kicker, title, text, extra = '') { return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${text}</p></div>${extra}</div>`; }
function renderPage() { if (state.page === 'home') return home(); if (state.page === 'sources') return sources(); if (state.page === 'report') return reportView(); return archive(state.page === 'exports'); }
function home() {
  const mod = modules.find(m => m.id === state.module);
  return `${pageHeading('فضایی برای پرسیدن، کشف کردن و آموختن', 'از پرسش علمی، تا <em>شواهد معتبر.</em>', 'دستیار پژوهشی شما در دنیای داروسازی و علوم پزشکی', `<span class="date-label">${icon('calendar')} ${date(new Date())}</span>`)}
  <section class="welcome-banner"><div class="banner-content"><span class="banner-tag">${icon('spark')} پژوهش ساختاریافته، نگاه علمی</span><h2>دانش پراکنده را به<br>پژوهشی منسجم تبدیل کنید.</h2><p>مقالات علمی را پیدا کنید، شواهد را کنار هم بگذارید<br class="desktop-br"> و کتابخانهٔ شخصی پژوهش خود را بسازید.</p><a class="banner-link" href="#research-form">اولین پرسش شما چیست؟ ${icon('arrow')}</a></div><div class="science-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="art-dot dot-one"></div><div class="art-dot dot-two"></div><div class="art-dot dot-three"></div><div class="art-tile tile-book">${icon('book')}</div><div class="art-tile tile-pill">${icon('pill')}</div><div class="art-note note-one">${icon('shield')} مبتنی بر شواهد</div><div class="art-note note-two">${icon('check')} مسیر روشن پژوهش</div><div class="art-cross">+</div></div></section>
  <section class="research-area" aria-labelledby="research-title"><div class="section-heading"><h2 id="research-title">پژوهش خود را از اینجا شروع کنید</h2><span>۶ مسیر تخصصی، یک فضای یکپارچه</span></div><div class="module-tabs" role="tablist" aria-label="حوزهٔ پژوهش">${modules.map(m => `<button role="tab" aria-selected="${m.id === state.module}" class="module-tab ${m.id === state.module ? 'selected' : ''}" data-module="${m.id}"><span class="module-icon">${icon(m.icon)}</span><strong>${m.title}</strong><small>${m.subtitle}</small></button>`).join('')}</div>
  <div class="workspace-grid"><section class="query-card"><form id="research-form"><div class="query-title"><span class="query-title-icon">${icon(mod.icon)}</span><div><h3>چه موضوعی را بررسی کنیم؟</h3><p>${mod.title} <span> / </span> مرور منابع و گردآوری شواهد</p></div><span class="tag">تا ${fa(mod.count)} مقاله</span></div><label class="sr-only" for="query">موضوع پژوهش</label><textarea id="query" name="query" maxlength="300" required placeholder="${mod.placeholder}">${esc(state.draft)}</textarea><div class="suggestions"><span>برای شروع:</span>${mod.hints.map(h => `<button type="button" data-hint="${esc(h)}" dir="ltr">${esc(h)}</button>`).join('')}</div><div class="query-filters"><label>${icon('book')} نوع مطالعه<select id="study-type"><option value="all" ${state.type === 'all' ? 'selected' : ''}>همهٔ مقالات نمایه‌شده</option><option value="review" ${state.type === 'review' ? 'selected' : ''}>مرور نظام‌مند</option><option value="trial" ${state.type === 'trial' ? 'selected' : ''}>کارآزمایی تصادفی</option><option value="meta" ${state.type === 'meta' ? 'selected' : ''}>متاآنالیز</option></select></label><label>${icon('clock')} بازهٔ انتشار<select id="year-range"><option value="5" ${state.years === '5' ? 'selected' : ''}>۵ سال اخیر</option><option value="1" ${state.years === '1' ? 'selected' : ''}>سال جاری و قبل</option><option value="all" ${state.years === 'all' ? 'selected' : ''}>همهٔ سال‌ها</option></select></label></div>${state.module === 'case' ? '<p class="privacy-note">نام، کد ملی و اطلاعات شناسایی بیمار را وارد نکنید. تنها کلیدواژهٔ علمی به پایگاه عمومی ارسال می‌شود؛ این بخش تشخیص خودکار ارائه نمی‌کند.</p>' : ''}${state.module === 'interaction' ? '<p class="privacy-note">جست‌وجوی مقاله، جایگزین بررسی در پایگاه تخصصی تداخلات نیست. نبود نتیجه به معنای ایمن‌بودن ترکیب نیست.</p>' : ''}<div class="query-bottom"><span>${icon('shield')} جست‌وجوی واقعی در Europe PMC</span><button class="primary-button" type="submit" ${state.busy ? 'disabled' : ''}>${icon(state.busy ? 'clock' : 'search')} ${state.busy ? 'در حال جست‌وجو…' : 'شروع پژوهش'}${!state.busy ? icon('arrow') : ''}</button></div><p class="search-disclosure">عبارت جست‌وجو به Europe PMC ارسال می‌شود. برای نتایج دقیق‌تر، نام علمی انگلیسی وارد کنید.</p><div id="search-status" role="status" aria-live="polite"></div></form></section>
  <aside class="research-guide"><div class="guide-title">${icon('spark')}<h3>یک گزارش، با نگاه جامع</h3></div><p>چارچوب پیشنهادی پژوهش شما</p><ul>${mod.sections.slice(0, 4).map(s => `<li>${icon('check')}<span>${s.split('؛')[0]}</span></li>`).join('')}</ul><button class="text-button" data-action="framework">مشاهدهٔ چارچوب کامل ${icon('arrow')}</button><div class="guide-foot">${icon('book')} متن اصلی مقالات، بدون ترجمهٔ حدسی</div></aside></div></section>
  <div class="lower-grid"><section class="recent-section"><div class="section-heading"><h2>${icon('clock')} پژوهش‌های اخیر</h2><button class="text-button" data-page="archive">مشاهدهٔ همه ${icon('arrow')}</button></div>${reports.length ? `<div class="recent-list">${reports.slice(0, 3).map(reportRow).join('')}</div>` : `<div class="empty-recent"><div class="empty-icon">${icon('folder')}</div><div><h3>اولین پژوهش، آغاز کتابخانهٔ شماست</h3><p>گزارش‌هایی که ذخیره کنید اینجا در دسترس خواهند بود؛ حتی آفلاین.</p></div><span class="subtle-count">۰۱</span></div>`}</section><section class="source-preview"><div class="section-heading"><h2>${icon('shield')} شفافیت در منابع</h2><button class="text-button" data-page="sources">جزئیات ${icon('arrow')}</button></div><div class="source-logos"><span class="pubmed-logo">Pub<span>Med</span><small>از طریق Europe PMC</small></span><span class="pmc-logo">Europe <strong>PMC</strong><small>مقالات و چکیده‌ها</small></span><span class="guideline-logo">Clinical<br><strong>Guidelines</strong><small>نیازمند اتصال</small></span></div><p class="source-note"><i></i> منبع هر مقاله مشخص است؛ کیفیت شواهد نیازمند ارزیابی است.</p></section></div>
  <div class="safety-line">${icon('shield')}<p>برای پژوهش و آموزش طراحی شده است. تصمیم‌های تشخیصی و درمانی باید با ارزیابی متخصص و منابع به‌روز اتخاذ شوند.</p><button class="text-button" data-action="help">بیشتر بدانید ${icon('chevron')}</button></div>`;
}
function reportRow(r) {
  const mod = modules.find(m => m.id === r.module);
  return `<button class="report-row" data-open="${esc(r.id)}"><span class="row-icon">${icon(mod.icon)}</span><span class="row-content"><strong dir="auto">${esc(r.title)}</strong><small>${mod.title} <span>·</span> ${date(r.created)}</small></span><span class="row-meta">${fa(r.articles.length)} مقاله <small>${r.articles.length ? 'گردآوری شواهد' : 'پیش‌نویس'}</small></span>${icon('chevron')}</button>`;
}
function archive(exports = false) {
  const filtered = reports.filter(r => (state.archiveFilter === 'all' || r.module === state.archiveFilter) && r.title.toLowerCase().includes(state.search.toLowerCase()));
  return `${pageHeading('کتابخانهٔ شخصی شما', exports ? 'گزارش‌ها و خروجی‌ها' : 'پژوهش‌های من', exports ? 'گزارش را باز کنید و نسخهٔ Word یا نسخهٔ قابل چاپ PDF بگیرید.' : 'مسیر پژوهش شما، محفوظ و قابل مرور؛ آنلاین و آفلاین.', `<button class="primary-button" data-action="new">${icon('plus')} پژوهش جدید</button>`)}<div class="stats-grid"><div>${icon('folder')}<strong>${fa(reports.length)}</strong><span>پژوهش ذخیره‌شده</span></div><div>${icon('book')}<strong>${fa(reports.reduce((n, r) => n + r.articles.length, 0))}</strong><span>مقاله در گزارش‌ها</span></div><div>${icon('wifi')}<strong>محلی</strong><span>ذخیره در همین مرورگر</span></div></div><section class="panel"><div class="archive-toolbar"><div class="input-search">${icon('search')}<input id="archive-search" aria-label="جست‌وجوی پژوهش" placeholder="جست‌وجو در پژوهش‌ها…" value="${esc(state.search)}"></div><select id="archive-filter" aria-label="فیلتر حوزه"><option value="all">همهٔ حوزه‌ها</option>${modules.map(m => `<option value="${m.id}" ${state.archiveFilter === m.id ? 'selected' : ''}>${m.title}</option>`).join('')}</select></div><div id="archive-list">${filtered.length ? filtered.map(reportRow).join('') : `<div class="empty-state">${icon('folder')}<h2>${reports.length ? 'پژوهشی با این مشخصات پیدا نشد' : 'کتابخانه‌تان را بسازید'}</h2><p>${reports.length ? 'عبارت جست‌وجو یا فیلتر را تغییر دهید.' : 'از میز پژوهش شروع کنید؛ گزارش‌ها پس از ذخیره اینجا نمایش داده می‌شوند.'}</p>${!reports.length ? '<button class="primary-button" data-action="new">شروع اولین پژوهش</button>' : ''}</div>`}</div></section><p class="muted-info">${icon('shield')} اطلاعات روی این دستگاه نگهداری می‌شود؛ پاک‌کردن داده‌های مرورگر، آرشیو را حذف می‌کند. از تنظیمات نسخهٔ پشتیبان بگیرید.</p>`;
}
function sources() {
  const items = [
    ['Europe PMC / PubMed', 'جست‌وجوی آنلاین', 'active', 'جست‌وجوی مقالات نمایه‌شدهٔ MEDLINE/PubMed همراه با چکیده، شناسهٔ PMID و DOI. مرتب‌شده بر اساس تاریخ انتشار؛ بدون تضمین کیفیت یا جامعیت.'],
    ['UpToDate', 'متصل نیست', '', 'دسترسی اشتراکی و مجوز رسمی لازم است. این برنامه به محتوای UpToDate دسترسی ندارد.'],
    ['Harrison’s · Katzung · Foye', 'نیازمند منبع مجاز', '', 'منابع مرجع دانشگاهی؛ در حال حاضر متن این کتاب‌ها در برنامه موجود نیست و نقل‌قولی از آن‌ها تولید نمی‌شود.'],
    ['Applied Therapeutics', 'نیازمند منبع مجاز', '', 'برای استناد دقیق، نسخهٔ کتاب و دسترسی دارای مجوز باید فراهم شود.'],
    ['AHA & Clinical Guidelines', 'اتصال مستقیم ندارد', '', 'مقالات مرتبط ممکن است در جست‌وجو پیدا شوند؛ دریافت آخرین نسخهٔ راهنما و تأیید اعتبار آن خودکار نیست.'],
    ['Drug Interaction Databases', 'متصل نیست', '', 'سطوح خطر X / D / C متعلق به نظام‌های مشخص‌اند. بدون پایگاه تخصصی، رتبهٔ خطر، فهرست قطعی تداخلات یا تضمین ایمنی ساخته نمی‌شود.']
  ];
  return `${pageHeading('منشأ روشن، پژوهش قابل پیگیری', 'کتابخانهٔ منابع', 'دقیقاً بدانید کدام منبع متصل است و کدام به دسترسی تکمیلی نیاز دارد.')}<div class="notice">${icon('shield')} هیچ پایگاه علمی مصون از خطا نیست؛ مقالات بازیابی‌شده باید از نظر طراحی مطالعه، سوگیری، بازپس‌گیری و ارتباط بالینی بررسی شوند.</div><div class="source-grid">${items.map(([title, status, cls, text]) => `<article class="source-card"><div class="source-card-top">${icon('book')}<span class="badge ${cls}">${status}</span></div><h2 dir="ltr">${title}</h2><p>${text}</p></article>`).join('')}</div>`;
}
function reportView() {
  const r = state.active;
  if (!r) { state.page = 'home'; return home(); }
  const mod = modules.find(m => m.id === r.module);
  return `<div class="report-header"><button class="text-button" data-page="archive">${icon('arrow')} بازگشت به پژوهش‌ها</button><div class="report-actions"><button class="secondary-button" data-action="word">${icon('download')} Word</button><button class="secondary-button" data-action="pdf">${icon('file')} چاپ / PDF</button><button class="primary-button" data-action="save">${icon('check')} ذخیرهٔ گزارش</button></div></div><article id="print-report"><div class="report-title"><span class="eyebrow">${mod.title} / گردآوری پژوهشی</span><h1 dir="auto">${esc(r.title)}</h1><p>${date(r.created)} <span>·</span> ${fa(r.articles.length)} مقاله از هدف ${fa(mod.count)} مطالعه <span>·</span> Europe PMC</p></div><div class="notice">${icon('shield')} ${warning}</div><div class="report-summary"><h3>دربارهٔ این گزارش</h3><p>این خروجی شامل مشخصات و چکیدهٔ اصلی مقالات است؛ خلاصه‌سازی هوشمند، ترجمهٔ تخصصی و تحلیل بالینی انجام نشده است. ${r.articles.length < mod.count ? 'تعداد مقالات بازیابی‌شده کمتر از هدف است؛ برای تکمیل تعداد، مطالعهٔ نامعتبر یا ساختگی اضافه نشده است.' : 'تعداد نتیجه به معنای تأیید کیفیت یا پوشش همهٔ شواهد نیست.'}</p><details><summary>مشاهدهٔ عبارت جست‌وجو و روش انتخاب</summary><p dir="ltr" class="query-code">${esc(r.query)}</p><p>مقالات نمایه‌شده دارای چکیده، مرتب بر اساس تاریخ انتشار. برچسب‌های پیش‌چاپ و بازپس‌گیری تا حد داده‌های نمایه حذف می‌شوند. جدیدترین نتایج لزوماً بهترین شواهد نیستند.</p></details></div><section class="panel framework-panel"><h2>چارچوب بررسی تخصصی</h2><p>بخش‌های زیر هنوز تحلیل نشده‌اند؛ به منبع قابل استناد و بررسی متخصص نیاز دارند.</p><div class="framework-grid">${mod.sections.map((s, i) => `<div><span>${fa(i + 1)}</span><strong>${s}</strong><small>نیازمند بررسی</small></div>`).join('')}</div>${r.module === 'case' ? '<p class="privacy-note">درصد احتمال تشخیص فقط با مدل معتبر و دادهٔ کافی قابل ارائه است؛ این گزارش درصد تشخیصی تولید نمی‌کند.</p>' : ''}</section><div class="section-heading article-heading"><h2>مقالات بازیابی‌شده <span class="count-pill">${fa(r.articles.length)}</span></h2><span>متن اصلی · نیازمند ارزیابی شواهد</span></div>${r.articles.map((a, i) => `<section class="article-card"><div class="article-number">${fa(i + 1)}</div><div class="article-main"><div class="article-meta"><span>${esc(a.journal)}</span><span>${esc(a.date)}</span></div><h3 dir="ltr"><a href="https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(a.id)}/" target="_blank" rel="noopener noreferrer">${esc(a.title)} ${icon('external')}</a></h3><p dir="ltr" class="authors">${esc(a.authors)}</p><div class="article-tags">${(a.types || []).slice(0, 3).map(t => `<span>${esc(t)}</span>`).join('')}<span>PMID: ${esc(a.id)}</span></div><details><summary>چکیدهٔ اصلی مقاله</summary><p class="abstract" dir="ltr">${esc(plainText(a.abstract)) || 'چکیده در دسترس نیست.'}</p>${a.doi ? `<p class="doi" dir="ltr">DOI: ${esc(a.doi)}</p>` : ''}</details></div></section>`).join('')}<section class="panel notes-panel"><h2>یادداشت پژوهشگر <span class="badge">تأییدنشده</span></h2><p>جمع‌بندی و ارزیابی خود را با ذکر منبع بنویسید. اطلاعات شناسایی بیمار را ثبت نکنید.</p><textarea id="research-notes" maxlength="30000" placeholder="یادداشت، محدودیت‌های مطالعات و پرسش‌های بعدی…">${esc(r.notes || '')}</textarea><p class="print-notes">${esc(r.notes || 'یادداشتی ثبت نشده است.')}</p><span class="note-save-hint">برای نگهداری یادداشت‌ها، «ذخیرهٔ گزارش» را بزنید.</span></section><p class="print-footer">فارم‌آگاه — گزارش آموزشی و پژوهشی؛ نه دستور درمان.</p></article>${reports.some(x => x.id === r.id) ? `<button class="danger-button" data-action="delete">${icon('trash')} حذف این پژوهش از آرشیو</button>` : ''}`;
}
function dialog(title, content) {
  const modal = document.querySelector('#modal');
  modal.innerHTML = `<div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" data-close aria-label="بستن">${icon('close')}</button></div><div class="modal-body">${content}</div>`;
  modal.querySelector('[data-close]').onclick = () => modal.close();
  if (!modal.open) modal.showModal();
}
function collectNotes() { const el = document.querySelector('#research-notes'); if (el && state.active) state.active.notes = el.value; }
function navigate(page) { collectNotes(); state.page = page; shell(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function bind() {
  app.querySelectorAll('[data-page]').forEach(el => el.onclick = e => { e.preventDefault(); navigate(el.dataset.page); });
  app.querySelectorAll('[data-module]').forEach(el => {
    el.onclick = () => { state.draft = ''; state.module = el.dataset.module; shell(); document.querySelector(`[data-module="${state.module}"]`).focus(); };
    el.onkeydown = event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const index = modules.findIndex(m => m.id === state.module); const next = event.key === 'Home' ? 0 : event.key === 'End' ? modules.length - 1 : (index + (event.key === 'ArrowLeft' ? 1 : -1) + modules.length) % modules.length; document.querySelector(`[data-module="${modules[next].id}"]`).click(); };
  });
  app.querySelectorAll('[data-hint]').forEach(el => el.onclick = () => { document.querySelector('#query').value = el.dataset.hint; state.draft = el.dataset.hint; document.querySelector('#query').focus(); });
  app.querySelectorAll('[data-open]').forEach(el => el.onclick = () => { collectNotes(); state.active = structuredClone(reports.find(r => r.id === el.dataset.open)); state.page = 'report'; shell(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  app.querySelectorAll('[data-action]').forEach(el => el.onclick = () => action(el.dataset.action));
  const form = document.querySelector('#research-form'); if (form) form.onsubmit = search;
  const query = document.querySelector('#query'); if (query) query.oninput = () => state.draft = query.value;
  const type = document.querySelector('#study-type'); if (type) type.onchange = () => state.type = type.value;
  const years = document.querySelector('#year-range'); if (years) years.onchange = () => state.years = years.value;
  const searchInput = document.querySelector('#archive-search'); if (searchInput) searchInput.oninput = () => { const position = searchInput.selectionStart; state.search = searchInput.value; shell(); const el = document.querySelector('#archive-search'); el.focus(); el.setSelectionRange(position, position); };
  const filter = document.querySelector('#archive-filter'); if (filter) filter.onchange = () => { state.archiveFilter = filter.value; shell(); };
  const notes = document.querySelector('#research-notes'); if (notes) notes.oninput = () => { state.active.notes = notes.value; document.querySelector('.print-notes').textContent = notes.value; };
}
async function search(e) {
  e.preventDefault();
  if (state.busy) return;
  if (!navigator.onLine) { toast('برای جست‌وجوی جدید اینترنت لازم است؛ پژوهش‌های ذخیره‌شده آفلاین در دسترس‌اند.'); return; }
  const term = document.querySelector('#query').value.trim();
  let query;
  try { query = buildQuery(term, state.type, state.years, state.module); } catch (err) { toast(err.message); return; }
  const mod = modules.find(m => m.id === state.module);
  state.draft = term; state.busy = true; shell();
  const status = document.querySelector('#search-status'); status.innerHTML = '<div class="loading-line"><span class="spinner"></span>در حال دریافت مقالات؛ این فرایند ممکن است چند ثانیه طول بکشد.</div>';
  controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const params = new URLSearchParams({ query, format: 'json', resultType: 'core', pageSize: String(mod.count) });
    const response = await fetch(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?${params}`, { signal: controller.signal, credentials: 'omit' });
    if (!response.ok) throw new Error('پایگاه مقاله فعلاً پاسخ نمی‌دهد. کمی بعد دوباره تلاش کنید.');
    const articles = parseResults(await response.json());
    if (!articles.length) { toast('مقاله‌ای با این فیلترها پیدا نشد. نام انگلیسی دقیق‌تر یا بازهٔ انتشار گسترده‌تری انتخاب کنید.'); return; }
    state.active = { id: crypto.randomUUID(), title: term, module: mod.id, created: new Date().toISOString(), query, articles, notes: '' };
    state.page = 'report'; toast(`${fa(articles.length)} مقاله دریافت شد. برای نگهداری، گزارش را ذخیره کنید.`);
  } catch (err) { toast(err.name === 'AbortError' ? 'مهلت اتصال تمام شد. اینترنت را بررسی و دوباره تلاش کنید.' : (err instanceof TypeError ? 'اتصال به پایگاه مقاله برقرار نشد. شبکه یا دسترسی مرورگر را بررسی کنید.' : err.message)); }
  finally { clearTimeout(timeout); state.busy = false; shell(); }
}
async function action(name) {
  if (name === 'menu') { document.querySelector('#sidebar').classList.toggle('mobile-open'); return; }
  if (name === 'new') { state.draft = ''; state.active = null; navigate('home'); document.querySelector('#query').focus(); return; }
  if (name === 'framework') { const mod = modules.find(m => m.id === state.module); dialog(`چارچوب پژوهش ${mod.title}`, `<ol class="framework-list">${mod.sections.map(s => `<li>${s}</li>`).join('')}<li>تا ${fa(mod.count)} مقالهٔ مرتبط، همراه با شناسه و چکیدهٔ اصلی</li></ol><div class="notice">این چارچوب جایگزین تحلیل نیست. تکمیل بخش‌های بالینی به بررسی منابع و ارزیابی متخصص نیاز دارد.</div>`); return; }
  if (name === 'help') { dialog('راهنمای پژوهش مسئولانه', '<h3>از موضوع به مقاله</h3><p>حوزه را انتخاب کنید، نام علمی انگلیسی بنویسید و فیلتر مطالعه را مشخص کنید. مقالات از Europe PMC دریافت می‌شوند. متن چکیده همان متن منبع است و خلاصه‌سازی هوشمند یا ترجمهٔ خودکار فعال نیست.</p><h3>اعتبارسنجی پیش از استفاده</h3><p>متن کامل، روش مطالعه، جمعیت، اندازهٔ اثر، تعارض منافع و خطر سوگیری را بررسی کنید. تعداد مقاله و اعتبار نشریه به‌تنهایی کافی نیست.</p><h3>محدودیت‌های بالینی</h3><p>این نسخه دوز، احتمال تشخیص، رتبهٔ قطعی تداخل یا دستور درمان تولید نمی‌کند. منابع اشتراکی و سرویس تحلیل هوشمند هنوز متصل نیستند. علائم اورژانسی نیازمند مراجعهٔ فوری به خدمات درمانی‌اند.</p><h3>آفلاین و خروجی</h3><p>گزارش را ذخیره کنید تا در همین مرورگر قابل مرور باشد. Word مستقیماً دانلود می‌شود؛ برای PDF، در پنجرهٔ چاپ گزینهٔ Save as PDF را انتخاب کنید.</p>'); return; }
  if (name === 'offline') { dialog('پژوهش، حتی بدون اینترنت', `<div class="offline-hero">${icon('wifi')}<h3>${offlineReady ? 'پوستهٔ برنامه برای آفلاین ذخیره شده است' : 'آماده‌سازی آفلاین هنوز تأیید نشده است'}</h3></div><p>آرشیو و چکیده‌های ذخیره‌شده بدون اینترنت قابل مرورند. پس از یک بار بارگذاری کامل روی HTTPS، فایل‌های برنامه نیز ذخیره می‌شوند.</p><p>جست‌وجوی تازه و بازکردن لینک مقاله به اینترنت نیاز دارد. حالت خصوصی مرورگر یا پاک‌کردن داده‌های سایت ممکن است آرشیو را حذف کند.</p><p>تعداد گزارش‌های ذخیره‌شده: <strong>${fa(reports.length)}</strong></p>`); return; }
  if (name === 'settings') { settings(); return; }
  if (name === 'save') { collectNotes(); const previous = reports; reports = [structuredClone(state.active), ...reports.filter(r => r.id !== state.active.id)]; if (persist()) { toast('گزارش و یادداشت‌ها در این مرورگر ذخیره شدند.'); shell(); } else reports = previous; return; }
  if (name === 'word') { collectNotes(); try { const paragraphs = reportParagraphs(state.active); const doc = new Document({ styles: { default: { document: { run: { font: 'Arial', size: 23 } } } }, sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children: paragraphs.map((text, i) => new Paragraph({ bidirectional: /[\u0600-\u06ff]/.test(text), spacing: { after: 180 }, children: [new TextRun({ text, bold: i === 0, size: i === 0 ? 36 : 23 })] })) }] }); download(await Packer.toBlob(doc), `pharmagah-${state.active.id.slice(0, 8)}.docx`); toast('فایل Word آماده شد.'); } catch { toast('ساخت فایل Word ناموفق بود؛ از نسخهٔ چاپ استفاده کنید.'); } return; }
  if (name === 'pdf') { collectNotes(); document.querySelectorAll('#print-report details').forEach(el => { el.dataset.wasOpen = el.open; el.open = true; }); window.print(); return; }
  if (name === 'delete') { dialog('حذف پژوهش', '<p>این گزارش از آرشیو همین مرورگر حذف می‌شود. ادامه می‌دهید؟</p><button class="danger-button" id="confirm-delete">حذف پژوهش</button>'); document.querySelector('#confirm-delete').onclick = () => { const previous = reports; reports = reports.filter(r => r.id !== state.active.id); if (persist()) { document.querySelector('#modal').close(); state.active = null; navigate('archive'); toast('پژوهش حذف شد.'); } else reports = previous; }; }
}
function download(blob, filename) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000); }
function settings() {
  dialog('تنظیمات و نگهداری داده‌ها', `<h3>فضای ذخیره‌سازی شخصی</h3><p>داده‌ها همگام‌سازی ابری نمی‌شوند و روی این مرورگر باقی می‌مانند. این فضا رمزگذاری تخصصی پروندهٔ پزشکی ندارد؛ اطلاعات هویتی بیمار را ثبت نکنید.</p><div class="settings-status">${icon('folder')} ${fa(reports.length)} گزارش <span class="badge ${storageAvailable ? 'active' : ''}">${storageAvailable ? 'ذخیرهٔ محلی' : 'ذخیره‌سازی در دسترس نیست'}</span></div><h3>نسخهٔ پشتیبان</h3><p>فایل پشتیبان شامل متن مقالات و یادداشت‌هاست؛ آن را در محل امن نگه دارید.</p><button class="secondary-button" id="backup">${icon('download')} دریافت نسخهٔ پشتیبان JSON</button><label class="import-label">بازیابی از نسخهٔ پشتیبان<input id="restore" type="file" accept=".json,application/json"></label><p class="muted-info">بازیابی، گزارش‌های جدید را اضافه می‌کند و گزارش موجود را بازنویسی نمی‌کند.</p>`);
  document.querySelector('#backup').onclick = () => download(new Blob([JSON.stringify({ version: 1, reports }, null, 2)], { type: 'application/json' }), 'pharmagah-backup.json');
  document.querySelector('#restore').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast('حجم نسخهٔ پشتیبان باید کمتر از ۱۰ مگابایت باشد.'); return; }
    try { const data = JSON.parse(await file.text()); if (data.version !== 1 || !Array.isArray(data.reports) || !data.reports.every(validateReport)) throw new Error(); const previous = reports; const ids = new Set(reports.map(r => r.id)); const additions = data.reports.filter(r => { if (ids.has(r.id)) return false; ids.add(r.id); return true; }); reports = [...reports, ...additions].sort((a, b) => b.created.localeCompare(a.created)); if (persist()) { document.querySelector('#modal').close(); shell(); toast(`${fa(additions.length)} گزارش بازیابی شد.`); } else reports = previous; } catch { toast('فایل پشتیبان معتبر نیست؛ داده‌های فعلی تغییر نکرده‌اند.'); }
  };
}
window.addEventListener('afterprint', () => document.querySelectorAll('#print-report details').forEach(el => el.open = el.dataset.wasOpen === 'true'));
window.addEventListener('online', () => { collectNotes(); shell(); toast('اتصال اینترنت برقرار شد.'); });
window.addEventListener('offline', () => { collectNotes(); shell(); toast('آفلاین هستید؛ آرشیو ذخیره‌شده همچنان در دسترس است.'); });
shell();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(() => navigator.serviceWorker.ready).then(async registration => {
    const cache = await caches.open('pharmagah-v2'); offlineReady = !!(await cache.match(new URL('./index.html', location.href).href));
  }).catch(() => { offlineReady = false; });
}
