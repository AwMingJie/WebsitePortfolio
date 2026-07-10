(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  document.documentElement.classList.add("js");

  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const year = document.querySelector("[data-year]");
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const skillCards = Array.from(document.querySelectorAll(".skill-card"));
  const skillStatus = document.querySelector("[data-skill-status]");
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const reduceMotion = getMediaQuery("(prefers-reduced-motion: reduce)");
  const mobileNavigation = getMediaQuery("(max-width: 720px)");

  function getMediaQuery(query) {
    if (typeof window.matchMedia !== "function") {
      return null;
    }

    return window.matchMedia(query);
  }

  function addMediaQueryListener(mediaQuery, listener) {
    if (!mediaQuery) {
      return;
    }

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", listener);
    } else if (typeof mediaQuery.addListener === "function") {
      mediaQuery.addListener(listener);
    }
  }

  function prefersReducedMotion() {
    return Boolean(reduceMotion && reduceMotion.matches);
  }

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  /* Mobile navigation */
  if (toggle && menu) {
    let menuOpen = false;
    const toggleLabel = toggle.querySelector(".sr-only");

    function isMobileNavigation() {
      return mobileNavigation ? mobileNavigation.matches : window.innerWidth <= 720;
    }

    function setMenuInert(inert) {
      menu.toggleAttribute("inert", inert);

      if ("inert" in menu) {
        menu.inert = inert;
      }
    }

    function updateToggleLabel(open) {
      const label = open ? "Close menu" : "Open menu";
      toggle.setAttribute("aria-label", label);

      if (toggleLabel) {
        toggleLabel.textContent = label;
      }
    }

    function setMenu(open, options) {
      const settings = options || {};
      const isMobile = isMobileNavigation();
      const shouldOpen = Boolean(open && isMobile);
      const shouldInert = isMobile && !shouldOpen;

      if (shouldInert && menu.contains(document.activeElement)) {
        toggle.focus({ preventScroll: true });
      }

      menuOpen = shouldOpen;
      document.body.classList.toggle("nav-open", shouldOpen);
      menu.classList.toggle("is-open", shouldOpen);
      toggle.setAttribute("aria-expanded", String(shouldOpen));
      updateToggleLabel(shouldOpen);
      setMenuInert(shouldInert);

      if (shouldInert) {
        menu.setAttribute("aria-hidden", "true");
      } else {
        menu.removeAttribute("aria-hidden");
      }

      if (settings.returnFocus) {
        toggle.focus({ preventScroll: true });
      }
    }

    toggle.addEventListener("click", () => {
      setMenu(!menuOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (menuOpen) {
          setMenu(false);
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) {
        event.preventDefault();
        setMenu(false, { returnFocus: true });
      }
    });

    document.addEventListener("focusin", (event) => {
      if (
        menuOpen &&
        event.target instanceof Node &&
        event.target !== toggle &&
        !menu.contains(event.target)
      ) {
        setMenu(false);
      }
    });

    function handleNavigationBreakpoint() {
      const focusWasOnToggle = document.activeElement === toggle;
      setMenu(false);

      if (!isMobileNavigation() && focusWasOnToggle) {
        const activeLink = navLinks.find((link) => link.classList.contains("is-active"));
        const focusTarget = activeLink || navLinks[0];

        if (focusTarget) {
          focusTarget.focus({ preventScroll: true });
        }
      }
    }

    addMediaQueryListener(mobileNavigation, handleNavigationBreakpoint);

    if (!mobileNavigation) {
      window.addEventListener("resize", handleNavigationBreakpoint, { passive: true });
    }

    setMenu(false);
  }

  /* Sticky header */
  function updateHeader() {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    }
  }

  if (header) {
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  /* Progressive content reveal, with a visible-content fallback. */
  let revealObserver = null;

  function revealAll() {
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }

    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  if (revealItems.length > 0) {
    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      revealAll();
    } else {
      try {
        revealObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");

                if (revealObserver) {
                  revealObserver.unobserve(entry.target);
                }
              }
            });
          },
          { threshold: 0.16 }
        );

        revealItems.forEach((item) => revealObserver.observe(item));
      } catch (error) {
        revealAll();
      }
    }

    addMediaQueryListener(reduceMotion, (event) => {
      if (event.matches) {
        revealAll();
      }
    });

    function revealHashTarget(hash) {
      if (!hash || hash === "#") {
        return;
      }

      let target = null;

      try {
        target = document.getElementById(decodeURIComponent(hash.slice(1)));
      } catch (error) {
        target = document.getElementById(hash.slice(1));
      }

      if (!target) {
        return;
      }

      if (target.classList.contains("reveal")) {
        target.classList.add("is-visible");
      }

      target.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
    }

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => revealHashTarget(link.hash));
    });

    revealHashTarget(window.location.hash);
    window.addEventListener("hashchange", () => revealHashTarget(window.location.hash));
  }

  /* Active in-page navigation */
  let navigationFrame = 0;

  function linkHash(link) {
    try {
      return decodeURIComponent(link.hash || "").slice(1);
    } catch (error) {
      return (link.hash || "").slice(1);
    }
  }

  function setActiveSection(sectionId) {
    navLinks.forEach((link) => {
      const active = Boolean(sectionId && linkHash(link) === sectionId);
      link.classList.toggle("is-active", active);

      if (active) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function updateActiveNavigation() {
    navigationFrame = 0;

    if (sections.length === 0 || navLinks.length === 0) {
      return;
    }

    const navigableSections = sections.filter((section) =>
      navLinks.some((link) => linkHash(link) === section.id)
    );

    if (navigableSections.length === 0) {
      setActiveSection("");
      return;
    }

    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const marker = headerHeight + Math.min(window.innerHeight * 0.24, 180);
    let currentSection = null;

    navigableSections.forEach((section) => {
      if (section.getBoundingClientRect().top <= marker) {
        currentSection = section;
      }
    });

    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );

    if (window.scrollY + window.innerHeight >= documentHeight - 2) {
      currentSection = navigableSections[navigableSections.length - 1];
    }

    setActiveSection(currentSection ? currentSection.id : "");
  }

  function scheduleActiveNavigation() {
    if (navigationFrame) {
      return;
    }

    navigationFrame = window.requestAnimationFrame(updateActiveNavigation);
  }

  if (sections.length > 0 && navLinks.length > 0) {
    updateActiveNavigation();
    window.addEventListener("scroll", scheduleActiveNavigation, { passive: true });
    window.addEventListener("resize", scheduleActiveNavigation, { passive: true });
  }

  /* Skill filters: button semantics by default, legacy tab markup supported. */
  function applySkillFilter(selectedButton) {
    const filter = selectedButton.dataset.filter || "all";
    let visibleCount = 0;

    filterButtons.forEach((button) => {
      const selected = button === selectedButton;
      const legacyTab = button.getAttribute("role") === "tab";
      button.classList.toggle("is-active", selected);

      if (legacyTab) {
        button.setAttribute("aria-selected", String(selected));
        button.setAttribute("tabindex", selected ? "0" : "-1");
        button.removeAttribute("aria-pressed");
      } else {
        button.setAttribute("aria-pressed", String(selected));
        button.removeAttribute("aria-selected");
      }
    });

    skillCards.forEach((card) => {
      const categories = (card.dataset.category || "").split(/\s+/).filter(Boolean);
      const show = filter === "all" || categories.includes(filter);
      card.classList.toggle("is-hidden", !show);
      card.hidden = !show;

      if (show) {
        visibleCount += 1;
      }
    });

    if (skillStatus) {
      const categoryName = (selectedButton.textContent || filter).trim().toLowerCase();
      skillStatus.textContent =
        filter === "all"
          ? `Showing all ${visibleCount} capability areas.`
          : `Showing ${visibleCount} ${categoryName} capability ${visibleCount === 1 ? "area" : "areas"}.`;
    }
  }

  filterButtons.forEach((button, buttonIndex) => {
    button.addEventListener("click", () => applySkillFilter(button));

    button.addEventListener("keydown", (event) => {
      if (button.getAttribute("role") !== "tab") {
        return;
      }

      let nextIndex = buttonIndex;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (buttonIndex + 1) % filterButtons.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (buttonIndex - 1 + filterButtons.length) % filterButtons.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = filterButtons.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      filterButtons[nextIndex].focus();
      applySkillFilter(filterButtons[nextIndex]);
    });
  });

  if (filterButtons.length > 0) {
    const selectedFilter =
      filterButtons.find(
        (button) =>
          button.classList.contains("is-active") ||
          button.getAttribute("aria-pressed") === "true" ||
          button.getAttribute("aria-selected") === "true"
      ) || filterButtons[0];

    applySkillFilter(selectedFilter);
  }

  /* Hero canvas */
  const canvas = document.getElementById("threat-canvas");

  if (!canvas || typeof canvas.getContext !== "function") {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const hero = canvas.closest(".hero") || canvas;
  let width = 0;
  let height = 0;
  let nodes = [];
  let animationFrame = 0;
  let visibilityFrame = 0;
  let heroVisible = true;
  let pointer = { x: 0, y: 0, active: false };

  function createNodes() {
    const count = Math.max(22, Math.min(58, Math.round(width / 26)));
    nodes = Array.from({ length: count }, (_, index) => ({
      x: (Math.sin(index * 91.7) * 0.5 + 0.5) * width,
      y: (Math.cos(index * 53.3) * 0.5 + 0.5) * height,
      vx: Math.sin(index * 2.1) * 0.18,
      vy: Math.cos(index * 1.7) * 0.18,
      r: index % 5 === 0 ? 2.2 : 1.45,
      pulse: index * 0.4
    }));
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(0, rect.width);
    height = Math.max(0, rect.height);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    createNodes();
  }

  function drawCanvas(timestamp, moveNodes) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(9, 10, 10, 0.78)";
    ctx.fillRect(0, 0, width, height);

    if (moveNodes) {
      nodes.forEach((node) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < -20) node.x = width + 20;
        if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20;
        if (node.y > height + 20) node.y = -20;

        if (pointer.active) {
          const dx = pointer.x - node.x;
          const dy = pointer.y - node.y;
          const distance = Math.hypot(dx, dy);

          if (distance < 150 && distance > 1) {
            node.x -= (dx / distance) * 0.22;
            node.y -= (dy / distance) * 0.22;
          }
        }
      });
    }

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);

        if (distance < 150) {
          const opacity = 1 - distance / 150;
          ctx.strokeStyle = `rgba(54, 230, 168, ${opacity * 0.23})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    nodes.forEach((node, index) => {
      const pulse = (Math.sin(timestamp / 700 + node.pulse) + 1) / 2;
      ctx.fillStyle =
        index % 7 === 0 ? "rgba(255, 189, 89, 0.86)" : "rgba(54, 230, 168, 0.82)";
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + pulse * 1.2, 0, Math.PI * 2);
      ctx.fill();
    });

    const sweepX = ((timestamp / 28) % (width + 260)) - 130;
    ctx.strokeStyle = "rgba(140, 230, 255, 0.26)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sweepX, 0);
    ctx.lineTo(sweepX + 120, height);
    ctx.stroke();
  }

  function canAnimateCanvas() {
    return (
      width > 0 &&
      height > 0 &&
      heroVisible &&
      !document.hidden &&
      !prefersReducedMotion()
    );
  }

  function stopCanvas() {
    if (animationFrame) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }
  }

  function animateCanvas(timestamp) {
    animationFrame = 0;

    if (!canAnimateCanvas()) {
      return;
    }

    drawCanvas(timestamp, true);
    animationFrame = window.requestAnimationFrame(animateCanvas);
  }

  function updateCanvasPlayback() {
    stopCanvas();

    if (width <= 0 || height <= 0 || !heroVisible || document.hidden) {
      return;
    }

    if (prefersReducedMotion()) {
      drawCanvas(0, false);
    } else {
      animationFrame = window.requestAnimationFrame(animateCanvas);
    }
  }

  function checkHeroVisibility() {
    visibilityFrame = 0;
    const rect = hero.getBoundingClientRect();
    const visible =
      rect.bottom > 0 &&
      rect.top < window.innerHeight &&
      rect.right > 0 &&
      rect.left < window.innerWidth;

    if (visible !== heroVisible) {
      heroVisible = visible;
      updateCanvasPlayback();
    }
  }

  function scheduleHeroVisibilityCheck() {
    if (!visibilityFrame) {
      visibilityFrame = window.requestAnimationFrame(checkHeroVisibility);
    }
  }

  hero.addEventListener(
    "pointermove",
    (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true
      };
    },
    { passive: true }
  );

  hero.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  function handleCanvasResize() {
    resizeCanvas();
    checkHeroVisibility();
    updateCanvasPlayback();
  }

  window.addEventListener("resize", handleCanvasResize, { passive: true });
  document.addEventListener("visibilitychange", updateCanvasPlayback);
  window.addEventListener("pagehide", stopCanvas);
  window.addEventListener("pageshow", () => {
    checkHeroVisibility();
    updateCanvasPlayback();
  });
  addMediaQueryListener(reduceMotion, updateCanvasPlayback);

  if ("IntersectionObserver" in window) {
    const canvasVisibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) {
          return;
        }

        heroVisible = entry.isIntersecting && entry.intersectionRatio > 0;
        updateCanvasPlayback();
      },
      { threshold: 0.01 }
    );

    canvasVisibilityObserver.observe(hero);
  } else {
    window.addEventListener("scroll", scheduleHeroVisibilityCheck, { passive: true });
  }

  resizeCanvas();
  checkHeroVisibility();
  updateCanvasPlayback();
})();
