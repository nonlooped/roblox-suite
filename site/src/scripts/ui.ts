export {};
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* Copy buttons, one delegated handler. */
document.addEventListener("click", async (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-copy]");
  if (!button) return;
  const label = button.querySelector<HTMLElement>("[data-copy-label]")!;
  let text = button.dataset.copiedLabel ?? "Copied";
  let copied = true;
  try {
    await navigator.clipboard.writeText(button.dataset.copy!);
  } catch {
    copied = false;
    text = "Copy manually";
    const code = button.closest(".cmd")?.querySelector("code") ??
      button.querySelector("[data-copy-source]") ??
      button.closest("[data-copy-scope]")?.querySelector("[data-copy-source]");
    if (code) getSelection()?.selectAllChildren(code);
  }
  label.textContent = text;
  button.classList.toggle("is-copied", copied);
  const burst = button.closest(".cmd")?.querySelector<HTMLElement>(".cmd-burst");
  if (copied && burst && !reduced) {
    burst.animate(
      [
        { opacity: 0.9, transform: "scale(0.985)" },
        { opacity: 0, transform: "scale(1.09, 1.35)" },
      ],
      { duration: 650, easing: "cubic-bezier(0.23, 1, 0.32, 1)" },
    );
  }
  clearTimeout(Number(button.dataset.timer));
  button.dataset.timer = String(
    setTimeout(() => {
      label.textContent = button.dataset.idleLabel ?? "Copy";
      button.classList.remove("is-copied");
    }, 2200),
  );
});

/* Pointer spotlight, dot-grid mask and per-element proximity light, one rAF-throttled handler. */
if (canHover) {
  const root = document.documentElement;
  const glowers = [...document.querySelectorAll<HTMLElement>("[data-glow]")];
  let frame = 0;
  let px = 0;
  let py = 0;

  const paint = () => {
    frame = 0;
    root.style.setProperty("--px", `${px}px`);
    root.style.setProperty("--py", `${py}px`);
    for (const el of glowers) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < -200 || rect.top > innerHeight + 200) continue;
      el.style.setProperty("--mx", `${px - rect.left}px`);
      el.style.setProperty("--my", `${py - rect.top}px`);
    }
  };

  addEventListener(
    "pointermove",
    (event) => {
      px = event.clientX;
      py = event.clientY;
      root.classList.add("has-pointer");
      if (!frame) frame = requestAnimationFrame(paint);
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => root.classList.remove("has-pointer"));
}

/* Nav: one pill glides between links. */
const nav = document.querySelector<HTMLElement>(".nav");
const pill = nav?.querySelector<HTMLElement>(".nav-pill");
if (nav && pill) {
  const moveTo = (link: HTMLElement) => {
    const fresh = !pill.classList.contains("is-on");
    if (fresh) pill.style.transition = "opacity 150ms ease";
    pill.style.width = `${link.offsetWidth}px`;
    pill.style.transform = `translate(${link.offsetLeft}px, ${link.offsetTop}px)`;
    if (fresh) {
      pill.getBoundingClientRect();
      pill.style.transition = "";
    }
    pill.classList.add("is-on");
  };
  const links = nav.querySelectorAll<HTMLElement>("a");
  for (const link of links) {
    link.addEventListener("pointerenter", () => moveTo(link));
    link.addEventListener("focus", () => moveTo(link));
  }
  nav.addEventListener("pointerleave", () => pill.classList.remove("is-on"));
  nav.addEventListener("focusout", () => pill.classList.remove("is-on"));
}

/* Magnetic buttons. */
if (canHover && !reduced) {
  for (const el of document.querySelectorAll<HTMLElement>("[data-magnetic]")) {
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const dx = ((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 4;
      const dy = ((event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 4;
      el.style.setProperty("--tx", `${dx.toFixed(2)}px`);
      el.style.setProperty("--ty", `${dy.toFixed(2)}px`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
    });
  }
}

/* Header island tightens once the page scrolls. */
if (!document.documentElement.classList.contains("is-landing")) {
  const root = document.documentElement;
  const update = () => root.classList.toggle("is-stuck", scrollY > 24);
  addEventListener("scroll", update, { passive: true });
  update();
}
