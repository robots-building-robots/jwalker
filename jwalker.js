(function () {

  const DIRS      = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const GRID_SIZE = 8;
  const FADE_STEP = 0.008; // opacity delta per frame (~2s at 60fps)

  class Walker {
    constructor(canvas, { x, y, color, speed, length }) {
      this.canvas  = canvas;
      this.size    = GRID_SIZE;
      this.color   = color;
      this.speed   = speed;
      this.length  = length;
      this.stopped = false;
      this.opacity = 0; // fades in from 0

      this.col = Math.floor(x / GRID_SIZE);
      this.row = Math.floor(y / GRID_SIZE);

      this.trail    = [{ col: this.col, row: this.row }];
      this.occupied = new Set([`${this.col},${this.row}`]);
      this._elapsed = 0;
    }

    step() {
      const dirs = DIRS.slice().sort(() => Math.random() - 0.5);
      const cols = Math.floor(this.canvas.width  / this.size);
      const rows = Math.floor(this.canvas.height / this.size);

      for (const [dc, dr] of dirs) {
        const nc  = this.col + dc;
        const nr  = this.row + dr;
        const key = `${nc},${nr}`;

        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        if (this.occupied.has(key)) continue;

        this.col = nc;
        this.row = nr;
        this.trail.push({ col: nc, row: nr });
        this.occupied.add(key);

        if (this.trail.length > this.length) {
          const tail = this.trail.shift();
          this.occupied.delete(`${tail.col},${tail.row}`);
        }
        return true;
      }
      return false;
    }

    update(dt) {
      if (this.stopped) {
        this.opacity -= FADE_STEP;
        return;
      }

      // Fade in
      if (this.opacity < 1) this.opacity = Math.min(1, this.opacity + FADE_STEP);

      this._elapsed += dt;
      const interval = 1000 / this.speed;
      while (this._elapsed >= interval) {
        this._elapsed -= interval;
        if (!this.step()) {
          this.stopped = true;
          return;
        }
      }
    }

    get alive() {
      return this.opacity > 0;
    }

    draw(ctx) {
      const s = this.size;
      const n = this.trail.length;
      for (let i = 0; i < n; i++) {
        const { col, row } = this.trail[i];
        ctx.globalAlpha = ((i + 1) / n) * this.opacity;
        ctx.fillStyle = this.color;
        ctx.fillRect(col * s + 1, row * s + 1, s - 1, s - 1);
      }
      ctx.globalAlpha = 1;
    }
  }

  function randomColor() {
    const l = 30 + Math.floor(Math.random() * 35);
    return `hsl(0, 0%, ${l}%)`;
  }

  function randomWalker(canvas) {
    return new Walker(canvas, {
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
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

      // Cull dead walkers, spawn to keep N moving
      const alive  = walkers.filter(w => w.alive);
      const moving = alive.filter(w => !w.stopped).length;
      const needed = N - moving;
      for (let i = 0; i < needed; i++) alive.push(randomWalker(canvas));
      walkers = alive;

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
