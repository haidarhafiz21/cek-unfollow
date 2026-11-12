(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- Storage (aman jika diblokir) ---------------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch { /* abaikan */ } },
  };

  /* ---------------- Icons ---------------- */
  const ICON = {
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5.5 5h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2.5-8z"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    userX: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="m17 8 4 4M21 8l-4 4"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="8" r="3.3"/><path d="M2.5 20c.7-3.3 3-5 6-5s5.3 1.7 6 5"/><circle cx="16.5" cy="8.5" r="2.8"/><path d="M16 14.6c2.7 0 4.8 1.6 5.5 4.6"/></svg>',
    userPlus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M19 8v6M16 11h6"/></svg>',
    trendDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 7 6.5 6.5 4-4L21 17"/><path d="M15 17h6v-6"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.01"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></svg>',
    eyeOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.1A10 10 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.4 3.3M6.6 6.6C3.9 8.4 2.5 12 2.5 12s3.5 7 9.5 7a9.4 9.4 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m3 3 18 18"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"/><circle cx="12" cy="12" r="3"/></svg>',
  };

  /* ---------------- Theme ---------------- */
  const root = document.documentElement;
  const savedTheme = store.get('cu:theme', null);
  if (savedTheme) root.dataset.theme = savedTheme;
  $('#themeBtn').addEventListener('click', () => {
    const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    store.set('cu:theme', next);
  });
  const topbar = $('.topbar');
  addEventListener('scroll', () => topbar.classList.toggle('scrolled', scrollY > 4), { passive: true });

  /* ---------------- Helpers ---------------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtNum = (n) => n.toLocaleString('id-ID');
  const dateFmt = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtDate = (ts) => (ts ? dateFmt.format(new Date(ts * 1000)) : '');
  const fmtDateMs = (ms) => dateFmt.format(new Date(ms));
  const profileUrl = (u) => `https://www.instagram.com/${encodeURIComponent(u)}/`;

  function hue(u) {
    let h = 0;
    for (let i = 0; i < u.length; i++) h = (h * 31 + u.charCodeAt(i)) >>> 0;
    return h % 360;
  }
  function initials(u) {
    const parts = u.split(/[._]+/).filter(Boolean);
    const s = parts.length > 1 ? parts[0][0] + parts[1][0] : u.replace(/[^a-z0-9]/g, '').slice(0, 2);
    return (s || u.slice(0, 2)).toUpperCase();
  }
  const avatar = (u) => `<span class="avatar" style="--h:${hue(u)}" aria-hidden="true">${esc(initials(u))}</span>`;

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------------- Parsing data Instagram ---------------- */
  const USER_RE = /^[a-z0-9._]{1,30}$/;
  const RESERVED = new Set(['accounts', 'explore', 'p', 'reel', 'reels', 'stories', 'direct', 'about', 'legal', 'developer', 'instagram.com']);
  const RELEVANT = /(^|\/)(followers(_\d+)?|following|pending_follow_requests|personal_information|connections)\.(json|html?)$/i;

  function userFromHref(href) {
    try {
      let h = String(href).trim();
      if (!/^https?:\/\//i.test(h)) h = 'https://' + h.replace(/^\/+/, '');
      const url = new URL(h);
      if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return '';
      const parts = url.pathname.split('/').filter(Boolean).filter((p) => p !== '_u');
      const u = (parts[0] || '').toLowerCase();
      return RESERVED.has(u) ? '' : u;
    } catch { return ''; }
  }

  function clean(raw) {
    if (raw == null) return '';
    let u = String(raw).trim();
    if (!u) return '';
    if (/instagram\.com/i.test(u)) u = userFromHref(u);
    u = u.replace(/^@/, '').toLowerCase();
    return USER_RE.test(u) && !RESERVED.has(u) ? u : '';
  }

  function kindFromName(name) {
    const base = name.split('/').pop().toLowerCase();
    if (/^followers(_\d+)?\./.test(base)) return 'followers';
    if (/^following\./.test(base)) return 'following';
    if (/^pending_follow_requests\./.test(base)) return 'pending';
    return '';
  }

  function fromIgList(list) {
    const out = [];
    if (!Array.isArray(list)) return out;
    for (const item of list) {
      if (!item || typeof item !== 'object') continue;
      const s = (Array.isArray(item.string_list_data) && item.string_list_data[0]) || {};
      const u = clean(s.value) || clean(item.title) || clean(s.href);
      if (u) out.push({ u, ts: Number(s.timestamp) || 0 });
    }
    return out;
  }

  function addAll(map, entries) {
    for (const e of entries) if (e.u && !map.has(e.u)) map.set(e.u, e.ts || 0);
  }

  function parseJson(name, text, acc) {
    let data;
    try { data = JSON.parse(text); } catch { return; }
    const kind = kindFromName(name);

    if (Array.isArray(data)) {
      // followers_1.json berbentuk array langsung
      addAll(kind === 'following' ? acc.following : kind === 'pending' ? acc.pending : acc.followers, fromIgList(data));
      return;
    }
    if (!data || typeof data !== 'object') return;

    if (data.relationships_followers) addAll(acc.followers, fromIgList(data.relationships_followers));
    if (data.relationships_following) addAll(acc.following, fromIgList(data.relationships_following));
    if (data.relationships_follow_requests_sent) addAll(acc.pending, fromIgList(data.relationships_follow_requests_sent));

    // Format lama: connections.json { followers: {user: date}, following: {...} }
    for (const key of ['followers', 'following']) {
      const obj = data[key];
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        addAll(acc[key], Object.entries(obj).map(([u, d]) => ({ u: clean(u), ts: Math.floor(Date.parse(d) / 1000) || 0 })));
      }
    }

    // personal_information.json -> username pemilik akun
    if (Array.isArray(data.profile_user)) {
      const v = data.profile_user[0]?.string_map_data?.Username?.value;
      if (v && clean(v)) acc.owner = clean(v);
    }
  }

  function parseHtml(name, text, acc) {
    const kind = kindFromName(name);
    if (!kind) return;
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const entries = [];
    doc.querySelectorAll('a[href*="instagram.com"]').forEach((a) => {
      const u = clean(a.getAttribute('href')) || clean(a.textContent);
      if (!u) return;
      let ts = 0;
      const dateEl = a.parentElement?.nextElementSibling || a.closest('div')?.nextElementSibling;
      if (dateEl) {
        const t = Date.parse(dateEl.textContent.trim());
        if (!Number.isNaN(t)) ts = Math.floor(t / 1000);
      }
      entries.push({ u, ts });
    });
    addAll(acc[kind], entries);
  }

  function parseText(name, text, acc) {
    if (/\.json$/i.test(name)) parseJson(name, text, acc);
    else if (/\.html?$/i.test(name)) parseHtml(name, text, acc);
  }

  function newAcc() {
    return { followers: new Map(), following: new Map(), pending: new Map(), owner: '', exportDate: '' };
  }

  async function processFiles(fileList) {
    const files = [...fileList];
    if (!files.length) return;
    const acc = newAcc();
    setLoading(true);
    hideError();
    try {
      for (const f of files) {
        const m = f.name.match(/instagram-([a-z0-9._]+)-(\d{4}-\d{2}-\d{2})/i);
        if (m) { acc.owner = acc.owner || m[1].toLowerCase(); acc.exportDate = acc.exportDate || m[2]; }

        if (/\.zip$/i.test(f.name)) {
          if (!window.JSZip) throw new Error('Library pembaca ZIP gagal dimuat (cek koneksi internet). Alternatifnya: ekstrak ZIP-nya, lalu unggah followers_1.json dan following.json.');
          const zip = await window.JSZip.loadAsync(f);
          const jobs = [];
          zip.forEach((path, entry) => {
            if (!entry.dir && !path.includes('__MACOSX') && RELEVANT.test(path)) {
              jobs.push(entry.async('string').then((t) => parseText(path, t, acc)));
            }
          });
          await Promise.all(jobs);
        } else if (/\.(json|html?)$/i.test(f.name)) {
          parseText(f.name, await f.text(), acc);
        }
      }

      if (!acc.followers.size && !acc.following.size) {
        throw new Error('Data followers/following tidak ditemukan. Pastikan kamu mengunggah ZIP ekspor Instagram (bagian "Pengikut dan mengikuti"), atau file followers_1.json dan following.json.');
      }
      if (!acc.following.size) throw new Error('File following.json belum ada. Unggah juga file "following" agar bisa dibandingkan.');
      if (!acc.followers.size) throw new Error('File followers_1.json belum ada. Unggah juga file "followers" agar bisa dibandingkan.');

      showResult(analyze(acc));
    } catch (err) {
      console.error(err);
      showError(err.message || 'Gagal membaca file. Silakan coba lagi.');
    } finally {
      setLoading(false);
      $('#fileInput').value = '';
    }
  }

  /* ---------------- Analisis + riwayat ---------------- */
  const sameSets = (h, f, g) => h && h.followers.length === f.length && h.following.length === g.length &&
    h.followers.join('\n') === f.join('\n') && h.following.join('\n') === g.join('\n');

  function analyze(acc, opts = {}) {
    const { followers, following, pending } = acc;
    const notBack = [], mutual = [], fans = [];
    for (const [u, ts] of following) {
      if (followers.has(u)) mutual.push({ u, ts: Math.max(ts, followers.get(u)) });
      else notBack.push({ u, ts });
    }
    for (const [u, ts] of followers) if (!following.has(u)) fans.push({ u, ts });

    const curF = [...followers.keys()].sort();
    const curG = [...following.keys()].sort();
    const histKey = 'cu:snap:' + (acc.owner || 'default');
    const history = opts.demoHistory || store.get(histKey, []);

    // Bandingkan dengan snapshot terakhir yang berbeda dari data sekarang
    let prev = null;
    for (let i = history.length - 1; i >= 0; i--) {
      if (!sameSets(history[i], curF, curG)) { prev = history[i]; break; }
    }

    let unfollowers = null, newFollowers = null;
    if (prev) {
      const prevF = new Set(prev.followers);
      unfollowers = prev.followers.filter((u) => !followers.has(u)).map((u) => ({ u, ts: 0 }));
      newFollowers = curF.filter((u) => !prevF.has(u));
    }

    if (!opts.demo) {
      const last = history[history.length - 1];
      if (!sameSets(last, curF, curG)) {
        history.push({ date: Date.now(), exportDate: acc.exportDate || '', followers: curF, following: curG });
        while (history.length > 6) history.shift();
        if (!store.set(histKey, history)) {
          // Kalau penyimpanan penuh, simpan cukup snapshot terakhir
          store.set(histKey, history.slice(-1));
        }
      }
    }

    return {
      owner: acc.owner, exportDate: acc.exportDate, demo: !!opts.demo, histKey,
      followers, following, pending,
      lists: {
        notBack, mutual, fans,
        unfollowers,
        following: [...following].map(([u, ts]) => ({ u, ts })),
        followers: [...followers].map(([u, ts]) => ({ u, ts })),
        pending: pending.size ? [...pending].map(([u, ts]) => ({ u, ts })) : null,
      },
      prev, newFollowers,
    };
  }

  /* ---------------- UI: upload view ---------------- */
  const dropzone = $('#dropzone');
  const fileInput = $('#fileInput');

  function setLoading(on) { dropzone.classList.toggle('loading', on); }
  function showError(msg) { const e = $('#errorMsg'); e.textContent = msg; e.hidden = false; }
  function hideError() { $('#errorMsg').hidden = true; }

  fileInput.addEventListener('change', () => processFiles(fileInput.files));
  ['dragenter', 'dragover'].forEach((ev) => dropzone.addEventListener(ev, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }));
  ['dragleave', 'dragend'].forEach((ev) => dropzone.addEventListener(ev, () => dropzone.classList.remove('drag')));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag');
    if (e.dataTransfer?.files?.length) processFiles(e.dataTransfer.files);
  });
  // Cegah browser membuka file jika dilepas di luar dropzone
  addEventListener('dragover', (e) => e.preventDefault());
  addEventListener('drop', (e) => e.preventDefault());

  const seg = $('.seg');
  $$('.seg-btn').forEach((b) => b.addEventListener('click', () => {
    const mode = b.dataset.mode;
    seg.dataset.mode = mode;
    $$('.seg-btn').forEach((x) => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-selected', on); });
    $$('.mode').forEach((m) => { m.hidden = m.dataset.mode !== mode; });
    $('#uploadFoot').hidden = mode === 'direct';
    $('#exportGuide').hidden = mode !== 'file';
    hideError();
  }));

  $$('[data-goto-mode]').forEach((b) => b.addEventListener('click', () => {
    $(`.seg-btn[data-mode="${b.dataset.gotoMode}"]`).click();
  }));

  /* ---------------- Perangkat: komputer / Android / iPhone ---------------- */
  const UA = navigator.userAgent;
  const IS_IOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const IS_ANDROID = /Android/i.test(UA);
  const IN_APP = /Instagram|FBAN|FBAV|FB_IAB|Line\/|TikTok|musical_ly|Twitter|Snapchat/i.test(UA);

  function setDevice(dev) {
    $$('.dev-btn').forEach((b) => b.classList.toggle('active', b.dataset.device === dev));
    $$('#modeDirect [data-dev]').forEach((el) => { el.hidden = !el.dataset.dev.split(' ').includes(dev); });
  }
  $$('.dev-btn').forEach((b) => b.addEventListener('click', () => setDevice(b.dataset.device)));
  setDevice(IS_IOS ? 'ios' : IS_ANDROID ? 'android' : 'desktop');
  if (IN_APP) $('#inAppNote').hidden = false;

  /* ---------------- Bagikan ---------------- */
  $('#shareBtn').addEventListener('click', async () => {
    const url = location.href.split('#')[0];
    const data = { title: 'Cek Unfollow', text: 'Cek siapa yang tidak follow balik di Instagram. Gratis dan tanpa password.', url };
    if (navigator.share) {
      try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const ok = await copyText(url);
    toast(ok ? 'Link disalin' : 'Gagal menyalin link');
  });

  /* ---------------- Mode langsung: bookmarklet ---------------- */
  let scriptCode = '';
  let bookmarkUrl = '';
  (function buildBookmarklet() {
    const link = $('#bookmarklet');
    if (typeof window.cekUnfollowBookmarklet !== 'function') {
      link.addEventListener('click', (e) => { e.preventDefault(); toast('File cekunfollow.js tidak ditemukan'); });
      return;
    }
    const bm = window.cekUnfollowBookmarklet();
    scriptCode = bm.code;
    bookmarkUrl = bm.url;
    link.href = bookmarkUrl;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      toast('Seret tombol ini ke bookmark bar, lalu klik dari sana saat di instagram.com');
    });
  })();

  $$('.copy-bm').forEach((b) => b.addEventListener('click', async () => {
    if (!bookmarkUrl) return toast('Kode belum siap');
    const ok = await copyText(bookmarkUrl);
    toast(ok ? 'Kode disalin. Lanjutkan ke langkah berikutnya' : 'Gagal menyalin');
  }));

  $('#copyScriptBtn').addEventListener('click', async () => {
    if (!scriptCode) return toast('Script belum siap');
    const ok = await copyText(scriptCode);
    toast(ok ? 'Script disalin. Tempel di Console instagram.com' : 'Gagal menyalin');
  });

  $('#previewBtn').addEventListener('click', () => {
    if (typeof window.cekUnfollowMain !== 'function') return;
    window.__cekUnfollowMock = makeMockInstagram();
    window.cekUnfollowMain();
  });

  // Simulasi API Instagram untuk pratinjau (tidak menghubungi Instagram sama sekali)
  function makeMockInstagram() {
    const first = ['raka', 'nadia', 'dimas', 'putri', 'bayu', 'sekar', 'fajar', 'ayu', 'rizky', 'salsa', 'arif', 'intan', 'yoga', 'tiara', 'hana', 'bima', 'citra', 'gilang', 'laras', 'naufal', 'kirana', 'reza', 'dinda', 'farhan', 'zahra', 'aldo', 'maya', 'kevin', 'nisa', 'dewi'];
    const last = ['Pratama', 'Putri', 'Saputra', 'Lestari', 'Wijaya', 'Anggraini', 'Nugroho', 'Maharani', 'Hidayat', 'Permata'];
    const suf = ['.id', '_', '.jpg', '99', '.ok', 'studio', '.art', 'x', '2001', '_photo', 'eats', '.travel', '.co', '_daily'];
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const pool = new Map();
    let pk = 1000;
    while (pool.size < 300) {
      const f = pick(first);
      const u = f + (rnd() < 0.5 ? '.' : '') + pick(first).slice(0, 3 + Math.floor(rnd() * 3)) + pick(suf);
      if (!pool.has(u)) pool.set(u, { pk: String(pk++), username: u, full_name: rnd() < 0.85 ? f[0].toUpperCase() + f.slice(1) + ' ' + pick(last) : '', profile_pic_url: '', is_verified: false, is_private: rnd() < 0.3 });
    }
    const users = [...pool.values()];
    const brands = [['natgeo.id', 'National Geo Indonesia'], ['musisi.favorit', 'Musisi Favorit'], ['brand.sepatu', 'Brand Sepatu Official'], ['klub.bola', 'Klub Bola']]
      .map(([u, n]) => ({ pk: String(pk++), username: u, full_name: n, profile_pic_url: '', is_verified: true, is_private: false }));
    const following = users.slice(0, 160).concat(users.slice(160, 196), brands, users.slice(290, 292));
    const followers = users.slice(0, 160).concat(users.slice(196, 290));
    const lost = users.slice(290, 296); // dulu follow, sekarang tidak
    const prevF = followers.filter((_, i) => i % 19 !== 0).concat(lost).map((u) => u.pk + ':' + u.username);

    const page = (list, qs) => {
      const start = Number(qs.get('max_id') || 0);
      const size = Number(qs.get('count') || 50);
      const next = start + size < list.length ? String(start + size) : null;
      return { users: list.slice(start, start + size), next_max_id: next, status: 'ok' };
    };
    return {
      uid: '1',
      speed: 0.12,
      storage: { 'cekunfollow:snap:1': { date: Date.now() - 9 * 86400000, f: prevF } },
      api(path) {
        const url = new URL(path, 'https://x.invalid');
        if (url.pathname.includes('/current_user/')) return { user: { pk: '1', username: 'kamu.demo', full_name: 'Kamu', profile_pic_url: '' }, status: 'ok' };
        if (url.pathname.includes('/web_profile_info/')) return { data: { user: { edge_followed_by: { count: followers.length }, edge_follow: { count: following.length } } }, status: 'ok' };
        if (url.pathname.endsWith('/following/')) return page(following, url.searchParams);
        if (url.pathname.endsWith('/followers/')) return page(followers, url.searchParams);
        return { status: 'ok' };
      },
    };
  }

  function parsePaste(text) {
    const m = new Map();
    text.split(/[\n,;\t]+/).forEach((line) => {
      const token = line.trim().split(/\s+/)[0];
      const u = clean(token);
      if (u && !m.has(u)) m.set(u, 0);
    });
    return m;
  }

  $('#pasteBtn').addEventListener('click', () => {
    hideError();
    const acc = newAcc();
    acc.followers = parsePaste($('#pasteFollowers').value);
    acc.following = parsePaste($('#pasteFollowing').value);
    if (!acc.followers.size || !acc.following.size) {
      showError('Isi kedua kolom: daftar pengikut dan daftar akun yang kamu ikuti.');
      return;
    }
    showResult(analyze(acc));
  });

  $('#demoBtn').addEventListener('click', () => {
    const { acc, demoHistory } = makeDemo();
    showResult(analyze(acc, { demo: true, demoHistory }));
  });

  $('#resetBtn').addEventListener('click', () => {
    $('#resultView').hidden = true;
    $('#uploadView').hidden = false;
    $('#resetBtn').hidden = true;
    state.data = null;
    scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------------- UI: result view ---------------- */
  const TABS = [
    { id: 'notBack', label: 'Tidak follow balik' },
    { id: 'unfollowers', label: 'Berhenti mengikuti' },
    { id: 'fans', label: 'Belum kamu follow balik' },
    { id: 'mutual', label: 'Mutual' },
    { id: 'following', label: 'Mengikuti' },
    { id: 'followers', label: 'Pengikut' },
    { id: 'pending', label: 'Permintaan tertunda' },
  ];

  const EMPTY = {
    notBack: ['Semua akun mengikuti balik', 'Setiap akun yang kamu ikuti juga mengikuti kamu.'],
    unfollowers: ['Tidak ada yang berhenti mengikuti', 'Semua pengikut dari pemeriksaan sebelumnya masih mengikuti.'],
    fans: ['Semua pengikut sudah diikuti balik', 'Tidak ada pengikut yang belum kamu ikuti.'],
    mutual: ['Belum ada akun mutual', 'Belum ada akun yang saling mengikuti dengan kamu.'],
    following: ['Tidak ada data', 'Tidak ada akun yang kamu ikuti.'],
    followers: ['Tidak ada data', 'Tidak ada data pengikut.'],
    pending: ['Tidak ada data', 'Tidak ada permintaan follow yang tertunda.'],
    search: ['Tidak ditemukan', 'Tidak ada username yang cocok dengan pencarian.'],
    ignoredOnly: ['Semua akun disembunyikan', 'Semua akun di daftar ini sudah kamu abaikan.'],
  };

  const PAGE = 60;
  const state = {
    data: null, tab: 'notBack', q: '', sort: 'new', showIgnored: false,
    items: [], rendered: 0,
    ignored: new Set(store.get('cu:ignored', [])),
  };

  function showResult(data) {
    state.data = data;
    state.q = '';
    $('#searchInput').value = '';
    state.tab = data.lists.unfollowers && data.lists.unfollowers.length ? 'unfollowers' : 'notBack';

    $('#uploadView').hidden = true;
    const rv = $('#resultView');
    rv.hidden = false;
    rv.style.animation = 'none'; void rv.offsetWidth; rv.style.animation = '';
    $('#resetBtn').hidden = false;
    scrollTo({ top: 0 });

    renderHead();
    renderChanges();
    renderOverview();
    renderTabs();
    renderList();
  }

  function renderHead() {
    const d = state.data;
    $('#resultEyebrow').textContent = d.demo ? 'Data contoh' : 'Hasil analisis';
    $('#resultTitle').textContent = d.owner ? `@${d.owner}` : 'Ringkasan akun';
    const meta = [];
    if (d.exportDate) meta.push(`Data ekspor ${fmtDateMs(Date.parse(d.exportDate))}`);
    meta.push(`Diperiksa ${fmtDateMs(Date.now())}`);
    $('#resultMeta').textContent = meta.join(' · ');
  }

  function renderChanges() {
    const d = state.data;
    const box = $('#changes');
    if (d.prev) {
      const un = d.lists.unfollowers, nf = d.newFollowers;
      const when = fmtDateMs(d.prev.date);
      const tone = un.length ? 'alert-amber' : 'ok';
      const title = un.length
        ? `${fmtNum(un.length)} akun berhenti mengikuti kamu`
        : 'Tidak ada akun yang berhenti mengikuti';
      const sub = `Dibandingkan dengan pemeriksaan ${when}` + (nf.length ? ` · ${fmtNum(nf.length)} pengikut baru` : '');
      box.innerHTML = `
        <div class="card changes ${tone}">
          <span class="changes-icon">${un.length ? ICON.trendDown : ICON.check}</span>
          <div class="changes-body"><strong>${title}</strong><span>${esc(sub)}</span></div>
          <div class="changes-actions">
            ${un.length ? `<span class="avatar-stack">${un.slice(0, 4).map((x) => avatar(x.u)).join('')}</span>
            <button class="btn ghost sm" data-goto="unfollowers">Lihat</button>` : ''}
          </div>
        </div>`;
    } else if (d.demo) {
      box.innerHTML = '';
    } else {
      box.innerHTML = `
        <div class="card changes info">
          <span class="changes-icon">${ICON.info}</span>
          <div class="changes-body">
            <strong>Pemeriksaan pertama</strong>
            <span>Hasil ini disimpan di browser. Unggah data yang lebih baru di lain waktu untuk melihat akun yang berhenti mengikuti.</span>
          </div>
        </div>`;
    }
    $$('[data-goto]', box).forEach(bindGoto);
  }

  function renderOverview() {
    const d = state.data, L = d.lists;
    const pct = d.following.size ? Math.round((L.mutual.length / d.following.size) * 100) : 0;

    const cells = [
      { id: 'following', label: 'Mengikuti', n: d.following.size },
      { id: 'followers', label: 'Pengikut', n: d.followers.size },
      { id: 'mutual', label: 'Mutual', n: L.mutual.length, tone: 'green' },
      { id: 'notBack', label: 'Tidak follow balik', n: L.notBack.length, tone: 'red' },
      { id: 'fans', label: 'Belum kamu follow balik', n: L.fans.length, tone: 'blue' },
    ];
    if (L.unfollowers) cells.push({ id: 'unfollowers', label: 'Berhenti mengikuti', n: L.unfollowers.length, tone: 'amber' });

    const stats = $('#stats');
    stats.innerHTML = `
      <div class="kpi-grid" style="--n:${cells.length}">
        ${cells.map((c) => `
          <button class="kpi" data-goto="${c.id}">
            <span class="kpi-label">${c.tone ? `<i class="dot ${c.tone}"></i>` : ''}${c.label}</span>
            <span class="kpi-num">${fmtNum(c.n)}</span>
          </button>`).join('')}
      </div>
      <div class="ratio">
        <div class="ratio-head"><span class="ratio-label">Rasio follow balik</span><strong>${pct}%</strong></div>
        <div class="ratio-bar"><span style="width:${pct}%"></span></div>
        <p class="ratio-desc">${fmtNum(L.mutual.length)} dari ${fmtNum(d.following.size)} akun yang kamu ikuti mengikuti balik</p>
      </div>`;
    $$('.kpi', stats).forEach(bindGoto);
  }

  function bindGoto(el) {
    el.addEventListener('click', () => {
      setTab(el.dataset.goto);
      $('.list-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function availableTabs() {
    const L = state.data.lists;
    return TABS.filter((t) => L[t.id]);
  }

  function renderTabs() {
    const L = state.data.lists;
    $('#tabs').innerHTML = availableTabs().map((t) => `
      <button class="tab ${t.id === state.tab ? 'active' : ''}" role="tab" data-tab="${t.id}" aria-selected="${t.id === state.tab}">
        ${t.label}<span class="count">${fmtNum(L[t.id].length)}</span>
      </button>`).join('');
    $$('.tab').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
    $$('.kpi').forEach((s) => s.classList.toggle('active', s.dataset.goto === state.tab));
  }

  function setTab(id) {
    if (!state.data.lists[id]) return;
    state.tab = id;
    renderTabs();
    $('.tab.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    renderList();
  }

  function currentItems() {
    const d = state.data;
    let items = d.lists[state.tab].slice();
    const q = state.q.trim().toLowerCase().replace(/^@/, '');
    if (q) items = items.filter((x) => x.u.includes(q));
    if (state.tab === 'notBack' && !state.showIgnored) items = items.filter((x) => !state.ignored.has(x.u));

    const byName = (a, b) => a.u.localeCompare(b.u);
    if (state.sort === 'az') items.sort(byName);
    else if (state.sort === 'za') items.sort((a, b) => byName(b, a));
    else {
      const dir = state.sort === 'new' ? -1 : 1;
      items.sort((a, b) => {
        if (!a.ts && !b.ts) return byName(a, b);
        if (!a.ts) return 1;
        if (!b.ts) return -1;
        return dir * (a.ts - b.ts);
      });
    }
    return items;
  }

  function subText(x) {
    const d = state.data, date = fmtDate(x.ts);
    switch (state.tab) {
      case 'notBack': return date ? `Kamu ikuti sejak ${date}` : 'Kamu ikuti, belum follow balik';
      case 'fans': return date ? `Mengikutimu sejak ${date}` : 'Mengikutimu';
      case 'mutual': return date ? `Mutual sejak ${date}` : 'Saling mengikuti';
      case 'unfollowers': return d.prev ? `Masih mengikutimu per ${fmtDateMs(d.prev.date)}` : 'Berhenti mengikutimu';
      case 'following': return date ? `Diikuti sejak ${date}` : 'Kamu ikuti';
      case 'followers': return date ? `Mengikutimu sejak ${date}` : 'Pengikut';
      case 'pending': return date ? `Diminta ${date}` : 'Menunggu persetujuan';
      default: return '';
    }
  }

  function badgeFor(u) {
    const d = state.data;
    const iFollow = d.following.has(u), followsMe = d.followers.has(u);
    switch (state.tab) {
      case 'following': return followsMe ? '<span class="badge green">Mutual</span>' : '<span class="badge rose">Tidak follow balik</span>';
      case 'followers': return iFollow ? '<span class="badge green">Mutual</span>' : '<span class="badge indigo">Belum kamu follow</span>';
      case 'unfollowers': return iFollow ? '<span class="badge rose">Masih kamu ikuti</span>' : '';
      default: return '';
    }
  }

  function rowHtml(x) {
    const ignorable = state.tab === 'notBack';
    const isIgn = state.ignored.has(x.u);
    return `
      <li class="row ${ignorable && isIgn ? 'ignored' : ''}" data-u="${esc(x.u)}">
        ${avatar(x.u)}
        <div class="row-main">
          <a class="uname" href="${profileUrl(x.u)}" target="_blank" rel="noopener noreferrer">@${esc(x.u)}</a>
          <span class="sub">${esc(subText(x))}</span>
        </div>
        ${badgeFor(x.u)}
        <div class="row-actions">
          ${ignorable ? `<button class="row-btn ${isIgn ? 'on' : ''}" data-ignore title="${isIgn ? 'Tampilkan lagi' : 'Abaikan (mis. akun artis/brand)'}" aria-label="${isIgn ? 'Batal abaikan' : 'Abaikan'} @${esc(x.u)}">${isIgn ? ICON.eye : ICON.eyeOff}</button>` : ''}
          <a class="row-btn" href="${profileUrl(x.u)}" target="_blank" rel="noopener noreferrer" title="Buka profil" aria-label="Buka profil @${esc(x.u)}">${ICON.external}</a>
        </div>
      </li>`;
  }

  function renderList() {
    state.items = currentItems();
    state.rendered = 0;
    const list = $('#list');
    list.innerHTML = '';
    renderMeta();

    const empty = $('#empty');
    if (!state.items.length) {
      const all = state.data.lists[state.tab];
      const key = state.q ? 'search' : (state.tab === 'notBack' && all.length ? 'ignoredOnly' : state.tab);
      const [t, s] = EMPTY[key];
      empty.innerHTML = `<div class="empty-icon">${key === 'search' ? ICON.search : ICON.inbox}</div><strong>${t}</strong><span>${s}</span>`;
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    appendMore();
  }

  function appendMore() {
    if (state.rendered >= state.items.length) return;
    const next = state.items.slice(state.rendered, state.rendered + PAGE);
    $('#list').insertAdjacentHTML('beforeend', next.map(rowHtml).join(''));
    state.rendered += next.length;
  }

  function renderMeta() {
    const meta = $('#listMeta');
    const parts = [];
    const total = state.items.length;
    parts.push(`<span>${fmtNum(total)} akun${state.q ? ` cocok dengan “${esc(state.q)}”` : ''}</span>`);
    if (state.tab === 'notBack') {
      const ign = state.data.lists.notBack.filter((x) => state.ignored.has(x.u)).length;
      if (ign) parts.push(`<span>· ${fmtNum(ign)} diabaikan</span><button class="link-btn" id="toggleIgnored">${state.showIgnored ? 'Sembunyikan' : 'Tampilkan'}</button>`);
      else parts.push('<span>· Tips: klik ikon mata untuk mengabaikan akun artis/brand</span>');
    }
    meta.innerHTML = parts.join('');
    $('#toggleIgnored')?.addEventListener('click', () => { state.showIgnored = !state.showIgnored; renderList(); });
  }

  // Infinite scroll
  new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && state.data) appendMore();
  }, { rootMargin: '600px' }).observe($('#sentinel'));

  // Abaikan / batal abaikan
  $('#list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ignore]');
    if (!btn) return;
    const row = btn.closest('.row');
    const u = row.dataset.u;
    const nowIgnored = !state.ignored.has(u);
    if (nowIgnored) state.ignored.add(u); else state.ignored.delete(u);
    store.set('cu:ignored', [...state.ignored]);
    toast(nowIgnored ? `@${u} diabaikan` : `@${u} ditampilkan lagi`);

    if (nowIgnored && !state.showIgnored) {
      // Hapus baris tanpa render ulang supaya posisi scroll tidak lompat
      const idx = state.items.findIndex((x) => x.u === u);
      if (idx > -1) { state.items.splice(idx, 1); state.rendered = Math.max(0, state.rendered - 1); }
      row.remove();
      appendMore();
      renderMeta();
      if (!state.items.length) renderList();
    } else {
      row.outerHTML = rowHtml(state.items.find((x) => x.u === u) || { u, ts: 0 });
      renderMeta();
    }
  });

  let searchTimer;
  $('#searchInput').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { state.q = e.target.value; renderList(); }, 120);
  });
  $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; renderList(); });

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove();
      return ok;
    }
  }

  $('#copyBtn').addEventListener('click', async () => {
    if (!state.items.length) return toast('Daftar kosong');
    const ok = await copyText(state.items.map((x) => x.u).join('\n'));
    toast(ok ? `${fmtNum(state.items.length)} username disalin` : 'Gagal menyalin');
  });

  $('#csvBtn').addEventListener('click', () => {
    if (!state.items.length) return toast('Daftar kosong');
    const rows = [['username', 'profil', 'tanggal']].concat(
      state.items.map((x) => [x.u, profileUrl(x.u), x.ts ? new Date(x.ts * 1000).toISOString().slice(0, 10) : ''])
    );
    const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `cek-unfollow-${state.tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('CSV diunduh');
  });

  if (location.hash === '#demo') $('#demoBtn').click();
  if (location.hash === '#preview') $('#previewBtn').click();

  /* ---------------- Data contoh ---------------- */
  function makeDemo() {
    const first = ['raka', 'nadia', 'dimas', 'putri', 'bayu', 'sekar', 'fajar', 'ayu', 'rizky', 'salsa', 'arif', 'intan', 'yoga', 'tiara', 'hana', 'bima', 'citra', 'gilang', 'laras', 'naufal', 'kirana', 'reza', 'dinda', 'farhan', 'zahra', 'aldo', 'maya', 'kevin', 'nisa', 'dewi'];
    const suf = ['.id', '_', '.jpg', '99', '.ok', 'studio', '.art', 'x', '2001', '_photo', 'eats', '.travel', '.co', '_daily', 'pratama', '.kim', '_', '.wav'];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const pool = new Set();
    while (pool.size < 320) pool.add(pick(first) + (rnd() < .5 ? '.' : '') + pick(first).slice(0, 3 + Math.floor(rnd() * 3)) + pick(suf));
    const names = [...pool];
    const now = Math.floor(Date.now() / 1000);
    const ts = () => now - Math.floor(rnd() * 86400 * 900);

    const acc = newAcc();
    acc.owner = 'kamu.demo';
    names.slice(0, 150).forEach((u) => { acc.following.set(u, ts()); acc.followers.set(u, ts()); }); // mutual
    names.slice(150, 192).forEach((u) => acc.following.set(u, ts()));                                 // tidak follow balik
    names.slice(192, 300).forEach((u) => acc.followers.set(u, ts()));                                 // fans
    names.slice(300, 303).forEach((u) => acc.pending.set(u, ts()));
    ['brand.official', 'artis.favorit', 'natgeo.id'].forEach((u) => acc.following.set(u, ts()));

    const lost = names.slice(303, 309); // pernah follow, sekarang unfollow
    lost.slice(0, 2).forEach((u) => acc.following.set(u, ts()));
    const prevFollowers = [...acc.followers.keys()].filter((_, i) => i % 23 !== 0).concat(lost).sort();
    const demoHistory = [{ date: Date.now() - 14 * 86400000, followers: prevFollowers, following: [...acc.following.keys()].sort() }];
    return { acc, demoHistory };
  }
})();
