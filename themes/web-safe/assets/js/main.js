(function () {
  "use strict";

  function setupReadingProgress() {
    const article = document.querySelector(".entry__content");
    const bars = document.querySelectorAll("[data-reading-progress]");
    const labels = document.querySelectorAll("[data-reading-percent]");

    if (!article || !bars.length) return;

    document.querySelectorAll("[data-progress], .bar-percent").forEach(function (element) {
      element.hidden = false;
    });

    let frameRequested = false;

    function updateProgress() {
      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const viewportHeight = window.innerHeight;
      const distance = article.offsetHeight - viewportHeight;
      const current = window.scrollY - articleTop + viewportHeight * 0.2;
      const percentage = distance <= 0 ? 100 : Math.min(100, Math.max(0, (current / distance) * 100));

      bars.forEach(function (bar) {
        bar.style.width = percentage + "%";
      });
      labels.forEach(function (label) {
        label.textContent = Math.round(percentage) + "%";
      });
      frameRequested = false;
    }

    function requestUpdate() {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(updateProgress);
    }

    updateProgress();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }

    return new Promise(function (resolve, reject) {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy") ? resolve() : reject(new Error("Copy failed"));
      } catch (error) {
        reject(error);
      } finally {
        textarea.remove();
      }
    });
  }

  function setupCodeBlocks() {
    const frames = document.querySelectorAll(".code");

    if (!frames.length) return;

    // Screen readers do not announce a focused button's changing label, so
    // the result is repeated in a polite status region.
    const status = document.createElement("p");
    status.className = "visually-hidden";
    status.setAttribute("role", "status");
    document.body.appendChild(status);

    function showResult(button, label, copied) {
      button.textContent = label;
      status.textContent = label;
      if (copied) button.dataset.copied = "true";

      window.setTimeout(function () {
        button.textContent = "Copy";
        status.textContent = "";
        delete button.dataset.copied;
      }, 1800);
    }

    frames.forEach(function (frame) {
      const button = frame.querySelector(".code__copy");
      const code = frame.querySelector("pre code");

      if (!button || !code) return;
      button.hidden = false;

      button.addEventListener("click", function () {
        // textContent keeps each source line exactly once; innerText would add
        // extra breaks for the block-level line wrappers.
        copyText(code.textContent.replace(/\n$/, "")).then(function () {
          showResult(button, "Copied", true);
        }).catch(function () {
          showResult(button, "Select code", false);
        });
      });
    });
  }

  function setupActiveTableOfContents() {
    const tocLinks = Array.from(document.querySelectorAll("[data-toc] nav a[href^='#']"));
    const column = document.querySelector(".side__inner");
    const bar = document.querySelector(".tools--sticky");

    if (!tocLinks.length) return;

    const linksById = new Map();
    tocLinks.forEach(function (link) {
      let id = link.hash.slice(1);

      try {
        id = decodeURIComponent(id);
      } catch (error) {
        // Keep the literal hash when it contains malformed escape sequences.
      }

      if (!linksById.has(id)) linksById.set(id, []);
      linksById.get(id).push(link);
    });

    const headings = Array.from(document.querySelectorAll(".entry__content h2[id], .entry__content h3[id]"))
      .filter(function (heading) { return linksById.has(heading.id); });

    if (!headings.length) return;

    let activeId = "";
    let frameRequested = false;

    function setActiveHeading(heading) {
      if (!heading || heading.id === activeId) return;
      activeId = heading.id;

      tocLinks.forEach(function (link) {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });

      linksById.get(heading.id).forEach(function (link) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "location");
      });

      // When the contents are taller than the column, scroll the column only as
      // far as needed to show the current entry. Recentering it would move the
      // list in large steps, including under the pointer right after a click.
      const columnLink = linksById.get(heading.id).find(function (link) {
        return column && column.contains(link);
      });
      if (!columnLink || column.scrollHeight <= column.clientHeight) return;

      const margin = 8;
      const columnRect = column.getBoundingClientRect();
      const linkRect = columnLink.getBoundingClientRect();
      if (linkRect.top < columnRect.top + margin) {
        column.scrollTop -= columnRect.top + margin - linkRect.top;
      } else if (linkRect.bottom > columnRect.bottom - margin) {
        column.scrollTop += linkRect.bottom - (columnRect.bottom - margin);
      }
    }

    function updateActiveHeading() {
      const barIsVisible = bar && bar.offsetParent !== null;
      const marker = (barIsVisible ? bar.offsetHeight : 0) + 56;
      let currentHeading = headings[0];

      headings.forEach(function (heading) {
        if (heading.getBoundingClientRect().top <= marker) currentHeading = heading;
      });

      const atDocumentEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atDocumentEnd) currentHeading = headings[headings.length - 1];

      setActiveHeading(currentHeading);
      frameRequested = false;
    }

    function requestUpdate() {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(updateActiveHeading);
    }

    updateActiveHeading();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);
  }

  function setupBarMenus() {
    const menus = Array.from(document.querySelectorAll(".bar-menu"));

    if (!menus.length) return;

    menus.forEach(function (menu) {
      // Following a link closes the menu before the browser jumps, so the
      // heading lands below the collapsed bar.
      menu.addEventListener("click", function (event) {
        if (event.target.closest(".bar-menu__panel a")) menu.open = false;
      });
    });

    document.addEventListener("click", function (event) {
      menus.forEach(function (menu) {
        if (menu.open && !menu.contains(event.target)) menu.open = false;
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      menus.forEach(function (menu) {
        if (!menu.open) return;
        menu.open = false;
        menu.querySelector("summary").focus();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupReadingProgress();
    setupCodeBlocks();
    setupActiveTableOfContents();
    setupBarMenus();
  });
})();
