/* enhancements — page content works without this file */
(function () {
  "use strict";

  var MOTION_MS = 1500;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothScrollTo(y, duration) {
    duration = duration || 1100;
    var reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      window.scrollTo(0, y);
      return;
    }
    var start = window.pageYOffset || document.documentElement.scrollTop || 0;
    var diff = y - start;
    if (Math.abs(diff) < 2) return;
    var t0 = null;
    function step(now) {
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, start + diff * easeInOutCubic(t));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function bindSmoothAnchors() {
    var links = document.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (e) {
        var href = this.getAttribute("href");
        if (!href || href === "#") return;
        var id = href.slice(1);
        var el = document.getElementById(id);
        if (!el) return;
        e.preventDefault();
        var top =
          el.getBoundingClientRect().top +
          (window.pageYOffset || document.documentElement.scrollTop);
        smoothScrollTo(top, 1100);
        if (history && history.replaceState) {
          history.replaceState(null, "", href);
        }
      });
    }
  }

  function startMotions() {
    var frames = document.querySelectorAll("[data-motion]");
    for (var f = 0; f < frames.length; f++) {
      (function (frame) {
        var imgs = frame.querySelectorAll("img");
        if (imgs.length < 2) return;
        var i = 0;
        for (var j = 0; j < imgs.length; j++) {
          if (j === 0) imgs[j].classList.add("is-active");
          else imgs[j].classList.remove("is-active");
        }
        setInterval(function () {
          imgs[i].classList.remove("is-active");
          i = (i + 1) % imgs.length;
          imgs[i].classList.add("is-active");
        }, MOTION_MS);
      })(frames[f]);
    }
  }

  /* natural image ratios — no forced crop frame */
  function syncPairRatios() {
    /* no-op: pairs use each image's intrinsic aspect ratio */
  }

  function bindNavHighlight() {
    var works = document.getElementById("works");
    var archive = document.getElementById("archive");
    var navs = document.querySelectorAll("[data-nav]");
    if (!works || !navs.length) return;

    function setActive(name) {
      for (var i = 0; i < navs.length; i++) {
        if (navs[i].getAttribute("data-nav") === name) {
          navs[i].classList.add("is-active");
        } else {
          navs[i].classList.remove("is-active");
        }
      }
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!archive) {
          setActive("works");
          return;
        }
        var aTop = archive.getBoundingClientRect().top;
        setActive(aTop < window.innerHeight * 0.45 ? "archive" : "works");
      },
      { passive: true }
    );
  }

  /* ---------- lightbox on project detail pages ---------- */

  function bindLightbox() {
    var detail = document.querySelector(".detail");
    if (!detail) return;

    var sources = [];
    var seen = {};
    var imgs = detail.querySelectorAll(".project__media img");
    for (var i = 0; i < imgs.length; i++) {
      var src = imgs[i].currentSrc || imgs[i].src;
      if (!src || seen[src]) continue;
      seen[src] = true;
      sources.push(src);
    }
    if (!sources.length) return;

    var root = document.createElement("div");
    root.className = "lightbox";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "image viewer");
    root.innerHTML =
      '<button type="button" class="lightbox__btn lightbox__close" aria-label="close">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
      '<path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg></button>' +
      '<button type="button" class="lightbox__btn lightbox__prev" aria-label="previous image">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
      '<path d="M15 5l-7 7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<img class="lightbox__img" alt="" />' +
      '<button type="button" class="lightbox__btn lightbox__next" aria-label="next image">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
      '<path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<div class="lightbox__counter" aria-live="polite"></div>';
    document.body.appendChild(root);

    var imgEl = root.querySelector(".lightbox__img");
    var counterEl = root.querySelector(".lightbox__counter");
    var btnClose = root.querySelector(".lightbox__close");
    var btnPrev = root.querySelector(".lightbox__prev");
    var btnNext = root.querySelector(".lightbox__next");
    var index = 0;
    var open = false;

    function render() {
      imgEl.src = sources[index];
      counterEl.textContent = index + 1 + " / " + sources.length;
      var multi = sources.length > 1;
      btnPrev.style.display = multi ? "" : "none";
      btnNext.style.display = multi ? "" : "none";
    }

    function show(i) {
      index = (i + sources.length) % sources.length;
      render();
      root.classList.add("is-open");
      document.body.classList.add("lightbox-open");
      open = true;
    }

    function hide() {
      root.classList.remove("is-open");
      document.body.classList.remove("lightbox-open");
      open = false;
    }

    function next() {
      show(index + 1);
    }

    function prev() {
      show(index - 1);
    }

    for (var j = 0; j < imgs.length; j++) {
      (function (img) {
        img.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          var src = img.currentSrc || img.src;
          var idx = sources.indexOf(src);
          if (idx < 0) idx = 0;
          show(idx);
        });
      })(imgs[j]);
    }

    btnClose.addEventListener("click", function (e) {
      e.stopPropagation();
      hide();
    });
    btnPrev.addEventListener("click", function (e) {
      e.stopPropagation();
      prev();
    });
    btnNext.addEventListener("click", function (e) {
      e.stopPropagation();
      next();
    });

    /* click dark background (not image / not arrows / not close) closes */
    root.addEventListener("click", function (e) {
      if (e.target === root) hide();
    });

    /* stop image area from closing when clicking the photo itself — already pointer-events none on img */
    imgEl.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    document.addEventListener("keydown", function (e) {
      if (!open) return;
      if (e.key === "Escape") hide();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    });
  }

  function init() {
    bindSmoothAnchors();
    startMotions();
    syncPairRatios();
    bindNavHighlight();
    bindLightbox();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
