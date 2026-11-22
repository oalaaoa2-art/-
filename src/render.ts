import type { Block, Page, SiteDoc, Theme } from './types';
import { googleFontsUrl } from './fonts';

export const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export function rgba(hex: string, alpha: number): string {
  const raw = String(hex || '').replace('#', '');
  const h =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw.padEnd(6, '0').slice(0, 6);
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const f = (path: string, value: unknown, cls = '', tag = 'div') =>
  `<${tag}${cls ? ` class="${cls}"` : ''} data-field="${path}">${esc(value)}</${tag}>`;

const ph = (url: string | undefined, alt: string, cls = '') =>
  url
    ? `<img${cls ? ` class="${cls}"` : ''} src="${esc(url)}" alt="${esc(alt)}" loading="lazy" />`
    : `<div class="ph${cls ? ' ' + cls : ''}" role="img" aria-label="${esc(alt)}"><span>Изображение</span></div>`;

/* ------------------------------- page helpers ------------------------------ */

export type Ctx = { pages?: Page[]; currentSlug?: string };

export const slugOf = (p: Page, i: number): string => p.slug || `page-${i + 1}`;

const HEX = /^#[0-9a-f]{3,8}$/i;

/** Применяет размеры и форму блока (ширина, скругление, фон, высота) к его корню. */
function decorate(html: string, b: Block): string {
  const box = b.box;
  if (!box || !html) return html;
  const css: string[] = [];
  const cls: string[] = [];
  const width = Number(box.width) || 0;
  const narrow = (width > 0 && width < 100) || Number(box.maxw) > 0;
  if (width > 0 && width < 100) css.push(`width:${width}%`);
  if (Number(box.maxw) > 0) css.push(`max-width:${box.maxw}px`);
  if (narrow) {
    const align = box.align || 'center';
    css.push(
      align === 'left'
        ? 'margin-left:0;margin-right:auto'
        : align === 'right'
          ? 'margin-left:auto;margin-right:0'
          : 'margin-left:auto;margin-right:auto'
    );
  }
  if (Number(box.radius) > 0) css.push(`border-radius:${box.radius}px`);
  if (Number(box.minh) > 0) {
    css.push(`min-height:${box.minh}px`);
    cls.push('minh');
  }
  if (box.padt != null) css.push(`padding-top:${Number(box.padt) || 0}px`);
  if (box.padb != null) css.push(`padding-bottom:${Number(box.padb) || 0}px`);
  const bg = box.bg || 'none';
  if (bg === 'surface') {
    css.push('background:var(--surface)');
    cls.push('boxed');
  } else if (bg === 'accent') {
    css.push('background:var(--accent);color:var(--accent-text)');
    cls.push('boxed');
  } else if (HEX.test(bg)) {
    css.push(`background:${bg}`);
    cls.push('boxed');
  }
  if (box.shadow) cls.push('shadowed');
  if (!css.length && !cls.length) return html;
  const style = css.length ? ` style="${css.join(';')}"` : '';
  return html.replace(/^<([a-zA-Z]+)([^>]*)>/, (_m, tag: string, attrs: string) => {
    let a = attrs;
    if (cls.length) {
      a = /class="/.test(a)
        ? a.replace(/class="([^"]*)"/, (_x: string, c: string) => `class="${c} ${cls.join(' ')}"`)
        : `${a} class="${cls.join(' ')}"`;
    }
    return `<${tag}${a}${style}>`;
  });
}

/* ---------------------------------- blocks --------------------------------- */

function renderBlock(b: Block, ctx: Ctx = {}): string {
  return decorate(body(b, ctx), b);
}

