(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.jwalker = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  function createCanvas(container) {
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.setAttribute('role', 'presentation');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;display:block;';
    container.appendChild(canvas);
    return canvas;
  }

  function resizeCanvas(canvas) {
    var container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }

  function draw(canvas) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function observe(canvas) {
    if (typeof ResizeObserver !== 'undefined') {
      var observer = new ResizeObserver(function () {
        resizeCanvas(canvas);
        draw(canvas);
      });
      observer.observe(canvas.parentElement);
    } else {
      var redraw = debounce(function () {
        resizeCanvas(canvas);
        draw(canvas);
      }, 150);
      window.addEventListener('resize', redraw);
    }
  }

  function init(selector) {
    selector = selector || '.jwalker';
    var containers = document.querySelectorAll(selector);
    for (var i = 0; i < containers.length; i++) {
      var container = containers[i];
      if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
      }
      var canvas = createCanvas(container);
      resizeCanvas(canvas);
      draw(canvas);
      observe(canvas);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  return { init: init };

}));
