export {};
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
const desktop = matchMedia("(min-width: 64rem) and (min-height: 37.5rem)");

interface Info {
  el: HTMLAnchorElement;
  name: string;
  asks: string[];
  icon: string;
}

const tiles = [...document.querySelectorAll<HTMLAnchorElement>(".tile")];
const info: Info[] = tiles.map((el) => ({
  el,
  name: el.dataset.name!,
  asks: JSON.parse(el.dataset.asks!),
  icon: el.querySelector(".tile-glyph")!.innerHTML,
}));

const plane = document.querySelector<HTMLElement>(".board-plane");
const typed = document.querySelector<HTMLElement>(".console-typed")!;
const chip = document.querySelector<HTMLElement>(".console-chip")!;
const chipIcon = chip.querySelector<HTMLElement>(".chip-icon")!;
const chipName = chip.querySelector<HTMLElement>(".chip-name")!;
const toggle = document.querySelector<HTMLButtonElement>(".console-toggle")!;

/* Tilt that follows the pointer. */
if (plane && canHover && !reduced) {
  let tx = 0;
  let ty = 0;
  let cx = 0;
  let cy = 0;
  let raf = 0;
  const step = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    plane.style.setProperty("--tx", `${cx.toFixed(3)}deg`);
    plane.style.setProperty("--ty", `${cy.toFixed(3)}deg`);
    raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(step) : 0;
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(step);
  };
  addEventListener(
    "pointermove",
    (event) => {
      if (!desktop.matches) return;
      ty = (event.clientX / innerWidth - 0.5) * 12;
      tx = -(event.clientY / innerHeight - 0.5) * 12;
      kick();
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => {
    tx = 0;
    ty = 0;
    kick();
  });
}

/* Prompt console and the demo that drives it. */
const CANCELLED = Symbol("cancelled");
let generation = 0;
let userPaused = false;
let resumeTimer = 0;
let lit = -1;

const sleep = (ms: number, run: number) =>
  new Promise<void>((resolve, reject) =>
    setTimeout(() => (run === generation ? resolve() : reject(CANCELLED)), ms),
  );

const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789#%&*+";

function setLit(index: number) {
  if (lit === index) return;
  if (lit >= 0) info[lit].el.classList.remove("is-lit");
  lit = index;
  if (index < 0) return;
  const { el } = info[index];
  el.classList.add("is-lit");
  window.dispatchEvent(new CustomEvent("skill-pulse"));
  const ring = el.querySelector<HTMLElement>(".tile-ring");
  if (ring && !reduced) {
    ring.animate(
      [
        { opacity: 0.85, transform: "scale(0.96)" },
        { opacity: 0, transform: "scale(1.28)" },
      ],
      { duration: 800, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }
}

function paintChip(index: number) {
  const { icon } = info[index];
  chip.classList.add("is-on");
  chipIcon.innerHTML = icon;
}

function clearChip() {
  chip.classList.remove("is-on");
  chipName.textContent = "";
  chipIcon.innerHTML = "";
}

const quote = (text: string, done: boolean) => (text ? `\u201C${text}${done ? "\u201D" : ""}` : "");

async function typeText(text: string, ms: number, run: number) {
  for (let i = 1; i <= text.length; i++) {
    typed.textContent = quote(text.slice(0, i), i === text.length);
    await sleep(ms, run);
  }
}

async function eraseText(run: number) {
  let text = typed.textContent!.replace(/[\u201C\u201D]/g, "");
  while (text.length > 0) {
    text = text.slice(0, -3);
    typed.textContent = quote(text, false);
    await sleep(8, run);
  }
  typed.textContent = "";
}

async function decode(name: string, run: number, total = 350) {
  const frames = Math.max(1, Math.round(total / 35));
  for (let f = 0; f <= frames; f++) {
    const reveal = Math.floor((f / frames) * name.length);
    chipName.textContent = [...name]
      .map((ch, i) => (i < reveal || ch === " " ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join("");
    if (f < frames) await sleep(35, run);
  }
  chipName.textContent = name;
}

function showStatic(index: number, askIndex = 0) {
  setLit(index);
  paintChip(index);
  chipName.textContent = info[index].name;
  typed.textContent = quote(info[index].asks[askIndex], true);
}

const shuffled = () => {
  const order = info.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

function startLoop() {
  const run = ++generation;
  (async () => {
    try {
      await eraseText(run);
      setLit(-1);
      clearChip();
      let round = 0;
      for (;;) {
        for (const index of shuffled()) {
          const ask = info[index].asks[round % 3];
          await typeText(ask, 28, run);
          setLit(index);
          paintChip(index);
          await decode(info[index].name, run);
          await sleep(2400, run);
          setLit(-1);
          await eraseText(run);
          clearChip();
          await sleep(200, run);
        }
        round++;
      }
    } catch (error) {
      if (error !== CANCELLED) throw error;
    }
  })();
}

function showSkill(index: number) {
  clearTimeout(resumeTimer);
  const run = ++generation;
  (async () => {
    try {
      setLit(index);
      paintChip(index);
      chipName.textContent = info[index].name;
      typed.textContent = "";
      await typeText(info[index].asks[0], 10, run);
    } catch (error) {
      if (error !== CANCELLED) throw error;
    }
  })();
}

function release() {
  clearTimeout(resumeTimer);
  if (userPaused || reduced) return;
  resumeTimer = window.setTimeout(startLoop, 1200);
}

const datastores = Math.max(0, tiles.findIndex((t) => t.dataset.slug === "roblox-datastores"));

if (reduced) {
  showStatic(datastores);
  toggle.hidden = true;
} else {
  showStatic(datastores);
  setTimeout(() => {
    if (!userPaused && generation === 0) startLoop();
  }, 1800);
}

info.forEach(({ el }, index) => {
  const enter = () => showSkill(index);
  el.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") enter();
  });
  el.addEventListener("focus", enter);
  el.addEventListener("pointerleave", release);
  el.addEventListener("blur", release);
});

toggle.addEventListener("click", () => {
  userPaused = !userPaused;
  toggle.setAttribute("aria-pressed", String(userPaused));
  toggle.setAttribute("aria-label", userPaused ? "Play demo" : "Pause demo");
  clearTimeout(resumeTimer);
  if (userPaused) generation++;
  else startLoop();
});
