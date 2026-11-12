// Anime Ambient Canvas Particles
(function() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const PARTICLE_COUNT = 45;

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.theme = document.body.getAttribute('data-theme') || 'monarch';
      this.x = Math.random() * width;
      this.y = initial ? Math.random() * height : (this.theme === 'flame' ? height + 10 : -10);
      
      if (this.theme === 'sakura') {
        this.size = Math.random() * 8 + 6;
        this.speedX = Math.random() * 1.5 - 0.5;
        this.speedY = Math.random() * 1.8 + 1.0;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.04;
        this.opacity = Math.random() * 0.6 + 0.3;
      } else if (this.theme === 'flame') {
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 1.2;
        this.speedY = -(Math.random() * 2.2 + 1.0);
        this.opacity = Math.random() * 0.7 + 0.3;
      } else {
        // Monarch / Cyberpunk / Ghibli
        this.size = Math.random() * 3 + 1.5;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.opacity = Math.random() * 0.5 + 0.2;
      }
    }

    update() {
      const currentTheme = document.body.getAttribute('data-theme') || 'monarch';
      if (this.theme !== currentTheme) {
        this.theme = currentTheme;
      }

      this.x += this.speedX;
      this.y += this.speedY;

      if (this.theme === 'sakura') {
        this.rotation += this.rotSpeed;
        if (this.y > height + 20 || this.x > width + 20 || this.x < -20) {
          this.reset(false);
        }
      } else if (this.theme === 'flame') {
        if (this.y < -20) {
          this.reset(false);
        }
      } else {
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.reset(false);
        }
      }
    }

    draw() {
      ctx.save();
      if (this.theme === 'sakura') {
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.beginPath();
        ctx.fillStyle = `rgba(244, 114, 182, ${this.opacity})`;
        // Sakura petal ellipse shape
        ctx.ellipse(0, 0, this.size, this.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (this.theme === 'flame') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249, 115, 22, ${this.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ef4444';
        ctx.fill();
      } else if (this.theme === 'ghibli') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(52, 211, 153, ${this.opacity})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#34d399';
        ctx.fill();
      } else if (this.theme === 'cyberpunk') {
        ctx.fillStyle = Math.random() > 0.5 ? `rgba(244, 63, 94, ${this.opacity})` : `rgba(6, 182, 212, ${this.opacity})`;
        ctx.fillRect(this.x, this.y, this.size, this.size);
      } else {
        // Monarch System Blue
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${this.opacity})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#38bdf8';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    for (let p of particles) {
      p.update();
      p.draw();
    }
    requestAnimationFrame(animate);
  }

  animate();
})();
