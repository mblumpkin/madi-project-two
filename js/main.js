document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------------------------
  // A) Mouse glow (updates the radial gradient position)
  // -------------------------------------------------------
  const glow = document.getElementById("mouse-glow");
  if (glow) {
    document.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;

      glow.style.background = `radial-gradient(
        300px circle at ${x}% ${y}%,
        #ffd24d22,
        #b45aff11 40%,
        transparent 65%
      )`;
    });
  }

  // -------------------------------------------------------
  // B) Foggy Fireflies (calm, misty, not chaotic)
  // -------------------------------------------------------
  const canvas = document.getElementById("fireflies");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext("2d");

    let w = 0, h = 0, dpr = 1;
    const pointer = { x: 0.5, y: 0.4, active: false };
    const flies = [];

    function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
    function rand(min, max) { return Math.random() * (max - min) + min; }

    function resize() {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = window.innerWidth;
      h = window.innerHeight;

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Lower number = calmer. Adjust 26–40 if you want.
      const target = Math.floor(28 * (w * h) / (1100 * 700));

      while (flies.length < target) {
        flies.push({
          x: rand(0, w),
          y: rand(0, h),
          r: rand(0.9, 1.9),
          a: rand(0.06, 0.22),
          phase: rand(0, Math.PI * 2),
          speed: rand(0.12, 0.35),
          drift: rand(0.0012, 0.0045),
          hueShift: rand(-10, 10),
        });
      }
      while (flies.length > target) flies.pop();
    }

    window.addEventListener("resize", resize);
    resize();

    document.addEventListener("pointermove", (e) => {
      pointer.x = e.clientX / window.innerWidth;
      pointer.y = e.clientY / window.innerHeight;
      pointer.active = true;
    });
    document.addEventListener("pointerleave", () => {
      pointer.active = false;
    });

    function draw(t) {
      requestAnimationFrame(draw);

      // Clear each frame (keeps it clean and prevents “scribbles”)
      ctx.clearRect(0, 0, w, h);

      // Soft fog layer to push fireflies “behind mist”
      ctx.globalCompositeOperation = "source-over";
      const fog = ctx.createRadialGradient(
        w * 0.5, h * 0.35, 80,
        w * 0.5, h * 0.35, Math.max(w, h)
      );
      fog.addColorStop(0, "rgba(180, 90, 255, 0.05)"); // #b45aff
      fog.addColorStop(0.45, "rgba(255, 210, 77, 0.03)"); // #ffd24d
      fog.addColorStop(1, "rgba(7, 9, 24, 0)");
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, w, h);

      // Fireflies in additive blend
      ctx.globalCompositeOperation = "lighter";

      const px = pointer.x * w;
      const py = pointer.y * h;

      for (const f of flies) {
        const wob1 = Math.sin(t * 0.001 * f.speed + f.phase);
        const wob2 = Math.cos(t * 0.0012 * f.speed + f.phase * 1.3);

        f.x += wob1 * f.drift * 120;
        f.y += wob2 * f.drift * 100;

        // Wrap edges
        if (f.x < -20) f.x = w + 20;
        if (f.x > w + 20) f.x = -20;
        if (f.y < -20) f.y = h + 20;
        if (f.y > h + 20) f.y = -20;

        // Very subtle attraction to cursor (calm)
        if (pointer.active) {
          const dx = px - f.x;
          const dy = py - f.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
          const pull = clamp(110 / dist, 0, 0.18) * 0.05;
          f.x += (dx / dist) * pull;
          f.y += (dy / dist) * pull;
        }

        // Gentle flicker
        const tw = 0.5 + 0.5 * Math.sin(t * 0.0022 + f.phase);
        const alpha = clamp(f.a * (0.35 + tw * 0.55), 0, 0.28);

        const rr = f.r * (0.95 + tw * 0.15);
        const hue = 46 + f.hueShift;

        // Big soft glow — no harsh “dot”
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rr * 12);
        g.addColorStop(0, `hsla(${hue}, 95%, 65%, ${alpha})`);
        g.addColorStop(0.4, `hsla(${hue}, 95%, 60%, ${alpha * 0.40})`);
        g.addColorStop(1, `hsla(${hue}, 95%, 60%, 0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(f.x, f.y, rr * 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    requestAnimationFrame(draw);
  }

  // -------------------------------------------------------
  // C) Sound toggle + shadow bounce (SAFE: doesn't delete img)
  // -------------------------------------------------------
  const audio = document.getElementById("bg-music");
  const btn = document.getElementById("sound-toggle");
  const label = btn ? btn.querySelector(".sound-label") : null;

  if (audio) audio.volume = 0.35;

  // Restore saved setting (UI only; browsers block autoplay)
  const saved = localStorage.getItem("lightbetween_sound");
  if (btn && label) {
    const isSavedOn = saved === "on";
    btn.setAttribute("aria-pressed", isSavedOn ? "true" : "false");
    label.textContent = isSavedOn ? "Sound: On" : "Sound: Off";
  }

  if (audio && btn && label) {
    btn.addEventListener("click", async () => {
      // Bounce on click (doesn't matter if audio fails)
      btn.classList.remove("bounce");
      void btn.offsetWidth;
      btn.classList.add("bounce");
      setTimeout(() => btn.classList.remove("bounce"), 500);

      const turningOn = audio.paused;

      // Update UI without destroying inner HTML
      btn.setAttribute("aria-pressed", turningOn ? "true" : "false");
      label.textContent = turningOn ? "Sound: On" : "Sound: Off";

      try {
        if (turningOn) {
          await audio.play(); // allowed due to user click
          localStorage.setItem("lightbetween_sound", "on");
        } else {
          audio.pause();
          localStorage.setItem("lightbetween_sound", "off");
        }
      } catch (err) {
        // Revert UI if play fails
        console.log("Audio play failed:", err);
        btn.setAttribute("aria-pressed", turningOn ? "false" : "true");
        label.textContent = turningOn ? "Sound: Off" : "Sound: On";
      }
    });
  }
});
