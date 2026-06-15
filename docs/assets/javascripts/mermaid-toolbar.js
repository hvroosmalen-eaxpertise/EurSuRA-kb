(function() {
  'use strict';

  // Find the rendered SVG near the toolbar: either inside the preceding
  // element (<pre> with inner SVG) or as the preceding element itself.
  function findSvg(bar) {
    var el = bar.previousElementSibling;
    if (!el) return null;
    if (el.tagName === 'SVG') return el;
    return el.querySelector('svg');
  }

  // Set up download actions once the SVG is available.
  function enableDownloads(bar, svg) {
    svg = svg || findSvg(bar);
    if (!svg) return;

    // SVG download
    bar.querySelector('[data-action=svg]').onclick = function(e) {
      e.preventDefault();
      var str = new XMLSerializer().serializeToString(svg.cloneNode(true));
      var blob = new Blob([str], {type: 'image/svg+xml'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'concept-map.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    // PNG download
    bar.querySelector('[data-action=png]').onclick = function(e) {
      e.preventDefault();
      var rect = svg.getBoundingClientRect();
      var canvas = document.createElement('canvas');
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      var ctx = canvas.getContext('2d');
      ctx.scale(2, 2);
      var img = new Image();
      var svgData = new XMLSerializer().serializeToString(svg.cloneNode(true));
      img.onload = function() {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(function(blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = 'concept-map.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 'image/png');
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };
  }

  document.querySelectorAll('pre.mermaid').forEach(function(pre) {
    var code = pre.querySelector('code');
    if (!code) return;
    var source = code.textContent;

    // Insert a toolbar with Copy source (always works) + placeholder action links
    var bar = document.createElement('div');
    bar.className = 'mermaid-toolbar';

    var copyBtn = document.createElement('a');
    copyBtn.href = '#';
    copyBtn.textContent = 'Copy source';
    copyBtn.style.cssText = 'font-size:0.8em;margin-right:14px;';
    copyBtn.onclick = function(e) {
      e.preventDefault();
      navigator.clipboard.writeText(source).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy source'; }, 2000);
      });
    };
    bar.appendChild(copyBtn);

    var svgLink = document.createElement('a');
    svgLink.href = '#';
    svgLink.textContent = 'Download SVG';
    svgLink.setAttribute('data-action', 'svg');
    svgLink.style.cssText = 'font-size:0.8em;margin-right:14px;color:#888;cursor:default;';
    bar.appendChild(svgLink);

    var pngLink = document.createElement('a');
    pngLink.href = '#';
    pngLink.textContent = 'Download PNG';
    pngLink.setAttribute('data-action', 'png');
    pngLink.style.cssText = 'font-size:0.8em;color:#888;cursor:default;';
    bar.appendChild(pngLink);

    pre.parentNode.insertBefore(bar, pre.nextSibling);

    // Wait for the rendered SVG (Material theme or our own loader)
    var attempts = 0;
    var timer = setInterval(function() {
      attempts++;
      var svg = findSvg(bar);
      if (svg) {
        clearInterval(timer);
        svgLink.style.cssText = 'font-size:0.8em;margin-right:14px;';
        pngLink.style.cssText = 'font-size:0.8em;';
        enableDownloads(bar, svg);
        return;
      }
      // After 6s, render Mermaid ourselves
      if (attempts >= 12) {
        clearInterval(timer);
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
        s.onload = function() {
          mermaid.initialize({ startOnLoad: false });
          mermaid.render('mmd-' + Date.now(), source).then(function(r) {
            var wrapper = document.createElement('div');
            wrapper.innerHTML = r.svg;
            var svgEl = wrapper.firstElementChild;
            pre.parentNode.replaceChild(wrapper, pre);
            svgLink.style.cssText = 'font-size:0.8em;margin-right:14px;';
            pngLink.style.cssText = 'font-size:0.8em;';
            enableDownloads(bar, svgEl);
          });
        };
        document.head.appendChild(s);
      }
    }, 500);
  });
})();
