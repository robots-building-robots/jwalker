(function () {

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  class Walker {
    constructor(canvas, { x, y, size, color, speed, length }) {
      this.canvas = canvas;
      this.size   = size;    // grid cell size in px
      this.color  = color;
      this.speed  = speed;   // steps per second
      this.length = length;  // max trail length in cells

      // Snap starting position to grid
      this.col = Math.floor(x / size);
      this.row = Math.floor(y / size);

      this.trail    = [{ col: this.col, row: this.row }];
      this.occupied = new Set([`${this.col},${this.row}`]);

      this._elapsed = 0;
    }

    step() {
      // Shuffle directions for unbiased random walk
      const dirs = DIRS.slice().sort(() => Math.random() - 0.5);

      const cols = Math.floor(this.canvas.width  / this.size);
      const rows = Math.floor(this.canvas.height / this.size);

      for (const [dc, dr] of dirs) {
        const nc = this.col + dc;
        const nr = this.row + dr;
        const key = `${nc},${nr}`;

        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        if (this.occupied.has(key)) continue;

        // Move to the new cell
        this.col = nc;
        this.row = nr;
        this.trail.push({ col: nc, row: nr });
        this.occupied.add(key);

        // Drop the tail if over length
        if (this.trail.length > this.length) {
          const tail = this.trail.shift();
          this.occupied.delete(`${tail.col},${tail.row}`);
        }

        return;
      }
      // All neighbours occupied — wait (trail will free space next step)
    }

    update(dt) {
      this._elapsed += dt;
      const interval = 1000 / this.speed;
      while (this._elapsed >= interval) {
        this._elapsed -= interval;
        this.step();
      }
    }

    draw(ctx) {
      const s = this.size;
      const n = this.trail.length;
      for (let i = 0; i < n; i++) {
        const { col, row } = this.trail[i];
        // Fade opacity from tail to head
        const alpha = (i + 1) / n;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(col * s + 1, row * s + 1, s - 1, s - 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  function randomColor() {
    return `hsl(${Math.random() * 360}, 70%, 55%)`;
  }

  function randomWalker(canvas) {
    const size = 16 + Math.floor(Math.random() * 24);
    return new Walker(canvas, {
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
      size,
      color:  randomColor(),
      speed:  4 + Math.random() * 8,
      length: 20 + Math.floor(Math.random() * 40),
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

    let last = null;
    function loop(ts) {
      const dt = last === null ? 0 : ts - last;
      last = ts;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      walkers.forEach(w => { w.update(dt); w.draw(ctx); });
      requestAnimationFrame(loop);
    }

    resize();
    requestAnimationFrame(loop);
    new ResizeObserver(resize).observe(container);
  });

}());
