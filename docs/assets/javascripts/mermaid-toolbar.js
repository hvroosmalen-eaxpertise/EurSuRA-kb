(function() {
  'use strict';

  var CDNS = [
    'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js',
    'https://unpkg.com/mermaid@11/dist/mermaid.min.js',
  ];

  function findSvg(bar) {
    var el = bar.previousElementSibling;
    if (!el) return null;
    if (el.tagName === 'SVG') return el;
    return el.querySelector('svg');
  }

  function svgToPng(svg, callback) {
    var rect = svg.getBoundingClientRect();
    var canvas = document.createElement('canvas');
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    var ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    var img = new Image();
    var svgData = new XMLSerializer().serializeToString(svg.cloneNode(true));
    // Strip foreignObject (not supported on canvas) and replace with plain text
    svgData = svgData.replace(/<foreignObject[^>]*>[\s\S]*?<\/foreignObject>/gi, '');
    img.onload = function() {
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(callback, 'image/png');
    };
    img.onerror = function() {
      // Fallback: return SVG as fallback
      callback(null);
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }

  function enableDownloads(bar, svg) {
    var svgLink = bar.querySelector('[data-action=svg]');
    var pngLink = bar.querySelector('[data-action=png]');
    if (!svgLink || !pngLink) return;

    svgLink.style.cssText = 'font-size:0.8em;margin-right:14px;';
    pngLink.style.cssText = 'font-size:0.8em;';

    svgLink.onclick = function(e) {
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

    pngLink.onclick = function(e) {
      e.preventDefault();
      svgToPng(svg, function(blob) {
        if (!blob) {
          // Fallback: download as SVG instead and explain
          alert('PNG export unavailable — downloading SVG instead. Open the SVG in a browser and save as PNG from there.');
          svgLink.onclick(e);
          return;
        }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'concept-map.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    };
  }

  function loadMermaidAndRender(pre, bar, source, cdnIndex) {
    // Guard: if an SVG already appeared (Material theme rendered), do nothing.
    if (findSvg(bar)) return;

    cdnIndex = cdnIndex || 0;
    if (cdnIndex >= CDNS.length) return;

    var s = document.createElement('script');
    s.src = CDNS[cdnIndex];
    s.onload = function() {
      // Guard again: theme might have rendered while CDN was loading
      if (findSvg(bar)) return;
      try {
        mermaid.initialize({ startOnLoad: false });
        mermaid.render('mmd-' + Date.now(), source).then(function(r) {
          // Guard: someone else rendered in the meantime
          if (findSvg(bar)) return;
          var wrapper = document.createElement('div');
          wrapper.innerHTML = r.svg;
          var svgEl = wrapper.firstElementChild;
          if (pre.parentNode) {
            pre.parentNode.replaceChild(wrapper, pre);
          } else {
            bar.parentNode.insertBefore(wrapper, bar);
          }
          enableDownloads(bar, svgEl);
        });
      } catch (err) {
        console.warn('mermaid-toolbar: render error', err);
      }
    };
    s.onerror = function() {
      loadMermaidAndRender(pre, bar, source, cdnIndex + 1);
    };
    document.head.appendChild(s);
  }

  document.querySelectorAll('pre.mermaid').forEach(function(pre) {
    var code = pre.querySelector('code');
    if (!code) return;
    var source = code.textContent;

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

    // Poll for theme-rendered SVG; fall back to our own renderer later.
    var attempts = 0;
    var timer = setInterval(function() {
      attempts++;
      var svg = findSvg(bar);
      if (svg) {
        clearInterval(timer);
        enableDownloads(bar, svg);
        return;
      }
      if (attempts >= 12) {
        clearInterval(timer);
        loadMermaidAndRender(pre, bar, source);
      }
    }, 500);
  });
})();
