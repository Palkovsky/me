// Title hover preview positioning
// Positions the preview image above the title if it would overflow the viewport
(function() {
  // Only run on non-touch devices
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return;
  }

  document.addEventListener('DOMContentLoaded', function() {
    const titleLinks = document.querySelectorAll('.title-link');

    titleLinks.forEach(function(link) {
      const preview = link.querySelector('.title-hover-preview');
      if (!preview) return;

      link.addEventListener('mouseenter', function() {
        // Reset to default (below) position first
        preview.classList.remove('above');

        // Wait for the image to be displayed to get accurate dimensions
        requestAnimationFrame(function() {
          const linkRect = link.getBoundingClientRect();
          const previewRect = preview.getBoundingClientRect();
          const viewportHeight = window.innerHeight;

          // Check if preview would overflow bottom of viewport
          const bottomOverflow = linkRect.bottom + previewRect.height + 8 > viewportHeight;

          if (bottomOverflow) {
            preview.classList.add('above');
          }
        });
      });

      link.addEventListener('mouseleave', function() {
        preview.classList.remove('above');
      });
    });
  });
})();