document.addEventListener('DOMContentLoaded', () => {

  // ====== Mobile Nav Toggle ======
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Close nav when clicking a link (mobile)
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
    });
  });

  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#nav')) {
      navLinks.classList.remove('open');
    }
  });

  // ====== Nav scroll background ======
  const nav = document.getElementById('nav');
  let navScrolled = false;

  function updateNavBg() {
    const scrolled = window.scrollY > 20;
    if (scrolled !== navScrolled) {
      navScrolled = scrolled;
      nav.style.background = scrolled
        ? 'rgba(15, 15, 26, 0.95)'
        : 'rgba(15, 15, 26, 0.85)';
      nav.style.boxShadow = scrolled
        ? '0 1px 20px rgba(0, 0, 0, 0.3)'
        : 'none';
    }
  }

  window.addEventListener('scroll', updateNavBg, { passive: true });
  updateNavBg();

  // ====== Screenshot Lightbox ======
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  document.querySelectorAll('.screenshot-card').forEach(card => {
    card.addEventListener('click', () => {
      const fullSrc = card.getAttribute('data-full');
      lightboxImg.src = fullSrc;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  // ====== FAQ Accordion ======
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');

      // Close all others
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) openItem.classList.remove('open');
      });

      // Toggle current
      item.classList.toggle('open', !isOpen);
    });
  });

  // ====== Smooth scroll offset for fixed nav ======
  // Handled by CSS scroll-padding-top, but also handle hash links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 60;
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });

  // ====== Intersection Observer for reveal animations ======
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe feature cards, workflow steps, screenshot cards, download cards, FAQ items
  document.querySelectorAll([
    '.feature-card',
    '.wf-step',
    '.screenshot-card',
    '.download-card',
    '.faq-item',
    '.intro-card'
  ].join(',')).forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

});
