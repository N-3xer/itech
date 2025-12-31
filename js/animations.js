// Animations: GSAP ScrollTrigger if available, counters, and small effects
document.addEventListener('DOMContentLoaded', () => {
  // GSAP ScrollTrigger if present
  if (window.gsap && window.gsap.registerPlugin) {
    try {
      gsap.registerPlugin(ScrollTrigger);
      gsap.utils.toArray('section').forEach(section => {
        // Animate each section into view with a subtle upward motion and fade.
        // Using ScrollTrigger yields smooth, performant scroll-driven animations.
        gsap.from(section, {
          opacity: 0,
          y: 30,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: { trigger: section, start: 'top 85%' }
        });
      });
    } catch (e) { console.warn('GSAP init failed', e); }
  }

  // additional small reveal for pillar children
  if (window.gsap && window.gsap.registerPlugin) {
    gsap.utils.toArray('.pillar-card').forEach((card, i) => {
      gsap.from(card, { opacity: 0, y: 30, duration: 0.8, delay: i*0.12, scrollTrigger: { trigger: card, start: 'top 85%' } });
    });
  }

  // Simple count-up for stats elements: elements with data-count
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const to = el.getAttribute('data-count');
          animateCount(el, to);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => io.observe(c));
  }

  function animateCount(el, to) {
    const n = isNaN(+to) ? to : +to;
    if (typeof n === 'number') {
      // Simple numeric tween using requestAnimationFrame. This avoids adding a heavy
      // dependency and provides a smooth count-up effect when the stat enters view.
      let start = 0; const duration = 1500; const startTime = performance.now();
      function step(now) {
        const t = Math.min((now - startTime) / duration, 1);
        el.textContent = Math.floor(t * n + (1 - t) * start);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    } else {
      el.textContent = to;
    }
  }
});
