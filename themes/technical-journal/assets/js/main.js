(function () {
  "use strict";

  function setupReadingProgress() {
    const article = document.querySelector(".entry-content");
    const progressBar = document.querySelector("[data-reading-progress]");
    const progressLabel = document.querySelector("[data-reading-percent]");

    if (!article || !progressBar || !progressLabel) return;

    let frameRequested = false;

    function updateProgress() {
      const articleTop = article.getBoundingClientRect().top + window.scrollY;
      const articleHeight = article.offsetHeight;
      const viewportHeight = window.innerHeight;
      const distance = articleHeight - viewportHeight;
      const current = window.scrollY - articleTop + viewportHeight * 0.2;
      const percentage = distance <= 0 ? 100 : Math.min(100, Math.max(0, (current / distance) * 100));

      progressBar.style.height = percentage + "%";
      progressLabel.textContent = Math.round(percentage) + "%";
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

  function getCodeLanguage(code) {
    const className = Array.from(code.classList).find(function (name) {
      return name.indexOf("language-") === 0;
    });

    if (!className) return "code";
    return className.replace("language-", "").replace(/-/g, " ");
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
    document.querySelectorAll(".entry-content .highlight").forEach(function (frame) {
      const pre = frame.querySelector("pre");
      const code = pre && pre.querySelector("code");

      if (!pre || !code || frame.querySelector(".code-toolbar")) return;

      frame.classList.add("code-frame");
      const toolbar = document.createElement("div");
      toolbar.className = "code-toolbar";

      const language = document.createElement("span");
      language.className = "code-language";
      language.textContent = getCodeLanguage(code);

      const button = document.createElement("button");
      button.className = "code-copy";
      button.type = "button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code to clipboard");

      button.addEventListener("click", function () {
        copyText(code.innerText).then(function () {
          button.textContent = "Copied";
          button.dataset.copied = "true";
          window.setTimeout(function () {
            button.textContent = "Copy";
            delete button.dataset.copied;
          }, 1800);
        }).catch(function () {
          button.textContent = "Select code";
          window.setTimeout(function () { button.textContent = "Copy"; }, 1800);
        });
      });

      toolbar.appendChild(language);
      toolbar.appendChild(button);
      frame.insertBefore(toolbar, frame.firstChild);
    });
  }

  function setupActiveTableOfContents() {
    const toc = document.querySelector(".entry-toc");
    const tocLinks = Array.from(document.querySelectorAll(".entry-toc a[href^='#']"));
    if (!toc || !tocLinks.length) return;

    const linksById = new Map();
    tocLinks.forEach(function (link) {
      linksById.set(decodeURIComponent(link.hash.slice(1)), link);
    });

    const headings = Array.from(document.querySelectorAll(".entry-content h2[id], .entry-content h3[id]"))
      .filter(function (heading) { return linksById.has(heading.id); });

    if (!headings.length) return;

    let activeId = "";
    let frameRequested = false;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function setActiveHeading(heading) {
      if (!heading || heading.id === activeId) return;

      tocLinks.forEach(function (link) {
        link.classList.remove("is-active");
        link.removeAttribute("aria-current");
      });

      const activeLink = linksById.get(heading.id);
      if (!activeLink) return;

      activeId = heading.id;
      activeLink.classList.add("is-active");
      activeLink.setAttribute("aria-current", "location");

      const tocRect = toc.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      if (linkRect.top < tocRect.top + 16 || linkRect.bottom > tocRect.bottom - 16) {
        const relativeTop = toc.scrollTop + linkRect.top - tocRect.top;
        toc.scrollTo({
          top: Math.max(0, relativeTop - toc.clientHeight * 0.3),
          behavior: reduceMotion ? "auto" : "smooth"
        });
      }
    }

    function updateActiveHeading() {
      const header = document.querySelector(".journal-header");
      const marker = (header ? header.offsetHeight : 0) + 56;
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

  document.addEventListener("DOMContentLoaded", function () {
    setupReadingProgress();
    setupCodeBlocks();
    setupActiveTableOfContents();
  });
})();