function body(b: Block, ctx: Ctx): string {
  switch (b.type) {
    case 'nav': {
      const links = (b.links ?? []) as string[];
      const pageLinks =
        (ctx.pages?.length ?? 0) > 1 && b.showPages !== false
          ? ctx.pages!
              .map(
                (p, i) =>
                  `<a class="page-link${slugOf(p, i) === ctx.currentSlug ? ' on' : ''}" href="#/${esc(
                    slugOf(p, i)
                  )}">${esc(p.name)}</a>`
              )
              .join('')
          : '';
      return `<header class="nav" data-bid="${b.id}">
  <div class="wrap nav-in">
    <span class="brand" data-field="brand">${esc(b.brand)}</span>
    <nav class="links">${pageLinks}${links
      .map((l, i) => `<a href="#" data-field="links.${i}">${esc(l)}</a>`)
      .join('')}</nav>
    ${b.cta ? `<a class="btn btn-sm nav-cta" href="#" data-field="cta">${esc(b.cta)}</a>` : ''}
  </div>
</header>`;
    }

    case 'hero': {
      const media = b.image;
      return `<section class="hero${media ? ' with-media' : ''}" data-bid="${b.id}">
  <div class="wrap hero-in">
    <div class="hero-copy">
      ${b.kicker ? f('kicker', b.kicker, 'pill') : ''}
      ${f('title', b.title, '', 'h1')}
      ${b.subtitle ? f('subtitle', b.subtitle, 'lead', 'p') : ''}
      <div class="actions">
        ${b.cta ? `<a class="btn" href="#" data-field="cta">${esc(b.cta)}</a>` : ''}
        ${b.cta2 ? `<a class="btn btn-ghost" href="#" data-field="cta2">${esc(b.cta2)}</a>` : ''}
      </div>
    </div>
    ${media ? `<figure class="hero-media">${ph(b.image, b.title)}</figure>` : ''}
  </div>
</section>`;
    }

    case 'features': {
      const items = (b.items ?? []) as { icon: string; title: string; text: string }[];
      const cols = Number(b.cols) || 0;
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.subtitle ? f('subtitle', b.subtitle, 'sub muted', 'p') : ''}
    </div>
    <div class="grid grid-3${cols ? ' cols' : ''}"${cols ? ` style="--cols:${cols}"` : ''}>
      ${items
        .map(
          (it, i) => `<article class="card">
        <div class="ico" data-field="items.${i}.icon">${esc(it.icon)}</div>
        <h3 data-field="items.${i}.title">${esc(it.title)}</h3>
        <p class="muted" data-field="items.${i}.text">${esc(it.text)}</p>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    case 'split': {
      const bullets = (b.bullets ?? []) as string[];
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap split${b.reverse ? ' rev' : ''}">
    <figure class="split-media">${ph(b.image, b.title)}</figure>
    <div class="split-copy">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.text ? f('text', b.text, 'muted', 'p') : ''}
      ${
        bullets.length
          ? `<ul class="checks">${bullets
              .map((x, i) => `<li data-field="bullets.${i}">${esc(x)}</li>`)
              .join('')}</ul>`
          : ''
      }
    </div>
  </div>
</section>`;
    }

    case 'gallery': {
      const images = (b.images ?? []) as { url: string; caption: string }[];
      const cols = Number(b.cols) || 0;
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.subtitle ? f('subtitle', b.subtitle, 'sub muted', 'p') : ''}
    </div>
    <div class="gal${cols ? ' cols' : ''}"${cols ? ` style="--cols:${cols}"` : ''}>
      ${images
        .map(
          (im, i) => `<figure class="gal-item">
        ${ph(im.url, im.caption || 'Работа')}
        ${im.caption ? `<figcaption data-field="images.${i}.caption">${esc(im.caption)}</figcaption>` : ''}
      </figure>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    case 'stats': {
      const items = (b.items ?? []) as { value: string; label: string }[];
      const cols = Number(b.cols) || 0;
      return `<section class="section stats-section" data-bid="${b.id}">
  <div class="wrap">
    ${b.title ? `<div class="head"><h2 data-field="title">${esc(b.title)}</h2></div>` : ''}
    <div class="stats${cols ? ' cols' : ''}"${cols ? ` style="--cols:${cols}"` : ''}>
      ${items
        .map(
          (it, i) => `<div class="stat">
        <span class="stat-val" data-field="items.${i}.value">${esc(it.value)}</span>
        <span class="stat-lbl" data-field="items.${i}.label">${esc(it.label)}</span>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    case 'pricing': {
      const plans = (b.plans ?? []) as {
        name: string;
        price: string;
        period: string;
        text: string;
        features: string[];
        cta: string;
        featured?: boolean;
      }[];
      const cols = Number(b.cols) || 0;
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.subtitle ? f('subtitle', b.subtitle, 'sub muted', 'p') : ''}
    </div>
    <div class="grid grid-3 plans${cols ? ' cols' : ''}"${cols ? ` style="--cols:${cols}"` : ''}>
      ${plans
        .map(
          (p, i) => `<article class="card plan${p.featured ? ' featured' : ''}">
        ${p.featured ? '<span class="badge">Популярный</span>' : ''}
        <h3 data-field="plans.${i}.name">${esc(p.name)}</h3>
        <div class="price"><span data-field="plans.${i}.price">${esc(p.price)}</span><small data-field="plans.${i}.period">${esc(p.period)}</small></div>
        <p class="muted" data-field="plans.${i}.text">${esc(p.text)}</p>
        <ul class="plan-features">${(p.features ?? [])
          .map(
            (x, j) => `<li data-field="plans.${i}.features.${j}">${esc(x)}</li>`
          )
          .join('')}</ul>
        <a class="btn btn-block" href="#" data-field="plans.${i}.cta">${esc(p.cta)}</a>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    case 'quote':
      return `<section class="section quote-wrap" data-bid="${b.id}">
  <div class="wrap quote">
    <div class="mark">“</div>
    ${f('quote', b.quote, '', 'blockquote')}
    <div class="who">
      ${b.author ? `<span class="name" data-field="author">${esc(b.author)}</span>` : ''}
      ${b.role ? `<span class="role" data-field="role">${esc(b.role)}</span>` : ''}
    </div>
  </div>
</section>`;

    case 'cta':
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="cta-box">
      ${f('title', b.title, '', 'h2')}
      ${b.text ? f('text', b.text, 'cta-text', 'p') : ''}
      <div class="actions">
        ${b.cta ? `<a class="btn" href="#" data-field="cta">${esc(b.cta)}</a>` : ''}
        ${b.cta2 ? `<a class="btn btn-ghost" href="#" data-field="cta2">${esc(b.cta2)}</a>` : ''}
      </div>
    </div>
  </div>
</section>`;

    case 'contact':
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap contact">
    <div class="contact-info">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.text ? f('text', b.text, 'muted', 'p') : ''}
      <ul class="contact-list">
        ${b.email ? `<li><span>Почта</span><a href="mailto:${esc(b.email)}" data-field="email">${esc(b.email)}</a></li>` : ''}
        ${b.phone ? `<li><span>Телефон</span><a href="tel:${esc(b.phone)}" data-field="phone">${esc(b.phone)}</a></li>` : ''}
        ${b.address ? `<li><span>Адрес</span><em data-field="address">${esc(b.address)}</em></li>` : ''}
      </ul>
    </div>
    <form class="form card" onsubmit="return false">
      <label>Имя<input type="text" placeholder="Как к вам обращаться" /></label>
      <label>Почта<input type="email" placeholder="you@example.com" /></label>
      <label>Сообщение<textarea rows="4" placeholder="Расскажите о задаче"></textarea></label>
      <button class="btn" type="submit">Отправить</button>
    </form>
  </div>
</section>`;

    case 'footer': {
      const links = (b.links ?? []) as string[];
      return `<footer class="footer" data-bid="${b.id}">
  <div class="wrap foot-in">
    <div class="foot-brand">
      <span class="brand" data-field="brand">${esc(b.brand)}</span>
      ${b.text ? f('text', b.text, 'muted', 'p') : ''}
    </div>
    <nav class="foot-links">${links
      .map((l, i) => `<a href="#" data-field="links.${i}">${esc(l)}</a>`)
      .join('')}</nav>
  </div>
  <div class="wrap foot-note" data-field="note">${esc(b.note)}</div>
</footer>`;
    }

    case 'banner':
      return `<div class="banner" data-bid="${b.id}">
  <div class="wrap banner-in">
    <span data-field="text">${esc(b.text)}</span>
    ${b.cta ? `<a class="btn btn-sm" href="#" data-field="cta">${esc(b.cta)}</a>` : ''}
  </div>
</div>`;

    case 'logos': {
      const logos = (b.logos ?? []) as string[];
      return `<section class="section logos-sec" data-bid="${b.id}">
  <div class="wrap">
    ${b.title ? `<div class="head"><h2 data-field="title">${esc(b.title)}</h2></div>` : ''}
    <div class="logos">${logos
      .map((l, i) => `<span class="logo-chip" data-field="logos.${i}">${esc(l)}</span>`)
      .join('')}</div>
  </div>
</section>`;
    }

    case 'steps': {
      const items = (b.items ?? []) as { title: string; text: string }[];
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.subtitle ? f('subtitle', b.subtitle, 'sub muted', 'p') : ''}
    </div>
    <div class="steps">
      ${items
        .map(
          (it, i) => `<div class="step">
        <span class="step-num">0${i + 1}</span>
        <h3 data-field="items.${i}.title">${esc(it.title)}</h3>
        <p data-field="items.${i}.text">${esc(it.text)}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    case 'faq': {
      const items = (b.items ?? []) as { q: string; a: string }[];
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap faq-wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.subtitle ? f('subtitle', b.subtitle, 'sub muted', 'p') : ''}
    </div>
    <div class="faq-list">
      ${items
        .map(
          (it, i) => `<div class="faq-item">
        <h3 data-field="items.${i}.q">${esc(it.q)}</h3>
        <p data-field="items.${i}.a">${esc(it.a)}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    case 'team': {
      const people = (b.people ?? []) as { name: string; role: string; photo: string }[];
      const cols = Number(b.cols) || 0;
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.subtitle ? f('subtitle', b.subtitle, 'sub muted', 'p') : ''}
    </div>
    <div class="team-grid"${cols ? ` style="--cols:${cols}"` : ''}>
      ${people
        .map(
          (p, i) => `<figure class="member">
        <div class="member-photo">${ph(p.photo, p.name)}</div>
        <h3 data-field="people.${i}.name">${esc(p.name)}</h3>
        <span data-field="people.${i}.role">${esc(p.role)}</span>
      </figure>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    case 'timeline': {
      const items = (b.items ?? []) as { date: string; title: string; text: string }[];
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
    </div>
    <div class="timeline">
      ${items
        .map(
          (it, i) => `<div class="tl-item">
        ${it.date ? `<span class="tl-date" data-field="items.${i}.date">${esc(it.date)}</span>` : ''}
        <h3 data-field="items.${i}.title">${esc(it.title)}</h3>
        <p data-field="items.${i}.text">${esc(it.text)}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    case 'table': {
      const cols = (b.cols ?? []) as string[];
      const rows = (b.rows ?? []) as { label: string; cells: string[] }[];
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.subtitle ? f('subtitle', b.subtitle, 'sub muted', 'p') : ''}
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead><tr><th></th>${cols
          .map((c, i) => `<th data-field="cols.${i}">${esc(c)}</th>`)
          .join('')}</tr></thead>
        <tbody>${rows
          .map(
            (r, i) => `<tr><td data-field="rows.${i}.label">${esc(r.label)}</td>${(r.cells ?? [])
              .map((c, j) => `<td data-field="rows.${i}.cells.${j}">${esc(c)}</td>`)
              .join('')}</tr>`
          )
          .join('')}</tbody>
      </table>
    </div>
  </div>
</section>`;
    }

    case 'text':
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap prose${b.align === 'center' ? ' align-center' : ''}">
    ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
    ${b.title ? f('title', b.title, '', 'h2') : ''}
    ${b.text ? f('text', b.text, '', 'p') : ''}
  </div>
</section>`;

    case 'video':
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.text ? f('text', b.text, 'sub muted', 'p') : ''}
    </div>
    <figure class="video-box">
      ${ph(b.poster, b.title || 'Видео')}
      <span class="play" aria-hidden="true"></span>
      ${b.videoUrl ? `<a class="btn video-link" href="${esc(b.videoUrl)}" target="_blank" rel="noopener">Смотреть видео</a>` : ''}
    </figure>
  </div>
</section>`;

    case 'subscribe':
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="subscribe-box">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.text ? f('text', b.text, 'muted', 'p') : ''}
      <form class="sub-form" onsubmit="return false">
        <input type="email" placeholder="${esc(b.placeholder || 'you@example.com')}" />
        <button class="btn" type="submit" data-field="cta">${esc(b.cta)}</button>
      </form>
      ${b.note ? f('note', b.note, 'sub-note', 'p') : ''}
    </div>
  </div>
</section>`;

    case 'testimonials': {
      const items = (b.items ?? []) as { quote: string; author: string; role: string }[];
      const cols = Number(b.cols) || 0;
      return `<section class="section" data-bid="${b.id}">
  <div class="wrap">
    <div class="head">
      ${b.kicker ? f('kicker', b.kicker, 'eyebrow') : ''}
      ${b.title ? f('title', b.title, '', 'h2') : ''}
      ${b.subtitle ? f('subtitle', b.subtitle, 'sub muted', 'p') : ''}
    </div>
    <div class="testimonials"${cols ? ` style="--cols:${cols}"` : ''}>
      ${items
        .map(
          (it, i) => `<article class="testimonial">
        <p data-field="items.${i}.quote">${esc(it.quote)}</p>
        <div class="who">
          <strong data-field="items.${i}.author">${esc(it.author)}</strong>
          <span data-field="items.${i}.role">${esc(it.role)}</span>
        </div>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
    }

    default:
      return '';
  }
}

/* ----------------------------------- css ----------------------------------- */

function baseCss(t: Theme, editable: boolean): string {
  const heading = `'${t.fontHeading}', Georgia, serif`;
  const bodyFont = `'${t.fontBody}', system-ui, sans-serif`;

  return `
:root{
  --bg:${t.bg};--surface:${t.surface};--text:${t.text};--muted:${t.muted};
  --accent:${t.accent};--accent-text:${t.accentText};
  --line:${rgba(t.text, 0.12)};--line-strong:${rgba(t.text, 0.24)};
  --soft:${rgba(t.accent, 0.09)};
  --radius:${t.radius}px;--maxw:${t.maxWidth}px;
  --font-h:${heading};--font-b:${bodyFont};
}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:17px;line-height:1.65;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block;height:100%;object-fit:cover}
a{color:inherit;text-decoration:none}
::selection{background:var(--accent);color:var(--accent-text)}
h1,h2,h3,h4{font-family:var(--font-h);font-weight:700;line-height:1.08;letter-spacing:-0.025em;margin:0 0 0.4em}
h1{font-size:clamp(38px,5.4vw,70px)}
h2{font-size:clamp(28px,3.4vw,44px)}
h3{font-size:21px;letter-spacing:-0.015em;margin-bottom:0.5em}
p{margin:0 0 1em}
p:last-child{margin-bottom:0}
.muted{color:var(--muted)}
small{font-size:14px}
.wrap{width:100%;max-width:var(--maxw);margin:0 auto;padding:0 28px}
.section{padding:clamp(56px,7vw,104px) 0}
.head{max-width:720px;margin:0 auto clamp(36px,4vw,56px);text-align:center}
.head h2{margin-bottom:0.35em}
.head .sub{font-size:19px}
.eyebrow{font-size:13px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.pill{display:inline-flex;align-items:center;gap:8px;padding:7px 15px;border-radius:999px;background:var(--soft);border:1px solid ${rgba(t.accent, 0.28)};color:var(--accent);font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:22px}
.actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px}
.hero .actions{justify-content:center}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:14px 26px;border-radius:calc(var(--radius) * 0.6);background:var(--accent);color:var(--accent-text);font-family:var(--font-b);font-size:16px;font-weight:600;border:1px solid transparent;cursor:pointer;transition:transform .18s ease,filter .18s ease,background .18s ease}
.btn:hover{transform:translateY(-1px);filter:brightness(1.07)}
.btn-sm{padding:10px 18px;font-size:14.5px}
.btn-block{display:flex;width:100%;margin-top:auto}
.btn-ghost{background:transparent;color:var(--text);border-color:var(--line-strong)}
.btn-ghost:hover{background:${rgba(t.text, 0.05)}}
.nav{position:sticky;top:0;z-index:30;background:${rgba(t.bg, 0.8)};backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.nav-in{display:flex;align-items:center;gap:28px;min-height:72px}
.brand{font-family:var(--font-h);font-weight:700;font-size:20px;letter-spacing:-0.02em}
.links{display:flex;gap:26px;margin-left:auto;font-size:15px;color:var(--muted)}
.links a{transition:color .15s ease}
.links a:hover{color:var(--text)}
.nav-cta{margin-left:4px}
.hero{padding:clamp(64px,9vw,124px) 0 clamp(56px,7vw,100px);background:radial-gradient(120% 90% at 50% -20%,${rgba(t.accent, 0.16)},transparent 65%)}
.hero-in{display:flex;flex-direction:column;align-items:center;text-align:center}
.hero-copy{max-width:820px;display:flex;flex-direction:column;align-items:center}
.hero.with-media .hero-in{display:grid;grid-template-columns:1.05fr .95fr;gap:clamp(28px,5vw,64px);align-items:center;text-align:left}
.hero.with-media .hero-copy{align-items:flex-start}
.hero.with-media .actions{justify-content:flex-start}
.lead{font-size:clamp(17px,1.5vw,20px);color:var(--muted);margin:20px 0 0;max-width:620px}
.hero-media{width:100%;margin:0;aspect-ratio:4/3.2;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);box-shadow:0 30px 70px -40px ${rgba(t.text, 0.5)}}
.ph{display:flex;align-items:center;justify-content:center;width:100%;height:100%;min-height:120px;background:linear-gradient(135deg,${rgba(t.accent, 0.32)},${rgba(t.accent, 0.06)});color:${rgba(t.text, 0.55)};font-size:13px;letter-spacing:0.08em;text-transform:uppercase}
.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
.grid-3{grid-template-columns:repeat(auto-fit,minmax(250px,1fr))}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:28px}
.ico{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:calc(var(--radius) * 0.55);background:var(--soft);color:var(--accent);font-size:21px;margin-bottom:18px}
.split{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,68px);align-items:center}
.split-media{aspect-ratio:4/3;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);margin:0}
.split.rev .split-media{order:2}
.split-copy h2{margin-bottom:0.5em}
.checks{list-style:none;margin:22px 0 0;padding:0;display:grid;gap:12px}
.checks li{position:relative;padding-left:30px;color:var(--muted)}
.checks li::before{content:"";position:absolute;left:0;top:9px;width:14px;height:8px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent);transform:rotate(-45deg)}
.gal{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.gal-item{margin:0;border-radius:calc(var(--radius) * 0.8);overflow:hidden;position:relative;aspect-ratio:4/3.1;border:1px solid var(--line)}
.gal-item:nth-child(4n+1){grid-column:span 2;aspect-ratio:auto}
.gal-item figcaption{position:absolute;left:0;right:0;bottom:0;padding:26px 16px 12px;font-size:13.5px;font-weight:500;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.62))}
.stats-section{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:28px;text-align:center}
.stat{display:flex;flex-direction:column;gap:4px}
.stat-val{font-family:var(--font-h);font-size:clamp(34px,4vw,52px);font-weight:700;letter-spacing:-0.03em;color:var(--accent);line-height:1.1}
.stat-lbl{font-size:14.5px;color:var(--muted)}
.plans{align-items:stretch}
.plan{display:flex;flex-direction:column;gap:6px;position:relative;padding-top:32px}
.plan.featured{border-color:var(--accent);background:linear-gradient(180deg,${rgba(t.accent, 0.12)},var(--surface));box-shadow:0 24px 60px -46px ${rgba(t.accent, 0.9)}}
.badge{position:absolute;top:-12px;right:20px;background:var(--accent);color:var(--accent-text);font-size:11.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:5px 11px;border-radius:999px}
.price{display:flex;align-items:baseline;gap:8px;font-family:var(--font-h);font-size:44px;font-weight:700;letter-spacing:-0.03em;line-height:1.1}
.price small{font-family:var(--font-b);font-weight:500;color:var(--muted);font-size:14px;letter-spacing:0}
.plan-features{list-style:none;margin:14px 0 24px;padding:0;display:grid;gap:10px;color:var(--muted);font-size:15.5px}
.plan-features li{position:relative;padding-left:24px}
.plan-features li::before{content:"→";position:absolute;left:0;color:var(--accent)}
.quote-wrap{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.quote{text-align:center;max-width:880px}
.quote .mark{font-family:var(--font-h);font-size:72px;line-height:.6;color:var(--accent);margin-bottom:18px}
.quote blockquote{margin:0 0 26px;font-family:var(--font-h);font-size:clamp(24px,2.7vw,38px);line-height:1.28;letter-spacing:-0.02em}
.quote .who{display:flex;flex-direction:column;gap:2px;font-size:15px}
.quote .name{font-weight:600}
.quote .role{color:var(--muted)}
.cta-box{background:var(--accent);color:var(--accent-text);border-radius:calc(var(--radius) * 1.2);padding:clamp(36px,5.5vw,72px);text-align:center;display:flex;flex-direction:column;align-items:center;background-image:radial-gradient(90% 120% at 15% 0%,rgba(255,255,255,.22),transparent 60%)}
.cta-box h2{margin-bottom:0.35em}
.cta-text{opacity:.85;max-width:560px;margin:0}
.cta-box .actions{justify-content:center}
.cta-box .btn{background:var(--accent-text);color:var(--accent)}
.cta-box .btn-ghost{background:transparent;color:var(--accent-text);border-color:${rgba(t.accentText, 0.45)}}
.contact{display:grid;grid-template-columns:1fr 1fr;gap:clamp(28px,5vw,64px);align-items:start}
.contact-list{list-style:none;margin:28px 0 0;padding:0;display:grid;gap:16px}
.contact-list li{display:flex;flex-direction:column;gap:2px;padding-bottom:16px;border-bottom:1px solid var(--line)}
.contact-list span{font-size:12.5px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted)}
.contact-list a,.contact-list em{font-style:normal;font-size:18px;font-weight:500}
.form{display:grid;gap:14px}
.form label{display:grid;gap:7px;font-size:13.5px;font-weight:600;letter-spacing:0.02em;color:var(--muted)}
.form input,.form textarea{width:100%;padding:12px 14px;border-radius:calc(var(--radius) * 0.5);border:1px solid var(--line-strong);background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:15.5px;font-weight:400;resize:vertical}
.form input:focus,.form textarea:focus{outline:2px solid ${rgba(t.accent, 0.5)};outline-offset:1px;border-color:transparent}
.footer{border-top:1px solid var(--line);padding:56px 0 28px;background:var(--surface)}
.foot-in{display:flex;justify-content:space-between;gap:36px;flex-wrap:wrap;align-items:flex-start}
.foot-brand{max-width:360px}
.foot-brand p{margin-top:10px;font-size:15px}
.foot-links{display:flex;gap:22px;flex-wrap:wrap;font-size:15px;color:var(--muted)}
.foot-links a:hover{color:var(--text)}
.foot-note{margin-top:36px;padding-top:20px;border-top:1px solid var(--line);font-size:13.5px;color:var(--muted)}
.banner{background:var(--accent);color:var(--accent-text);font-size:14.5px}
.banner-in{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;padding:11px 0}
.banner .btn{background:var(--accent-text);color:var(--accent);padding:7px 16px;font-size:13px}
.logos{display:flex;flex-wrap:wrap;justify-content:center;gap:14px 34px;align-items:center}
.logo-chip{font-family:var(--font-h);font-size:clamp(16px,2vw,22px);font-weight:700;letter-spacing:-0.01em;opacity:.62;padding:8px 12px;border-radius:8px;transition:opacity .2s}
.logo-chip:hover{opacity:1}
.steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:22px}
.step{padding:24px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);display:flex;flex-direction:column;gap:8px}
.step-num{font-family:var(--font-h);font-size:13px;font-weight:700;letter-spacing:.14em;color:var(--accent);text-transform:uppercase}
.step h3{margin:0}
.step p{margin:0;color:var(--muted);font-size:15.5px}
.faq-wrap{display:grid;grid-template-columns:.85fr 1.15fr;gap:clamp(24px,4vw,60px);align-items:start}
.faq-wrap .head{margin:0;text-align:left}
.faq-list{display:grid}
.faq-item{padding:22px 0;border-top:1px solid var(--line)}
.faq-item:last-child{border-bottom:1px solid var(--line)}
.faq-item h3{margin:0 0 8px;font-size:18px;letter-spacing:-.01em}
.faq-item p{margin:0;color:var(--muted);font-size:15.5px}
.team-grid{display:grid;grid-template-columns:repeat(var(--cols,3),minmax(0,1fr));gap:22px}
.member{margin:0;display:flex;flex-direction:column;gap:10px}
.member-photo{aspect-ratio:3/3.6;border-radius:calc(var(--radius)*.8);overflow:hidden;border:1px solid var(--line);background:var(--surface)}
.member h3{margin:4px 0 0;font-size:18px}
.member span{color:var(--muted);font-size:14.5px}
.timeline{display:grid;border-left:2px solid var(--line);padding-left:26px;margin-left:6px}
.tl-item{position:relative;padding:0 0 30px}
.tl-item::before{content:"";position:absolute;left:-33px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px var(--bg)}
.tl-item:last-child{padding-bottom:0}
.tl-date{font-family:var(--font-h);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
.tl-item h3{margin:6px 0 4px;font-size:20px}
.tl-item p{margin:0;color:var(--muted)}
.table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface)}
.table{width:100%;border-collapse:collapse;min-width:560px}
.table th,.table td{padding:14px 18px;text-align:left;border-top:1px solid var(--line);font-size:15.5px}
.table thead th{border-top:0;font-family:var(--font-h);font-size:14px;background:rgba(127,127,127,.06)}
.table tbody tr:nth-child(even){background:rgba(127,127,127,.04)}
.table td:first-child{font-weight:600}
.prose{max-width:760px}
.prose.align-center{margin:0 auto;text-align:center}
.prose p{white-space:pre-line;color:var(--muted);font-size:17.5px}
.video-box{position:relative;aspect-ratio:16/9;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);margin:0 0 16px}
.video-box .play{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}
.video-box .play::before{content:"";width:74px;height:74px;border-radius:50%;background:rgba(0,0,0,.55);border:2px solid rgba(255,255,255,.9)}
.video-box .play::after{content:"";position:absolute;border-left:20px solid #fff;border-top:12px solid transparent;border-bottom:12px solid transparent;margin-left:5px}
.video-link{position:absolute;left:50%;bottom:18px;transform:translateX(-50%)}
.subscribe-box{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--radius)*1.1);padding:clamp(30px,5vw,60px);text-align:center}
.sub-form{display:flex;gap:10px;max-width:460px;margin:24px auto 12px;flex-wrap:wrap}
.sub-form input{flex:1;min-width:180px;padding:13px 16px;border-radius:calc(var(--radius)*.5);border:1px solid var(--line-strong);background:var(--bg);color:var(--text);font-family:var(--font-b);font-size:15.5px}
.sub-note{font-size:12.5px;color:var(--muted);margin:0}
.testimonials{display:grid;grid-template-columns:repeat(var(--cols,3),minmax(0,1fr));gap:18px}
.testimonial{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);padding:26px;display:flex;flex-direction:column;gap:14px}
.testimonial p{margin:0;font-size:16px;line-height:1.55}
.testimonial .who{display:flex;flex-direction:column;gap:1px;margin-top:auto}
.testimonial .who strong{font-size:14.5px}
.testimonial .who span{font-size:13px;color:var(--muted)}
@media (max-width:880px){.faq-wrap{grid-template-columns:1fr}.team-grid,.testimonials{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:620px){.team-grid,.testimonials{grid-template-columns:1fr}}
.page[hidden]{display:none}
.boxed{border:1px solid var(--line)}
.shadowed{box-shadow:0 34px 80px -52px ${rgba(t.text, 0.6)}}
.minh{display:flex;flex-direction:column;justify-content:center}
.links a.on{color:var(--text);font-weight:600}
.cols{grid-template-columns:repeat(var(--cols),minmax(0,1fr))}
.gal.cols .gal-item:nth-child(4n+1){grid-column:auto;aspect-ratio:4/3.1}
@media (max-width:900px){.cols{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:620px){.cols,.gal.cols{grid-template-columns:1fr}}
@media (max-width:880px){
  .links{display:none}
  .nav-in{min-height:64px}
  .hero.with-media .hero-in{grid-template-columns:1fr;text-align:center}
  .hero.with-media .hero-copy{align-items:center}
  .hero.with-media .actions{justify-content:center}
  .split,.contact{grid-template-columns:1fr}
  .split.rev .split-media{order:0}
  .gal{grid-template-columns:repeat(2,1fr)}
  .gal-item:nth-child(4n+1){grid-column:span 2}
}
@media (max-width:560px){
  body{font-size:16px}
  .wrap{padding:0 18px}
  .gal{grid-template-columns:1fr}
  .gal-item:nth-child(4n+1){grid-column:span 1}
  .foot-in{flex-direction:column}
}
${
  editable
    ? `
[data-bid]{position:relative}
[data-field]{outline:1.5px dashed transparent;outline-offset:4px;border-radius:4px;transition:outline-color .15s ease,background .15s ease;min-width:6px}
[data-bid]:hover [data-field]{outline-color:${rgba(t.accent, 0.5)}}
[data-field]:hover{background:${rgba(t.accent, 0.07)}}
[data-field]:focus{outline:2px solid ${rgba(t.accent, 0.9)};outline-offset:4px;background:${rgba(t.accent, 0.06)}}
[data-field]:focus-visible{outline:2px solid ${rgba(t.accent, 0.9)}}
[data-bid]:hover{outline:1.5px dashed ${rgba(t.accent, 0.55)};outline-offset:-1px}
.sel,.sel:hover{outline:2px solid #6366f1;outline-offset:-2px}
body{padding-bottom:0}
`
    : ''
}`;
}

/* --------------------------------- editing --------------------------------- */

const editorScript = `
(function(){
  var send=function(m){try{parent.postMessage(m,'*')}catch(e){}};
  function mark(id){
    var prev=document.querySelectorAll('.sel');
    for(var i=0;i<prev.length;i++)prev[i].classList.remove('sel');
    if(!id)return;
    var el=document.querySelector('[data-bid="'+id+'"]');
    if(el)el.classList.add('sel');
  }
  function report(){send({type:'height',value:document.documentElement.scrollHeight})}
  var fields=document.querySelectorAll('[data-field]');
  for(var i=0;i<fields.length;i++){
    fields[i].setAttribute('contenteditable','true');
    fields[i].setAttribute('spellcheck','false');
  }
  window.addEventListener('message',function(e){
    var d=e.data||{};
    if(d.type==='highlight')mark(d.id);
    if(d.type==='scrollTo'){
      var el=document.querySelector('[data-bid="'+d.id+'"]');
      if(el)el.scrollIntoView({block:'center',behavior:'smooth'});
    }
  });
  document.addEventListener('click',function(e){
    var a=e.target.closest?e.target.closest('a'):null;
    if(a)e.preventDefault();
    var b=e.target.closest?e.target.closest('[data-bid]'):null;
    if(!b)return;
    send({type:'select',id:b.getAttribute('data-bid')});
  });
  document.addEventListener('focusin',function(e){
    var el=e.target.closest?e.target.closest('[data-field]'):null;
    if(!el)return;
    var b=el.closest('[data-bid]');
    if(!b)return;
    mark(b.getAttribute('data-bid'));
    send({type:'select',id:b.getAttribute('data-bid')});
  });
  document.addEventListener('blur',function(e){
    var el=e.target.closest?e.target.closest('[data-field]'):null;
    if(!el)return;
    var b=el.closest('[data-bid]');
    if(!b)return;
    var value=(el.innerText||'').replace(/\\u00a0/g,' ').replace(/\\n{3,}/g,'\\n\\n').trim();
    send({type:'edit',id:b.getAttribute('data-bid'),path:el.getAttribute('data-field'),value:value});
    report();
  },true);
  window.addEventListener('load',report);
  setTimeout(report,150);
  setTimeout(report,600);
  if(window.ResizeObserver){new ResizeObserver(report).observe(document.body);}
  document.addEventListener('input',function(){
    clearTimeout(window.__rt);
    window.__rt=setTimeout(report,220);
  });
})();
`;

/* ---------------------------------- build ---------------------------------- */

const routerScript = `
(function(){
  var views=[].slice.call(document.querySelectorAll('.page'));
  if(views.length<2)return;
  function show(slug){
    var found=false;
    for(var i=0;i<views.length;i++){
      var on=views[i].getAttribute('data-page')===slug;
      views[i].hidden=!on;
      if(on)found=true;
    }
    if(!found)views[0].hidden=false;
    window.scrollTo(0,0);
  }
  function fromHash(){
    var m=(location.hash||'').match(/^#\\/(.+)$/);
    show(m?decodeURIComponent(m[1]):views[0].getAttribute('data-page'));
  }
  window.addEventListener('hashchange',fromHash);
  fromHash();
})();
`;

export function buildHtml(
  doc: SiteDoc,
  opts: { editable?: boolean; pageId?: string } = {}
): string {
  const t = doc.theme;
  const fonts = googleFontsUrl([t.fontHeading, t.fontBody]);
  const legacy = doc as unknown as { blocks?: Block[] };
  const pages: Page[] =
    doc.pages && doc.pages.length
      ? doc.pages
      : [{ id: 'page', name: 'Главная', slug: 'index', blocks: legacy.blocks ?? [] }];
  const editable = !!opts.editable;
  const active = editable ? pages.find((p) => p.id === opts.pageId) ?? pages[0] : null;

  const renderPage = (p: Page, i: number) => {
    const ctx: Ctx = { pages, currentSlug: slugOf(p, i) };
    const inner = p.blocks.map((b) => renderBlock(b, ctx)).join('\n');
    return `<div class="page" data-page="${esc(slugOf(p, i))}">\n${inner}\n</div>`;
  };

  const body = active
    ? renderPage(active, pages.indexOf(active))
    : pages.map(renderPage).join('\n');
  const router = !editable && pages.length > 1 ? `<script>${routerScript}</script>` : '';
  const title = editable && active && active.name !== 'Главная' ? `${doc.name} — ${active.name}` : doc.name || 'Мой сайт';

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title || 'Мой сайт')}</title>
<meta name="description" content="${esc(doc.name || 'Мой сайт')} — сайт, собранный в Реакторе." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${fonts}" rel="stylesheet" />
<style>${baseCss(t, !!opts.editable)}</style>
</head>
<body>
${body}
${router}
${opts.editable ? `<script>${editorScript}</script>` : ''}
</body>
</html>`;
}
