/* ============================================
   AuraWireOrb — lightweight 3D wireframe sphere
   Pure canvas 2D + manual 3D projection, no deps.
   Usage: AuraWireOrb(canvasEl, { count, colors, speed, interactive, ambient })
   ============================================ */
(function () {
  function AuraWireOrb(canvas, opts) {
    if (!canvas || !canvas.getContext) return null;
    opts = opts || {};

    const ctx = canvas.getContext('2d');
    const count = opts.count || 90;
    const colors = opts.colors || ['123,110,246', '90,169,230', '255,122,156'];
    const speed = opts.speed != null ? opts.speed : 0.00028;
    const interactive = opts.interactive !== false;
    const linkFrac = opts.linkFrac != null ? opts.linkFrac : 0.62;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, cx = 0, cy = 0, R = 0;
    let points = [];
    let rotX = opts.tiltX != null ? opts.tiltX : 0.32;
    let targetRotX = rotX, rotY = 0, targetRotY = 0;
    let angle = 0;
    let raf = null;
    let destroyed = false;

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const cw = parent.clientWidth || 1;
      const ch = parent.clientHeight || 1;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = cw + 'px';
      canvas.style.height = ch + 'px';
      w = canvas.width; h = canvas.height;
      cx = w / 2; cy = h / 2;
      R = Math.min(w, h) * (opts.radius || 0.4);
    }

    function buildPoints() {
      points = [];
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = golden * i;
        points.push({
          x: Math.cos(theta) * r,
          y: y,
          z: Math.sin(theta) * r,
          c: colors[i % colors.length]
        });
      }
    }

    function onMove(e) {
      const parent = canvas.parentElement;
      const r = parent.getBoundingClientRect();
      targetRotY = ((e.clientX - r.left) / r.width - 0.5) * 1.3;
      targetRotX = (opts.tiltX != null ? opts.tiltX : 0.32) + ((e.clientY - r.top) / r.height - 0.5) * -0.9;
    }
    function onLeave() {
      targetRotY = 0;
      targetRotX = opts.tiltX != null ? opts.tiltX : 0.32;
    }

    function drawFrame() {
      if (destroyed) return;
      angle += speed * 16.6;
      rotY += (targetRotY - rotY) * 0.045;
      rotX += (targetRotX - rotX) * 0.045;

      const cosA = Math.cos(angle + rotY), sinA = Math.sin(angle + rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      const proj = new Array(points.length);
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const x = p.x * cosA - p.z * sinA;
        const z1 = p.x * sinA + p.z * cosA;
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;
        const scale = 1 / (1.9 - z2);
        proj[i] = {
          sx: cx + x * R * scale,
          sy: cy + y1 * R * scale,
          z: z2,
          c: p.c,
          scale
        };
      }

      ctx.clearRect(0, 0, w, h);

      const maxLinkDist = R * linkFrac;
      for (let i = 0; i < proj.length; i++) {
        for (let j = i + 1; j < proj.length; j++) {
          const a = proj[i], b = proj[j];
          const dx = a.sx - b.sx, dy = a.sy - b.sy;
          const d = Math.hypot(dx, dy);
          if (d < maxLinkDist) {
            const depth = (a.z + b.z) / 2;
            const op = Math.max(0, (depth + 1) / 2) * 0.22;
            if (op <= 0.008) continue;
            ctx.strokeStyle = `rgba(${a.c},${op})`;
            ctx.lineWidth = Math.max(0.5, dpr * 0.55);
            ctx.beginPath();
            ctx.moveTo(a.sx, a.sy);
            ctx.lineTo(b.sx, b.sy);
            ctx.stroke();
          }
        }
      }

      proj.sort((a, b) => a.z - b.z);
      for (let i = 0; i < proj.length; i++) {
        const p = proj[i];
        const op = 0.35 + (p.z + 1) / 2 * 0.65;
        const rad = Math.max(1, 2.1 * p.scale * dpr);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.c},${op})`;
        ctx.arc(p.sx, p.sy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) raf = requestAnimationFrame(drawFrame);
    }

    window.addEventListener('resize', resize);
    resize();
    buildPoints();

    if (interactive && !reduceMotion) {
      const parent = canvas.parentElement;
      parent.addEventListener('mousemove', onMove);
      parent.addEventListener('mouseleave', onLeave);
    }

    drawFrame();
    if (reduceMotion) {
      // Draw a single static, gently tilted frame — no rAF loop.
    }

    return {
      destroy() {
        destroyed = true;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        const parent = canvas.parentElement;
        if (parent) {
          parent.removeEventListener('mousemove', onMove);
          parent.removeEventListener('mouseleave', onLeave);
        }
      }
    };
  }

  window.AuraWireOrb = AuraWireOrb;
})();
