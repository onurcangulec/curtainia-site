/* Curtainia — tüm sayfalarda çalışan ortak betik.
   1) Mobil menü
   2) Yüzen WhatsApp düğmesi
   3) Çerez onayı + Google Consent Mode v2 (ölçüm kimliği girilene kadar şerit çıkmaz)
   4) Teklif formu: gizli iframe'e POST, ziyaretçi sayfada kalır
   Perdenial'daki track.js mantığının sade karşılığı. */
(function () {
  'use strict';

  var WA = '905323934416';
  /* Curtainia'nın kendi GA4 ölçüm kimliği buraya yazılacak (örn. 'G-XXXXXXX').
     BOŞ kaldığı sürece: hiçbir çerez yazılmaz, Google'a hiçbir istek gitmez
     ve çerez şeridi de gösterilmez — onaylanacak bir şey yok. */
  var GTAG_ID = 'G-0H0X7M33XH';

  /* ---------- 1. mobil menü ---------- */
  function menu() {
    var b = document.querySelector('.burger'), n = document.querySelector('.nav');
    if (!b || !n) return;
    b.addEventListener('click', function () {
      var open = n.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---------- 2. yüzen WhatsApp ---------- */
  function whatsapp() {
    if (document.querySelector('.wa-float')) return;
    var a = document.createElement('a');
    a.className = 'wa-float';
    a.href = 'https://wa.me/' + WA + '?text=' +
      encodeURIComponent('Hello Curtainia, I would like a quote for made-to-measure curtains.');
    a.rel = 'noopener';
    a.target = '_blank';
    a.setAttribute('aria-label', 'Message Curtainia on WhatsApp');
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.16 8.16 0 0 1-1.26-4.36c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.21-8.24 8.21Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.1-.22-.17-.47-.29Z"/></svg>';
    document.body.appendChild(a);
  }

  /* ---------- 3. çerez onayı ---------- */
  var KEY = 'curtainia_cookies';
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  function loadGA() {
    if (!GTAG_ID) return;
    gtag('consent', 'update', {
      ad_storage: 'granted', ad_user_data: 'granted',
      ad_personalization: 'granted', analytics_storage: 'granted'
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GTAG_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GTAG_ID, { anonymize_ip: true });
  }

  function clearGA() {
    try {
      var host = location.hostname, parts = host.split('.');
      var scopes = ['', host, '.' + host];
      if (parts.length > 2) { var root = parts.slice(-2).join('.'); scopes.push(root, '.' + root); }
      var all = document.cookie ? document.cookie.split(';') : [];
      for (var i = 0; i < all.length; i++) {
        var name = all[i].split('=')[0].replace(/^\s+|\s+$/g, '');
        if (!/^(_ga(_|$)|_gcl_)/.test(name)) continue;
        for (var j = 0; j < scopes.length; j++) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' +
            (scopes[j] ? '; domain=' + scopes[j] : '');
        }
      }
    } catch (e) {}
  }

  function banner() {
    /* Ölçüm kimliği yoksa site hiç çerez yazmıyor — şerit göstermek yanıltıcı olur. */
    if (!GTAG_ID) return;
    if (read()) return;
    var box = document.createElement('div');
    box.className = 'crz';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'Cookie choice');
    box.innerHTML =
      '<p>We would like to use analytics cookies to see which pages help and which do not. ' +
      'They run only if you accept. <a href="legal.html#cookies">Details</a>.</p>' +
      '<div class="crz-b"><button type="button" class="no">Decline</button>' +
      '<button type="button" class="ok">Accept</button></div>';
    document.body.appendChild(box);
    requestAnimationFrame(function () {
      box.classList.add('open');
      document.body.classList.add('crz-open');
    });
    function close() { box.classList.remove('open'); document.body.classList.remove('crz-open');
      setTimeout(function () { box.remove(); }, 350); }
    box.querySelector('.ok').addEventListener('click', function () { write('accepted'); loadGA(); close(); });
    box.querySelector('.no').addEventListener('click', function () { write('declined'); clearGA(); close(); });
  }

  if (GTAG_ID) {
    gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
      analytics_storage: 'denied', functionality_storage: 'granted', security_storage: 'granted'
    });
    if (read() === 'accepted') loadGA(); else clearGA();
  }

  /* ---------- 4. teklif formu ---------- */
  function form() {
    var f = document.getElementById('quoteForm');
    if (!f) return;
    var note = document.getElementById('quoteNote');
    var ts = f.querySelector('[name="ts"]');
    if (ts) ts.value = String(Math.floor(Date.now() / 1000));
    f.addEventListener('submit', function () {
      if (note) note.textContent = 'Sending your enquiry…';
      setTimeout(function () {
        if (note) note.textContent =
          'Thank you — your enquiry is with us. We answer within one working day. ' +
          'If you have not heard back, write to info@curtainia.com and we will chase it.';
        f.reset();
        if (ts) ts.value = String(Math.floor(Date.now() / 1000));
      }, 1400);
    });
  }

  function init() { menu(); whatsapp(); banner(); form(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
