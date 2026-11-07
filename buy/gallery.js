// /buy/ picture gallery: a swipeable viewer, a thumbnail strip and a full-screen view.
(() => {
  document.documentElement.classList.remove("no-js");
  const track = document.querySelector(".slides");
  if (!track) return;
  const slides = [...track.querySelectorAll(".zoom")];
  const thumbs = [...document.querySelectorAll(".thumb")];
  const rail = document.querySelector(".rail");
  const viewer = document.querySelector(".viewer");
  const lb = document.querySelector(".lb");
  const lbImg = lb.querySelector("img");
  const lbCap = lb.querySelector(".lb-cap");
  const n = slides.length;
  const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  let cur = 0;

  const wrap = (i) => (i + n) % n;

  function mark(i) {
    if (i === cur) return;
    cur = i;
    thumbs.forEach((t, k) => t.toggleAttribute("aria-current", k === i));
    // Keep the active thumbnail in view inside the rail, without scrolling the page.
    const t = thumbs[i];
    rail.scrollTo({ left: t.offsetLeft - rail.clientWidth / 2 + t.offsetWidth / 2 - rail.offsetLeft, behavior: smooth });
  }

  function go(i, behavior = smooth) {
    i = wrap(i);
    track.scrollTo({ left: i * track.clientWidth, behavior });
    mark(i);
  }

  // Swipes and trackpad scrolls move the track; follow along.
  let raf = 0;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => mark(Math.round(track.scrollLeft / track.clientWidth)));
  }, { passive: true });

  viewer.querySelector(".prev").addEventListener("click", () => go(cur - 1));
  viewer.querySelector(".next").addEventListener("click", () => go(cur + 1));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); }
  });

  thumbs.forEach((t, i) => t.addEventListener("click", () => go(i, "auto")));

  // Keep the current photo lined up when the viewer is resized.
  addEventListener("resize", () => track.scrollTo({ left: cur * track.clientWidth }));

  // Lightbox
  function show(i) {
    i = wrap(i);
    const s = slides[i];
    lbImg.src = s.dataset.lg;
    lbImg.alt = s.querySelector("img").alt;
    lbCap.textContent = lbImg.alt;
    lb.querySelector(".now").textContent = i + 1;
    lb.dataset.i = i;
    // Warm the neighbours so arrowing through is instant.
    [i - 1, i + 1].forEach((k) => { new Image().src = slides[wrap(k)].dataset.lg; });
  }
  const step = (d) => show(+lb.dataset.i + d);

  slides.forEach((s, i) => s.addEventListener("click", () => {
    show(i);
    lb.showModal();
  }));
  lb.querySelector(".lb-close").addEventListener("click", () => lb.close());
  lb.querySelector(".prev").addEventListener("click", () => step(-1));
  lb.querySelector(".next").addEventListener("click", () => step(1));
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  // Click the dark area around the photo to close (but not at the end of a swipe).
  let swiped = false;
  lb.addEventListener("click", (e) => {
    if (swiped) { swiped = false; return; }
    if (e.target === lb || e.target.classList.contains("lb-stage")) lb.close();
  });
  // Bring the page viewer to the photo you ended on.
  lb.addEventListener("close", () => go(+lb.dataset.i, "auto"));

  // Swipe in the lightbox.
  let x0 = null;
  const stage = lb.querySelector(".lb-stage");
  stage.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
  stage.addEventListener("pointerup", (e) => {
    if (x0 === null) return;
    const dx = e.clientX - x0;
    x0 = null;
    swiped = Math.abs(dx) > 50;
    if (swiped) step(dx < 0 ? 1 : -1);
  });
})();
