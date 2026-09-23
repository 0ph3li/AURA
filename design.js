document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------
     0. Shared chrome — nav, progress bar, cursor,
     reveal-on-scroll, magnetic buttons, glass tilt.
  --------------------------------------------- */
  const nav = document.getElementById('siteNav');
  const progressFill = document.getElementById('progressFill');
  const cursorDot = document.getElementById('cursorDot');

  function updateChrome() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const p = docH > 0 ? window.scrollY / docH : 0;
    if (progressFill) progressFill.style.width = `${Math.min(Math.max(p, 0), 1) * 100}%`;
    if (nav) nav.classList.toggle('solid', window.scrollY > 30);
  }
  window.addEventListener('scroll', () => requestAnimationFrame(updateChrome), { passive: true });
  updateChrome();

  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');
  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navMobile.classList.toggle('open');
    });
    navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      navToggle.classList.remove('open');
      navMobile.classList.remove('open');
    }));
  }

  if (window.matchMedia('(hover: hover)').matches && cursorDot) {
    window.addEventListener('mousemove', (e) => {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top = e.clientY + 'px';
      cursorDot.classList.add('on');
    });
    document.addEventListener('mouseleave', () => cursorDot.classList.remove('on'));
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => cursorDot.classList.add('grow'));
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('grow'));
    });
  }

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));

  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) * 0.25;
        const my = (e.clientY - r.top - r.height / 2) * 0.25;
        el.style.transform = `translate(${mx}px, ${my}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
    document.querySelectorAll('.glass-spot').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------------------------------------------
     1. Floating layer stack — 3D mouse parallax
  --------------------------------------------- */
  const stack = document.getElementById('layerStack');
  if (stack) {
    const cards = Array.from(stack.querySelectorAll('.layer-card'));
    let curX = 0, curY = 0, targetX = 0, targetY = 0;

    stack.addEventListener('mousemove', (e) => {
      const r = stack.getBoundingClientRect();
      targetX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      targetY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    stack.addEventListener('mouseleave', () => { targetX = 0; targetY = 0; });

    function animateStack() {
      curX += (targetX - curX) * 0.08;
      curY += (targetY - curY) * 0.08;
      cards.forEach((card) => {
        const depth = parseFloat(card.dataset.depth);
        const baseX = parseFloat(card.dataset.x);
        const baseY = parseFloat(card.dataset.y);
        const rot = parseFloat(card.dataset.rot);
        const px = curX * 18 * depth;
        const py = curY * 14 * depth;
        card.style.transform = `translate(-50%,-50%) translate(${baseX + px}px, ${baseY + py}px) rotate(${rot + curX * 3 * depth}deg) translateZ(${depth * 40}px)`;
      });
      requestAnimationFrame(animateStack);
    }
    animateStack();

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const target = document.getElementById(card.dataset.target);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  /* ---------------------------------------------
     2. Type lab — live specimen
  --------------------------------------------- */
  const weightRange = document.getElementById('rangeWeight');
  const sizeRange = document.getElementById('rangeSize');
  const trackRange = document.getElementById('rangeTrack');
  const typePreview = document.getElementById('typePreview');
  const weightVal = document.getElementById('weightVal');
  const sizeVal = document.getElementById('sizeVal');
  const trackVal = document.getElementById('trackVal');
  const presets = document.querySelectorAll('.type-preset');

  function applyType() {
    if (!typePreview) return;
    const w = weightRange.value, s = sizeRange.value, t = trackRange.value;
    typePreview.style.fontWeight = w;
    typePreview.style.fontSize = s + 'px';
    typePreview.style.letterSpacing = t + 'px';
    weightVal.textContent = w;
    sizeVal.textContent = s + 'px';
    trackVal.textContent = t + 'px';
  }
  [weightRange, sizeRange, trackRange].forEach(r => r && r.addEventListener('input', applyType));
  if (typePreview) applyType();

  presets.forEach(btn => {
    btn.addEventListener('click', () => {
      presets.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      weightRange.value = btn.dataset.weight;
      sizeRange.value = btn.dataset.size;
      trackRange.value = btn.dataset.track;
      applyType();
    });
  });

  /* ---------------------------------------------
     3. Color mixer — interpolate across brand stops
  --------------------------------------------- */
  const colorRange = document.getElementById('colorRange');
  const mixerPreview = document.getElementById('mixerPreview');
  const mixerHex = document.getElementById('mixerHex');

  const stops = [
    [123, 110, 246], // violet
    [90, 169, 230],  // blue
    [255, 122, 156], // pink
    [255, 181, 107]  // amber
  ];

  function lerp(a, b, t) { return Math.round(a + (b - a) * t); }
  function toHex(n) { return n.toString(16).padStart(2, '0'); }

  function mixColor(pct) {
    const segments = stops.length - 1;
    const scaled = (pct / 100) * segments;
    const idx = Math.min(Math.floor(scaled), segments - 1);
    const t = scaled - idx;
    const a = stops[idx], b = stops[idx + 1];
    const r = lerp(a[0], b[0], t), g = lerp(a[1], b[1], t), bl = lerp(a[2], b[2], t);
    return { r, g, b: bl, hex: `#${toHex(r)}${toHex(g)}${toHex(bl)}` };
  }

  function applyColor() {
    if (!colorRange) return;
    const c = mixColor(parseFloat(colorRange.value));
    mixerPreview.style.background = `linear-gradient(135deg, rgb(${c.r},${c.g},${c.b}), rgba(${c.r},${c.g},${c.b},.55))`;
    mixerHex.textContent = c.hex.toUpperCase();
  }
  if (colorRange) {
    colorRange.addEventListener('input', applyColor);
    applyColor();
  }

  document.querySelectorAll('[data-copy]').forEach(el => {
    el.addEventListener('click', async () => {
      const text = el.dataset.copy === 'mixer' ? mixerHex.textContent : el.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        if (el.classList.contains('swatch')) {
          el.classList.add('copied');
          setTimeout(() => el.classList.remove('copied'), 1200);
        }
      } catch (e) { /* clipboard unavailable — silently ignore */ }
    });
  });

  /* ---------------------------------------------
     4. Space / grid demo
  --------------------------------------------- */
  const gridToggle = document.getElementById('gridToggle');
  const gridOverlay = document.getElementById('gridOverlay');
  const spaceRange = document.getElementById('spaceRange');
  const spaceCard = document.getElementById('spaceDemoCard');
  const spaceScaleVal = document.getElementById('spaceScaleVal');

  if (gridToggle) {
    gridToggle.addEventListener('click', () => {
      const on = gridToggle.getAttribute('aria-checked') !== 'true';
      gridToggle.setAttribute('aria-checked', String(on));
      gridOverlay.classList.toggle('on', on);
    });
  }
  if (spaceRange) {
    spaceRange.addEventListener('input', () => {
      const scale = parseFloat(spaceRange.value);
      const base = 8 * scale;
      spaceCard.style.padding = `${base * 2.5}px`;
      spaceCard.style.gap = `${base}px`;
      spaceScaleVal.textContent = `${scale.toFixed(1)}×`;
    });
  }

  /* ---------------------------------------------
     5. Motion lab — named easing curves
  --------------------------------------------- */
  const easings = {
    snap:   { css: 'cubic-bezier(.7,0,.3,1)',    curve: [0.7, 0, 0.3, 1] },
    glide:  { css: 'cubic-bezier(.22,.9,.3,1)',  curve: [0.22, 0.9, 0.3, 1] },
    bounce: { css: 'cubic-bezier(.34,1.56,.64,1)', curve: [0.34, 1.56, 0.64, 1] },
    linear: { css: 'linear', curve: [0, 0, 1, 1] }
  };
  const easingBtns = document.querySelectorAll('.easing-btn');
  const ball = document.getElementById('motionBall');
  const graphPath = document.getElementById('graphActivePath');
  const graphPoint = document.getElementById('graphActivePoint');
  const replayBtn = document.getElementById('motionReplay');
  let currentEasing = 'glide';

  function drawGraph(key) {
    const [x1, y1, x2, y2] = easings[key].curve;
    const w = 100, h = 100;
    const p0 = `10,90`;
    const p1 = `${10 + x1 * 80},${90 - y1 * 80}`;
    const p2 = `${10 + x2 * 80},${90 - y2 * 80}`;
    const p3 = `90,10`;
    if (graphPath) graphPath.setAttribute('d', `M${p0} C${p1} ${p2} ${p3}`);
  }

  function playBall() {
    if (!ball) return;
    const track = ball.parentElement;
    const distance = track.offsetWidth - ball.offsetWidth - 12;
    ball.style.transition = 'none';
    ball.style.left = '6px';
    requestAnimationFrame(() => {
      ball.style.transition = `left 1.1s ${easings[currentEasing].css}`;
      ball.style.left = distance + 'px';
    });
  }

  easingBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      easingBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentEasing = btn.dataset.easing;
      drawGraph(currentEasing);
      playBall();
    });
  });
  if (replayBtn) replayBtn.addEventListener('click', playBall);
  if (ball) {
    drawGraph(currentEasing);
    const motionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          playBall();
          motionObserver.disconnect();
        }
      });
    }, { threshold: 0.5 });
    motionObserver.observe(document.getElementById('motion'));
  }

  /* ---------------------------------------------
     6. Components tabs
  --------------------------------------------- */
  const tabBtns = document.querySelectorAll('.tab-btn');
  function activateTab(btn) {
    const target = btn.dataset.tab;
    tabBtns.forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.toggle('active', p.id === `panel-${target}`);
    });
  }
  tabBtns.forEach((btn, idx) => {
    btn.addEventListener('click', () => activateTab(btn));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = tabBtns[(idx + dir + tabBtns.length) % tabBtns.length];
        next.focus();
        activateTab(next);
      }
    });
  });

  /* ---------------------------------------------
     7. Component demo toggles (inside Inputs tab)
  --------------------------------------------- */
  document.querySelectorAll('.demo-toggle').forEach(sw => {
    sw.addEventListener('click', () => {
      const on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(on));
    });
  });

});
