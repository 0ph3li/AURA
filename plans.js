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

  /* ---------------------------------------------
     0b. Ambient 3D wireframe orb, behind the hero
  --------------------------------------------- */
  const plansOrbCanvas = document.getElementById('plansOrbCanvas');
  if (plansOrbCanvas && window.AuraWireOrb) {
    window.AuraWireOrb(plansOrbCanvas, {
      count: 65,
      radius: 0.48,
      colors: ['255,122,156', '123,110,246'],
      speed: 0.0002,
      interactive: false,
      tiltX: 0.24
    });
  }

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
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${py * -5}deg) rotateY(${px * 6}deg) translateY(-2px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------
     1. Floating 3D plan stack — mouse parallax
  --------------------------------------------- */
  const stack = document.getElementById('plan3dStack');
  if (stack) {
    const cards = Array.from(stack.querySelectorAll('.plan3d-card'));
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
  }

  /* ---------------------------------------------
     2. Tabs — comparison categories
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
    document.querySelectorAll(`#panel-${target} .compare-table tbody tr`).forEach((row, i) => {
      row.style.transitionDelay = `${Math.min(i * 40, 300)}ms`;
      row.classList.add('in');
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
     3. Comparison table reveal (first visible tab)
  --------------------------------------------- */
  const compareObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        compareObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.compare-table tbody tr').forEach((row, i) => {
    row.style.transitionDelay = `${Math.min(i * 40, 300)}ms`;
    compareObserver.observe(row);
  });

});
