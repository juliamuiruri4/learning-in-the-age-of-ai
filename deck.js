function boundedSlide(number, total) {
  return Math.max(1, Math.min(total, number));
}

function parseSlideHash(hash, total) {
  const match = /^#slide-([1-9]\d*)$/.exec(hash);
  if (!match) return null;
  const number = Number(match[1]);
  return Number.isSafeInteger(number) && number <= total ? number : null;
}

function initDeck() {
  const deck = document.querySelector("#deck");
  const slides = [...deck.querySelectorAll("[data-slide]")];
  const previous = document.querySelector("#previous");
  const next = document.querySelector("#next");
  const counter = document.querySelector("#slide-counter");
  const progress = document.querySelector("#progress-track");
  const fill = document.querySelector("#progress-fill");
  const announcement = document.querySelector("#slide-announcement");
  const help = document.querySelector("#help-dialog");
  let current = 0;
  let touchStart = null;
  let suppressClickUntil = 0;

  function showSlide(number, updateHistory = true) {
    const target = boundedSlide(number, slides.length);
    if (target === current) return;
    if (current) {
      const departing = slides[current - 1];
      departing.querySelectorAll("video").forEach((video) => video.pause());
      departing.hidden = true;
    }
    const arriving = slides[target - 1];
    arriving.hidden = false;
    current = target;
    counter.textContent = `${String(current).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    progress.setAttribute("aria-valuenow", String(current));
    fill.style.transform = `scaleX(${current / slides.length})`;
    previous.disabled = current === 1;
    next.disabled = current === slides.length;
    announcement.textContent = slides[current - 1].getAttribute("aria-label");
    arriving.querySelectorAll("video").forEach((video) => {
      video.play().catch(() => {});
    });
    if (updateHistory) history.pushState(null, "", `#slide-${current}`);
  }

  function move(direction) {
    showSlide(current + direction);
  }

  function moveForKey(key) {
    if (["ArrowRight", "PageDown", " "].includes(key)) move(1);
    else if (["ArrowLeft", "PageUp"].includes(key)) move(-1);
    else if (key === "Home") showSlide(1);
    else if (key === "End") showSlide(slides.length);
    else return false;
    return true;
  }

  const initial = parseSlideHash(location.hash, slides.length) ?? 1;
  slides.forEach((slide) => { slide.hidden = true; });
  showSlide(initial, false);
  if (parseSlideHash(location.hash, slides.length) === null) history.replaceState(null, "", "#slide-1");
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));

  document.addEventListener("keydown", (event) => {
    if (help.open || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof Element && event.target.closest("button, a, input, textarea, select, [contenteditable]")) return;
    if (moveForKey(event.key)) event.preventDefault();
  });

  deck.addEventListener("click", (event) => {
    if (Date.now() < suppressClickUntil || window.getSelection()?.toString()) return;
    const middle = deck.getBoundingClientRect().left + deck.getBoundingClientRect().width / 2;
    move(event.clientX < middle ? -1 : 1);
  });
  deck.addEventListener("pointerdown", (event) => { if (event.pointerType === "touch") touchStart = { x: event.clientX, y: event.clientY }; });
  deck.addEventListener("pointerup", (event) => {
    if (!touchStart || event.pointerType !== "touch") return;
    const dx = event.clientX - touchStart.x;
    const dy = event.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    suppressClickUntil = Date.now() + 400;
    move(dx < 0 ? 1 : -1);
  });
  deck.addEventListener("pointercancel", () => { touchStart = null; });
  window.addEventListener("hashchange", () => showSlide(parseSlideHash(location.hash, slides.length) ?? 1, false));
  document.querySelector("#help-button").addEventListener("click", () => help.showModal());
  document.querySelector("#close-help").addEventListener("click", () => help.close());
}

initDeck();
