(function () {
  var d = document.documentElement;
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    d.dataset.theme = t;
  } catch (e) {
    d.dataset.theme = 'light';
  }
})();
