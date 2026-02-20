(function () {

  class Walker {
    constructor(canvas, { x, y, size, color, speed, length }) {
      this.canvas = canvas;
      this.x = x;
      this.y = y;
      this.size = size;
      this.color = color;
      this.speed = speed;
      this.length = length;
      this.trail = [];
      this.angle = Math.random() * Math.PI * 2;
    }

    update() {
      // Randomly nudge direction
      this.angle += (Math.random() - 0.5) * 0.4;

      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;

      // Bounce off edges
      const w = this.canvas.width;
      const h = this.canvas.height;
      if (this.x < 0 || this.x > w) { this.angle = Math.PI - this.angle; this.x = Math.max(0, Math.min(w, this.x)); }
      if (this.y < 0 || this.y > h) { this.angle = -this.angle;           this.y = Math.max(0, Math.min(h, this.y)); }

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.length) this.trail.shift();
    }

    draw(ctx) {
      if (this.trail.length < 2) return;

      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.stroke();

      // Circle at head
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function randomColor() {
    return `hsl(${Math.random() * 360}, 70%, 55%)`;
  }

  function randomWalker(canvas) {
    return new Walker(canvas, {
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
      size:   4 + Math.random() * 12,
      color:  randomColor(),
      speed:  1 + Math.random() * 3,
      length: 40 + Math.floor(Math.random() * 80),
    });
  }

  document.querySelectorAll('.jwalker').forEach(function (container) {
    const style = container.style;
    if (getComputedStyle(container).position === 'static') style.position = 'relative';
    style.isolation = 'isolate';

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;';
    container.prepend(canvas);

    const N = 3;
    let walkers = [];

    function resize() {
      canvas.width  = container.offsetWidth;
      canvas.height = container.offsetHeight;
      walkers = Array.from({ length: N }, () => randomWalker(canvas));
    }

    function loop() {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      walkers.forEach(w => { w.update(); w.draw(ctx); });
      requestAnimationFrame(loop);
    }

    resize();
    loop();
    new ResizeObserver(resize).observe(container);
  });

}());
