(function () {

  const DIRS      = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const GRID_SIZE = 8;
  const FADE_STEP = 0.02;

  class Walker {
    constructor(canvas, { x, y, color, size, speed, length }) {
      this.canvas    = canvas;
      this.color     = color;
      this.size      = size;
      this.speed     = speed;
      this.length    = length;
      this.stopped   = false;
      this.opacity   = 0;
      this.col       = Math.floor(x / size);
      this.row       = Math.floor(y / size);
      this.trail     = [{ col: this.col, row: this.row }];
      this.occupied  = new Set([this.col * 10000 + this.row]); // integer key
      this._elapsed  = 0;
      this._interval = 1000 / speed; // computed once
    }

    step() {
      // Fisher-Yates shuffle of 4 directions, no allocation
      const d = DIRS;
      for (let i = 3; i > 0; i--) {
        const j = Math.random() * (i + 1) | 0;
        const t = d[i]; d[i] = d[j]; d[j] = t;
      }

      const sz   = this.size;
      const cols = (this.canvas.width  / sz) | 0;
      const rows = (this.canvas.height / sz) | 0;

      for (let i = 0; i < 4; i++) {
        const nc  = this.col + d[i][0];
        const nr  = this.row + d[i][1];
        if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
        const key = nc * 10000 + nr;
        if (this.occupied.has(key)) continue;
        this.col = nc;
        this.row = nr;
        this.trail.push({ col: nc, row: nr });
        this.occupied.add(key);
        if (this.trail.length > this.length) {
          const tail = this.trail.shift();
          this.occupied.delete(tail.col * 10000 + tail.row);
        }
        return true;
      }
      return false;
    }

    update(dt) {
      if (this.stopped) {
        this.opacity = this.opacity - FADE_STEP < 0 ? 0 : this.opacity - FADE_STEP;
        return;
      }
      this.opacity = this.opacity + FADE_STEP > 1 ? 1 : this.opacity + FADE_STEP;
      this._elapsed += dt;
      while (this._elapsed >= this._interval) {
        this._elapsed -= this._interval;
        if (!this.step()) { this.stopped = true; return; }
      }
    }

    get alive() { return this.opacity > 0.01; }

    draw(ctx) {
      const n   = this.trail.length;
      const op  = this.opacity;
      const s   = this.size;
      ctx.fillStyle = this.color;
      for (let i = 0; i < n; i++) {
        ctx.globalAlpha = ((i + 1) / n) * op;
        const c = this.trail[i];
        ctx.fillRect(c.col * s + 1, c.row * s + 1, s - 1, s - 1);
      }
    }
  }

  function spawnWalker(canvas, cfg) {
    return new Walker(canvas, {
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
      color:  cfg.color,
      size:   cfg.size,
      speed:  cfg.speed,
      length: cfg.length,
    });
  }

  document.querySelectorAll('.jwalker').forEach(function (container) {
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
    container.style.isolation = 'isolate';

    const d = container.dataset;
    const cfg = {
      color:  d.color  || 'rgb(160,160,160)',
      size:   d.size   ? parseInt(d.size,  10) : GRID_SIZE,
      count:  d.count  ? parseInt(d.count, 10) : 3,
      speed:  d.speed  ? parseFloat(d.speed)   : 4 + Math.random() * 8,
      length: d.length ? parseInt(d.length, 10) : 20 + Math.floor(Math.random() * 40),
    };

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:-1;';
    container.prepend(canvas);

    const ctx = canvas.getContext('2d');
    const N = cfg.count;
    let walkers = [];
    let needsReset = true;
    let resizeTimer = null;

    new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { needsReset = true; }, 150);
    }).observe(container);

    let last = null;
    function loop(ts) {
      const dt = last === null ? 0 : ts - last;
      last = ts;

      if (needsReset) {
        needsReset = false;
        canvas.width  = container.offsetWidth;
        canvas.height = container.offsetHeight;
        walkers = Array.from({ length: N }, function () { return spawnWalker(canvas, cfg); });
      }

      // In-place cull and refill — no allocation when steady-state
      let alive = 0;
      for (let i = 0; i < walkers.length; i++) {
        if (walkers[i].alive) walkers[alive++] = walkers[i];
      }
      walkers.length = alive;
      while (walkers.length < N) walkers.push(spawnWalker(canvas, cfg));

      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < walkers.length; i++) {
        walkers[i].update(dt);
        walkers[i].draw(ctx);
      }
      ctx.globalAlpha = 1;

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  });

}());
