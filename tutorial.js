(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Tema (sama dengan halaman utama) ---------- */
  const root = document.documentElement;
  try { const t = JSON.parse(localStorage.getItem('cu:theme')); if (t) root.dataset.theme = t; } catch (e) { /* abaikan */ }
  $('#themeBtn').addEventListener('click', () => {
    const cur = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('cu:theme', JSON.stringify(next)); } catch (e) { /* abaikan */ }
  });

  /* ---------- Toast ---------- */
  let timer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  /* ---------- Bookmarklet ---------- */
  const bm = typeof window.cekUnfollowBookmarklet === 'function' ? window.cekUnfollowBookmarklet() : null;
  const link = $('#bookmarklet');
  if (link) {
    if (bm) link.href = bm.url;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      toast('Seret tombol ini ke bookmark bar, lalu klik dari sana saat di instagram.com');
    });
  }
  $$('.copy-bm').forEach((b) => b.addEventListener('click', async () => {
    if (!bm) return toast('Kode belum siap. Muat ulang halaman.');
    const ok = await copyText(bm.url);
    toast(ok ? 'Kode disalin. Lanjutkan ke langkah berikutnya' : 'Gagal menyalin');
  }));

  /* ---------- Tab perangkat ---------- */
  const TABS = ['komputer', 'android', 'iphone', 'file', 'faq'];
  const UA = navigator.userAgent;
  const IS_IOS = /iPhone|iPad|iPod/i.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const IS_ANDROID = /Android/i.test(UA);

  function select(id) {
    if (!TABS.includes(id)) return;
    $$('.doc-tab').forEach((a) => {
      const on = a.dataset.tab === id;
      a.classList.toggle('active', on);
      a.setAttribute('aria-selected', on);
    });
    $$('.doc-section').forEach((s) => { s.hidden = s.dataset.sec !== id; });
    const active = $('.doc-tab.active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  $$('.doc-tab').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.dataset.tab;
    history.replaceState(null, '', '#' + id);
    select(id);
  }));
  // Tautan internal ke bagian lain (mis. "#file" di Tanya jawab)
  $$('.doc-section a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    if (!TABS.includes(id)) return;
    e.preventDefault();
    history.replaceState(null, '', '#' + id);
    select(id);
    scrollTo({ top: 0, behavior: 'smooth' });
  }));
  addEventListener('hashchange', () => select(location.hash.slice(1)));

  const fromHash = location.hash.slice(1);
  select(TABS.includes(fromHash) ? fromHash : IS_IOS ? 'iphone' : IS_ANDROID ? 'android' : 'komputer');
})();
