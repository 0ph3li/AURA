document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------
     0. Shared refs
  --------------------------------------------- */
  const intro = document.getElementById('intro');
  const nav = document.getElementById('siteNav');
  const scrollCue = document.getElementById('scrollCue');
  const progressFill = document.getElementById('progressFill');
  const lines = Array.from(document.querySelectorAll('.intro-line'));

  let introHeight = intro.offsetHeight;
  let winH = window.innerHeight;
  let docH = document.documentElement.scrollHeight - winH;

  window.addEventListener('resize', () => {
    introHeight = intro.offsetHeight;
    winH = window.innerHeight;
    docH = document.documentElement.scrollHeight - winH;
  });

  const orbField = document.querySelector('.orb-field');
  const heroOrb = document.querySelector('.hero-orb');

  /* ---------------------------------------------
     1. Intro scroll sequence (pinned orb + 3 lines)
  --------------------------------------------- */
  const stageCount = lines.length;
  let introProgress = 0;
  // Each phrase gets an equal slice of the pinned scroll range.
  // The pinned range is introHeight - winH (the distance the section is "sticky" for).
  function updateIntro() {
    const pinnedRange = Math.max(introHeight - winH, 1);
    const raw = window.scrollY / pinnedRange; // 0 -> 1 across the whole intro
    const progress = Math.min(Math.max(raw, 0), 1);
    introProgress = progress;

    lines.forEach((line, i) => {
      const sliceStart = i / stageCount;
      const sliceEnd = (i + 1) / stageCount;
      const fadeWidth = (sliceEnd - sliceStart) * 0.28;

      let opacity = 0;
      let shift = 24;

      if (progress >= sliceStart - fadeWidth && progress <= sliceEnd) {
        if (progress < sliceStart) {
          const t = (progress - (sliceStart - fadeWidth)) / fadeWidth;
          opacity = t;
          shift = 24 * (1 - t);
        } else if (progress > sliceEnd - fadeWidth) {
          const t = (sliceEnd - progress) / fadeWidth;
          opacity = Math.max(t, 0);
          shift = -24 * (1 - Math.max(t, 0));
        } else {
          opacity = 1;
          shift = 0;
        }
      }
      line.style.opacity = opacity;
      line.style.transform = `translateY(calc(-50% + ${shift}px))`;
    });

    // scroll cue fades once user starts scrolling
    scrollCue.style.opacity = progress > 0.03 ? '0' : '1';

    // reveal nav near the end of the intro
    if (progress > 0.92) {
      nav.classList.add('visible');
    } else {
      nav.classList.remove('visible');
    }
  }

  /* ---------------------------------------------
     2. Nav "solid" state + active link + progress bar
  --------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const navSections = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function updateNavChrome() {
    nav.classList.toggle('solid', window.scrollY > introHeight - winH + 40);

    let current = null;
    navSections.forEach(sec => {
      const r = sec.getBoundingClientRect();
      if (r.top <= winH * 0.4 && r.bottom >= winH * 0.4) current = sec.id;
    });
    navLinks.forEach(a => {
      a.style.color = current && a.getAttribute('href') === '#' + current ? 'var(--ink)' : '';
    });
  }

  function updateProgress() {
    const p = docH > 0 ? window.scrollY / docH : 0;
    progressFill.style.width = `${Math.min(Math.max(p, 0), 1) * 100}%`;
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateIntro();
        updateNavChrome();
        updateProgress();
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  updateIntro();
  updateNavChrome();
  updateProgress();

  /* ---------------------------------------------
     2b. Cinematic mouse parallax on the gradient orbs
  --------------------------------------------- */
  let mouseX = 0, mouseY = 0;   // target, -0.5 .. 0.5
  let curX = 0, curY = 0;       // lerped current

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
  }, { passive: true });

  function parallaxLoop() {
    curX += (mouseX - curX) * 0.06;
    curY += (mouseY - curY) * 0.06;

    if (orbField) {
      const scale = 1 + introProgress * 0.18;
      const px = curX * 46;
      const py = curY * 46;
      orbField.style.transform = `translate(${px}px, ${py}px) scale(${scale})`;
    }
    if (heroOrb) {
      heroOrb.style.transform = `translate(${curX * -28}px, ${curY * -28}px)`;
    }
    requestAnimationFrame(parallaxLoop);
  }
  requestAnimationFrame(parallaxLoop);

  /* ---------------------------------------------
     2c. Intro 3D wireframe orb — the "spectacular"
     centerpiece behind the opening lines. Speeds up
     subtly as you scroll through the pinned intro.
  --------------------------------------------- */
  const introOrbCanvas = document.getElementById('introOrbCanvas');
  if (introOrbCanvas && window.AuraWireOrb) {
    const orbHandle = window.AuraWireOrb(introOrbCanvas, {
      count: 150,
      radius: 0.46,
      colors: ['123,110,246', '90,169,230', '255,122,156'],
      speed: 0.00035,
      tiltX: 0.3
    });
    if (orbHandle) {
      window.addEventListener('scroll', () => {
        // subtle extra spin tied to scroll progress, layered on top of the module's own animation
        introOrbCanvas.style.filter = `saturate(${1 + introProgress * 0.4})`;
      }, { passive: true });
    }
  }

  /* ---------------------------------------------
     2c. Reliable smooth-scroll for every nav link
     (manual, so each link lands precisely under the
     fixed nav — never snaps back to the top/home)
  --------------------------------------------- */
  function smoothScrollTo(hash) {
    const target = document.querySelector(hash);
    if (!target) return;
    const navHeight = nav.offsetHeight || 0;
    const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    const hash = a.getAttribute('href');
    if (!hash || hash === '#' || !document.querySelector(hash)) return;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      smoothScrollTo(hash);
      history.pushState(null, '', hash);
    });
  });

  /* ---------------------------------------------
     3. Mobile nav toggle
  --------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navMobile.classList.toggle('open');
  });
  navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navMobile.classList.remove('open');
  }));

  /* ---------------------------------------------
     4. Reveal-on-scroll (IntersectionObserver)
  --------------------------------------------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ---------------------------------------------
     5. Pricing monthly / yearly toggle
  --------------------------------------------- */
  const periodSwitch = document.getElementById('periodSwitch');
  const priceLabels = document.querySelectorAll('.price-toggle-label');
  const priceNums = document.querySelectorAll('.price-num');

  if (periodSwitch) {
    periodSwitch.addEventListener('click', () => {
      const yearly = periodSwitch.getAttribute('aria-checked') !== 'true';
      periodSwitch.setAttribute('aria-checked', String(yearly));
      priceLabels.forEach(l => l.classList.toggle('active', l.dataset.period === (yearly ? 'yearly' : 'monthly')));
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
    });
    priceLabels.forEach(label => {
      label.addEventListener('click', () => {
        const wantYearly = label.dataset.period === 'yearly';
        if ((periodSwitch.getAttribute('aria-checked') === 'true') !== wantYearly) periodSwitch.click();
      });
    });
  }

  /* ---------------------------------------------
     5c. Magnetic buttons — nudge toward the cursor
  --------------------------------------------- */
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.btn, .demo-send, .demo-mic, .toggle-switch').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) * 0.28;
        const my = (e.clientY - r.top - r.height / 2) * 0.28;
        el.style.transform = `translate(${mx}px, ${my}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------
     6. FAQ accordion
  --------------------------------------------- */
  document.querySelectorAll('[data-faq]').forEach(item => {
    item.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('[data-faq]').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ---------------------------------------------
     7. Animated stat counters
  --------------------------------------------- */
  const statNums = document.querySelectorAll('.stat-num');
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimal || '0', 10);
      const duration = 1400;
      const start = performance.now();

      function tick(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = target * eased;
        el.textContent = decimals > 0 ? val.toFixed(decimals) : Math.round(val);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  statNums.forEach(el => countObserver.observe(el));

  /* ---------------------------------------------
     8. Glass spotlight + tilt (interactive cards)
  --------------------------------------------- */
  if (window.matchMedia('(hover: hover)').matches) {
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
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------
     9. Hero demo — "ask Aura" box: instant short
     answers, one-tap suggestion chips, and voice input.
  --------------------------------------------- */
  const demoForm = document.getElementById('demoForm');
  const demoInput = document.getElementById('demoInput');
  const demoReply = document.getElementById('demoReply');
  const demoMic = document.getElementById('demoMic');
  const demoSuggestions = document.getElementById('demoSuggestions');

  const demoAnswers = [
    { match: /voice|talk|speak(?!s)|microphone|listen/i, text: "Tap the mic next to this box and just talk — Aura listens, transcribes, and answers exactly like it would if you'd typed it." },
    { match: /privacy|data|device|secure|encrypt/i, text: "Most of that stays on your device — only the parts that need extra reasoning ever leave it, and always encrypted." },
    { match: /design|look|type|font/i, text: "One typeface, generous spacing, and motion that only shows up when something actually changes." },
    { match: /price|cost|pro\b|subscription|plan|studio|upgrade/i, text: "Aura is free to start. Pro adds deeper reasoning and a longer memory, from $14/month — Studio adds a shared team memory." },
    { match: /language|translat|italian|speak.*language/i, text: "52 languages, with nothing to switch — start typing or talking in whichever one you want." },
    { match: /remember|memory|forget|context/i, text: "Aura keeps what actually matters — a preference, a constraint — and lets small talk fade the way a real conversation would." },
    { match: /team|collaborat|shared|colleague/i, text: "Aura Studio shares memory and context across a whole team, with admin and usage controls built in." },
    { match: /offline|no internet|no wifi|no connection/i, text: "A lot of Aura keeps working without a connection — everyday questions run fully on-device." },
    { match: /mac|iphone|ipad|platform|sync/i, text: "One conversation, three platforms — start on your Mac, keep going on your phone." },
    { match: /code|program|debug|bug|function/i, text: "Aura traces execution paths, not just syntax, so a fix addresses what actually broke — not just the line that crashed." },
    { match: /who are you|what are you|^hi$|^hello$|hey aura/i, text: "I'm Aura — a calmer kind of intelligent, built to reason out loud and stay out of your way otherwise." },
    { match: /.*/, text: "That's exactly the kind of question Aura is built to sit with — happy to walk through it properly once you're in." }
  ];

  function askDemo(question) {
    const q = (question || '').trim();
    if (!q || !demoReply) return;

    const answer = demoAnswers.find(a => a.match.test(q)).text;

    demoReply.classList.remove('show');
    demoReply.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
    requestAnimationFrame(() => demoReply.classList.add('show'));

    setTimeout(() => {
      demoReply.textContent = '';
      let i = 0;
      const typer = setInterval(() => {
        demoReply.textContent = answer.slice(0, i + 1);
        i++;
        if (i >= answer.length) clearInterval(typer);
      }, 14);
    }, 500);
  }

  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = demoInput.value.trim();
      if (!q) return;
      askDemo(q);
      demoInput.value = '';
    });
  }

  if (demoSuggestions) {
    demoSuggestions.querySelectorAll('.demo-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        demoInput.value = chip.textContent;
        askDemo(chip.textContent);
      });
    });
  }

  // Voice input — Web Speech API, with graceful fallback when unsupported.
  if (demoMic) {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      demoMic.style.display = 'none';
    } else {
      const recognition = new SpeechRecognitionCtor();
      recognition.lang = navigator.language || 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      let listening = false;

      recognition.addEventListener('result', (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
        demoInput.value = transcript;
      });
      recognition.addEventListener('end', () => {
        listening = false;
        demoMic.classList.remove('listening');
        if (demoInput.value.trim()) {
          askDemo(demoInput.value);
          demoInput.value = '';
        }
      });
      recognition.addEventListener('error', () => {
        listening = false;
        demoMic.classList.remove('listening');
      });

      demoMic.addEventListener('click', () => {
        if (listening) {
          recognition.stop();
          return;
        }
        demoInput.value = '';
        demoInput.placeholder = 'Listening…';
        demoReply.classList.remove('show');
        listening = true;
        demoMic.classList.add('listening');
        try {
          recognition.start();
        } catch (err) {
          listening = false;
          demoMic.classList.remove('listening');
        }
      });
    }
  }

  /* ---------------------------------------------
     10. Custom cursor (desktop only)
  --------------------------------------------- */
  if (window.matchMedia('(hover: hover)').matches) {
    const dot = document.getElementById('cursorDot');
    window.addEventListener('mousemove', (e) => {
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      dot.classList.add('on');
    });
    document.addEventListener('mouseleave', () => dot.classList.remove('on'));
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => dot.classList.add('grow'));
      el.addEventListener('mouseleave', () => dot.classList.remove('grow'));
    });
  }

});
