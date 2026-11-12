/*
 * Cek Unfollow — script yang dijalankan di instagram.com (lewat bookmarklet atau Console).
 *
 * File ini dimuat oleh index.html HANYA untuk membuat bookmarklet dan pratinjau contoh.
 * Fungsi di bawah harus sepenuhnya mandiri: jangan memakai variabel dari luar fungsi,
 * karena isi fungsinya disalin apa adanya ke dalam bookmarklet.
 *
 * Catatan teknis:
 * - Memakai sesi login yang sudah ada di browser (cookie), tidak pernah meminta password.
 * - UI dibangun tanpa innerHTML (aman untuk Trusted Types / CSP Instagram) di dalam Shadow DOM.
 * - Permintaan diberi jeda acak supaya tidak membebani / memicu pembatasan Instagram.
 */
function cekUnfollowMain() {
  'use strict';

  const MOCK = window.__cekUnfollowMock || null;

  if (!MOCK && !/(^|\.)instagram\.com$/i.test(location.hostname)) {
    if (window.confirm('Cek Unfollow hanya dapat dijalankan di instagram.com.\n\nBuka Instagram sekarang? Setelah login, klik bookmark ini kembali.')) {
      location.href = 'https://www.instagram.com/';
    }
    return;
  }
  if (window.__cekUnfollow) {
    if (!MOCK) { window.__cekUnfollow.show(); return; }
    window.__cekUnfollow.destroy();
  }

  const SPEED = MOCK ? (MOCK.speed || 0.15) : 1;
  // App ID web Instagram; ambil dari halaman jika tersedia (versi mobile web bisa berbeda)
  const APP_ID = (() => {
    try {
      const m = document.documentElement.innerHTML.match(/"X-IG-App-ID"\s*:\s*"(\d{6,})"/);
      if (m) return m[1];
    } catch (e) { /* pakai bawaan */ }
    return '936619743392459';
  })();
  const P = 'cekunfollow:';

  /* ================= Penyimpanan ================= */
  const mem = MOCK ? Object.assign({}, MOCK.storage || {}) : null;
  const LS = {
    get(k, d) {
      try {
        if (mem) return k in mem ? mem[k] : d;
        const v = localStorage.getItem(k);
        return v ? JSON.parse(v) : d;
      } catch (e) { return d; }
    },
    set(k, v) {
      try {
        if (mem) { mem[k] = v; return true; }
        localStorage.setItem(k, JSON.stringify(v));
        return true;
      } catch (e) { return false; }
    },
  };

  /* ================= Helper ================= */
  const nf = (n) => Number(n || 0).toLocaleString('id-ID');
  const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const fd = (ms) => dateFmt.format(new Date(ms));
  const profileUrl = (u) => 'https://www.instagram.com/' + encodeURIComponent(u) + '/';

  function abortErr() { const e = new Error('Dibatalkan'); e.name = 'AbortError'; return e; }
  function igErr(kind, message) { const e = new Error(message); e.kind = kind; return e; }
  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) { reject(abortErr()); return; }
      const t = setTimeout(resolve, ms * SPEED);
      if (signal) signal.addEventListener('abort', () => { clearTimeout(t); reject(abortErr()); }, { once: true });
    });
  }
  function cookie(name) {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[1]) : '';
  }

  /* ================= DOM tanpa innerHTML ================= */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const SVG_TAGS = { svg: 1, path: 1, circle: 1, rect: 1 };
  const PROPS = { value: 1, src: 1, href: 1, type: 1, placeholder: 1, autocomplete: 1 };

  function h(tag, props) {
    const svg = !!SVG_TAGS[tag];
    const el = svg ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
    if (props) {
      for (const k in props) {
        const v = props[k];
        if (v == null || v === false) continue;
        if (k === 'vars') { for (const n in v) el.style.setProperty(n, v[n]); }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (!svg && PROPS[k]) el[k] = v;
        else el.setAttribute(k, v === true ? '' : String(v));
      }
    }
    for (let i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }
  function append(el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach((k) => append(el, k)); return; }
    el.appendChild(typeof kid === 'object' ? kid : document.createTextNode(String(kid)));
  }

  const ICONS = {
    brand: [['circle', { cx: 9, cy: 8, r: 3.5 }], ['path', { d: 'M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5' }], ['path', { d: 'M16 11l2 2 4-4' }]],
    close: [['path', { d: 'M6 6l12 12M18 6 6 18' }]],
    moon: [['path', { d: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' }]],
    sun: [['circle', { cx: 12, cy: 12, r: 4 }], ['path', { d: 'M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' }]],
    refresh: [['path', { d: 'M3 12a9 9 0 1 0 3-6.7L3 8' }], ['path', { d: 'M3 3v5h5' }]],
    trendDown: [['path', { d: 'm3 7 6.5 6.5 4-4L21 17' }], ['path', { d: 'M15 17h6v-6' }]],
    info: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M12 11v5M12 7.5v.01' }]],
    check: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'm8 12 3 3 5-6' }]],
    external: [['path', { d: 'M14 4h6v6' }], ['path', { d: 'M20 4 11 13' }], ['path', { d: 'M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4' }]],
    eyeOff: [['path', { d: 'M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.4 3.3M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7a9.4 9.4 0 0 0 5.4-1.6' }], ['path', { d: 'M9.9 9.9a3 3 0 0 0 4.2 4.2' }], ['path', { d: 'm3 3 18 18' }]],
    eye: [['path', { d: 'M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z' }], ['circle', { cx: 12, cy: 12, r: 3 }]],
    copy: [['rect', { x: 9, y: 9, width: 12, height: 12, rx: 2.5 }], ['path', { d: 'M5 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5' }]],
    search: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', { d: 'm20 20-3.5-3.5' }]],
    chev: [['path', { d: 'm6 9 6 6 6-6' }]],
    lock: [['rect', { x: 5, y: 11, width: 14, height: 10, rx: 2.5 }], ['path', { d: 'M8 11V8a4 4 0 0 1 8 0v3' }]],
    verified: [['circle', { cx: 12, cy: 12, r: 10, fill: '#3b82f6', stroke: 'none' }], ['path', { d: 'm7.5 12.3 3 3 6-6.3', stroke: '#fff', 'stroke-width': 2.6 }]],
    alert: [['path', { d: 'M12 3 2 20h20L12 3z' }], ['path', { d: 'M12 10v4M12 17v.01' }]],
    clock: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M12 7v5l3 2' }]],
    shield: [['path', { d: 'M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3z' }]],
    wifiOff: [['path', { d: 'm3 3 18 18' }], ['path', { d: 'M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M19 13a10 10 0 0 0-2-1.5M2 9.5a15 15 0 0 1 4.5-2.8M22 9.5A15 15 0 0 0 11 5.1' }], ['path', { d: 'M12 20v.01' }]],
    inbox: [['path', { d: 'M3 13h5l1.5 3h5L16 13h5' }], ['path', { d: 'M5.5 5h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2.5-8z' }]],
  };
  function icon(name, cls) {
    return h('svg', {
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'ic ' + (cls || ''), 'aria-hidden': 'true',
    }, ICONS[name].map((p) => h(p[0], p[1])));
  }

  function hue(s) { let x = 0; for (let i = 0; i < s.length; i++) x = (x * 31 + s.charCodeAt(i)) >>> 0; return x % 360; }
  function initials(u) {
    const parts = u.split(/[._]+/).filter(Boolean);
    const s = parts.length > 1 ? parts[0][0] + parts[1][0] : u.replace(/[^a-z0-9]/gi, '').slice(0, 2);
    return (s || u.slice(0, 2) || '?').toUpperCase();
  }
  function avatar(user) {
    const fallback = () => h('span', { class: 'av av-fb', vars: { '--h': hue(user.u || '') } }, initials(user.u || '?'));
    if (!user.pic) return fallback();
    const img = h('img', { class: 'av', src: user.pic, alt: '', loading: 'lazy', decoding: 'async' });
    img.addEventListener('error', () => img.replaceWith(fallback()), { once: true });
    return img;
  }

  /* ================= Gaya ================= */
  const DARK = '--bg:#0b0b0c;--surface:#131315;--surface-2:#1b1b1e;--surface-3:#26262a;--text:#ececee;--muted:#9a9aa3;--faint:#66666e;' +
    '--border:#26262a;--border-strong:#35353a;--shadow:none;--primary:#ececee;--primary-hover:#d6d6da;--primary-fg:#131315;' +
    '--link:#7ea3ee;--focus:#7ea3ee;--focus-ring:rgba(126,163,238,.22);' +
    '--red:#e57373;--red-bg:rgba(229,115,115,.1);--green:#5fbf8a;--green-bg:rgba(95,191,138,.1);' +
    '--blue:#7ea3ee;--blue-bg:rgba(126,163,238,.1);--amber:#d9a24a;--amber-bg:rgba(217,162,74,.1);' +
    '--av-s:14%;--av-l:22%;--av-fg:78%;color-scheme:dark;';

  const CSS = `
:host{all:initial}
.root{
  --bg:#fafafa;--surface:#fff;--surface-2:#f4f4f5;--surface-3:#e9e9ec;--text:#18181b;--muted:#6b6b74;--faint:#a1a1aa;
  --border:#e4e4e7;--border-strong:#d4d4d8;--shadow:0 1px 2px rgba(16,16,20,.04);
  --primary:#18181b;--primary-hover:#2e2e33;--primary-fg:#fafafa;
  --link:#2459c9;--focus:#2459c9;--focus-ring:rgba(36,89,201,.18);
  --red:#c53030;--red-bg:rgba(197,48,48,.08);--green:#1f7a4d;--green-bg:rgba(31,122,77,.09);
  --blue:#2459c9;--blue-bg:rgba(36,89,201,.08);--amber:#a15c07;--amber-bg:rgba(161,92,7,.09);
  --av-s:22%;--av-l:91%;--av-fg:32%;color-scheme:light;
  position:fixed;inset:0;z-index:2147483647;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;
  background:var(--bg);color:var(--text);
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;text-align:left;
  animation:cuIn .2s ease;
}
.root[data-theme=dark]{${DARK}}
@media (prefers-color-scheme:dark){.root:not([data-theme=light]){${DARK}}}
@keyframes cuIn{from{opacity:0}to{opacity:1}}
*,*::before,*::after{box-sizing:border-box}
[hidden]{display:none!important}
button,input,select{font:inherit;color:inherit;margin:0}
button{cursor:pointer}
a{color:inherit}
h2,p{margin:0}
:focus-visible{outline:2px solid var(--focus);outline-offset:2px}
.ic{width:16px;height:16px;flex:none;display:block}
.wrap{width:100%;max-width:960px;margin:0 auto;padding:0 16px}
@media (min-width:640px){.wrap{padding:0 24px}}
.muted{color:var(--muted)}

.topbar{position:sticky;top:0;z-index:5;background:var(--bg);border-bottom:1px solid var(--border)}
.topbar-in{display:flex;align-items:center;justify-content:space-between;gap:10px;height:56px}
.brand{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:600;letter-spacing:-.01em}
.brand-mark{width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:var(--primary);color:var(--primary-fg)}
.tag{font-size:11.5px;font-weight:500;padding:1px 7px;border-radius:5px;border:1px solid var(--border-strong);color:var(--muted)}
.top-actions{display:flex;align-items:center;gap:8px}
.icon-btn{width:34px;height:34px;border-radius:8px;display:grid;place-items:center;border:1px solid var(--border);background:var(--surface);color:var(--muted);transition:color .15s,border-color .15s}
.icon-btn:hover{color:var(--text);border-color:var(--border-strong)}
.i-sun{display:none}
.root[data-theme=dark] .i-sun{display:block}.root[data-theme=dark] .i-moon{display:none}
@media (prefers-color-scheme:dark){.root:not([data-theme=light]) .i-sun{display:block}.root:not([data-theme=light]) .i-moon{display:none}}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:38px;padding:0 14px;border-radius:8px;border:1px solid transparent;
  font-weight:500;font-size:14px;white-space:nowrap;text-decoration:none;transition:background-color .15s,border-color .15s}
.btn.sm{height:32px;padding:0 11px;font-size:13px;border-radius:7px}
.btn.primary{background:var(--primary);color:var(--primary-fg)}
.btn.primary:hover{background:var(--primary-hover)}
.btn.ghost{background:var(--surface);border-color:var(--border);color:var(--text)}
.btn.ghost:hover{background:var(--surface-2);border-color:var(--border-strong)}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:var(--shadow)}
.view{animation:cuIn .2s ease both}
.main{padding-top:28px;padding-bottom:40px}

.av{width:36px;height:36px;border-radius:50%;flex:none;object-fit:cover;background:var(--surface-2);display:grid;place-items:center;
  font-size:12.5px;font-weight:600;letter-spacing:.02em}
.av-fb{background:hsl(var(--h) var(--av-s) var(--av-l));color:hsl(var(--h) 30% var(--av-fg))}

/* Loading */
.ld-card{max-width:440px;margin:8vh auto 0;padding:28px 24px 22px;text-align:center;display:flex;flex-direction:column;align-items:center}
.ld-avatar{position:relative;width:64px;height:64px;display:grid;place-items:center;margin-bottom:16px}
.ld-avatar .av{width:52px;height:52px;font-size:16px}
.ld-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--surface-3);border-top-color:var(--text);animation:spin .9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.ld-card h2{font-size:17px;font-weight:600;letter-spacing:-.01em}
.ld-sub{font-size:13.5px;margin-top:4px}
.ld-rows{width:100%;display:grid;gap:14px;margin:22px 0 14px;text-align:left}
.pr-top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;font-size:13px}
.pr-label{font-weight:500}
.pr-count{color:var(--muted);font-variant-numeric:tabular-nums}
.pr.done .pr-count{color:var(--green)}
.pr-bar{position:relative;height:6px;border-radius:99px;background:var(--surface-3);overflow:hidden}
.pr-fill{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:99px;background:var(--text);transition:width .35s ease}
.pr-fill.indet{width:30%;animation:indet 1.2s ease-in-out infinite}
@keyframes indet{from{left:-30%}to{left:100%}}
.pr.done .pr-fill{background:var(--green)}
.ld-status{font-size:12.5px;color:var(--muted);min-height:19px;margin-bottom:16px}
.ld-status.warn{color:var(--amber)}

/* Error */
.err-card{max-width:440px;margin:10vh auto 0;padding:28px 24px 22px;text-align:center}
.err-icon{width:40px;height:40px;margin:0 auto 14px;border-radius:10px;display:grid;place-items:center;border:1px solid var(--border);color:var(--muted)}
.err-icon .ic{width:18px;height:18px}
.err-card h2{font-size:17px;font-weight:600;margin-bottom:4px}
.err-card p{color:var(--muted);font-size:13.5px}
.err-actions{display:flex;gap:8px;justify-content:center;margin-top:20px;flex-wrap:wrap}

/* Result */
.res-head{display:flex;align-items:center;gap:14px;margin:4px 0 16px}
.res-av .av{width:48px;height:48px;font-size:15px}
.eyebrow{font-size:12.5px;font-weight:500;color:var(--muted)}
.res-head h2{font-size:22px;font-weight:600;letter-spacing:-.02em;line-height:1.25}
.res-head p.muted{font-size:13px;margin-top:2px}

.banner{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px 16px;margin-bottom:12px}
.banner-ic{width:32px;height:32px;border-radius:8px;flex:none;display:grid;place-items:center}
.banner.info .banner-ic{background:var(--surface-2);color:var(--muted)}
.banner.amber .banner-ic{background:var(--amber-bg);color:var(--amber)}
.banner.ok .banner-ic{background:var(--green-bg);color:var(--green)}
.banner-body{flex:1 1 240px;min-width:0}
.banner-body strong{display:block;font-size:14px;font-weight:600}
.banner-body span{color:var(--muted);font-size:13px}
.banner-actions{display:flex;align-items:center;gap:12px}
.stack{display:flex}
.stack .av{width:26px;height:26px;font-size:10px;border:2px solid var(--surface);margin-left:-7px}
.stack .av:first-child{margin-left:0}

.kpis{overflow:hidden;margin-bottom:12px}
.kpi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:var(--border);border-bottom:1px solid var(--border)}
.kpi-grid>.kpi:last-child:nth-child(odd){grid-column:1/-1}
@media (min-width:720px){.kpi-grid{grid-template-columns:repeat(var(--n,5),minmax(0,1fr))}.kpi-grid>.kpi:last-child:nth-child(odd){grid-column:auto}}
.kpi{position:relative;display:flex;flex-direction:column;align-items:flex-start;justify-content:space-between;gap:6px;padding:14px 16px;border:0;background:var(--surface);text-align:left;transition:background-color .15s}
.kpi:hover,.kpi.active{background:var(--surface-2)}
.kpi.active::after{content:"";position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--text)}
.kpi-label{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--muted);font-weight:500;line-height:1.3}
.kpi-num{font-size:22px;font-weight:600;letter-spacing:-.02em;line-height:1.1;font-variant-numeric:tabular-nums}
.dot{width:7px;height:7px;border-radius:50%;flex:none}
.dot.red{background:var(--red)}.dot.green{background:var(--green)}.dot.blue{background:var(--blue)}.dot.amber{background:var(--amber)}
.ratio{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;padding:12px 16px}
.ratio-head{display:flex;align-items:baseline;gap:8px}
.ratio-label{font-size:12.5px;color:var(--muted);font-weight:500}
.ratio-head strong{font-size:14px;font-weight:600;font-variant-numeric:tabular-nums}
.ratio-bar{flex:1 1 160px;height:6px;border-radius:99px;background:var(--surface-3);overflow:hidden}
.ratio-fill{display:block;height:100%;width:0;border-radius:99px;background:var(--green);transition:width .6s ease}
.ratio-desc{font-size:12.5px;color:var(--muted)}

.list-card{overflow:hidden;scroll-margin-top:72px}
.tabs-wrap{border-bottom:1px solid var(--border)}
.tabs{display:flex;gap:2px;padding:0 8px;overflow-x:auto;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{position:relative;flex:none;display:inline-flex;align-items:center;gap:7px;border:0;background:none;padding:12px 10px;font-size:13.5px;font-weight:500;color:var(--muted);transition:color .15s}
.tab:hover,.tab.active{color:var(--text)}
.tab.active::after{content:"";position:absolute;left:8px;right:8px;bottom:-1px;height:2px;border-radius:2px;background:var(--text)}
.count{font-size:11.5px;font-weight:500;line-height:18px;padding:0 6px;border-radius:5px;background:var(--surface-2);color:var(--muted);font-variant-numeric:tabular-nums}
.tab.active .count{background:var(--surface-3);color:var(--text)}
.toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:12px 16px}
.search{flex:1 1 220px;display:flex;align-items:center;gap:8px;height:34px;padding:0 10px;border-radius:8px;border:1px solid var(--border);background:var(--surface);transition:border-color .15s,box-shadow .15s}
.search:focus-within{border-color:var(--focus);box-shadow:0 0 0 3px var(--focus-ring)}
.search .ic{width:15px;height:15px;color:var(--faint)}
.search input{flex:1;min-width:0;border:0;background:none;outline:none;font-size:13.5px;padding:0}
.tool-r{display:flex;gap:8px}
.select{position:relative;display:flex;align-items:center}
.select select{appearance:none;-webkit-appearance:none;height:32px;padding:0 30px 0 10px;border-radius:7px;border:1px solid var(--border);background:var(--surface);font-size:13px;font-weight:500;cursor:pointer}
.select .ic{position:absolute;right:9px;width:14px;height:14px;pointer-events:none;color:var(--muted)}
.meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;padding:0 16px 10px;font-size:12.5px;color:var(--muted)}
.chip{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 9px;border-radius:6px;border:1px solid var(--border);background:var(--surface);font-size:12.5px;font-weight:500;color:var(--muted)}
.chip .ic{width:13px;height:13px}
.chip:hover{border-color:var(--border-strong);color:var(--text)}
.chip.on{background:var(--surface-2);border-color:var(--border-strong);color:var(--text)}
.list{list-style:none;margin:0;padding:0;border-top:1px solid var(--border)}
.row{display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--border);transition:background-color .12s}
.row:last-child{border-bottom:0}
.row:hover{background:var(--surface-2)}
.row.ignored{opacity:.5}
.r-main{flex:1;min-width:0}
.r-title{display:flex;align-items:center;gap:5px;min-width:0}
.uname{font-weight:500;font-size:14px;text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.uname:hover{text-decoration:underline;text-underline-offset:3px}
.vf{width:14px;height:14px}
.lock{color:var(--faint);display:inline-flex}
.lock .ic{width:12px;height:12px}
.sub{display:block;font-size:12.5px;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.badge{flex:none;font-size:11.5px;font-weight:500;padding:2px 8px;border-radius:5px;white-space:nowrap}
.badge.red{background:var(--red-bg);color:var(--red)}
.badge.green{background:var(--green-bg);color:var(--green)}
.badge.blue{background:var(--blue-bg);color:var(--blue)}
.r-actions{display:flex;align-items:center;gap:6px;flex:none}
.r-btn{width:30px;height:30px;border-radius:7px;display:grid;place-items:center;border:1px solid var(--border);background:var(--surface);color:var(--muted);text-decoration:none;transition:color .15s,border-color .15s}
.r-btn:hover{color:var(--text);border-color:var(--border-strong)}
.r-btn .ic{width:15px;height:15px}
.r-btn.on{color:var(--text);background:var(--surface-2)}
@media (max-width:520px){.row .badge{display:none}.row{gap:10px;padding:10px 12px}}
.sentinel{height:1px}
.empty{text-align:center;padding:44px 20px 48px}
.empty-icon{width:40px;height:40px;margin:0 auto 12px;border-radius:10px;display:grid;place-items:center;border:1px solid var(--border);color:var(--muted)}
.empty-icon .ic{width:18px;height:18px}
.empty strong{display:block;font-size:14.5px;font-weight:600;margin-bottom:2px}
.empty span{color:var(--muted);font-size:13.5px}
.foot{text-align:center;font-size:12.5px;color:var(--faint);margin-top:20px}

.toast{position:fixed;left:50%;bottom:24px;z-index:10;transform:translate(-50%,8px);opacity:0;pointer-events:none;max-width:calc(100% - 32px);
  padding:9px 14px;border-radius:8px;background:var(--primary);color:var(--primary-fg);font-size:13.5px;font-weight:500;
  box-shadow:0 8px 24px -8px rgba(0,0,0,.3);transition:opacity .2s,transform .2s}
.toast.show{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;

  /* ================= Kerangka overlay ================= */
  const host = document.createElement('div');
  host.id = 'cek-unfollow-host';
  const shadow = host.attachShadow({ mode: 'open' });
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    shadow.adoptedStyleSheets = [sheet];
  } catch (e) {
    const st = document.createElement('style');
    st.textContent = CSS;
    shadow.appendChild(st);
  }

  const root = h('div', { class: 'root', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Cek Unfollow', tabindex: '-1' });
  const savedTheme = LS.get(P + 'theme', null);
  if (savedTheme) root.setAttribute('data-theme', savedTheme);

  const rerunBtn = h('button', { class: 'btn ghost sm', hidden: true, onclick: () => run() }, icon('refresh'), h('span', null, 'Cek ulang'));
  const themeBtn = h('button', { class: 'icon-btn', title: 'Ganti tema', 'aria-label': 'Ganti tema', onclick: toggleTheme }, icon('moon', 'i-moon'), icon('sun', 'i-sun'));
  const closeBtn = h('button', { class: 'icon-btn', title: 'Tutup (Esc)', 'aria-label': 'Tutup', onclick: hide }, icon('close'));
  const main = h('main', { class: 'wrap main' });
  const toastEl = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });

  root.append(
    h('header', { class: 'topbar' }, h('div', { class: 'wrap topbar-in' },
      h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, icon('brand')), h('span', null, 'Cek Unfollow'), MOCK ? h('span', { class: 'tag' }, 'Contoh') : null),
      h('div', { class: 'top-actions' }, rerunBtn, themeBtn, closeBtn))),
    main,
    toastEl
  );
  shadow.appendChild(root);
  document.body.appendChild(host);

  function toggleTheme() {
    const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    LS.set(P + 'theme', next);
  }

  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  let prevOverflow = '';
  function show() {
    host.style.display = '';
    prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    root.focus({ preventScroll: true });
  }
  function hide() {
    host.style.display = 'none';
    document.documentElement.style.overflow = prevOverflow;
  }
  function destroy() {
    if (state.ctrl) state.ctrl.abort();
    if (R.io) R.io.disconnect();
    document.removeEventListener('keydown', onKey, true);
    document.documentElement.style.overflow = prevOverflow;
    host.remove();
    delete window.__cekUnfollow;
  }
  function onKey(e) {
    if (e.key === 'Escape' && host.style.display !== 'none' && host.isConnected) { e.stopPropagation(); hide(); }
  }
  document.addEventListener('keydown', onKey, true);
  // Jangan biarkan ketikan di overlay memicu shortcut milik Instagram
  ['keydown', 'keyup', 'keypress'].forEach((t) => root.addEventListener(t, (e) => { if (e.key !== 'Escape') e.stopPropagation(); }));

  window.__cekUnfollow = { show, hide, destroy };

  /* ================= State ================= */
  const state = {
    me: null, data: null, view: 'loading', ctrl: null, retried: false,
    tab: 'notBack', q: '', sort: 'new', showIgnored: false, hideVerified: false,
    items: [], rendered: 0,
    ignored: new Set(LS.get(P + 'ignored', [])),
  };
  const L = {}; // referensi elemen loading
  const R = {}; // referensi elemen hasil

  /* ================= Instagram API ================= */
  async function api(path, signal) {
    if (MOCK) { await sleep(150, signal); return MOCK.api(path); }
    let res;
    try {
      res = await fetch(path, {
        credentials: 'include',
        signal,
        headers: { 'X-IG-App-ID': APP_ID, 'X-Requested-With': 'XMLHttpRequest', 'X-CSRFToken': cookie('csrftoken') },
      });
    } catch (e) {
      if (e.name === 'AbortError') throw e;
      throw igErr('network', 'Tidak dapat terhubung ke Instagram. Periksa koneksi internet, lalu coba lagi.');
    }
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    const msg = String((data && data.message) || '');
    if (res.status === 429 || /wait a few minutes|rate.?limit|too many/i.test(msg)) {
      throw igErr('rate', 'Instagram membatasi permintaan untuk sementara.');
    }
    if (/checkpoint|challenge/i.test(msg) || (data && data.checkpoint_url)) {
      throw igErr('checkpoint', 'Instagram meminta verifikasi keamanan. Buka beranda Instagram, selesaikan verifikasi, lalu coba lagi.');
    }
    if (res.status === 401 || /login_required/i.test(msg) || (data && data.require_login) || (!data && res.redirected)) {
      throw igErr('login', 'Sesi login tidak ditemukan.');
    }
    if (!res.ok || !data || data.status === 'fail') {
      throw igErr('unknown', 'Instagram menolak permintaan (kode ' + res.status + (msg ? ': ' + msg : '') + '). Coba lagi beberapa saat lagi.');
    }
    return data;
  }

  async function viewerInfo(signal) {
    const me = { uid: MOCK ? MOCK.uid : cookie('ds_user_id'), username: '', name: '', pic: '', followers: null, following: null };
    const steps = [
      async () => {
        const d = await api('/api/v1/accounts/current_user/?edit=true', signal);
        const u = d.user || {};
        me.uid = me.uid || String(u.pk_id || u.pk || '');
        me.username = u.username || me.username;
        me.name = u.full_name || me.name;
        me.pic = u.profile_pic_url || me.pic;
      },
      async () => {
        if (!me.username) return;
        const d = await api('/api/v1/users/web_profile_info/?username=' + encodeURIComponent(me.username), signal);
        const u = (d.data && d.data.user) || {};
        me.pic = u.profile_pic_url || me.pic;
        if (u.edge_followed_by) me.followers = u.edge_followed_by.count;
        if (u.edge_follow) me.following = u.edge_follow.count;
      },
      async () => {
        if (me.followers != null || !me.uid) return;
        const d = await api('/api/v1/users/' + me.uid + '/info/', signal);
        const u = d.user || {};
        me.username = me.username || u.username || '';
        me.pic = me.pic || u.profile_pic_url || '';
        if (u.follower_count != null) me.followers = u.follower_count;
        if (u.following_count != null) me.following = u.following_count;
      },
    ];
    for (const step of steps) {
      try { await step(); } catch (e) { if (e.name === 'AbortError') throw e; }
      await sleep(350, signal);
    }
    return me;
  }

  async function fetchList(kind, signal) {
    const total = kind === 'following' ? state.me.following : state.me.followers;
    const row = L.rows[kind];
    const label = kind === 'following' ? 'Mengambil daftar akun yang diikuti…' : 'Mengambil daftar pengikut…';
    const out = new Map();
    const seen = new Set();
    let maxId = '';
    let page = 0;
    setStatus(label);
    row.set(0, total);
    for (;;) {
      const qs = new URLSearchParams({ count: '50' });
      if (maxId) qs.set('max_id', maxId);
      if (kind === 'followers') qs.set('search_surface', 'follow_list_page');
      let data;
      try {
        data = await api('/api/v1/friendships/' + state.me.uid + '/' + kind + '/?' + qs.toString(), signal);
      } catch (e) {
        if (e.kind === 'rate' && !state.retried) {
          state.retried = true;
          await countdown(90, signal);
          setStatus(label);
          continue;
        }
        throw e;
      }
      const before = out.size;
      for (const u of data.users || []) {
        if (!u || !u.username) continue;
        const pk = String(u.pk_id || u.pk || u.id || u.username);
        if (out.has(pk)) continue;
        out.set(pk, {
          pk, u: String(u.username).toLowerCase(), name: u.full_name || '', pic: u.profile_pic_url || '',
          verified: !!u.is_verified, priv: !!u.is_private, idx: out.size,
        });
      }
      page++;
      row.set(out.size, total);
      const next = data.next_max_id ? String(data.next_max_id) : '';
      if (!next || seen.has(next) || out.size === before) break;
      seen.add(next);
      maxId = next;
      const longPause = page % 12 === 0;
      if (longPause) setStatus('Memberi jeda agar tidak terkena pembatasan…');
      await sleep(900 + Math.random() * 900 + (longPause ? 4000 + Math.random() * 3000 : 0), signal);
      if (longPause) setStatus(label);
    }
    row.set(out.size, total, true);
    return out;
  }

  async function countdown(sec, signal) {
    for (let s = sec; s > 0; s--) {
      setStatus('Instagram meminta jeda. Melanjutkan dalam ' + s + ' detik…', true);
      await sleep(1000, signal);
    }
    setStatus('Melanjutkan…');
  }

  /* ================= Alur utama ================= */
  async function run() {
    if (state.ctrl) state.ctrl.abort();
    const ctrl = new AbortController();
    state.ctrl = ctrl;
    state.retried = false;
    const signal = ctrl.signal;
    state.me = null;
    showLoading();
    try {
      state.me = await viewerInfo(signal);
      if (!state.me.uid) throw igErr('login', 'Sesi login tidak ditemukan.');
      showLoading();
      const following = await fetchList('following', signal);
      setStatus('Menunggu sebentar…');
      await sleep(1500, signal);
      const followers = await fetchList('followers', signal);
      setStatus('Menghitung hasil…');
      await sleep(400, signal);
      state.data = analyze(following, followers);
      showResults();
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.error('[Cek Unfollow]', e);
      showError(e);
    } finally {
      if (state.ctrl === ctrl) state.ctrl = null;
    }
  }

  function analyze(following, followers, force) {
    state.maps = { following, followers };
    const uid = state.me.uid;
    const snapKey = P + 'snap:' + uid;
    const logKey = P + 'log:' + uid;
    const now = Date.now();
    const prev = LS.get(snapKey, null);

    const notBack = [], mutual = [], fans = [];
    following.forEach((u, pk) => (followers.has(pk) ? mutual : notBack).push(u));
    followers.forEach((u, pk) => { if (!following.has(pk)) fans.push(u); });

    // Bandingkan dengan pemeriksaan sebelumnya
    const freshPks = new Set();
    let newFollowers = 0;
    const fresh = [];
    if (prev && Array.isArray(prev.f)) {
      const prevF = new Map(prev.f.map((s) => { const i = s.indexOf(':'); return [s.slice(0, i), s.slice(i + 1)]; }));
      prevF.forEach((u, pk) => { if (!followers.has(pk)) { fresh.push({ pk, u, date: now }); freshPks.add(pk); } });
      followers.forEach((_, pk) => { if (!prevF.has(pk)) newFollowers++; });
    }
    // Pengaman agar tidak menuduh unfollow secara keliru:
    // 1) data pengikut dari Instagram jauh lebih sedikit dari angka di profil -> data tidak lengkap
    // 2) terlalu banyak akun "hilang" sekaligus -> hampir pasti data tidak lengkap
    const reported = state.me.followers;
    const complete = reported == null || followers.size >= reported - Math.max(5, Math.ceil(reported * 0.03));
    let skip = null;
    if (!complete) skip = 'incomplete';
    else if (!force && prev && Array.isArray(prev.f) && fresh.length > Math.max(20, prev.f.length * 0.3)) skip = 'suspicious';
    const skipCount = fresh.length;

    // Log kumulatif; akun yang kembali mengikuti dikeluarkan dari log
    let log = LS.get(logKey, []).filter((x) => x && x.pk && !followers.has(x.pk));
    if (skip) {
      fresh.length = 0;
      freshPks.clear();
      newFollowers = 0;
    } else {
      const inLog = new Set(log.map((x) => x.pk));
      log = fresh.filter((x) => !inLog.has(x.pk)).concat(log).slice(0, 500);
      LS.set(logKey, log);
      LS.set(snapKey, { date: now, f: [...followers.values()].map((u) => u.pk + ':' + u.u) });
    }

    const unfollowers = log.map((x, i) => {
      const g = following.get(x.pk);
      return g ? Object.assign({}, g, { date: x.date, idx: i }) : { pk: x.pk, u: x.u, name: '', pic: '', date: x.date, idx: i };
    });

    return {
      following: [...following.values()],
      followers: [...followers.values()],
      notBack, mutual, fans,
      unfollowers: prev || log.length ? unfollowers : null,
      fresh: unfollowers.filter((x) => freshPks.has(x.pk)),
      newFollowers,
      prevDate: prev ? prev.date : null,
      skip, skipCount,
      followingMap: following,
      followersMap: followers,
    };
  }

  /* ================= Tampilan: loading ================= */
  function progressRow(label) {
    const count = h('span', { class: 'pr-count' }, 'Menunggu');
    const fill = h('span', { class: 'pr-fill' });
    const el = h('div', { class: 'pr' }, h('div', { class: 'pr-top' }, h('span', { class: 'pr-label' }, label), count), h('div', { class: 'pr-bar' }, fill));
    return {
      el,
      set(n, total, done) {
        count.textContent = total ? nf(n) + ' / ' + nf(total) : nf(n) + ' akun';
        if (done) { el.classList.add('done'); fill.classList.remove('indet'); fill.style.width = '100%'; return; }
        if (total) { fill.classList.remove('indet'); fill.style.width = Math.min(100, (n / total) * 100) + '%'; }
        else fill.classList.add('indet');
      },
    };
  }
  function setStatus(text, warn) {
    if (!L.status) return;
    L.status.textContent = text;
    L.status.classList.toggle('warn', !!warn);
  }
  function showLoading() {
    state.view = 'loading';
    rerunBtn.hidden = true;
    const me = state.me;
    L.rows = { following: progressRow('Mengikuti'), followers: progressRow('Pengikut') };
    L.status = h('p', { class: 'ld-status' }, 'Menghubungkan ke Instagram…');
    main.replaceChildren(h('section', { class: 'card ld-card view' },
      h('div', { class: 'ld-avatar' }, h('span', { class: 'ld-ring' }),
        me && me.username ? avatar({ u: me.username, pic: me.pic }) : h('span', { class: 'av av-fb', vars: { '--h': 220 } }, icon('brand'))),
      h('h2', null, me && me.username ? 'Memeriksa @' + me.username : 'Menyiapkan pemeriksaan'),
      h('p', { class: 'muted ld-sub' }, 'Biarkan tab ini tetap terbuka. Proses biasanya memerlukan 1–3 menit, tergantung jumlah akun.'),
      h('div', { class: 'ld-rows' }, L.rows.following.el, L.rows.followers.el),
      L.status,
      h('button', { class: 'btn ghost sm', onclick: destroy }, 'Batalkan')));
    root.scrollTop = 0;
  }

  /* ================= Tampilan: error ================= */
  function showError(e) {
    state.view = 'error';
    L.status = null;
    rerunBtn.hidden = true;
    const MAP = {
      login: ['lock', 'Belum login', 'Login ke Instagram di tab ini, lalu klik bookmark Cek Unfollow kembali.'],
      rate: ['clock', 'Instagram membatasi permintaan', 'Terlalu banyak permintaan dalam waktu singkat. Tunggu sekitar 1–2 jam sebelum mencoba lagi. Pembatasan ini bersifat sementara.'],
      checkpoint: ['shield', 'Verifikasi diperlukan', e.message],
      network: ['wifiOff', 'Koneksi terputus', e.message],
    };
    const m = MAP[e.kind] || ['alert', 'Terjadi kesalahan', e.message || 'Terjadi kesalahan yang tidak terduga. Coba lagi beberapa saat lagi.'];
    main.replaceChildren(h('section', { class: 'card err-card view' },
      h('div', { class: 'err-icon' }, icon(m[0])),
      h('h2', null, m[1]),
      h('p', null, m[2]),
      h('div', { class: 'err-actions' },
        e.kind === 'rate' ? null : h('button', { class: 'btn primary sm', onclick: () => run() }, 'Coba lagi'),
        h('button', { class: 'btn ghost sm', onclick: destroy }, 'Tutup'))));
  }

  /* ================= Tampilan: hasil ================= */
  const TABS = [
    { id: 'notBack', label: 'Tidak follow balik' },
    { id: 'unfollowers', label: 'Berhenti mengikuti' },
    { id: 'fans', label: 'Belum kamu follow balik' },
    { id: 'mutual', label: 'Mutual' },
    { id: 'following', label: 'Mengikuti' },
    { id: 'followers', label: 'Pengikut' },
  ];
  const EMPTY = {
    notBack: ['Semua akun mengikuti balik', 'Setiap akun yang kamu ikuti juga mengikuti kamu.'],
    unfollowers: ['Tidak ada yang berhenti mengikuti', 'Semua pengikut sejak pemeriksaan sebelumnya masih mengikuti.'],
    fans: ['Semua pengikut sudah diikuti balik', 'Tidak ada pengikut yang belum kamu ikuti.'],
    mutual: ['Belum ada akun mutual', 'Belum ada akun yang saling mengikuti dengan kamu.'],
    following: ['Tidak ada data', 'Kamu belum mengikuti akun apa pun.'],
    followers: ['Tidak ada data', 'Belum ada pengikut.'],
    search: ['Tidak ditemukan', 'Tidak ada akun yang cocok dengan pencarian.'],
    filtered: ['Semua akun disembunyikan', 'Akun di daftar ini sedang disembunyikan oleh filter.'],
  };

  function showResults() {
    state.view = 'result';
    L.status = null;
    rerunBtn.hidden = false;
    const d = state.data;
    const me = state.me;
    state.tab = d.fresh.length ? 'unfollowers' : 'notBack';
    state.q = '';

    const head = h('div', { class: 'res-head' },
      h('div', { class: 'res-av' }, avatar({ u: me.username || 'ig', pic: me.pic })),
      h('div', null,
        h('p', { class: 'eyebrow' }, MOCK ? 'Data contoh' : 'Hasil pemeriksaan'),
        h('h2', null, me.username ? '@' + me.username : 'Ringkasan akun'),
        h('p', { class: 'muted' }, 'Diperiksa ' + fd(Date.now()))));

    main.replaceChildren(h('section', { class: 'view' },
      head,
      banner(),
      accuracyNote(),
      overview(),
      listCard(),
      h('p', { class: 'foot' }, 'Data hanya diproses di browser. Tekan Esc atau tombol tutup untuk kembali ke Instagram.')));
    root.scrollTop = 0;
    renderTabs();
    renderList();
  }

  function banner() {
    const d = state.data;
    if (d.skip === 'incomplete') {
      return h('div', { class: 'card banner amber' },
        h('span', { class: 'banner-ic' }, icon('alert')),
        h('div', { class: 'banner-body' },
          h('strong', null, 'Data pengikut belum lengkap'),
          h('span', null, 'Instagram hanya mengirim ' + nf(d.followers.length) + ' dari ' + nf(state.me.followers) +
            ' pengikut. Agar tidak salah, daftar "Berhenti mengikuti" tidak diperbarui pada pemeriksaan ini. Coba Cek ulang beberapa saat lagi.')));
    }
    if (d.skip === 'suspicious') {
      return h('div', { class: 'card banner amber' },
        h('span', { class: 'banner-ic' }, icon('alert')),
        h('div', { class: 'banner-body' },
          h('strong', null, 'Perubahan tidak wajar, belum dicatat'),
          h('span', null, nf(d.skipCount) + ' akun terlihat hilang sekaligus sejak pemeriksaan ' + fd(d.prevDate) +
            '. Biasanya ini karena data dari Instagram belum lengkap. Coba Cek ulang beberapa saat lagi.')),
        h('div', { class: 'banner-actions' },
          h('button', { class: 'btn ghost sm', onclick: () => { state.data = analyze(state.maps.following, state.maps.followers, true); showResults(); } }, 'Tetap simpan')));
    }
    if (!d.prevDate) {
      return h('div', { class: 'card banner info' },
        h('span', { class: 'banner-ic' }, icon('info')),
        h('div', { class: 'banner-body' },
          h('strong', null, 'Pemeriksaan pertama'),
          h('span', null, 'Hasil ini disimpan di browser. Jalankan kembali di lain waktu untuk melihat akun yang berhenti mengikuti.')));
    }
    const n = d.fresh.length;
    const sub = 'Dibandingkan dengan pemeriksaan ' + fd(d.prevDate) + (d.newFollowers ? ' · ' + nf(d.newFollowers) + ' pengikut baru' : '');
    return h('div', { class: 'card banner ' + (n ? 'amber' : 'ok') },
      h('span', { class: 'banner-ic' }, icon(n ? 'trendDown' : 'check')),
      h('div', { class: 'banner-body' },
        h('strong', null, n ? nf(n) + ' akun berhenti mengikuti kamu' : 'Tidak ada akun yang berhenti mengikuti'),
        h('span', null, sub)),
      n ? h('div', { class: 'banner-actions' },
        h('span', { class: 'stack' }, d.fresh.slice(0, 4).map((x) => avatar(x))),
        h('button', { class: 'btn ghost sm', onclick: () => goto('unfollowers') }, 'Lihat')) : null);
  }

  function accuracyNote() {
    const d = state.data, me = state.me, gaps = [];
    if (d.skip === 'incomplete') return null; // sudah dijelaskan di banner
    if (me.following && d.following.length < me.following * 0.97) gaps.push(nf(d.following.length) + ' dari ' + nf(me.following) + ' akun yang diikuti');
    if (me.followers && d.followers.length < me.followers * 0.97) gaps.push(nf(d.followers.length) + ' dari ' + nf(me.followers) + ' pengikut');
    if (!gaps.length) return null;
    return h('div', { class: 'card banner info' },
      h('span', { class: 'banner-ic' }, icon('alert')),
      h('div', { class: 'banner-body' },
        h('strong', null, 'Data mungkin belum lengkap'),
        h('span', null, 'Instagram hanya mengirim ' + gaps.join(' dan ') + '. Jika hasil terlihat tidak sesuai, jalankan Cek ulang beberapa saat lagi.')));
  }

  function overview() {
    const d = state.data;
    const pct = d.following.length ? Math.round((d.mutual.length / d.following.length) * 100) : 0;
    const cells = [
      { id: 'following', label: 'Mengikuti', n: d.following.length },
      { id: 'followers', label: 'Pengikut', n: d.followers.length },
      { id: 'mutual', label: 'Mutual', n: d.mutual.length, tone: 'green' },
      { id: 'notBack', label: 'Tidak follow balik', n: d.notBack.length, tone: 'red' },
      { id: 'fans', label: 'Belum kamu follow balik', n: d.fans.length, tone: 'blue' },
    ];
    if (d.unfollowers) cells.push({ id: 'unfollowers', label: 'Berhenti mengikuti', n: d.unfollowers.length, tone: 'amber' });

    R.kpis = h('div', { class: 'kpi-grid', vars: { '--n': String(cells.length) } }, cells.map((c) =>
      h('button', { class: 'kpi', 'data-goto': c.id, onclick: () => goto(c.id) },
        h('span', { class: 'kpi-label' }, c.tone ? h('i', { class: 'dot ' + c.tone }) : null, c.label),
        h('span', { class: 'kpi-num' }, nf(c.n)))));

    const fill = h('span', { class: 'ratio-fill' });
    setTimeout(() => { fill.style.width = pct + '%'; }, 40);

    return h('div', { class: 'card kpis' },
      R.kpis,
      h('div', { class: 'ratio' },
        h('div', { class: 'ratio-head' }, h('span', { class: 'ratio-label' }, 'Rasio follow balik'), h('strong', null, pct + '%')),
        h('div', { class: 'ratio-bar' }, fill),
        h('p', { class: 'ratio-desc' }, nf(d.mutual.length) + ' dari ' + nf(d.following.length) + ' akun yang kamu ikuti mengikuti balik')));
  }

  function listCard() {
    R.tabs = h('div', { class: 'tabs', role: 'tablist' });
    R.search = h('input', {
      type: 'search', placeholder: 'Cari username atau nama', autocomplete: 'off', 'aria-label': 'Cari',
      oninput: (e) => { clearTimeout(R.st); R.st = setTimeout(() => { state.q = e.target.value; renderList(); }, 120); },
    });
    R.sort = h('select', { 'aria-label': 'Urutkan', onchange: (e) => { state.sort = e.target.value; renderList(); } },
      h('option', { value: 'new' }, 'Terbaru'), h('option', { value: 'old' }, 'Terlama'),
      h('option', { value: 'az' }, 'A–Z'), h('option', { value: 'za' }, 'Z–A'));
    R.sort.value = state.sort;
    R.meta = h('div', { class: 'meta' });
    R.list = h('ul', { class: 'list' });
    R.empty = h('div', { class: 'empty', hidden: true });
    R.sentinel = h('div', { class: 'sentinel' });
    if (R.io) R.io.disconnect();
    R.io = new IntersectionObserver((en) => { if (en[0].isIntersecting) more(); }, { root, rootMargin: '600px' });
    R.io.observe(R.sentinel);
    R.card = h('div', { class: 'card list-card' },
      h('div', { class: 'tabs-wrap' }, R.tabs),
      h('div', { class: 'toolbar' },
        h('label', { class: 'search' }, icon('search'), R.search),
        h('div', { class: 'tool-r' },
          h('label', { class: 'select' }, R.sort, icon('chev')),
          h('button', { class: 'btn ghost sm', title: 'Salin daftar username', onclick: copyList }, icon('copy'), h('span', null, 'Salin')))),
      R.meta, R.list, R.sentinel, R.empty);
    return R.card;
  }

  function goto(id) {
    setTab(id);
    R.card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function setTab(id) {
    if (!state.data[id]) return;
    state.tab = id;
    renderTabs();
    renderList();
  }
  function renderTabs() {
    const d = state.data;
    R.tabs.replaceChildren(...TABS.filter((t) => d[t.id]).map((t) =>
      h('button', { class: 'tab' + (t.id === state.tab ? ' active' : ''), role: 'tab', 'aria-selected': String(t.id === state.tab), onclick: () => setTab(t.id) },
        t.label, h('span', { class: 'count' }, nf(d[t.id].length)))));
    R.kpis.querySelectorAll('.kpi').forEach((s) => s.classList.toggle('active', s.getAttribute('data-goto') === state.tab));
    const active = R.tabs.querySelector('.active');
    if (active) {
      const box = R.tabs.getBoundingClientRect(), a = active.getBoundingClientRect();
      if (a.left < box.left || a.right > box.right) R.tabs.scrollLeft += a.left - box.left - 40;
    }
  }

  function currentItems() {
    let items = state.data[state.tab].slice();
    const q = state.q.trim().toLowerCase().replace(/^@/, '');
    if (q) items = items.filter((x) => x.u.includes(q) || (x.name && x.name.toLowerCase().includes(q)));
    if (state.tab === 'notBack') {
      if (!state.showIgnored) items = items.filter((x) => !state.ignored.has(x.pk));
      if (state.hideVerified) items = items.filter((x) => !x.verified);
    }
    const byName = (a, b) => a.u.localeCompare(b.u);
    if (state.sort === 'az') items.sort(byName);
    else if (state.sort === 'za') items.sort((a, b) => byName(b, a));
    else {
      const dir = state.sort === 'new' ? 1 : -1;
      items.sort((a, b) => dir * (a.idx - b.idx));
    }
    return items;
  }

  function subText(x) {
    switch (state.tab) {
      case 'unfollowers': return 'Terdeteksi ' + fd(x.date) + (x.name ? ' · ' + x.name : '');
      case 'notBack': return x.name || 'Tidak mengikuti balik';
      case 'fans': return x.name || 'Mengikuti kamu';
      case 'mutual': return x.name || 'Saling mengikuti';
      default: return x.name || ' ';
    }
  }
  function badge(x) {
    const d = state.data;
    const iFollow = d.followingMap.has(x.pk), followsMe = d.followersMap.has(x.pk);
    if (state.tab === 'following') return followsMe ? h('span', { class: 'badge green' }, 'Mutual') : h('span', { class: 'badge red' }, 'Tidak follow balik');
    if (state.tab === 'followers') return iFollow ? h('span', { class: 'badge green' }, 'Mutual') : h('span', { class: 'badge blue' }, 'Belum kamu follow');
    if (state.tab === 'unfollowers' && iFollow) return h('span', { class: 'badge red' }, 'Masih kamu ikuti');
    return null;
  }
  function row(x) {
    const canIgnore = state.tab === 'notBack';
    const isIgn = state.ignored.has(x.pk);
    const li = h('li', { class: 'row' + (canIgnore && isIgn ? ' ignored' : '') },
      avatar(x),
      h('div', { class: 'r-main' },
        h('div', { class: 'r-title' },
          h('a', { class: 'uname', href: profileUrl(x.u), target: '_blank', rel: 'noopener' }, '@' + x.u),
          x.verified ? icon('verified', 'vf') : null,
          x.priv ? h('span', { class: 'lock', title: 'Akun privat' }, icon('lock')) : null),
        h('span', { class: 'sub' }, subText(x))),
      badge(x),
      h('div', { class: 'r-actions' },
        canIgnore ? h('button', {
          class: 'r-btn' + (isIgn ? ' on' : ''),
          title: isIgn ? 'Tampilkan kembali' : 'Abaikan akun ini (misalnya akun publik atau brand)',
          'aria-label': (isIgn ? 'Batal abaikan @' : 'Abaikan @') + x.u,
          onclick: () => toggleIgnore(x, li),
        }, icon(isIgn ? 'eye' : 'eyeOff')) : null,
        h('a', { class: 'r-btn', href: profileUrl(x.u), target: '_blank', rel: 'noopener', title: 'Buka profil', 'aria-label': 'Buka profil @' + x.u }, icon('external'))));
    return li;
  }

  function renderList() {
    state.items = currentItems();
    state.rendered = 0;
    R.list.replaceChildren();
    renderMeta();
    if (!state.items.length) {
      const all = state.data[state.tab];
      const key = state.q ? 'search' : (all.length ? 'filtered' : state.tab);
      const e = EMPTY[key];
      R.empty.replaceChildren(h('div', { class: 'empty-icon' }, icon(key === 'search' ? 'search' : 'inbox')), h('strong', null, e[0]), h('span', null, e[1]));
      R.empty.hidden = false;
      return;
    }
    R.empty.hidden = true;
    more();
  }
  function more() {
    if (!state.items || state.rendered >= state.items.length) return;
    const next = state.items.slice(state.rendered, state.rendered + 60);
    next.forEach((x) => R.list.appendChild(row(x)));
    state.rendered += next.length;
  }
  function renderMeta() {
    const d = state.data;
    const kids = [h('span', null, nf(state.items.length) + ' akun' + (state.q ? ' cocok dengan "' + state.q + '"' : ''))];
    if (state.tab === 'notBack') {
      const nVer = d.notBack.filter((x) => x.verified).length;
      const nIgn = d.notBack.filter((x) => state.ignored.has(x.pk)).length;
      if (nVer) {
        kids.push(h('button', { class: 'chip' + (state.hideVerified ? ' on' : ''), onclick: () => { state.hideVerified = !state.hideVerified; renderList(); } },
          icon('verified', 'vf'), (state.hideVerified ? 'Akun terverifikasi disembunyikan' : 'Sembunyikan akun terverifikasi') + ' (' + nf(nVer) + ')'));
      }
      if (nIgn) {
        kids.push(h('button', { class: 'chip' + (state.showIgnored ? ' on' : ''), onclick: () => { state.showIgnored = !state.showIgnored; renderList(); } },
          icon(state.showIgnored ? 'eye' : 'eyeOff'), nf(nIgn) + ' diabaikan · ' + (state.showIgnored ? 'sembunyikan' : 'tampilkan')));
      }
    }
    R.meta.replaceChildren(...kids);
  }

  function toggleIgnore(x, li) {
    const nowIgnored = !state.ignored.has(x.pk);
    if (nowIgnored) state.ignored.add(x.pk); else state.ignored.delete(x.pk);
    LS.set(P + 'ignored', [...state.ignored]);
    toast(nowIgnored ? '@' + x.u + ' diabaikan' : '@' + x.u + ' ditampilkan kembali');
    if (nowIgnored && !state.showIgnored) {
      const i = state.items.indexOf(x);
      if (i > -1) { state.items.splice(i, 1); state.rendered = Math.max(0, state.rendered - 1); }
      li.remove();
      more();
      renderMeta();
      if (!state.items.length) renderList();
    } else {
      li.replaceWith(row(x));
      renderMeta();
    }
  }

  async function copyList() {
    if (!state.items.length) { toast('Daftar kosong'); return; }
    const text = state.items.map((x) => x.u).join('\n');
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = h('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      root.appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
    }
    toast(ok ? nf(state.items.length) + ' username disalin' : 'Gagal menyalin');
  }

  /* ================= Mulai ================= */
  show();
  run();
}

/*
 * Dipakai halaman web (index.html & tutorial.html) untuk membuat kode bookmarklet
 * dari fungsi di atas. Fungsi ini TIDAK ikut masuk ke dalam bookmarklet.
 */
function cekUnfollowBookmarklet() {
  const src = String(cekUnfollowMain)
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('//')).join('\n');
  const code = '(' + src + ')();';
  const url = 'javascript:' + code.replace(/[^\x21-\x7e]|[%#"<>`{}|\\^]/gu, (c) => encodeURIComponent(c)) + 'void%200';
  return { code, url };
}
