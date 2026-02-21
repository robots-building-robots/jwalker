(function () {

  const DIRS      = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const GRID_SIZE = 8;
  const FADE_STEP = 0.02;

  function parseColor(str) {
    const c = document.createElement('canvas').getContext('2d');
    c.fillStyle = str;
    const v = c.fillStyle; // browser normalises to #rrggbb or rgba(...)
    if (v[0] === '#') {
      const n = parseInt(v.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    return v.match(/\d+/g).slice(0, 3).map(Number);
  }

  class Walker {
    constructor(canvas, { x, y, lead, tail, size, speed, length }) {
      this.canvas    = canvas;
      this.lead      = parseColor(lead);
      this.tail      = parseColor(tail);
      this.size      = size;
      this.length    = length;
      this.stopped   = false;
      this.opacity   = 0;
      this.col       = Math.floor(x / size);
      this.row       = Math.floor(y / size);
      this.trail     = [{ col: this.col, row: this.row }];
      this.occupied  = new Set([this.col * 10000 + this.row]);
      this._elapsed  = 0;
      this._interval = 1000 / speed;
    }

    step() {
      // Fisher-Yates in-place shuffle
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
      const n            = this.trail.length;
      const op           = this.opacity;
      const s            = this.size;
      const [lr, lg, lb] = this.lead;
      const [tr, tg, tb] = this.tail;
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / n;
        const r = (lr - tr) * t + tr | 0;
        const g = (lg - tg) * t + tg | 0;
        const b = (lb - tb) * t + tb | 0;
        ctx.fillStyle = `rgba(${r},${g},${b},${t * op})`;
        const c = this.trail[i];
        ctx.fillRect(c.col * s + 1, c.row * s + 1, s - 1, s - 1);
      }
    }
  }

  function spawnWalker(canvas, cfg) {
    return new Walker(canvas, {
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
      lead:   cfg.lead,
      tail:   cfg.tail,
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
      lead:   d.color    || '#a0a0a0',
      tail:   d.colorEnd || '#000000',
      size:   d.size   ? parseInt(d.size,  10) : GRID_SIZE,
      count:  d.count  ? parseInt(d.count, 10) : null,
      speed:  d.speed  ? parseFloat(d.speed)   : 4 + Math.random() * 8,
      length: d.length ? parseInt(d.length, 10) : 20 + Math.floor(Math.random() * 40),
    };

    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;';
    container.prepend(canvas);

    const ctx = canvas.getContext('2d');
    const MAX = 8;
    let n = 0;
    let walkers = [];
    let needsReset = true;
    let resizeTimer = null;

    new ResizeObserver(function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { needsReset = true; }, 150);
    }).observe(container);

    container.addEventListener('click', function (e) {
      const rect = container.getBoundingClientRect();
      const w = new Walker(canvas, {
        x:      e.clientX - rect.left,
        y:      e.clientY - rect.top,
        lead:   cfg.lead,
        tail:   cfg.tail,
        size:   cfg.size,
        speed:  cfg.speed,
        length: cfg.length,
      });
      w.opacity = 1;
      if (walkers.length >= MAX) walkers.shift();
      walkers.push(w);
    });

    let last = null;
    function loop(ts) {
      const dt = last === null ? 0 : ts - last;
      last = ts;

      if (needsReset) {
        needsReset = false;
        const desktop = cfg.count ?? 3;
        n = window.innerWidth < 768 ? Math.ceil(desktop / 2) : desktop;
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        walkers = Array.from({ length: n }, function () { return spawnWalker(canvas, cfg); });
      }

      let alive = 0;
      for (let i = 0; i < walkers.length; i++) {
        if (walkers[i].alive) walkers[alive++] = walkers[i];
      }
      walkers.length = alive;
      while (walkers.length < n) walkers.push(spawnWalker(canvas, cfg));
      if (walkers.length > MAX) walkers.splice(0, walkers.length - MAX);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < walkers.length; i++) {
        walkers[i].update(dt);
        walkers[i].draw(ctx);
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  });

}());
