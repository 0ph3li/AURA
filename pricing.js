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
  const pricingOrbCanvas = document.getElementById('pricingOrbCanvas');
  if (pricingOrbCanvas && window.AuraWireOrb) {
    window.AuraWireOrb(pricingOrbCanvas, {
      count: 60,
      radius: 0.5,
      colors: ['123,110,246', '255,122,156'],
      speed: 0.0002,
      interactive: false,
      tiltX: 0.25
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
    document.querySelectorAll('.btn, .toggle-switch').forEach(el => {
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
     1. Plan recommender quiz
  --------------------------------------------- */
  const quizSteps = document.querySelectorAll('.quiz-step');
  const quizResult = document.getElementById('quizResult');
  const quizProgress = document.querySelectorAll('.quiz-progress span');
  const quizRestart = document.getElementById('quizRestart');
  const quizResultLabel = document.getElementById('quizResultLabel');
  const quizResultTitle = document.getElementById('quizResultTitle');
  const quizResultText = document.getElementById('quizResultText');

  let quizAnswers = {};
  const plans = {
    free: { title: 'Aura — Free', text: 'Everyday questions on-device, no cost, no catch. You can always upgrade later.' },
    pro: { title: 'Aura Pro', text: 'Deeper reasoning and a longer memory, for the questions that need more than a quick answer.' },
    studio: { title: 'Aura Studio', text: 'Built for a team — shared memory, admin controls, and seats that scale with you.' }
  };

  function showQuizStep(idx) {
    quizSteps.forEach((s, i) => s.classList.toggle('active', i === idx));
    quizProgress.forEach((p, i) => p.classList.toggle('done', i < idx));
  }

  document.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.closest('.quiz-step');
      const key = step.dataset.question;
      quizAnswers[key] = btn.dataset.value;

      const steps = Array.from(quizSteps);
      const idx = steps.indexOf(step);
      if (idx < steps.length - 1) {
        showQuizStep(idx + 1);
      } else {
        finishQuiz();
      }
    });
  });

  function pickPlan() {
    const who = quizAnswers.who;
    const depth = quizAnswers.depth;
    if (who === 'team') return 'studio';
    if (depth === 'constantly') return 'pro';
    if (depth === 'sometimes') return who === 'me' ? 'pro' : 'studio';
    return 'free';
  }

  function finishQuiz() {
    quizProgress.forEach(p => p.classList.add('done'));
    quizSteps.forEach(s => s.classList.remove('active'));
    const key = pickPlan();
    const plan = plans[key];
    quizResultLabel.textContent = 'We\'d start with';
    quizResultTitle.textContent = plan.title;
    quizResultText.textContent = plan.text;
    quizResult.classList.add('active');

    document.querySelectorAll('.price-card').forEach(c => c.classList.remove('recommended-glow', 'show'));
    const card = document.querySelector(`.price-card[data-plan="${key}"]`);
    if (card) {
      card.classList.add('recommended-glow');
      requestAnimationFrame(() => card.classList.add('show'));
    }
  }

  if (quizRestart) {
    quizRestart.addEventListener('click', () => {
      quizAnswers = {};
      quizResult.classList.remove('active');
      showQuizStep(0);
    });
  }
  if (quizSteps.length) showQuizStep(0);

  /* ---------------------------------------------
     2. Billing period + audience toggle
  --------------------------------------------- */
  const periodSwitch = document.getElementById('periodSwitch');
  const priceLabels = document.querySelectorAll('.price-toggle-label');
  const priceNums = document.querySelectorAll('.price-num');
  const audienceBtns = document.querySelectorAll('.audience-btn');
  const studioCard = document.querySelector('.price-card[data-plan="studio"]');

  function currentPeriod() { return periodSwitch && periodSwitch.getAttribute('aria-checked') === 'true' ? 'yearly' : 'monthly'; }

  function applyPrices() {
    const yearly = currentPeriod() === 'yearly';
    priceNums.forEach(num => {
      const value = yearly ? num.dataset.yearly : num.dataset.monthly;
      num.style.opacity = '0';
      num.style.transform = 'translateY(4px)';
      setTimeout(() => {
        num.textContent = `$${value}`;
        num.style.opacity = '1';
        num.style.transform = 'translateY(0)';
      }, 140);
    });
    updateSeatTotal();
  }

  if (periodSwitch) {
    periodSwitch.addEventListener('click', () => {
      const yearly = periodSwitch.getAttribute('aria-checked') !== 'true';
      periodSwitch.setAttribute('aria-checked', String(yearly));
      priceLabels.forEach(l => l.classList.toggle('active', l.dataset.period === (yearly ? 'yearly' : 'monthly')));
      applyPrices();
    });
    priceLabels.forEach(label => {
      label.addEventListener('click', () => {
        const wantYearly = label.dataset.period === 'yearly';
        if ((periodSwitch.getAttribute('aria-checked') === 'true') !== wantYearly) periodSwitch.click();
      });
    });
  }

  const freeCard = document.querySelector('.price-card[data-plan="free"]');
  const proCard = document.querySelector('.price-card[data-plan="pro"]');

  audienceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      audienceBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const isTeam = btn.dataset.audience === 'team';

      [freeCard, proCard].forEach(c => c && c.classList.toggle('audience-dim', isTeam));
      if (studioCard) {
        studioCard.classList.toggle('audience-dim', !isTeam);
        studioCard.classList.toggle('audience-focus', isTeam);
      }
      if (isTeam && seatRange && parseInt(seatRange.value, 10) < 5) {
        seatRange.value = 8;
        updateSeatTotal();
      }
    });
  });

  /* ---------------------------------------------
     3. Seat calculator (Studio card)
  --------------------------------------------- */
  const seatRange = document.getElementById('seatRange');
  const seatCount = document.getElementById('seatCount');
  const seatTotal = document.getElementById('seatTotal');

  function updateSeatTotal() {
    if (!seatRange) return;
    const seats = parseInt(seatRange.value, 10);
    seatCount.textContent = seats;
    const base = currentPeriod() === 'yearly' ? 35 : 42;
    let discount = 1;
    if (seats >= 25) discount = 0.8;
    else if (seats >= 10) discount = 0.9;
    const total = Math.round(base * seats * discount);
    seatTotal.innerHTML = `<strong>$${total.toLocaleString()}</strong> / ${currentPeriod() === 'yearly' ? 'month, billed yearly' : 'month'}${discount < 1 ? ` · ${Math.round((1 - discount) * 100)}% volume discount applied` : ''}`;
  }
  if (seatRange) {
    seatRange.addEventListener('input', updateSeatTotal);
    updateSeatTotal();
  }

  /* ---------------------------------------------
     4. Comparison table reveal
  --------------------------------------------- */
  const compareRows = document.querySelectorAll('.compare-table tbody tr');
  const compareObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        compareObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  compareRows.forEach((row, i) => {
    row.style.transitionDelay = `${Math.min(i * 40, 400)}ms`;
    compareObserver.observe(row);
  });

  /* ---------------------------------------------
     5. FAQ accordion
  --------------------------------------------- */
  document.querySelectorAll('[data-faq]').forEach(item => {
    item.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('[data-faq]').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

});
