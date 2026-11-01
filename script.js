const root = document.documentElement;
root.classList.add("js");

if (matchMedia("(hover: hover)").matches) {
  startSpotlight(document.querySelector(".hero"));
}

// Hra je celá vytvořená skriptem, takže bez JS po ní na stránce nezůstane prázdné místo.
// Pohyb je podstatou hry, při omezených animacích se proto vůbec nespustí.
const gameMount = document.querySelector("[data-game]");
if (gameMount && matchMedia("(prefers-reduced-motion: no-preference)").matches) {
  startGame(gameMount);
  startTabTease();
}

function startSpotlight(hero) {
  const light = document.createElement("div");
  light.className = "spotlight";
  hero.append(light);
  hero.addEventListener("pointermove", (event) => {
    const box = hero.getBoundingClientRect();
    light.style.setProperty("--x", `${event.clientX - box.left}px`);
    light.style.setProperty("--y", `${event.clientY - box.top}px`);
    light.classList.add("is-on");
  });
  hero.addEventListener("pointerleave", () => light.classList.remove("is-on"));
}

function startTabTease() {
  const title = document.title;
  document.addEventListener("visibilitychange", () => {
    document.title = document.hidden ? "The ball misses you" : title;
  });
}

function startGame(mount) {
  const BARS = 15;
  const SPACING = 280;
  const BALL_RADIUS = 9;
  const BAR_HEIGHT = 12;
  const GRAVITY = 0.0009;
  const BEST_KEY = "scroll-drop-best";
  const trackLength = (BARS + 1) * SPACING;

  // Prohlížeč by po reloadu obnovil scroll uprostřed hry a všechny překážky
  // nad kuličkou by se rázem počítaly jako nárazy.
  history.scrollRestoration = "manual";

  mount.id = "game";
  mount.className = "game";
  mount.style.setProperty("--track", `${trackLength}px`);
  mount.innerHTML = `
    <div class="game-stage">
      <div class="game-hud">
        <span>Scroll to fall. Wait for the gap.</span>
        <span>Score <strong data-score>0</strong> / ${BARS}</span>
      </div>
      <div class="game-board">
        <canvas aria-hidden="true"></canvas>
        <div class="game-result" aria-live="polite" hidden>
          <div class="game-verdict" data-verdict></div>
          <div class="game-score" data-final></div>
          <div class="game-best" data-best></div>
          <button class="game-again" type="button">Play again</button>
        </div>
      </div>
    </div>`;

  const hint = document.createElement("a");
  hint.className = "scroll-hint";
  hint.href = "#game";
  hint.textContent = "Scroll down to play ";
  const arrow = document.createElement("span");
  arrow.className = "scroll-arrow";
  arrow.textContent = "↓";
  hint.append(arrow);
  document.querySelector(".hero").append(hint);

  const canvas = mount.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = mount.querySelector("[data-score]");
  const resultEl = mount.querySelector(".game-result");
  const verdictEl = mount.querySelector("[data-verdict]");
  const finalEl = mount.querySelector("[data-final]");
  const bestEl = mount.querySelector("[data-best]");
  const styles = getComputedStyle(root);
  const color = (name) => styles.getPropertyValue(name).trim();
  const colors = {
    bar: color("--accent"),
    miss: color("--danger"),
    ball: color("--fg"),
    passed: color("--rule"),
  };
  const confettiColors = [colors.bar, colors.ball, colors.miss, "#ffd166", "#7ce7ff"];
  const stars = Array.from({ length: 70 }, () => ({
    x: Math.random(),
    y: Math.random(),
    depth: 0.1 + Math.random() * 0.4,
    size: 0.6 + Math.random() * 1.2,
  }));

  let bars = [];
  let particles = [];
  let floaters = [];
  let score = 0;
  let streak = 0;
  let finished = false;
  let hitUntil = 0;
  let shakeUntil = 0;
  let tail = 0;
  let lastTime = 0;
  let lastProgress = 0;
  let width = 0;
  let height = 0;
  let running = false;

  function reset() {
    bars = Array.from({ length: BARS }, (_, index) => {
      const level = index / (BARS - 1);
      return {
        y: SPACING * (index + 1),
        gap: 0.34 - 0.12 * level,
        speed: 0.0011 + 0.0008 * level,
        phase: Math.random() * Math.PI * 2,
        state: "open",
      };
    });
    particles = [];
    floaters = [];
    score = 0;
    streak = 0;
    finished = false;
    hitUntil = 0;
    shakeUntil = 0;
    lastProgress = 0;
    scoreEl.textContent = "0";
    resultEl.hidden = true;
  }

  function gapCenter(bar, time) {
    return 0.5 + 0.36 * Math.sin(bar.speed * time + bar.phase);
  }

  function ballY() {
    return height * 0.35;
  }

  function readBest() {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch {
      // Rekord je jen bonus, hra funguje i bez úložiště.
    }
  }

  function burst(x, y, palette, count, force) {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = force * (0.3 + Math.random() * 0.7);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.0008 + Math.random() * 0.0008,
        size: 2 + Math.random() * 3,
        color: palette[index % palette.length],
      });
    }
  }

  function verdictFor(value) {
    if (value === BARS) return "Flawless.";
    if (value >= BARS * 0.7) return "Very smooth.";
    if (value >= BARS * 0.4) return "Not bad.";
    return "Ouch.";
  }

  function finish() {
    finished = true;
    const best = Math.max(score, readBest());
    saveBest(best);
    verdictEl.textContent = verdictFor(score);
    finalEl.textContent = `${score} / ${BARS}`;
    bestEl.textContent = `Best: ${best} / ${BARS}`;
    resultEl.hidden = false;
    if (score === BARS) burst(width / 2, height / 2, confettiColors, 160, 0.7);
  }

  function pass() {
    score += 1;
    streak += 1;
    scoreEl.textContent = String(score);
    burst(width / 2, ballY(), [colors.bar, colors.ball], 14, 0.28);
    floaters.push({
      text: streak > 1 ? `x${streak}` : "+1",
      y: ballY() - 24,
      life: 1,
    });
  }

  function hit(time) {
    streak = 0;
    hitUntil = time + 300;
    shakeUntil = time + 220;
    burst(width / 2, ballY(), [colors.miss], 22, 0.36);
    navigator.vibrate?.(30);
  }

  // Scroll se zastavit nedá, takže náraz neblokuje pád, jen nepřipíše bod.
  function resolve(progress, time) {
    for (const bar of bars) {
      if (bar.state !== "open" || progress < bar.y) continue;
      const offset = Math.abs(gapCenter(bar, time) - 0.5) * width;
      if (offset <= (bar.gap * width) / 2 - BALL_RADIUS) {
        bar.state = "passed";
        pass();
      } else {
        bar.state = "hit";
        hit(time);
      }
    }
    if (!finished && bars.every((bar) => bar.state !== "open")) finish();
  }

  function update(delta, progress) {
    for (const particle of particles) {
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += GRAVITY * delta;
      particle.life -= particle.decay * delta;
    }
    particles = particles.filter((particle) => particle.life > 0);
    for (const floater of floaters) {
      floater.y -= 0.05 * delta;
      floater.life -= 0.0013 * delta;
    }
    floaters = floaters.filter((floater) => floater.life > 0);
    const velocity = Math.max(0, progress - lastProgress) / Math.max(delta, 1);
    tail += (Math.min(90, velocity * 60) - tail) * 0.2;
    lastProgress = progress;
  }

  function drawStars(progress) {
    ctx.fillStyle = colors.ball;
    for (const star of stars) {
      const y = (((star.y * height - progress * star.depth) % height) + height) % height;
      ctx.globalAlpha = star.depth;
      ctx.fillRect(star.x * width, y, star.size, star.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawBar(bar, y, time) {
    const center = gapCenter(bar, time) * width;
    const halfGap = (bar.gap * width) / 2;
    const left = Math.max(0, center - halfGap);
    const right = Math.min(width, center + halfGap);
    ctx.fillStyle = { open: colors.bar, hit: colors.miss, passed: colors.passed }[bar.state];
    ctx.beginPath();
    ctx.roundRect(0, y, left, BAR_HEIGHT, 6);
    ctx.roundRect(right, y, width - right, BAR_HEIGHT, 6);
    ctx.fill();
  }

  function drawBall(time) {
    const y = ballY();
    const ballColor = time < hitUntil ? colors.miss : colors.ball;
    ctx.fillStyle = ballColor;
    for (let step = 5; step > 0; step -= 1) {
      ctx.globalAlpha = 0.25 * (1 - step / 6);
      ctx.beginPath();
      ctx.arc(width / 2, y - (tail * step) / 5, BALL_RADIUS * (1 - step / 7), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowColor = ballColor;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(width / 2, y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawEffects() {
    for (const particle of particles) {
      ctx.globalAlpha = Math.max(0, particle.life);
      ctx.fillStyle = particle.color;
      ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    }
    ctx.fillStyle = colors.ball;
    ctx.font = "600 18px ui-monospace, Menlo, monospace";
    ctx.textAlign = "center";
    for (const floater of floaters) {
      ctx.globalAlpha = Math.max(0, floater.life);
      ctx.fillText(floater.text, width / 2 + 34, floater.y);
    }
    ctx.globalAlpha = 1;
  }

  function draw(progress, time) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    if (time < shakeUntil) {
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    }
    drawStars(progress);
    for (const bar of bars) {
      const y = ballY() + bar.y - progress;
      if (y > -BAR_HEIGHT && y < height) drawBar(bar, y, time);
    }
    drawBall(time);
    drawEffects();
    ctx.restore();
  }

  function frame(time) {
    if (!running) return;
    // Po návratu na obrazovku by velký skok v čase rozmetal částice.
    const delta = Math.min(50, time - lastTime);
    lastTime = time;
    const scrolled = -mount.getBoundingClientRect().top;
    const progress = Math.min(trackLength, Math.max(0, scrolled));
    resolve(progress, time);
    update(delta, progress);
    draw(progress, time);
    requestAnimationFrame(frame);
  }

  function resize() {
    const dpr = devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  mount.querySelector(".game-again").addEventListener("click", () => {
    reset();
    scrollTo({ top: mount.getBoundingClientRect().top + scrollY, behavior: "instant" });
  });

  new ResizeObserver(resize).observe(canvas);

  // Mimo obrazovku se nekreslí, aby stránka zbytečně nežrala baterii.
  new IntersectionObserver(([entry]) => {
    const wasRunning = running;
    running = entry.isIntersecting;
    if (running && !wasRunning) {
      lastTime = performance.now();
      requestAnimationFrame(frame);
    }
  }).observe(mount);

  reset();
  resize();
}
