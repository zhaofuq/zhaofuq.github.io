(function () {
  const carouselApiByEl = new WeakMap();
  let carouselKeydownBound = false;

  function bindCarouselKeydown() {
    if (carouselKeydownBound) return;
    carouselKeydownBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      document.querySelectorAll("[data-carousel]").forEach((carousel) => {
        if (!carousel.matches(":hover")) return;
        const api = carouselApiByEl.get(carousel);
        if (!api) return;
        if (e.key === "ArrowLeft") {
          api.step(-1);
          api.resetAutoplay();
        } else if (e.key === "ArrowRight") {
          api.step(1);
          api.resetAutoplay();
        }
      });
    });
  }

  function initCarousel(carousel) {
    const track = carousel.querySelector("[data-carousel-track]");
    const slides = Array.from(carousel.querySelectorAll("[data-carousel-slide]"));
    const prev = carousel.querySelector('[data-carousel-dir="prev"]');
    const next = carousel.querySelector('[data-carousel-dir="next"]');
    const dotsRoot = carousel.querySelector("[data-carousel-dots]");
    if (!track || !slides.length) return;

    let index = 0;
    let autoplay = window.setInterval(() => step(1), 7000);
    let touchStartX = null;

    function render() {
      track.style.transform = `translateX(-${index * 100}%)`;
      dotsRoot?.querySelectorAll("button").forEach((dot, i) => {
        dot.setAttribute("aria-current", i === index ? "true" : "false");
      });
    }

    function step(delta) {
      index = (index + delta + slides.length) % slides.length;
      render();
    }

    function resetAutoplay() {
      window.clearInterval(autoplay);
      autoplay = window.setInterval(() => step(1), 7000);
    }

    carouselApiByEl.set(carousel, { step, resetAutoplay });

    slides.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "carousel-dot";
      b.setAttribute("aria-label", "Slide " + (i + 1));
      b.addEventListener("click", () => {
        index = i;
        render();
        resetAutoplay();
      });
      dotsRoot?.appendChild(b);
    });

    prev?.addEventListener("click", () => {
      step(-1);
      resetAutoplay();
    });
    next?.addEventListener("click", () => {
      step(1);
      resetAutoplay();
    });

    carousel.addEventListener("mouseenter", () => window.clearInterval(autoplay));
    carousel.addEventListener("mouseleave", resetAutoplay);

    carousel.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );
    carousel.addEventListener(
      "touchend",
      (e) => {
        if (touchStartX == null) return;
        const dx = e.changedTouches[0].screenX - touchStartX;
        if (dx > 50) step(-1);
        else if (dx < -50) step(1);
        touchStartX = null;
        resetAutoplay();
      },
      { passive: true }
    );

    bindCarouselKeydown();
    render();
  }

  document.querySelectorAll("[data-carousel]").forEach(initCarousel);

  document.querySelectorAll(".results-showcase").forEach((showcase) => {
    const thumbs = showcase.querySelectorAll(".results-thumb-btn");
    thumbs.forEach((btn) => {
      btn.addEventListener("click", () => {
        thumbs.forEach((b) => {
          const on = b === btn;
          b.classList.toggle("is-active", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
      });
    });
  });

  document.querySelectorAll("[data-compare-viewport]").forEach((viewport) => {
    function setFromClientX(clientX) {
      const rect = viewport.getBoundingClientRect();
      if (rect.width <= 0) return;
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(2, Math.min(98, pct));
      viewport.style.setProperty("--compare-x", pct + "%");
    }
    viewport.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      if (e.pointerType === "mouse" && e.button !== 0) return;
      viewport.setPointerCapture(e.pointerId);
      setFromClientX(e.clientX);
    });
    viewport.addEventListener("pointermove", (e) => {
      if (!viewport.hasPointerCapture(e.pointerId)) return;
      e.stopPropagation();
      setFromClientX(e.clientX);
    });
    viewport.addEventListener("pointerup", (e) => {
      e.stopPropagation();
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    });
    viewport.addEventListener("pointercancel", (e) => {
      e.stopPropagation();
      if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) en.target.classList.add("is-visible");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));
})();
