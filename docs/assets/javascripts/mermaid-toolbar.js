(function() {
  'use strict';

  function addToolbar(container, source) {
    if (container.nextElementSibling && container.nextElementSibling.classList.contains('mermaid-toolbar')) return;

    var bar = document.createElement('div');
    bar.className = 'mermaid-toolbar';

    var editor = document.createElement('a');
    editor.href = '#';
    editor.textContent = 'View in Mermaid editor';
    editor.style.cssText = 'font-size:0.8em;margin-right:12px;';
    editor.onclick = function(e) {
      e.preventDefault();
      var encoded = btoa(source);
      window.open('https://mermaid.live/edit?base64=' + encoded, '_blank');
    };
    bar.appendChild(editor);

    var svgBtn = document.createElement('a');
    svgBtn.href = '#';
    svgBtn.textContent = 'Download SVG';
    svgBtn.style.cssText = 'font-size:0.8em;';
    svgBtn.onclick = function(e) {
      e.preventDefault();
      var svg = container.querySelector('svg');
      if (!svg) return;
      var clone = svg.cloneNode(true);
      var serializer = new XMLSerializer();
      var str = serializer.serializeToString(clone);
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

    container.parentNode.insertBefore(bar, container.nextSibling);
  }

  function check() {
    document.querySelectorAll('pre.mermaid').forEach(function(el) {
      if (el.querySelector('svg')) {
        var code = el.querySelector('code');
        addToolbar(el, code ? code.textContent : '');
      }
    });
  }

  check();
  var timer = setInterval(check, 800);
  setTimeout(function() { clearInterval(timer); }, 30000);
})();
