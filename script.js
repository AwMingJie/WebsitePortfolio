(function () {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const year = document.querySelector("[data-year]");
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const skillCards = Array.from(document.querySelectorAll(".skill-card"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  function setMenu(open) {
    document.body.classList.toggle("nav-open", open);
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));

  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) {
        return;
      }

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    {
      threshold: [0.24, 0.5, 0.72],
      rootMargin: "-20% 0px -55% 0px"
    }
  );

  sections.forEach((section) => navObserver.observe(section));

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-selected", String(selected));
      });

      skillCards.forEach((card) => {
        const show = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  const canvas = document.getElementById("threat-canvas");
  if (!canvas) {
    return;
  }

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let nodes = [];
  let rafId = 0;
  let pointer = { x: 0, y: 0, active: false };

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    createNodes();
  }

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

  function draw(timestamp) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(9, 10, 10, 0.78)";
    ctx.fillRect(0, 0, width, height);

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
      ctx.fillStyle = index % 7 === 0 ? "rgba(255, 189, 89, 0.86)" : "rgba(54, 230, 168, 0.82)";
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

    rafId = window.requestAnimationFrame(draw);
  }

  function startCanvas() {
    window.cancelAnimationFrame(rafId);
    if (!reduceMotion.matches) {
      rafId = window.requestAnimationFrame(draw);
    } else {
      draw(0);
      window.cancelAnimationFrame(rafId);
    }
  }

  canvas.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      active: true
    };
  });

  canvas.addEventListener("pointerleave", () => {
    pointer.active = false;
  });

  window.addEventListener("resize", resizeCanvas, { passive: true });
  reduceMotion.addEventListener("change", startCanvas);

  resizeCanvas();
  startCanvas();
})();
