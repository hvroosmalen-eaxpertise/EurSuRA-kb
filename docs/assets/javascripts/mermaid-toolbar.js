(function() {
  'use strict';

  // Add a toolbar after every Mermaid <pre>. When Mermaid.js later replaces
  // the <pre> with an <svg>, the toolbar survives as the next sibling.
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
      window.open('https://mermaid.live/edit?base64=' + encodeURIComponent(btoa(source)), '_blank');
    };
    bar.appendChild(editor);

    var svgBtn = document.createElement('a');
    svgBtn.href = '#';
    svgBtn.textContent = 'Download SVG';
    svgBtn.style.cssText = 'font-size:0.8em;';
    svgBtn.onclick = function(e) {
      e.preventDefault();
      // The <pre> is gone (replaced by <svg>), but our toolbar is the
      // next sibling, so the previous sibling of the toolbar is the SVG.
      var svg = bar.previousElementSibling;
      if (!svg || svg.tagName !== 'SVG') return;
      var str = new XMLSerializer().serializeToString(svg.cloneNode(true));
      var blob = new Blob([str], {type: 'image/svg+xml'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'diagram.svg';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    bar.appendChild(svgBtn);

    pre.parentNode.insertBefore(bar, pre.nextSibling);
  });
})();
