const root = document.documentElement;
root.classList.add("js");

let frame = 0;

addEventListener(
  "pointermove",
  (event) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      root.style.setProperty("--x", `${event.clientX}px`);
      root.style.setProperty("--y", `${event.clientY}px`);
    });
  },
  { passive: true },
);
