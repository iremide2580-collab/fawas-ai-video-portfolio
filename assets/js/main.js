/* =========================================================================
   Fawas AI Video Portfolio — site behaviour
   -------------------------------------------------------------------------
   1. Renders the gallery, filters, about lists and socials from data.js
   2. Lazy-loads every video below the fold
   3. Plays only the video that is actually in view (plus hover previews)
   4. Lightbox player with sound, keyboard arrows and a focus-returning close
   ========================================================================= */

(() => {
  "use strict";

  const S = window.SITE;
  if (!S) return;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const hoverFine = window.matchMedia("(hover: hover) and (pointer: fine)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const fileName = (path) => String(path).split("/").pop();

  /* ---------------------------------------------------------------- data bind */
  const readPath = (obj, path) =>
    path
      .replace(/\[(\d+)\]/g, ".$1")
      .split(".")
      .reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

  $$("[data-bind]").forEach((el) => {
    const value = readPath(S, el.dataset.bind);
    if (typeof value === "string") el.textContent = value;
  });

  /* ------------------------------------------------------------- icon helper */
  const icon = (name, cls = "ico") =>
    `<svg class="${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"></use></svg>`;

  /* ------------------------------------------------------------- hero content */
  const featuredIndex = Math.max(
    0,
    S.videos.findIndex((v) => v.featured)
  );
  const featured = S.videos[featuredIndex];

  const heroMeta = $("#heroMeta");
  if (heroMeta && Array.isArray(S.hero.meta)) {
    heroMeta.innerHTML = S.hero.meta.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  const showreel = $("#showreel");
  let playShowreel = () => {};
  const showreelVideo = $("#showreelVideo");
  const showreelSpec = $("#showreelSpec");

  if (featured && showreelVideo) {
    showreelVideo.src = featured.src;
    if (featured.poster) showreelVideo.poster = featured.poster;
    showreelVideo.addEventListener("error", () => showreel.classList.add("is-missing"));
    showreelVideo.addEventListener("loadeddata", () => {
      showreel.classList.remove("is-missing");
      playShowreel();
    });
    if (showreelSpec) {
      showreelSpec.textContent = `${featured.duration} · ${
        featured.orientation === "vertical" ? "9:16" : "16:9"
      } · 2026`;
    }
  }

  /* --------------------------------------------------------------- about/socials */
  const aboutSkills = $("#aboutSkills");
  if (aboutSkills) {
    aboutSkills.innerHTML = (S.about.skills || [])
      .map((skill) => `<li class="chip">${escapeHtml(skill)}</li>`)
      .join("");
  }

  const aboutTools = $("#aboutTools");
  if (aboutTools) {
    aboutTools.innerHTML = (S.about.tools || [])
      .map((tool) => `<li>${escapeHtml(tool)}</li>`)
      .join("");
  }

  const socialTemplate = (s, compact) => {
    const external = /^https?:/i.test(s.href);
    const label = external && !compact ? `${s.label} (opens in a new tab)` : s.label;
    return `
    <li>
      <a class="social" href="${escapeHtml(s.href)}"${
      external ? ' target="_blank" rel="noopener noreferrer"' : ""
    } aria-label="${escapeHtml(label)}">
        ${icon(s.icon)}
        ${compact ? "" : `<span>${escapeHtml(s.label)}</span>`}
      </a>
    </li>`;
  };

  const socials = S.contact.socials || [];
  const socialList = $("#socials");
  if (socialList) socialList.innerHTML = socials.map((s) => socialTemplate(s, false)).join("");
  const footerSocials = $("#footerSocials");
  if (footerSocials) footerSocials.innerHTML = socials.map((s) => socialTemplate(s, true)).join("");

  /* ------------------------------------------------------------------ services */
  const servicesEl = $("#services");
  if (servicesEl) {
    servicesEl.innerHTML = (S.services || [])
      .map(
        (service, i) => `
        <article class="service reveal" style="--d:${i * 0.06}s">
          <div class="service__top">
            <span class="service__icon">${icon(service.icon)}</span>
            <span class="service__num">0${i + 1}</span>
          </div>
          <h3 class="service__title">${escapeHtml(service.title)}</h3>
          <p class="service__text">${escapeHtml(service.text)}</p>
          <ul class="service__tags">
            ${(service.tags || [])
              .map((tag) => `<li class="service__tag">${escapeHtml(tag)}</li>`)
              .join("")}
          </ul>
        </article>`
      )
      .join("");
  }

  /* ------------------------------------------------------------------- gallery */
  const gallery = $("#gallery");
  const filtersEl = $("#filters");
  const statusEl = $("#galleryStatus");
  const cards = [];
  let activeFilter = "all";
  let visibleIndices = S.videos.map((_, i) => i);

  const categoryLabel = (video) =>
    video.badge ||
    ({ gameplay: "Gameplay", scenes: "Scene", vertical: "9:16", featured: "Showreel" }[
      video.category
    ] ||
      "Edit");

  const buildCard = (video, index) => {
    const article = document.createElement("article");
    article.className =
      "card reveal" +
      (video.featured ? " card--featured" : "") +
      (video.orientation === "vertical" ? " card--vertical" : "");
    article.dataset.category = video.category;
    article.dataset.index = String(index);
    article.style.setProperty("--d", `${Math.min(index, 6) * 0.05}s`);

    article.innerHTML = `
      <div class="card__media">
        <video class="card__video" muted loop playsinline preload="metadata"
               ${video.poster ? `poster="${escapeHtml(video.poster)}"` : ""}
               data-src="${escapeHtml(video.src)}"
               aria-hidden="true" tabindex="-1"></video>

        <div class="card__fallback" aria-hidden="true">
          ${icon("film")}
          <span>Preview unavailable<br><code>${escapeHtml(fileName(video.src))}</code></span>
        </div>

        <div class="card__badges" aria-hidden="true">
          <span class="badge${video.featured ? " badge--accent" : ""}">${escapeHtml(
      video.featured ? "Featured" : categoryLabel(video)
    )}</span>
          <span class="badge">${escapeHtml(video.duration || "")}</span>
        </div>

        <span class="card__play" aria-hidden="true">${icon("play")}</span>
        <button class="card__hit" type="button" aria-label="Play ${escapeHtml(
          video.title
        )} — ${escapeHtml(video.label)} with sound"></button>
      </div>

      <div class="card__body">
        <div>
          <h3 class="card__title">${escapeHtml(video.title)}</h3>
          <p class="card__label">${escapeHtml(video.label)}</p>
        </div>
        ${icon("arrow", "ico card__arrow")}
      </div>`;

    const videoEl = $(".card__video", article);
    videoEl.addEventListener("error", () => {
      article.classList.add("is-missing");
      videoEl.dataset.failed = "1";
    });
    // A file that eventually arrives (slow disk, brief network drop) should clear
    // the placeholder instead of leaving the card dead for the whole visit.
    videoEl.addEventListener("loadeddata", () => {
      videoEl.dataset.failed = "0";
      article.classList.remove("is-missing");
      if (article === activeCard && !lightboxOpen && !document.hidden) {
        const attempt = videoEl.play();
        if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
      }
    });

    return article;
  };

  if (gallery) {
    S.videos.forEach((video, index) => {
      const card = buildCard(video, index);
      cards.push(card);
      gallery.appendChild(card);
    });
  }

  /* -------------------------------------------------------------- filter tabs */
  const countFor = (id) =>
    id === "all" ? S.videos.length : S.videos.filter((v) => v.category === id).length;

  const setFilter = (id) => {
    activeFilter = id;
    visibleIndices = [];

    cards.forEach((card, index) => {
      const match = id === "all" || S.videos[index].category === id;
      card.classList.toggle("is-hidden", !match);
      if (match) {
        visibleIndices.push(index);
        if (!reduceMotion.matches && card.animate) {
          card.animate(
            [
              { opacity: 0, transform: "translateY(10px)" },
              { opacity: 1, transform: "none" },
            ],
            { duration: 320, easing: "cubic-bezier(.22,.61,.36,1)" }
          );
        }
      }
    });

    $$(".filter", filtersEl).forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.dataset.filter === id));
    });

    if (statusEl) {
      const label = (S.filters.find((f) => f.id === id) || { label: "All" }).label;
      statusEl.textContent = `${visibleIndices.length} ${
        visibleIndices.length === 1 ? "edit" : "edits"
      } · ${label}`;
    }

    refreshPlayback();
  };

  if (filtersEl) {
    filtersEl.innerHTML = S.filters
      .map(
        (filter) => `
        <button class="filter" type="button" data-filter="${escapeHtml(filter.id)}"
                aria-pressed="${filter.id === "all"}">
          ${escapeHtml(filter.label)}<span class="filter__count">${countFor(filter.id)}</span>
        </button>`
      )
      .join("");

    filtersEl.addEventListener("click", (event) => {
      const btn = event.target.closest(".filter");
      if (btn) setFilter(btn.dataset.filter);
    });
  }

  /* --------------------------------------------------------------- lazy load */
  const ensureSource = (video) => {
    if (!video.dataset.src || video.src) return;
    video.src = video.dataset.src;
  };

  const lazyObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        ensureSource(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "500px 0px" }
  );

  cards.forEach((card) => lazyObserver.observe($(".card__video", card)));

  /* ------------------------------------------------- playback orchestration */
  const cardRatios = new Map();
  let hoveredCard = null;
  let activeCard = null;
  let lightboxOpen = false;

  const playVideo = (card) => {
    if (!card) return;
    const video = $(".card__video", card);
    if (!video) return;
    ensureSource(video);
    if (video.error || video.dataset.failed === "1") {
      // Retry a couple of times before giving up: a single dropped request used
      // to mark the card unavailable until the page was reloaded.
      const tries = Number(video.dataset.retries || "0");
      if (tries < 2) {
        video.dataset.retries = String(tries + 1);
        video.load();
        const retry = video.play();
        if (retry && typeof retry.catch === "function") retry.catch(() => {});
        return;
      }
      card.classList.add("is-missing");
      return;
    }
    const attempt = video.play();
    if (attempt && typeof attempt.then === "function") {
      attempt
        .then(() => card.classList.add("is-playing"))
        .catch(() => card.classList.remove("is-playing"));
    } else {
      card.classList.add("is-playing");
    }
  };

  const pauseVideo = (card) => {
    const video = card && $(".card__video", card);
    if (video && !video.paused) video.pause();
    if (card) card.classList.remove("is-playing");
  };

  const pauseAllCards = () => cards.forEach(pauseVideo);

  const refreshPlayback = () => {
    if (lightboxOpen || reduceMotion.matches) {
      activeCard = null;
      pauseAllCards();
      return;
    }

    let target = null;

    if (hoverFine.matches && hoveredCard && !hoveredCard.classList.contains("is-hidden")) {
      target = hoveredCard;
    } else {
      let best = 0;
      cardRatios.forEach((ratio, card) => {
        if (!card || card.classList.contains("is-hidden")) return;
        if (ratio >= 0.6 && ratio > best) {
          best = ratio;
          target = card;
        }
      });
    }

    activeCard = target;
    cards.forEach((card) => {
      if (card === target) playVideo(card);
      else pauseVideo(card);
    });
  };

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // the observer watches .card__media, but playback is decided per card
        const card = entry.target.closest(".card");
        if (!card) return;
        if (entry.isIntersecting) cardRatios.set(card, entry.intersectionRatio);
        else cardRatios.delete(card);
      });
      refreshPlayback();
    },
    { threshold: [0, 0.25, 0.6, 0.9, 1] }
  );

  cards.forEach((card) => visibilityObserver.observe(card.querySelector(".card__media")));

  // Hover previews (pointer devices only)
  if (hoverFine.matches) {
    cards.forEach((card) => {
      card.addEventListener("pointerenter", (event) => {
        if (event.pointerType === "touch") return;
        hoveredCard = card;
        refreshPlayback();
      });
      card.addEventListener("pointerleave", () => {
        if (hoveredCard === card) hoveredCard = null;
        refreshPlayback();
      });
    });
  }

  // Hero showreel: muted loop only while it is on screen
  let heroInView = false;
  playShowreel = () => {
    if (!showreelVideo) return;
    if (lightboxOpen || reduceMotion.matches || document.hidden || !heroInView) return;

    // Recover from a dropped request instead of leaving the hero unavailable.
    if (showreelVideo.error) {
      const tries = Number(showreelVideo.dataset.retries || "0");
      if (tries >= 2) {
        showreel.classList.add("is-missing");
        return;
      }
      showreelVideo.dataset.retries = String(tries + 1);
      showreelVideo.load();
    }

    const attempt = showreelVideo.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});
  };

  if (showreelVideo) {
    const heroObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          heroInView = entry.isIntersecting;
          if (heroInView) playShowreel();
          else showreelVideo.pause();
        });
      },
      { threshold: 0.3 }
    );
    heroObserver.observe(showreelVideo);
  }

  /* ------------------------------------------------------------------ lightbox */
  const lightbox = $("#lightbox");
  const lbVideo = $("#lbVideo");
  const lbTitle = $("#lbTitle");
  const lbLabel = $("#lbLabel");
  const lbPrev = $("#lbPrev");
  const lbNext = $("#lbNext");
  const lbClose = $("#lbClose");

  let lbList = [];
  let lbIndex = 0;
  let lastFocused = null;

  const renderLightbox = () => {
    const video = lbList[lbIndex];
    if (!video) return;

    lbTitle.textContent = video.title;
    lbLabel.textContent = `${video.label} · ${video.duration} · ${
      video.orientation === "vertical" ? "9:16 vertical" : "16:9 landscape"
    }`;

    lbVideo.classList.toggle("is-vertical", video.orientation === "vertical");
    lbVideo.poster = video.poster || "";
    lbVideo.src = video.src;
    lbVideo.muted = false;
    lbVideo.volume = 1;
    lbVideo.load();

    const attempt = lbVideo.play();
    if (attempt && typeof attempt.catch === "function") attempt.catch(() => {});

    const single = lbList.length < 2;
    lbPrev.hidden = single || lbIndex === 0;
    lbNext.hidden = single || lbIndex === lbList.length - 1;
  };

  // A video file that isn't in assets/videos/ would otherwise open a silent black player
  if (lbVideo) {
    lbVideo.addEventListener("error", () => {
      const video = lbList[lbIndex];
      if (!video || !lbLabel) return;
      lbLabel.textContent = `${fileName(video.src)} isn't in assets/videos/ yet — add the file and reload.`;
    });
  }

  const openLightbox = (index, list) => {
    if (!lightbox || !lbVideo) return;
    const safeList = list && list.length ? list : S.videos;
    lbList = safeList;
    lbIndex = Math.max(0, Math.min(index, safeList.length - 1));

    lastFocused = document.activeElement;
    lightboxOpen = true;
    pauseAllCards();
    if (showreelVideo) showreelVideo.pause();
    document.body.classList.add("lb-open");

    renderLightbox();
    if (!lightbox.open) lightbox.showModal();
    if (lbClose) lbClose.focus();
  };

  const closeLightbox = () => {
    if (!lightbox || !lightbox.open) return;
    lightbox.close();
  };

  const stepLightbox = (direction) => {
    const next = lbIndex + direction;
    if (next < 0 || next >= lbList.length) return;
    lbIndex = next;
    renderLightbox();
  };

  if (gallery) {
    gallery.addEventListener("click", (event) => {
      const hit = event.target.closest(".card__hit");
      if (!hit) return;
      const card = hit.closest(".card");
      const index = Number(card.dataset.index);
      openLightbox(visibleIndices.indexOf(index), visibleIndices.map((i) => S.videos[i]));
    });
  }

  if (showreel) {
    const playButton = $("#showreelPlay");
    if (playButton) {
      playButton.addEventListener("click", () =>
        openLightbox(featuredIndex, S.videos)
      );
    }
    const frame = $(".showreel__frame", showreel);
    if (frame) {
      frame.addEventListener("click", (event) => {
        if (event.target.closest(".showreel__play")) return;
        openLightbox(featuredIndex, S.videos);
      });
    }
  }

  if (lightbox) {
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lbPrev) lbPrev.addEventListener("click", () => stepLightbox(-1));
    if (lbNext) lbNext.addEventListener("click", () => stepLightbox(1));

    // Click on the dark backdrop area closes the player
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    // Escape is handled by <dialog>; arrow keys page through the gallery
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        stepLightbox(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepLightbox(-1);
      }
    });

    lightbox.addEventListener("close", () => {
      lightboxOpen = false;
      document.body.classList.remove("lb-open");
      lbVideo.pause();
      lbVideo.removeAttribute("src");
      lbVideo.load();
      if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
      refreshPlayback();
      playShowreel();
    });
  }

  /* -------------------------------------------------------------- reveal anims */
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  const watchReveals = () => {
    $$(".reveal:not(.is-visible)").forEach((el) => revealObserver.observe(el));
  };

  if (reduceMotion.matches) {
    $$(".reveal").forEach((el) => el.classList.add("is-visible"));
  } else {
    watchReveals();
  }

  /* ---------------------------------------------------------------------- nav */
  const nav = $("#nav");
  const navToggle = $("#navToggle");
  const navLinks = $("#navLinks");

  const closeNav = () => {
    if (!nav) return;
    nav.classList.remove("is-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    }
  };

  if (navToggle && nav && navLinks) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    navLinks.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav();
    });

    document.addEventListener("click", (event) => {
      if (!nav.contains(event.target)) closeNav();
    });
  }

  const toTop = $(".to-top");
  const onScroll = () => {
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 24);
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 700);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Scroll-spy for the nav links
  const navAnchors = navLinks ? $$('a[href^="#"]:not(.btn)', navLinks) : [];
  const spied = navAnchors
    .map((a) => ({ link: a, section: document.getElementById(a.getAttribute("href").slice(1)) }))
    .filter((item) => item.section);

  if (spied.length) {
    // Pick the last section whose top has passed the reading line. Doing this on
    // scroll (instead of an observer) keeps the highlight correct when two
    // sections sit in the viewport at once.
    const updateSpy = () => {
      const line = window.innerHeight * 0.35;
      let current = null;
      spied.forEach((item) => {
        if (item.section.getBoundingClientRect().top <= line) current = item;
      });
      navAnchors.forEach((a) => a.classList.toggle("is-active", !!current && a === current.link));
    };
    // Read positions on the next frame so the scroll offset and the section
    // rects always agree (instant jumps to the very top otherwise look stale).
    let spyFrame = 0;
    const queueSpy = () => {
      if (spyFrame) cancelAnimationFrame(spyFrame);
      spyFrame = requestAnimationFrame(() => {
        spyFrame = 0;
        updateSpy();
      });
    };

    window.addEventListener("scroll", queueSpy, { passive: true });
    window.addEventListener("resize", queueSpy);
    window.addEventListener("scrollend", queueSpy);
    queueSpy();
  }

  /* -------------------------------------------------------------------- form */
  const form = $("#contactForm");
  const formStatus = $("#formStatus");

  const say = (message, ok = true) => {
    if (!formStatus) return;
    formStatus.style.color = ok ? "var(--lime)" : "#ff8fa3";
    formStatus.textContent = message;
  };

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = $("#name", form);
      const email = $("#email", form);
      const message = $("#message", form);

      for (const field of [name, email, message]) {
        if (!field.checkValidity()) {
          field.focus();
          say("Please fill in your name, a valid email and a message.", false);
          return;
        }
      }

      const payload = {
        name: name.value.trim(),
        email: email.value.trim(),
        message: message.value.trim(),
      };

      if (S.contact.formEndpoint) {
        try {
          say("Sending…", true);
          const response = await fetch(S.contact.formEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          form.reset();
          say("Message sent — I'll get back to you soon.", true);
        } catch (error) {
          say(
            `Couldn't send just now. Email me at ${S.contact.email} and I'll reply there.`,
            false
          );
        }
        return;
      }

      // No endpoint configured: hand the message to the visitor's mail app so
      // the form still delivers instead of silently doing nothing.
      const subject = encodeURIComponent(`Project brief from ${payload.name}`);
      const body = encodeURIComponent(`${payload.message}\n\n— ${payload.name}\n${payload.email}`);
      window.location.href = `mailto:${S.contact.email}?subject=${subject}&body=${body}`;
      say(
        `Opening your email app${payload.name ? `, ${payload.name}` : ""} — or write to ${S.contact.email} directly.`,
        true
      );
    });
  }

  /* -------------------------------------------------------------------- misc */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Pause everything when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseAllCards();
      if (showreelVideo) showreelVideo.pause();
      if (lbVideo) lbVideo.pause();
    } else {
      refreshPlayback();
      playShowreel();
    }
  });

  if (filtersEl) setFilter("all");
})();
