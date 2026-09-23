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
  const privacyOrbCanvas = document.getElementById('privacyOrbCanvas');
  if (privacyOrbCanvas && window.AuraWireOrb) {
    window.AuraWireOrb(privacyOrbCanvas, {
      count: 60,
      radius: 0.42,
      colors: ['90,169,230', '123,110,246'],
      speed: 0.00018,
      interactive: false,
      tiltX: 0.22
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
  }

  /* ---------------------------------------------
     1. Routing visualization — where a question goes
  --------------------------------------------- */
  const stage = document.getElementById('routeStage');
  const packet = document.getElementById('routePacket');
  const deviceNode = document.getElementById('deviceNode');
  const cloudNode = document.getElementById('cloudNode');
  const lock = document.getElementById('routeLock');
  const status = document.getElementById('routeStatus');
  const chips = document.querySelectorAll('.route-chip');

  function pointOnQuad(p0, p1, p2, t) {
    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;
    return { x, y };
  }

  let routeRunId = 0;
  function runRoute(mode, chip) {
    if (!stage) return;
    const runId = ++routeRunId;
    const r = stage.getBoundingClientRect();
    const devicePos = { x: r.width * 0.16, y: r.height * 0.5 };
    const cloudPos = { x: r.width * 0.84, y: r.height * 0.5 };
    const control = { x: r.width * 0.5, y: r.height * 0.12 };

    status.classList.remove('show');
    lock.classList.remove('show');
    deviceNode.classList.remove('pulse');
    cloudNode.classList.remove('pulse');
    packet.style.opacity = '1';

    if (mode === 'local') {
      deviceNode.classList.add('pulse');
      const start = performance.now();
      const duration = 900;
      function loop(now) {
        if (runId !== routeRunId) return;
        const t = Math.min((now - start) / duration, 1);
        const angle = t * Math.PI * 2;
        const rad = 34;
        packet.style.left = (devicePos.x + Math.cos(angle) * rad) + 'px';
        packet.style.top = (devicePos.y + Math.sin(angle) * rad - 40) + 'px';
        if (t < 1) requestAnimationFrame(loop);
        else {
          packet.style.opacity = '0';
          deviceNode.classList.remove('pulse');
          status.innerHTML = `<strong>Stayed on your device.</strong> Nothing left it.`;
          status.classList.add('show');
        }
      }
      requestAnimationFrame(loop);
    } else {
      const start = performance.now();
      const outDuration = 900;
      function outLoop(now) {
        if (runId !== routeRunId) return;
        const t = Math.min((now - start) / outDuration, 1);
        const pos = pointOnQuad(devicePos, control, cloudPos, t);
        packet.style.left = pos.x + 'px';
        packet.style.top = pos.y + 'px';
        if (t < 1) requestAnimationFrame(outLoop);
        else {
          cloudNode.classList.add('pulse');
          lock.classList.add('show');
          setTimeout(() => {
            if (runId !== routeRunId) return;
            const backStart = performance.now();
            const backDuration = 900;
            function backLoop(now2) {
              if (runId !== routeRunId) return;
              const t2 = Math.min((now2 - backStart) / backDuration, 1);
              const pos2 = pointOnQuad(cloudPos, control, devicePos, t2);
              packet.style.left = pos2.x + 'px';
              packet.style.top = pos2.y + 'px';
              if (t2 < 1) requestAnimationFrame(backLoop);
              else {
                packet.style.opacity = '0';
                cloudNode.classList.remove('pulse');
                lock.classList.remove('show');
                status.innerHTML = `<strong>Encrypted in transit.</strong> Processed, then discarded.`;
                status.classList.add('show');
              }
            }
            requestAnimationFrame(backLoop);
          }, 500);
        }
      }
      requestAnimationFrame(outLoop);
    }
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      runRoute(chip.dataset.mode, chip);
    });
  });
  if (chips.length && stage) {
    chips[0].classList.add('active');
    const routeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runRoute(chips[0].dataset.mode, chips[0]);
          routeObserver.disconnect();
        }
      });
    }, { threshold: 0.5 });
    routeObserver.observe(stage);
  }

  /* ---------------------------------------------
     2. Processing mix — on-device threshold
  --------------------------------------------- */
  const mixSlider = document.getElementById('mixSlider');
  const mixArc = document.getElementById('mixArc');
  const mixPercent = document.getElementById('mixPercent');
  const localCol = document.getElementById('localCol');
  const cloudCol = document.getElementById('cloudCol');

  const queryTypes = [
    { name: 'Everyday chat', complexity: 15 },
    { name: 'Reminders & timers', complexity: 10 },
    { name: 'Translation', complexity: 30 },
    { name: 'Quick calculations', complexity: 20 },
    { name: 'Document summaries', complexity: 60 },
    { name: 'Multi-step planning', complexity: 78 },
    { name: 'Image generation', complexity: 92 }
  ];

  const CIRC = 2 * Math.PI * 80;
  function updateMix() {
    const threshold = parseFloat(mixSlider.value);
    const onDevice = queryTypes.filter(q => q.complexity <= threshold);
    const cloud = queryTypes.filter(q => q.complexity > threshold);
    const pct = Math.round((onDevice.length / queryTypes.length) * 100);

    mixArc.style.strokeDasharray = `${(pct / 100) * CIRC} ${CIRC}`;
    mixPercent.textContent = pct + '%';

    localCol.innerHTML = onDevice.map(q => `<div class="mix-tag">${q.name}</div>`).join('') || '<div class="mix-tag" style="opacity:.5;">None yet — raise the slider</div>';
    cloudCol.innerHTML = cloud.map(q => `<div class="mix-tag">${q.name}</div>`).join('') || '<div class="mix-tag" style="opacity:.5;">Everything stays local</div>';
  }
  if (mixSlider) {
    mixSlider.addEventListener('input', updateMix);
    updateMix();
  }

  /* ---------------------------------------------
     3. Encryption demo — scramble / unscramble
  --------------------------------------------- */
  const cryptInput = document.getElementById('cryptInput');
  const cryptDisplay = document.getElementById('cryptDisplay');
  const cryptStatus = document.getElementById('cryptStatus');
  const encryptBtn = document.getElementById('encryptBtn');
  const decryptBtn = document.getElementById('decryptBtn');
  const glyphs = '#%&$@*!?01¤§░▒▓';
  let originalText = '';
  let cipherText = '';
  let cryptState = 'plain';

  function scrambleTo(target, display, onDone) {
    const len = target.length;
    let frame = 0;
    const totalFrames = 14;
    function tick() {
      let out = '';
      for (let i = 0; i < len; i++) {
        const reveal = (i / len) * totalFrames < frame;
        out += reveal ? target[i] : glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      display.textContent = out;
      frame++;
      if (frame <= totalFrames) requestAnimationFrame(tick);
      else { display.textContent = target; if (onDone) onDone(); }
    }
    tick();
  }

  function makeCipher(text) {
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      out += glyphs[(code + i) % glyphs.length];
    }
    return out.length ? out : '—';
  }

  if (encryptBtn) {
    encryptBtn.addEventListener('click', () => {
      if (cryptState === 'cipher') return;
      originalText = cryptInput.value.trim() || 'Meet me at 6 near the old bridge';
      cipherText = makeCipher(originalText);
      cryptState = 'encrypting';
      cryptDisplay.classList.remove('locked');
      cryptStatus.textContent = 'Encrypting on your device…';
      scrambleTo(cipherText, cryptDisplay, () => {
        cryptState = 'cipher';
        cryptDisplay.classList.add('locked');
        cryptStatus.textContent = '🔒 Unreadable in transit — even to us.';
      });
    });
  }
  if (decryptBtn) {
    decryptBtn.addEventListener('click', () => {
      if (cryptState !== 'cipher') return;
      cryptState = 'decrypting';
      cryptStatus.textContent = 'Decrypting with your device key…';
      scrambleTo(originalText, cryptDisplay, () => {
        cryptState = 'plain';
        cryptDisplay.classList.remove('locked');
        cryptStatus.textContent = '🔓 Only your device ever held the key.';
      });
    });
  }

  /* ---------------------------------------------
     4. Delete timeline
  --------------------------------------------- */
  const deleteRun = document.getElementById('deleteRun');
  const deleteNodes = document.querySelectorAll('.delete-node');
  const deleteStatus = document.getElementById('deleteStatus');

  if (deleteRun) {
    deleteRun.addEventListener('click', () => {
      deleteRun.disabled = true;
      deleteNodes.forEach(n => n.classList.remove('pending', 'done'));
      deleteStatus.innerHTML = 'Starting deletion…';

      deleteNodes.forEach((node, i) => {
        setTimeout(() => node.classList.add('pending'), i * 700);
        setTimeout(() => {
          node.classList.remove('pending');
          node.classList.add('done');
          if (i === deleteNodes.length - 1) {
            deleteStatus.innerHTML = '<strong>Fully removed.</strong> Sped up for this demo — in practice, within 24 hours everywhere.';
            deleteRun.disabled = false;
          } else {
            deleteStatus.innerHTML = `Cleared from <strong>${node.querySelector('.dn-label').textContent}</strong>…`;
          }
        }, i * 700 + 650);
      });
    });
  }

  /* ---------------------------------------------
     5. Permission toggles
  --------------------------------------------- */
  const permSwitches = document.querySelectorAll('.perm-switch');
  const permSummary = document.getElementById('permSummary');

  function updatePermSummary() {
    const on = Array.from(permSwitches).filter(s => s.getAttribute('aria-checked') === 'true');
    if (!permSummary) return;
    if (on.length === 0) {
      permSummary.innerHTML = 'Aura currently has <strong>no access</strong> to anything on this list.';
    } else {
      const names = on.map(s => s.dataset.name).join(', ');
      permSummary.innerHTML = `Aura can currently access: <strong>${names}</strong>.`;
    }
  }
  permSwitches.forEach(sw => {
    sw.addEventListener('click', () => {
      const on = sw.getAttribute('aria-checked') !== 'true';
      sw.setAttribute('aria-checked', String(on));
      updatePermSummary();
    });
  });
  updatePermSummary();

});
