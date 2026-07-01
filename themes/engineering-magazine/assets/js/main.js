(function () {
  "use strict";

  function setupReadingProgress() {
    const article = document.querySelector(".article-content");
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
    document.querySelectorAll(".article-content .highlight").forEach(function (frame) {
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
          window.setTimeout(function () {
            button.textContent = "Copy";
          }, 1800);
        });
      });

      toolbar.appendChild(language);
      toolbar.appendChild(button);
      frame.insertBefore(toolbar, frame.firstChild);
    });
  }

  function setupActiveTableOfContents() {
    const tocLinks = Array.from(document.querySelectorAll(".article-toc a[href^='#']"));
    if (!tocLinks.length || !("IntersectionObserver" in window)) return;

    const linksById = new Map();
    tocLinks.forEach(function (link) {
      linksById.set(decodeURIComponent(link.hash.slice(1)), link);
    });

    const headings = Array.from(document.querySelectorAll(".article-content h2[id], .article-content h3[id]"))
      .filter(function (heading) { return linksById.has(heading.id); });

    if (!headings.length) return;

    const visibleHeadings = new Set();
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visibleHeadings.add(entry.target.id);
        } else {
          visibleHeadings.delete(entry.target.id);
        }
      });

      tocLinks.forEach(function (link) { link.classList.remove("is-active"); });

      const activeId = headings.find(function (heading) { return visibleHeadings.has(heading.id); });
      if (activeId) {
        linksById.get(activeId.id).classList.add("is-active");
      }
    }, { rootMargin: "-15% 0px -70% 0px", threshold: 0 });

    headings.forEach(function (heading) { observer.observe(heading); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupReadingProgress();
    setupCodeBlocks();
    setupActiveTableOfContents();
  });
})();
