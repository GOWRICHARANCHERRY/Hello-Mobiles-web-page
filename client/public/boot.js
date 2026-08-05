(function () {
  var boot = document.getElementById('boot');
  if (!boot) return;

  function showFallback() {
    if (boot.classList.contains('hm-failed')) return;
    boot.classList.add('hm-failed');
    boot.innerHTML =
      '<div class="hm-retry-title">Couldn\'t load the page</div>' +
      '<div class="hm-retry-sub">A slow or interrupted connection stopped the page from loading (a fresh update may have just gone live).</div>' +
      '<button id="hm-reload-btn">Tap to reload</button>';
    var btn = document.getElementById('hm-reload-btn');
    if (btn) btn.addEventListener('click', function () { location.reload(); });
  }

  // A script/stylesheet failed to fetch (e.g. stale asset hash after a deploy).
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'SCRIPT' || t.tagName === 'LINK')) showFallback();
  }, true);

  // If React never mounted within 15s, treat as a boot failure.
  setTimeout(function () {
    var root = document.getElementById('root');
    if (!root || root.childElementCount === 0) showFallback();
  }, 15000);
})();
