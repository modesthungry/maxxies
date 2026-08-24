/* ═══════════════════════════════════════════════════════
   script.js — Максим Лубнин Portfolio
═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     NAV: burger menu toggle
  ───────────────────────────────────────── */
  const burger = document.querySelector('.nav__burger');
  const mobileMenu = document.getElementById('mobile-menu');

  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!isOpen));
      mobileMenu.hidden = isOpen;
    });

    // Close on mobile link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.hidden = true;
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!burger.contains(e.target) && !mobileMenu.contains(e.target)) {
        burger.setAttribute('aria-expanded', 'false');
        mobileMenu.hidden = true;
      }
    });
  }

  /* ─────────────────────────────────────────
     NAV: active link highlight on scroll
  ───────────────────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');

  function setActiveLink() {
    let current = '';
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
      if (section.offsetTop <= scrollY) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  /* ─────────────────────────────────────────
     NAV: sticky shadow on scroll
  ───────────────────────────────────────── */
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  }, { passive: true });

  /* ─────────────────────────────────────────
     SCROLL REVEAL
  ───────────────────────────────────────── */
  function addRevealClasses() {
    const targets = [
      '.stat-card',
      '.case',
      '.skill-card',
      '.timeline__item',
      '.logic-step',
      '.contact-item',
      '.contact__form',
    ];
    targets.forEach(sel => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${i * 60}ms`;
      });
    });
  }

  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: just show everything
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    addRevealClasses();
    initReveal();
  }

  /* ─────────────────────────────────────────
     SMOOTH SCROLL for anchor links
  ───────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 64;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ─────────────────────────────────────────
     CONTACT FORM validation + submission
  ───────────────────────────────────────── */
  const form = document.getElementById('contact-form');
  if (form) {
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn?.querySelector('.btn__text');
    const btnLoading = submitBtn?.querySelector('.btn__loading');
    const successMsg = form.querySelector('.form-success');

    // Live validation helpers
    function showError(input, msg) {
      input.classList.add('error');
      const errorEl = input.parentElement.querySelector('.form-error');
      if (errorEl) errorEl.textContent = msg;
    }

    function clearError(input) {
      input.classList.remove('error');
      const errorEl = input.parentElement.querySelector('.form-error');
      if (errorEl) errorEl.textContent = '';
    }

    function validateField(input) {
      const val = input.value.trim();
      if (input.required && !val) {
        showError(input, 'Это поле обязательно для заполнения');
        return false;
      }
      if (input.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        showError(input, 'Введите корректный email-адрес');
        return false;
      }
      clearError(input);
      return true;
    }

    // Validate on blur
    form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('error')) validateField(field);
      });
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();

      // Validate all required fields
      let valid = true;
      form.querySelectorAll('input[required], textarea[required]').forEach(field => {
        if (!validateField(field)) valid = false;
      });
      if (!valid) return;

      // Check if Formspree ID is still a placeholder
      const action = form.getAttribute('action') || '';
      if (action.includes('ВАША_ФОРМА_ID')) {
        alert('Форма не настроена. Зарегистрируйтесь на formspree.io и замените ВАША_ФОРМА_ID в HTML-файле.');
        return;
      }

      // Show loading state
      submitBtn.disabled = true;
      if (btnText) btnText.hidden = true;
      if (btnLoading) btnLoading.hidden = false;

      try {
        const data = new FormData(form);
        const response = await fetch(action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          form.reset();
          if (successMsg) successMsg.hidden = false;
          submitBtn.hidden = true;
          form.querySelectorAll('.form-error').forEach(el => (el.textContent = ''));
        } else {
          const json = await response.json().catch(() => ({}));
          const msg = json.errors?.map(err => err.message).join(', ')
            || 'Ошибка при отправке. Попробуйте ещё раз или напишите напрямую на email.';
          alert(msg);
        }
      } catch {
        alert('Не удалось отправить сообщение. Проверьте соединение или напишите напрямую.');
      } finally {
        submitBtn.disabled = false;
        if (btnText) btnText.hidden = false;
        if (btnLoading) btnLoading.hidden = true;
      }
    });
  }

})();
