(function () {
  document.querySelectorAll('.jwalker').forEach(function (container) {
    var style = container.style;
    if (getComputedStyle(container).position === 'static') style.position = 'relative';
    style.isolation = 'isolate';

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;';
    container.prepend(canvas);

    function draw() {
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      var ctx = canvas.getContext('2d');
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(canvas.width, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(canvas.width, 0); ctx.lineTo(0, canvas.height); ctx.stroke();
    }

    draw();
    new ResizeObserver(draw).observe(container);
  });
}());
