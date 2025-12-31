// Main interactions: mobile menu, navbar scroll behavior, slideshow, smooth scroll
document.addEventListener('DOMContentLoaded', function () {
  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu
  const mobileToggle = document.getElementById('mobile-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('mobile-open');
      mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Navbar solidify on scroll
  const header = document.getElementById('site-header');
  const hero = document.getElementById('hero');
  const heroHeight = hero ? hero.offsetHeight : 600;
  function updateHeader() {
    if (window.scrollY > heroHeight - 80) {
      header.classList.add('bg-itech-dark/95','backdrop-blur-sm','scrolled');
    } else {
      header.classList.remove('bg-itech-dark/95','backdrop-blur-sm','scrolled');
    }
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Smooth scroll for internal anchors (account for fixed header)
  const headerHeight = header ? header.offsetHeight : 80;
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href').slice(1);
      if (!targetId) return;
      const target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        // Calculate the final scroll position while accounting for the fixed header's height
        // and a small spacing offset so the section title isn't flush against the header.
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 24;
        window.scrollTo({ top, behavior: 'smooth' });
        // close mobile menu if open
        if (mobileMenu && mobileMenu.classList.contains('mobile-open')) mobileMenu.classList.remove('mobile-open');
      }
    });
  });

  // Hero reveals
  const headline = document.getElementById('hero-headline');
  const subtitle = document.getElementById('hero-sub');
  setTimeout(() => { headline && headline.classList.add('opacity-100'); headline && headline.classList.remove('opacity-0'); }, 300);
  setTimeout(() => { subtitle && subtitle.classList.add('opacity-100'); subtitle && subtitle.classList.remove('opacity-0'); }, 700);

  // Slideshow phrases
  const phrases = ["Education that transforms","Software that solves","Websites that convert"];
  let slideIdx = 0;
  const slideshow = document.getElementById('slideshow');
  // showSlide makes a small animated swap of text inside the circle.
  // We fade it out, switch text, and nudge its Y position for a subtle motion effect.
  function showSlide(i){
    if (!slideshow) return;
    slideshow.style.opacity = 0;
    setTimeout(()=>{
      slideshow.textContent = phrases[i];
      slideshow.style.transform = 'translateY(6px)';
      slideshow.style.opacity = 1;
      setTimeout(()=> slideshow.style.transform = 'translateY(0)', 220);
    }, 300);
  }
  showSlide(slideIdx);
  // Respect user preference for reduced motion: disable auto-rotation if user requests reduced motion
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    setInterval(()=>{ slideIdx = (slideIdx+1)%phrases.length; showSlide(slideIdx); }, 3000);
  }

  // Simple reveal on scroll observer for elements with opacity-0
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        // Add utility classes used for reveal animations. These are simple CSS transitions
        // that act as a lightweight fallback when GSAP isn't available.
        e.target.classList.add('reveal','visible');
        e.target.classList.remove('opacity-0');
      }
    });
  }, {threshold:0.15});
  document.querySelectorAll('.opacity-0').forEach(el => io.observe(el));

  // Improved carousel functionality (slides + dots + autoplay)
  (function initCarousel(){
    const slides = Array.from(document.querySelectorAll('.carousel-slide'));
    const dots = Array.from(document.querySelectorAll('.dot'));
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    if (!slides.length) return;
    let current = 0; const total = slides.length;

    // Initialize accessibility attributes for slides and dots
    slides.forEach((s, i) => {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slide');
      s.setAttribute('aria-label', `Slide ${i+1} of ${total}`);
      s.setAttribute('aria-hidden', 'true');
    });
    dots.forEach((d, i) => {
      // make dots keyboard-focusable and announceable
      d.setAttribute('role', 'button');
      d.setAttribute('tabindex', '0');
      d.setAttribute('aria-label', `Show slide ${i+1}`);
      d.setAttribute('aria-current', 'false');
      // keyboard activation for Enter/Space
      d.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); showSlide(i); reset(); }
      });
    });

    function showSlide(index){
      // Toggle the active class on slides and dots (CSS handles the animation)
      slides.forEach((s,i)=> {
        const isActive = i===index;
        s.classList.toggle('active', isActive);
        s.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      });
      dots.forEach((d,i)=> {
        const isActive = i===index;
        d.classList.toggle('active', isActive);
        d.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
      current = index;

      // Update a visually-hidden live region so screen readers announce the currently visible testimonial
      const announcer = document.getElementById('carousel-announcer');
      if (announcer) {
        const activeSlide = slides[index];
        const nameEl = activeSlide && activeSlide.querySelector('.testimonial-name');
        const quoteEl = activeSlide && activeSlide.querySelector('.testimonial-quote');
        const text = nameEl ? `${nameEl.textContent}: ${quoteEl ? quoteEl.textContent : ''}` : `Slide ${index+1}`;
        announcer.textContent = text;
      }
    }

    function nextSlide(){ showSlide((current+1)%total); }
    function prevSlide(){ showSlide((current-1+total)%total); }

    nextBtn && nextBtn.addEventListener('click', ()=>{ nextSlide(); reset(); });
    prevBtn && prevBtn.addEventListener('click', ()=>{ prevSlide(); reset(); });
    dots.forEach((d,i)=> d.addEventListener('click', ()=>{ showSlide(i); reset(); }));

    // If the user prefers reduced motion, don't autoplay the carousel
    const prefReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let interval = prefReduced ? null : setInterval(nextSlide, 5000);
    function reset(){ if (prefReduced) return; clearInterval(interval); interval = setInterval(nextSlide, 5000); }
    // initial show
    showSlide(0);
    // keyboard navigation (left/right arrows)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { nextSlide(); reset(); }
      if (e.key === 'ArrowLeft') { prevSlide(); reset(); }
    });
  })();
});
