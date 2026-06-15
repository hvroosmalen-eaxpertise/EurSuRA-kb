(function() {
  'use strict';

  var sources = [];
  document.querySelectorAll('pre.mermaid').forEach(function(pre) {
    var code = pre.querySelector('code');
    sources.push(code ? code.textContent : '');
  });

  if (sources.length === 0) return;

  // Mermaid replaces each <pre class="mermaid"> with an <svg> in document
  // order. Watch for new SVGs and add a toolbar below each one by index.
  var done = 0;

  function tryAdd() {
    var svgs = document.querySelectorAll('svg');
    // Find the next un-toolbared Mermaid SVG (new SVGs beyond what we've processed)
    for (var i = done; i < svgs.length && i < sources.length; i++) {
      var svg = svgs[i];
      if (svg.nextElementSibling && svg.nextElementSibling.classList.contains('mermaid-toolbar')) continue;

      var bar = document.createElement('div');
      bar.className = 'mermaid-toolbar';

      var editor = document.createElement('a');
      editor.href = '#';
      editor.textContent = 'View in Mermaid editor';
      editor.style.cssText = 'font-size:0.8em;margin-right:12px;';
      editor.onclick = (function(src) {
        return function(e) {
          e.preventDefault();
          window.open('https://mermaid.live/edit?base64=' + btoa(src), '_blank');
        };
      })(sources[i]);
      bar.appendChild(editor);

      var svgBtn = document.createElement('a');
      svgBtn.href = '#';
      svgBtn.textContent = 'Download SVG';
      svgBtn.style.cssText = 'font-size:0.8em;';
      svgBtn.onclick = (function(s) {
        return function(e) {
          e.preventDefault();
          var str = new XMLSerializer().serializeToString(s.cloneNode(true));
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
      })(svg);
      bar.appendChild(svgBtn);

      svg.parentNode.insertBefore(bar, svg.nextSibling);
      done = i + 1;
    }
  }

  tryAdd();
  var timer = setInterval(tryAdd, 500);
  setTimeout(function() { clearInterval(timer); }, 30000);
})();
