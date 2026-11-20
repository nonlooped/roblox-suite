export {};

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const stepper = document.querySelector<HTMLElement>("[data-stepper]");
const mock = document.querySelector<HTMLElement>("[data-mock]");
const typed = mock?.querySelector<HTMLElement>(".typed");
const COMMAND = "npx skills add nonlooped/roblox-suite";

if (stepper && mock && typed) {
  const items = [...stepper.querySelectorAll<HTMLElement>("li[data-step]")];
  let typing = 0;
  let current = 0;

  const typeCommand = () => {
    clearTimeout(typing);
    mock.classList.remove("is-typed");
    if (reduced) {
      typed.textContent = COMMAND;
      mock.classList.add("is-typed");
      return;
    }
    typed.textContent = "";
    let i = 0;
    const tick = () => {
      i++;
      typed.textContent = COMMAND.slice(0, i);
      if (i < COMMAND.length) typing = window.setTimeout(tick, 18);
      else typing = window.setTimeout(() => mock.classList.add("is-typed"), 250);
    };
    typing = window.setTimeout(tick, 350);
  };

  const activate = (step: number) => {
    if (step === current) return;
    const previous = current;
    current = step;
    items.forEach((li, index) => {
      li.classList.toggle("is-active", index + 1 === step);
      li.classList.toggle("is-done", index + 1 < step);
    });
    mock.dataset.step = String(step);
    if (step === 3) typeCommand();
    else if (step === 4 && previous < 3) {
      clearTimeout(typing);
      typed.textContent = COMMAND;
      mock.classList.add("is-typed");
    } else if (step < 3) {
      clearTimeout(typing);
      typed.textContent = "";
      mock.classList.remove("is-typed");
    }
  };

  items.forEach((li, index) => {
    const head = li.querySelector<HTMLElement>(".step-head")!;
    const step = index + 1;
    head.addEventListener("click", () => activate(step));
    head.addEventListener("focus", () => activate(step));
    head.addEventListener("pointerenter", () => activate(step));
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) activate(Number((entry.target as HTMLElement).dataset.step));
      }
    },
    { rootMargin: "-45% 0px -45% 0px" },
  );
  items.forEach((li) => observer.observe(li));

  current = 0;
  activate(1);
}
