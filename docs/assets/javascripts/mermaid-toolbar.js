(function() {
  'use strict';

  var sources = [];
  document.querySelectorAll('pre.mermaid').forEach(function(pre) {
    var code = pre.querySelector('code');
    if (!code) return;
    sources.push(code.textContent);
  });

  if (sources.length === 0) return;

  // Load Mermaid.js explicitly so we can render independently of the
  // Material theme's lazy loader (which may not fire in all deployments).
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';
  script.onload = function() {
    mermaid.initialize({ startOnLoad: false });

    sources.forEach(function(source, i) {
      mermaid.render('mermaid-toolbar-render-' + i, source).then(function(result) {
        var container = document.createElement('div');
        container.style.cssText = 'display:flex;flex-direction:column;align-items:center;margin:1em 0;';
        container.innerHTML = result.svg;

        var bar = document.createElement('div');
        bar.className = 'mermaid-toolbar';
        bar.style.cssText = 'margin-top:6px;';

        // Copy source
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

        // Download SVG
        var svgBtn = document.createElement('a');
        svgBtn.href = '#';
        svgBtn.textContent = 'Download SVG';
        svgBtn.style.cssText = 'font-size:0.8em;margin-right:14px;';
        svgBtn.onclick = function(e) {
          e.preventDefault();
          var str = new XMLSerializer().serializeToString(container.querySelector('svg').cloneNode(true));
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
        bar.appendChild(svgBtn);

        // Download PNG
        var pngBtn = document.createElement('a');
        pngBtn.href = '#';
        pngBtn.textContent = 'Download PNG';
        pngBtn.style.cssText = 'font-size:0.8em;';
        pngBtn.onclick = function(e) {
          e.preventDefault();
          var svg = container.querySelector('svg');
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
        bar.appendChild(pngBtn);

        container.appendChild(bar);

        // Replace the original <pre> with our rendered container
        var pre = document.querySelectorAll('pre.mermaid')[i];
        if (pre && pre.parentNode) {
          pre.parentNode.replaceChild(container, pre);
        }
      });
    });
  };
  document.head.appendChild(script);
})();
