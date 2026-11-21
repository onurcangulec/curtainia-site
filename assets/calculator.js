/* Curtainia — curtain fabric calculator (curtain-calculator.html)
   The arithmetic is the quote engine's, so the figure here matches the quote:
     fabric (m) = track (m) × fullness + 0.20 m × panels      (10 + 10 cm side hems per panel)
     a pair splits the fullness, it does not double it.
   Every cloth is woven 290–360 cm wide and made up railroaded (turned on its side),
   so the width never needs a vertical seam; the only limit is the drop, which may not
   exceed the cloth's "longest seamless drop" (roll width − 20 cm).
   Fabric data: assets/fabrics.js (window.CURTAINIA_FABRICS), generated from the cloth pages.
   CSP: no inline script on this site — keep everything in this file. */
(function () {
  'use strict';

  var IN = 2.54, YD = 0.9144, SIDE = 0.20;   /* m per panel */
  var WA = '905323934416';

  var HEADINGS = [
    { k: 'double-pinch', n: 'Double pinch pleat', f: 2.0, m: 'track', d: 'Two folds per pleat. The everyday tailored heading.' },
    { k: 'triple-pinch', n: 'Triple pinch pleat', f: 2.5, m: 'track', d: 'Three folds per pleat. The fullest, most formal.' },
    { k: 'inverted-box', n: 'Inverted box pleat', f: 2.0, m: 'track', d: 'The fold turned to the back. Flat and architectural.' },
    { k: 'pencil-pleat', n: 'Pencil pleat', f: 2.0, m: 'track', d: 'Gathered tape heading, the classic British heading.' },
    { k: 'ripple-fold', n: 'Ripple fold', f: 2.0, m: 'track', d: 'A continuous S-wave on a ripple-fold track.' },
    { k: 'grommet', n: 'Grommet / eyelet', f: 1.8, m: 'pole', d: 'Rings through the cloth, straight onto the pole.' },
    { k: 'rod-pocket', n: 'Rod pocket', f: 2.0, m: 'pole', d: 'A sewn channel the pole slides through.' },
    { k: 'tab-top', n: 'Tab top', f: 1.8, m: 'pole', d: 'Fabric loops over the pole. Relaxed and casual.' },
    { k: 'flat-panel', n: 'Flat panel', f: 1.0, m: 'track', d: 'No gather at all. For a sheer meant to read as a plane.' }
  ];
  var FULL = [1.0, 1.5, 1.8, 2.0, 2.5, 3.0];

  var FAB = (window.CURTAINIA_FABRICS || []).slice().sort(function (a, b) { return a.n < b.n ? -1 : 1; });

  /* ---------- GA4: only after consent, same rule as site.js ---------- */
  function track(name, params) {
    try {
      if (localStorage.getItem('curtainia_cookies') !== 'accepted') return;
      window.dataLayer = window.dataLayer || [];
      /* gtag.js only reads the arguments object, not a plain array */
      var g = function () { window.dataLayer.push(arguments); };
      g('event', name, params || {});
    } catch (e) {}
  }

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function r1(n) { return (Math.round(n * 10) / 10).toFixed(1); }
  function r2(n) { return (Math.round(n * 100) / 100).toFixed(2); }
  function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function heading(k) { for (var i = 0; i < HEADINGS.length; i++) if (HEADINGS[i].k === k) return HEADINGS[i]; return HEADINGS[0]; }
  function fabric(s) { for (var i = 0; i < FAB.length; i++) if (FAB[i].s === s) return FAB[i]; return null; }

  /* ---------- pure calculation (cm in, metres out) ---------- */
  function calc(st) {
    var trackM = st.width / 100, panels = st.panels;
    var r = { ok: st.width > 0 && st.drop > 0 };
    r.flatM = trackM * st.full;                 /* cloth across the window */
    r.metres = r.flatM + SIDE * panels;          /* what is cut from the roll */
    r.perPanelTrack = st.width / panels;
    var cloth = st.cloth ? fabric(st.cloth) : null;
    r.cloth = cloth;
    if (cloth) {
      r.fits = st.drop <= cloth.d;
      r.price = r.metres * cloth.p;
    } else {
      var pool = FAB.filter(function (f) { return (!st.type || f.t === st.type) && f.d >= st.drop; });
      r.poolN = pool.length;
      r.poolAll = FAB.filter(function (f) { return !st.type || f.t === st.type; }).length;
      if (pool.length) {
        var ps = pool.map(function (f) { return f.p; });
        r.min = r.metres * Math.min.apply(null, ps);
        r.max = r.metres * Math.max.apply(null, ps);
      }
    }
    return r;
  }

  function dim(cm, unit) {
    return unit === 'in' ? Math.round(cm / IN) + ' in <small>(' + Math.round(cm) + ' cm)</small>'
                         : Math.round(cm) + ' cm <small>(' + Math.round(cm / IN) + ' in)</small>';
  }
  function plainDim(cm, unit) {
    return unit === 'in' ? Math.round(cm / IN) + ' in (' + Math.round(cm) + ' cm)' : Math.round(cm) + ' cm (' + Math.round(cm / IN) + ' in)';
  }

  function init() {
    var root = $('#calc');
    if (!root) return;

    var st = { head: 'double-pinch', panels: 2, unit: 'in', width: 0, drop: 0, full: 2.0, fullTouched: false, type: '', cloth: '' };

    /* heading cards */
    var heads = $('#cHeads', root);
    heads.innerHTML = HEADINGS.map(function (h) {
      return '<button type="button" class="c-head" role="radio" aria-checked="false" data-k="' + h.k + '">' +
        '<span class="c-hf">' + h.f.toFixed(1) + '×</span><span class="c-hn">' + esc(h.n) + '</span>' +
        '<span class="c-hd">' + esc(h.d) + '</span></button>';
    }).join('');

    /* fullness options */
    var fullSel = $('#cFull', root);
    fullSel.innerHTML = FULL.map(function (f) {
      var lab = { 1: 'flat', 1.5: 'light', 1.8: 'relaxed', 2: 'standard', 2.5: 'full', 3: 'luxury' }[f];
      return '<option value="' + f + '">' + f.toFixed(1) + '× — ' + lab + '</option>';
    }).join('');

    /* cloth list */
    var clothSel = $('#cCloth', root);
    function fillCloth() {
      var keep = clothSel.value;
      var groups = [['S', 'Sheers'], ['D', 'Drapes']];
      var h = '<option value="">Not chosen yet — show the range</option>';
      groups.forEach(function (g) {
        if (st.type && st.type !== g[0]) return;
        h += '<optgroup label="' + g[1] + '">' + FAB.filter(function (f) { return f.t === g[0]; }).map(function (f) {
          return '<option value="' + f.s + '">' + esc(f.n) + ' — ' + Math.round(f.w) + ' cm wide, $' + f.p.toFixed(2) + '/m</option>';
        }).join('') + '</optgroup>';
      });
      clothSel.innerHTML = h;
      if (keep && fabric(keep) && (!st.type || fabric(keep).t === st.type)) clothSel.value = keep;
      st.cloth = clothSel.value;
    }
    fillCloth();

    var img = $('#cImg', root), cap = $('#cCap', root), out = $('#cOut', root);
    var wIn = $('#cWidth', root), dIn = $('#cDrop', root);
    var ctaForm = $('#cQuote', root), ctaWa = $('#cWa', root);
    var wLab = $('#cWidthLbl', root), dLab = $('#cDropLbl', root), mountTxt = $('#cMount', root);
    var reported = false;

    function setHead(k) {
      st.head = k;
      var h = heading(k);
      $$('.c-head', heads).forEach(function (b) {
        var on = b.getAttribute('data-k') === k;
        b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
      });
      img.src = 'assets/heading/' + k + '.svg';
      img.alt = h.n + ': where to measure the width and the drop';
      cap.textContent = h.n + ' · ' + h.f.toFixed(1) + '× fullness · measure the drop from the ' +
        (h.m === 'track' ? 'top of the track' : 'top of the pole');
      if (!st.fullTouched) { st.full = h.f; fullSel.value = String(h.f); }
      mountTxt.textContent = h.m === 'track' ? 'track' : 'pole';
      draw();
    }

    function readInputs() {
      var k = st.unit === 'in' ? IN : 1;
      st.width = Math.max(0, parseFloat(wIn.value) || 0) * k;
      st.drop = Math.max(0, parseFloat(dIn.value) || 0) * k;
      st.full = parseFloat(fullSel.value) || 2;
      st.cloth = clothSel.value;
    }

    function setUnit(u) {
      readInputs();
      st.unit = u;
      var k = u === 'in' ? IN : 1;
      if (st.width) wIn.value = Math.round(st.width / k);
      if (st.drop) dIn.value = Math.round(st.drop / k);
      wLab.textContent = 'Width (' + u + ')';
      dLab.textContent = 'Drop (' + u + ')';
      wIn.placeholder = u === 'in' ? 'e.g. 96' : 'e.g. 244';
      dIn.placeholder = u === 'in' ? 'e.g. 96' : 'e.g. 244';
      $$('[data-unit]', root).forEach(function (b) { var on = b.getAttribute('data-unit') === u; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      draw();
    }

    function summary(r) {
      var h = heading(st.head), L = [];
      L.push('Heading: ' + h.n + ' at ' + st.full.toFixed(1) + '× fullness');
      L.push((st.panels === 2 ? 'A pair' : 'One panel') + ' on a ' + plainDim(st.width, st.unit) + ' ' + (h.m === 'track' ? 'track' : 'pole'));
      L.push('Drop: ' + plainDim(st.drop, st.unit));
      if (r.cloth) L.push('Cloth: ' + r.cloth.n);
      L.push('Calculator: ' + r2(r.metres) + ' m (' + r2(r.metres / YD) + ' yd) of cloth');
      if (r.cloth) L.push('Estimate: about ' + money(r.price) + ' delivered duty paid to the USA');
      return L;
    }

    function draw() {
      readInputs();
      var r = calc(st), u = st.unit, h = heading(st.head);
      if (!r.ok) {
        out.innerHTML = '<p class="c-empty">Enter the width of your ' + (h.m === 'track' ? 'track' : 'pole') +
          ' and the drop, and the figures appear here.</p>';
        ctaForm.setAttribute('href', 'contact.html');
        ctaWa.setAttribute('href', 'https://wa.me/' + WA);
        return;
      }
      var x = '';
      x += '<div class="c-row"><span>Cloth across the window</span><b>' + dim(r.flatM * 100, u) + '</b></div>';
      x += '<div class="c-row"><span>' + (st.panels === 2 ? 'Each panel covers' : 'The panel covers') + '</span><b>' + dim(r.perPanelTrack, u) + ' of ' + (h.m === 'track' ? 'track' : 'pole') + '</b></div>';
      x += '<div class="c-row big"><span>Cloth we cut</span><b>' + r2(r.metres / YD) + ' yd <small>(' + r2(r.metres) + ' m)</small></b></div>';

      if (r.cloth) {
        x += r.fits
          ? '<p class="c-ok">One piece, no vertical seams: ' + esc(r.cloth.n) + ' takes a drop of up to ' + dim(r.cloth.d, u) + '.</p>'
          : '<p class="c-warn">This drop is taller than ' + esc(r.cloth.n) + ' can be made in one piece (' + dim(r.cloth.d, u) + '). ' +
            'Choose a wider cloth, or we will talk you through a horizontal join before anything is cut.</p>';
        x += '<div class="c-price"><span>Estimate, ' + esc(r.cloth.n) + '</span><b>' + money(r.price) + '</b>' +
             '<small>' + r.cloth.p.toFixed(2) + ' $/m × ' + r2(r.metres) + ' m · made up and delivered duty paid to the USA</small></div>';
      } else if (r.poolN) {
        x += '<p class="c-ok">' + r.poolN + ' of our ' + r.poolAll + ' ' + (st.type === 'S' ? 'sheers' : st.type === 'D' ? 'drapes' : 'cloths') +
             ' make this drop in one piece, with no vertical seams.</p>';
        x += '<div class="c-price"><span>Estimate, depending on the cloth</span><b>' + money(r.min) + ' – ' + money(r.max) + '</b>' +
             '<small>Made up and delivered duty paid to the USA. Pick a cloth above for its own figure.</small></div>';
      } else {
        x += '<p class="c-warn">None of our ' + (st.type === 'S' ? 'sheers' : st.type === 'D' ? 'drapes' : 'cloths') +
             ' reaches this drop in one piece. Send us the figures: a horizontal join, placed where it is least visible, is usually the answer.</p>';
      }
      x += '<p class="c-note">An estimate from our published per-metre prices — your written quote is the final price. ' +
           'Lining, if you want it, is not included here. For the UK, the EU and elsewhere we confirm the delivered price in the quote.</p>';
      out.innerHTML = x;

      var L = summary(r);
      var olcu = plainDim(st.width, u) + ' x ' + plainDim(st.drop, u);
      ctaForm.setAttribute('href', 'contact.html?olcu=' + encodeURIComponent(olcu) + '&mesaj=' + encodeURIComponent(L.join('\n') + '\n\n'));
      ctaWa.setAttribute('href', 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello Curtainia, I used the curtain calculator.\n\n' + L.join('\n') + '\n\nCould you send me a quote?'));

      if (!reported) { reported = true; track('calculator_result', { heading: st.head }); }
    }

    /* events */
    $$('.c-head', heads).forEach(function (b) {
      b.addEventListener('click', function () { setHead(b.getAttribute('data-k')); });
    });
    $$('[data-panels]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        st.panels = +b.getAttribute('data-panels');
        $$('[data-panels]', root).forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        draw();
      });
    });
    $$('[data-unit]', root).forEach(function (b) { b.addEventListener('click', function () { setUnit(b.getAttribute('data-unit')); }); });
    $$('[data-type]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        st.type = b.getAttribute('data-type');
        $$('[data-type]', root).forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        fillCloth(); draw();
      });
    });
    fullSel.addEventListener('change', function () { st.fullTouched = true; draw(); });
    [wIn, dIn].forEach(function (i) { i.addEventListener('input', draw); });
    clothSel.addEventListener('change', draw);
    ctaForm.addEventListener('click', function () { track('calculator_quote', { method: 'form' }); });
    ctaWa.addEventListener('click', function () { track('calculator_quote', { method: 'whatsapp' }); });

    /* deep link: curtain-calculator.html?heading=ripple-fold&cloth=cloth-oak.html */
    try {
      var q = new URLSearchParams(location.search);
      var qc = q.get('cloth'); if (qc && fabric(qc)) clothSel.value = qc;
      var qh = q.get('heading'); if (qh) st.head = heading(qh).k;
    } catch (e) {}

    setUnit('in');
    setHead(st.head);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
