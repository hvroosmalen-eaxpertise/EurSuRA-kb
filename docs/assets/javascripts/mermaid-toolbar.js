(function() {
  'use strict';

  document.querySelectorAll('pre.mermaid').forEach(function(pre) {
    var code = pre.querySelector('code');
    if (!code) return;
    var source = code.textContent;

    var bar = document.createElement('div');
    bar.className = 'mermaid-toolbar';

    // --- Copy source ---
    var copyBtn = document.createElement('a');
    copyBtn.href = '#';
    copyBtn.textContent = 'Copy source';
    copyBtn.style.cssText = 'font-size:0.8em;margin-right:12px;';
    copyBtn.title = 'Copy the Mermaid diagram source to the clipboard';
    copyBtn.onclick = function(e) {
      e.preventDefault();
      navigator.clipboard.writeText(source).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy source'; }, 2000);
      });
    };
    bar.appendChild(copyBtn);

    // --- Download SVG ---
    var svgBtn = document.createElement('a');
    svgBtn.href = '#';
    svgBtn.textContent = 'Download SVG';
    svgBtn.style.cssText = 'font-size:0.8em;margin-right:12px;';
    svgBtn.onclick = function(e) {
      e.preventDefault();
      var svg = bar.previousElementSibling;
      if (!svg || svg.tagName !== 'SVG') {
        alert('Diagram not yet rendered — please wait a moment and try again.');
        return;
      }
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
    bar.appendChild(svgBtn);

    // --- Download PNG ---
    var pngBtn = document.createElement('a');
    pngBtn.href = '#';
    pngBtn.textContent = 'Download PNG';
    pngBtn.style.cssText = 'font-size:0.8em;';
    pngBtn.onclick = function(e) {
      e.preventDefault();
      var svg = bar.previousElementSibling;
      if (!svg || svg.tagName !== 'SVG') {
        alert('Diagram not yet rendered — please wait a moment and try again.');
        return;
      }
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

    pre.parentNode.insertBefore(bar, pre.nextSibling);
  });
})();
