(function() {
  'use strict';

  // Unicode-safe base64 encode for Mermaid source (which may contain
  // em-dashes, smart quotes, etc. that btoa() cannot handle directly).
  function base64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  document.querySelectorAll('pre.mermaid').forEach(function(pre) {
    var code = pre.querySelector('code');
    if (!code) return;
    var source = code.textContent;

    var bar = document.createElement('div');
    bar.className = 'mermaid-toolbar';

    var editor = document.createElement('a');
    editor.href = '#';
    editor.textContent = 'View in Mermaid editor';
    editor.style.cssText = 'font-size:0.8em;margin-right:12px;';
    editor.onclick = function(e) {
      e.preventDefault();
      window.open('https://mermaid.live/edit?base64=' + base64(source), '_blank');
    };
    bar.appendChild(editor);

    var svgBtn = document.createElement('a');
    svgBtn.href = '#';
    svgBtn.textContent = 'Download SVG';
    svgBtn.style.cssText = 'font-size:0.8em;';
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

    pre.parentNode.insertBefore(bar, pre.nextSibling);
  });
})();
