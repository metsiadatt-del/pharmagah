export const modules = [
  { id: 'pharma', title: 'فارما', subtitle: 'دارو و فارماکوتراپی', icon: 'pill', count: 20, placeholder: 'نام دارو، دستهٔ دارویی یا پرسش پژوهشی خود را بنویسید…', hints: ['Metformin', 'SGLT2 inhibitors', 'Semaglutide'], sections: ['اندیکاسیون‌ها، Off-label، دوز و مدت درمان در گروه‌های سنی', 'بارداری، سالمندی و جمعیت‌های خاص؛ G6PD و بیماری‌های همراه', 'مکانیسم اثر، فارماکودینامیک و اثرات فیزیولوژیک', 'ساختار شیمیایی، SAR، فارماکوفور و سیر تاریخی داروهای دسته', 'فارماکوکینتیک، دفع و تنظیم دوز کلیوی و کبدی', 'تا ۲۵ تداخل مهم با ذکر نظام طبقه‌بندی و مدیریت', 'فارماسیوتیکس، نگهداری و آموزش مصرف بیمار', 'توکسیکولوژی، علائم و مدیریت مسمومیت توسط متخصص'] },
  { id: 'case', title: 'کیس بالینی', subtitle: 'بررسی ساختاریافتهٔ بیمار', icon: 'stethoscope', count: 20, placeholder: 'فقط موضوع علمی بدون مشخصات بیمار؛ مثلاً heart failure renal impairment…', hints: ['Heart failure renal impairment', 'Polypharmacy older adults', 'Diabetes pregnancy'], sections: ['اطلاعات تکمیلی لازم: سن، وزن، علائم حیاتی، سابقه، آزمایش‌ها و داروها', 'پاتوفیزیولوژی و توضیح علائم', 'سه تشخیص افتراقی اصلی و دو احتمال دیگر؛ بدون درصدسازی', 'درمان دارویی و غیردارویی با بررسی متخصص', 'پایش، پیگیری و اصلاح سبک زندگی'] },
  { id: 'disease', title: 'بیماری‌ها', subtitle: 'از اتیولوژی تا درمان', icon: 'heart', count: 20, placeholder: 'نام بیماری یا موضوع علمی مرتبط با علائم را بنویسید…', hints: ['Type 2 diabetes', 'Heart failure', 'Rheumatoid arthritis'], sections: ['تعریف، اتیولوژی و عوامل خطر', 'پاتوفیزیولوژی و تظاهرات بالینی', 'تشخیص و تشخیص‌های افتراقی', 'فارماکوتراپی و درمان غیردارویی', 'پایش، پیشگیری و جمعیت‌های خاص'] },
  { id: 'cosmetic', title: 'آرایشی و بهداشتی', subtitle: 'مواد مؤثره و محصولات', icon: 'drop', count: 10, placeholder: 'نام مادهٔ مؤثره یا ترکیب محصول را وارد کنید…', hints: ['Niacinamide', 'Topical retinoids', 'Sunscreen'], sections: ['ترکیبات، فرمولاسیون و مکانیسم اثر', 'شواهد اثربخشی و محدودیت تعمیم به محصول', 'ایمنی، حساسیت و جمعیت‌های خاص', 'روش مصرف، پایداری و نگهداری'] },
  { id: 'supplement', title: 'مکمل‌های ورزشی', subtitle: 'عملکرد و شواهد علمی', icon: 'activity', count: 10, placeholder: 'نام مکمل یا پرسش خود دربارهٔ عملکرد ورزشی را بنویسید…', hints: ['Creatine monohydrate', 'Whey protein', 'Beta alanine'], sections: ['ماهیت مکمل و فیزیولوژی ورزشی', 'اثربخشی و کیفیت شواهد', 'دوز، مدت مصرف و محدودهٔ سنی با استناد', 'افراد عادی و جمعیت‌های خاص', 'عوارض، تداخلات و کنترل کیفیت'] },
  { id: 'interaction', title: 'تداخلات دارویی', subtitle: 'ایمنی در مصرف هم‌زمان', icon: 'shuffle', count: 20, placeholder: 'نام انگلیسی داروها را با ویرگول جدا کنید؛ مثلاً warfarin, aspirin…', hints: ['Warfarin, Aspirin', 'Clarithromycin, Simvastatin', 'Lithium, Ibuprofen'], sections: ['تداخل دارو–دارو و دارو–غذا', 'شدت خطر با نام و نسخهٔ پایگاه تخصصی', 'مکانیسم فارماکوکینتیکی و فارماکودینامیکی', 'مدیریت، جایگزین‌ها و پایش توسط متخصص'] }
];
export const warning = 'این گزارش یک گردآوری پژوهشی است، نه توصیهٔ درمانی. نمایه‌شدن مقاله تضمین کیفیت نیست. متن کامل، خطر سوگیری و قابلیت کاربرد باید توسط متخصص ارزیابی شود.';
export function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
export function buildQuery(term, type, years, moduleId, now = new Date()) {
  const clean = term.trim().replace(/["(){}\[\]\\:]/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length < 2 || clean.length > 300) throw new Error('موضوع باید بین ۲ تا ۳۰۰ نویسه باشد.');
  const terms = moduleId === 'interaction' ? clean.split(/[,،]/).map(x => x.trim()).filter(Boolean) : [clean];
  if (moduleId === 'interaction' && terms.length < 2) throw new Error('دست‌کم دو دارو را با ویرگول جدا کنید.');
  const topic = terms.map(x => `TITLE_ABS:"${x}"`).join(' AND ');
  const filters = ['SRC:MED', 'HAS_ABSTRACT:Y', 'NOT PUB_TYPE:"Preprint"', 'NOT PUB_TYPE:"Retracted Publication"', 'NOT PUB_TYPE:"Retraction of Publication"'];
  if (type === 'review') filters.push('PUB_TYPE:"Systematic Review"');
  if (type === 'trial') filters.push('PUB_TYPE:"Randomized Controlled Trial"');
  if (type === 'meta') filters.push('PUB_TYPE:"Meta-Analysis"');
  if (years !== 'all') filters.push(`FIRST_PDATE:[${now.getUTCFullYear() - Number(years)}-01-01 TO ${now.toISOString().slice(0, 10)}]`);
  return `${topic} AND ${filters.join(' AND ')} sort_date:y`;
}
export function parseResults(payload) {
  if (!payload?.resultList || !Array.isArray(payload.resultList.result)) throw new Error('پاسخ پایگاه مقاله قابل خواندن نیست.');
  return payload.resultList.result.filter(a => a.id && a.title && a.isRetracted !== 'Y' && a.isRetracted !== true && !(a.pubTypeList?.pubType || []).some(t => /retract|preprint/i.test(t))).map(a => ({
    id: a.id, title: a.title, authors: a.authorString || 'نویسندگان ثبت نشده',
    journal: a.journalInfo?.journal?.title || a.journalTitle || 'نشریه نامشخص',
    year: a.pubYear || '', date: a.firstPublicationDate || a.pubYear || '',
    doi: a.doi || '', abstract: a.abstractText || '', types: a.pubTypeList?.pubType || [],
    source: 'MED', url: `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(a.id)}/`
  }));
}
export function validateReport(r) {
  return !!(r && typeof r.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(r.id) && typeof r.title === 'string' && r.title.length <= 300 && modules.some(m => m.id === r.module) && typeof r.query === 'string' && (r.notes === undefined || (typeof r.notes === 'string' && r.notes.length <= 30000)) && Array.isArray(r.articles) && r.articles.length <= 100 && r.articles.every(a => a && typeof a.title === 'string' && typeof a.id === 'string' && /^\d+$/.test(a.id) && ['authors', 'journal', 'date', 'doi', 'abstract'].every(k => typeof a[k] === 'string') && Array.isArray(a.types) && a.types.every(t => typeof t === 'string')) && typeof r.created === 'string' && Number.isFinite(Date.parse(r.created)));
}
export function plainText(markup) {
  return String(markup || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}
export function reportParagraphs(r) {
  const module = modules.find(m => m.id === r.module);
  return [r.title, `فارم‌آگاه • ${module.title} • ${new Date(r.created).toLocaleDateString('fa-IR')}`, warning,
    `عبارت جست‌وجو: ${r.query}`, `گردآوری ${r.articles.length} مقاله؛ هدف ${module.count} مطالعه. مرور متن کامل و تأیید کیفیت انجام نشده است.`,
    'چارچوب بررسی بالینی — نیازمند منبع و ارزیابی متخصص', ...module.sections,
    'یادداشت پژوهشگر (تأییدنشده)', r.notes || 'یادداشتی ثبت نشده است.',
    'مقالات بازیابی‌شده — متن چکیدهٔ اصلی، نه خلاصهٔ تولیدشده',
    ...r.articles.flatMap((a, i) => [`${i + 1}. ${a.title}`, `${a.authors} | ${a.journal} | ${a.date}`, `PMID: ${a.id}${a.doi ? ` | DOI: ${a.doi}` : ''}`, `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(a.id)}/`, plainText(a.abstract) || 'چکیده در دسترس نیست.'])];
}
