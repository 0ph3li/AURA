document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------
     0. Shared chrome — nav, progress bar, cursor,
     reveal-on-scroll, magnetic buttons, glass tilt.
     (self-contained rewrite for this page only)
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
    document.querySelectorAll('.tilt').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${py * -6}deg) rotateY(${px * 8}deg) translateY(-2px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------
     1. Particle field — canvas with mouse repulsion
  --------------------------------------------- */
  const canvas = document.getElementById('intelCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    const hero = canvas.closest('.intel-hero');
    let w, h, particles = [];
    let mx = -9999, my = -9999;

    function resize() {
      w = canvas.width = hero.offsetWidth;
      h = canvas.height = hero.offsetHeight;
      const count = Math.round((w * h) / 16000);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.8
      }));
    }
    window.addEventListener('resize', resize);
    resize();

    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
    });
    hero.addEventListener('mouseleave', () => { mx = -9999; my = -9999; });

    const colors = ['123,110,246', '90,169,230', '255,122,156'];

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const dx = p.x - mx, dy = p.y - my;
        const dist = Math.hypot(dx, dy);
        if (dist < 110) {
          const force = (110 - dist) / 110 * 0.6;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        ctx.beginPath();
        ctx.fillStyle = `rgba(${colors[i % colors.length]},0.55)`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const d = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (d < 105) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${colors[i % colors.length]},${0.14 * (1 - d / 105)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* ---------------------------------------------
     2. 3D orbit atom — JS-driven ellipse orbits
  --------------------------------------------- */
  const stage = document.getElementById('atomStage');
  if (stage) {
    const nodes = Array.from(stage.querySelectorAll('.atom-node'));
    let t = 0;
    function orbit() {
      t += 0.006;
      const cx = stage.offsetWidth / 2;
      const cy = stage.offsetHeight / 2;
      nodes.forEach((node) => {
        const speed = parseFloat(node.dataset.speed);
        const radius = parseFloat(node.dataset.radius) * Math.min(stage.offsetWidth, stage.offsetHeight);
        const tilt = parseFloat(node.dataset.tilt);
        const phase = parseFloat(node.dataset.phase);
        const angle = t * speed + phase;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius * tilt;
        const depth = (Math.sin(angle) + 1) / 2; // 0 back, 1 front
        const scale = 0.75 + depth * 0.4;
        node.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) scale(${scale})`;
        node.style.zIndex = Math.round(depth * 10);
        node.style.opacity = 0.55 + depth * 0.45;
      });
      requestAnimationFrame(orbit);
    }
    orbit();

    nodes.forEach(node => {
      node.addEventListener('click', () => {
        const target = node.dataset.target;
        const btn = document.querySelector(`.tab-btn[data-tab="${target}"]`);
        if (btn) {
          document.getElementById('ways')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setTimeout(() => activateTab(btn), 450);
        }
      });
    });
  }

  /* ---------------------------------------------
     3. Tabs — Reasoning / Creativity / Memory / Vision
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
     4. Live reasoning stream
  --------------------------------------------- */
  const livePrompts = document.querySelectorAll('.live-prompt-btn');
  const liveLines = document.getElementById('liveLines');
  const liveAnswer = document.getElementById('liveAnswer');
  const liveTimer = document.getElementById('liveTimer');

  const traces = {
    plan: {
      steps: [
        'Reading the question for what it actually needs.',
        'Breaking "plan a trip" into constraints: dates, budget, pace.',
        'Weighing two itineraries against the stated budget.',
        'Discarding the rushed one — it violates the pace constraint.'
      ],
      answer: 'A 5-day loop with two travel days and three slow ones fits your budget better than the packed version — here it is, day by day.'
    },
    code: {
      steps: [
        'Locating the function that owns this bug.',
        'Tracing the null case back to a missing default.',
        'Checking two call sites for the same assumption.',
        'Writing a fix that covers all three, not just the one you hit.'
      ],
      answer: 'The crash was a missing default on one parameter — patched in the function and both callers that shared the assumption.'
    },
    ethics: {
      steps: [
        'Noting this has no single correct answer.',
        'Laying out the strongest case on each side.',
        'Flagging where my own uncertainty is highest.',
        'Answering as an opinion, not a verdict.'
      ],
      answer: 'Here is where I land, and why — but I have kept the counter-argument visible instead of quietly discarding it.'
    }
  };

  let liveRunId = 0;
  function runTrace(key) {
    const trace = traces[key];
    if (!trace || !liveLines) return;
    const runId = ++liveRunId;
    liveLines.innerHTML = '';
    if (liveAnswer) { liveAnswer.textContent = ''; liveAnswer.style.opacity = 0; }
    const start = performance.now();

    let tickTimer = setInterval(() => {
      if (runId !== liveRunId) return clearInterval(tickTimer);
      if (liveTimer) liveTimer.textContent = ((performance.now() - start) / 1000).toFixed(1) + 's';
    }, 80);

    trace.steps.forEach((text, i) => {
      setTimeout(() => {
        if (runId !== liveRunId) return;
        const line = document.createElement('div');
        line.className = 'live-line' + (i < trace.steps.length - 1 ? ' muted' : '');
        line.innerHTML = `<span class="ln-tag">${String(i + 1).padStart(2, '0')}</span><span class="ln-text">${text}</span>`;
        liveLines.appendChild(line);
      }, i * 650);
    });

    setTimeout(() => {
      if (runId !== liveRunId) return;
      clearInterval(tickTimer);
      if (!liveAnswer) return;
      liveAnswer.style.opacity = 1;
      let i = 0;
      const typer = setInterval(() => {
        if (runId !== liveRunId) return clearInterval(typer);
        liveAnswer.innerHTML = trace.answer.slice(0, i + 1) + '<span class="live-cursor"></span>';
        i++;
        if (i >= trace.answer.length) {
          clearInterval(typer);
          liveAnswer.innerHTML = trace.answer;
        }
      }, 16);
    }, trace.steps.length * 650 + 300);
  }

  livePrompts.forEach(btn => {
    btn.addEventListener('click', () => {
      livePrompts.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      runTrace(btn.dataset.trace);
    });
  });
  if (livePrompts.length) {
    livePrompts[0].classList.add('active');
    const liveObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runTrace(livePrompts[0].dataset.trace);
          liveObserver.disconnect();
        }
      });
    }, { threshold: 0.4 });
    liveObserver.observe(document.getElementById('live'));
  }

  /* ---------------------------------------------
     5. Benchmark bars — animate in on scroll
  --------------------------------------------- */
  const benchFills = document.querySelectorAll('.bench-fill');
  const benchObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.width = el.dataset.value + '%';
      benchObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  benchFills.forEach(el => benchObserver.observe(el));

  /* ---------------------------------------------
     6. Playground — depth-scaled simulated reasoning
  --------------------------------------------- */
  const depthBtns = document.querySelectorAll('.depth-btn');
  const playRun = document.getElementById('playRun');
  const playInput = document.getElementById('playInput');
  const playOutput = document.getElementById('playOutput');
  let depth = 'standard';

  const depthSteps = {
    quick: 1,
    standard: 3,
    deep: 5
  };
  const stepBank = [
    'Reading the request and pulling out the real constraint.',
    'Checking it against the most likely edge case.',
    'Comparing two reasonable approaches side by side.',
    'Discarding the one that only works in the common case.',
    'Sanity-checking the answer against the original question.',
    'Trimming the explanation down to what you actually need.'
  ];

  depthBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      depthBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      depth = btn.dataset.depth;
    });
  });

  function runPlayground() {
    if (!playOutput) return;
    const question = (playInput.value || '').trim() || 'How should I approach this?';
    const n = depthSteps[depth] || 3;
    playOutput.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const step = document.createElement('div');
      step.className = 'play-step';
      step.style.animationDelay = `${i * 0.35}s`;
      step.innerHTML = `<span class="step-num">${i + 1}</span><span class="step-text">${stepBank[i % stepBank.length]}</span>`;
      playOutput.appendChild(step);
    }
    const final = document.createElement('div');
    final.className = 'play-step final';
    final.style.animationDelay = `${n * 0.35}s`;
    final.innerHTML = `<span class="step-num">✓</span><span class="step-text">Answering "${question}" with ${n === 1 ? 'one direct pass' : n + ' checked steps'} — the deeper the setting, the more it double-checks itself before replying.</span>`;
    playOutput.appendChild(final);
  }
  if (playRun) playRun.addEventListener('click', runPlayground);

  /* ---------------------------------------------
     7. Modality flip cards — tap to flip on touch
  --------------------------------------------- */
  document.querySelectorAll('.modal-card').forEach(card => {
    card.addEventListener('click', () => {
      if (!window.matchMedia('(hover: hover)').matches) {
        card.classList.toggle('flipped');
      }
    });
  });

});
