/*
 * JavaScript for the Material 3 Expressive demo site.
 *
 * This script implements dynamic theming based on a user‑selected accent
 * color, toggles dark mode on request, and wires up simple interactions for
 * the floating action button (FAB) menu.  It includes lightweight colour
 * conversion helpers and demonstrates how to adjust Material design
 * variables on the fly.
 */

/* Colour conversion helpers.  These functions convert between hex and HSL
 * representations so that we can adjust a colour's lightness for the
 * different roles (container, on‑colour, etc.).  They were inspired by
 * common colour manipulation routines and are deliberately kept simple.
 */
function hexToHsl(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  const l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }
  const toHex = (val) => {
    const h = Math.round((val + m) * 255).toString(16).padStart(2, '0');
    return h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function adjustLightness(hsl, delta) {
  let newL = Math.max(0, Math.min(100, hsl.l + delta));
  return { h: hsl.h, s: hsl.s, l: newL };
}

/* Determine whether black or white will be more legible on a given
 * background colour.  This simple luminance check is adequate for
 * generating on‑colour values for our dynamic theme. */
function getContrastColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // Perceived luminance formula.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Apply an accent colour to the CSS variables.  The algorithm adjusts
 * lightness to generate container colours and computes appropriate on
 * colours (text on coloured surfaces).  It also derives a secondary
 * palette by shifting the hue slightly.
 * @param {string} hex The source colour in hex format.
 */
function setThemeColor(hex) {
  const hsl = hexToHsl(hex);
  // Primary roles
  const primary = hex;
  const onPrimary = getContrastColor(primary);
  const primaryContainer = hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 40, 95));
  const onPrimaryContainer = getContrastColor(primaryContainer);
  // Secondary palette by rotating the hue by 30 degrees and reducing
  // saturation to 60% of the original.  This loosely emulates the
  // Material algorithm which derives tonal palettes from a base colour.
  const secondaryH = (hsl.h + 30) % 360;
  const secondaryS = Math.max(10, hsl.s * 0.6);
  const secondaryL = Math.max(20, Math.min(90, hsl.l));
  const secondary = hslToHex(secondaryH, secondaryS, secondaryL);
  const onSecondary = getContrastColor(secondary);
  const secondaryContainer = hslToHex(secondaryH, secondaryS, Math.min(secondaryL + 35, 95));
  const onSecondaryContainer = getContrastColor(secondaryContainer);
  // Tertiary palette by rotating further.
  const tertiaryH = (hsl.h + 300) % 360;
  const tertiaryS = Math.max(10, hsl.s * 0.5);
  const tertiaryL = hsl.l;
  const tertiary = hslToHex(tertiaryH, tertiaryS, tertiaryL);
  const onTertiary = getContrastColor(tertiary);
  const tertiaryContainer = hslToHex(tertiaryH, tertiaryS, Math.min(tertiaryL + 40, 95));
  const onTertiaryContainer = getContrastColor(tertiaryContainer);

  const root = document.documentElement;
  // Apply primary roles
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--on-primary', onPrimary);
  root.style.setProperty('--primary-container', primaryContainer);
  root.style.setProperty('--on-primary-container', onPrimaryContainer);
  // Apply secondary roles
  root.style.setProperty('--secondary', secondary);
  root.style.setProperty('--on-secondary', onSecondary);
  root.style.setProperty('--secondary-container', secondaryContainer);
  root.style.setProperty('--on-secondary-container', onSecondaryContainer);
  // Apply tertiary roles
  root.style.setProperty('--tertiary', tertiary);
  root.style.setProperty('--on-tertiary', onTertiary);
  root.style.setProperty('--tertiary-container', tertiaryContainer);
  root.style.setProperty('--on-tertiary-container', onTertiaryContainer);
}

/**
 * Initialise interactions once the page is loaded.  This function
 * attaches event listeners to the colour picker, dark mode toggle and FAB.
 */
function init() {
  const colorPicker = document.getElementById('colorPicker');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const darkModeLabel = document.getElementById('darkModeLabel');
  const fab = document.getElementById('fab');
  const fabMenu = document.getElementById('fabMenu');
  const getStartedBtn = document.getElementById('getStartedBtn');

  // Grab handles for the new Tools controls.  These sliders adjust
  // global variables for shape and typography.  We also reference
  // elements within the live updates and about sections.
  const radiusSlider = document.getElementById('radiusSlider');
  const weightSlider = document.getElementById('weightSlider');
  const widthSlider = document.getElementById('widthSlider');
  const clockDisplay = document.getElementById('clockDisplay');
  const starsDisplay = document.getElementById('starsDisplay');
  const forksDisplay = document.getElementById('forksDisplay');
  const liveProgress = document.getElementById('liveProgress');
  const devName = document.getElementById('devName');
  const devNickname = document.getElementById('devNickname');
  const avatarImg = document.getElementById('avatarImg');
  const repoSizeSpan = document.getElementById('repoSize');

  // Set the initial accent colour based on the picker's value.
  setThemeColor(colorPicker.value);

  // When the user picks a new colour, update the theme.
  colorPicker.addEventListener('input', (e) => {
    setThemeColor(e.target.value);
  });

  // Toggle dark mode.  Add or remove the 'dark-theme' class on html.
  // Use event delegation for the dark mode toggle.  Some nested elements
  // (e.g. the span or svg inside the button) may intercept click events,
  // so listen on the document and check if the click occurred within
  // the toggle.  Using closest() ensures any descendant will match.
  document.addEventListener('click', (evt) => {
    const toggleBtn = evt.target.closest('#darkModeToggle');
    if (toggleBtn) {
      const html = document.documentElement;
      const isDark = html.classList.toggle('dark-theme');
      darkModeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
    }
  });

  // Handle FAB menu opening/closing.  Clicking the FAB toggles the
  // `open` class on the menu, which controls its visibility via CSS.
  fab.addEventListener('click', () => {
    fabMenu.classList.toggle('open');
  });
  // Close the menu when clicking outside of it.
  document.addEventListener('click', (e) => {
    if (!fab.contains(e.target) && !fabMenu.contains(e.target)) {
      fabMenu.classList.remove('open');
    }
  });

  // Scroll to the features section when clicking the Get started button.
  getStartedBtn.addEventListener('click', () => {
    const section = document.getElementById('features');
    section.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------------------------------------------------------------------
   * Tools controls
   *
   * Update CSS variables when the user adjusts the corner radius or
   * variable font sliders.  The radius slider controls all corner sizes
   * proportionally: small, medium and large radii are derived from the
   * base value.  The weight and width sliders update the corresponding
   * CSS custom properties that feed into the `font-variation-settings`
   * rule declared in the stylesheet.  These updates take effect
   * immediately, enabling a playful exploration of Material 3’s adaptive
   * shapes and type.
   */
  if (radiusSlider) {
    radiusSlider.addEventListener('input', (e) => {
      const base = parseInt(e.target.value, 10);
      const root = document.documentElement;
      // Derive smaller radii proportionally and clamp to minimum values.
      const small = Math.max(2, Math.round(base * 0.3));
      const medium = Math.max(4, Math.round(base * 0.6));
      const large = base;
      root.style.setProperty('--radius-small', `${small}px`);
      root.style.setProperty('--radius-medium', `${medium}px`);
      root.style.setProperty('--radius-large', `${large}px`);
    });
  }
  if (weightSlider) {
    weightSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      document.documentElement.style.setProperty('--font-weight', val);
    });
  }
  if (widthSlider) {
    widthSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      document.documentElement.style.setProperty('--font-width', val);
    });
  }

  /* ---------------------------------------------------------------------
   * Live updates
   *
   * Keep the Berlin clock ticking, animate a looping progress bar and
   * fetch live repository statistics from GitHub.  Real‑time updates
   * bring the interface to life, reflecting the glanceable design
   * principles of Material 3 Expressive【148115298754705†L333-L344】. */
  // Clock: update every second using the browser's local clock
  function updateClock() {
    try {
      const now = new Date().toLocaleTimeString('de-DE', {
        timeZone: 'Europe/Berlin',
        hour12: false
      });
      clockDisplay.textContent = now;
    } catch (err) {
      // Fallback to system time without timezone if conversion fails
      clockDisplay.textContent = new Date().toLocaleTimeString();
    }
  }
  if (clockDisplay) {
    updateClock();
    setInterval(updateClock, 1000);
  }
  // Progress bar: animate a looping value from 0 to 100
  if (liveProgress) {
    let progress = 0;
    setInterval(() => {
      progress = (progress + 1) % 101;
      liveProgress.value = progress;
    }, 50);
  }
  // Fetch GitHub repo stats for stars and forks.  Use the public
  // GitHub API which supports CORS.  If the request fails, fall back
  // to default values so the UI remains populated.  Note: hitting this
  // endpoint too frequently may trigger rate limiting, so we fetch once.
  function fetchRepoStats() {
    fetch('https://api.github.com/repos/mosesmakaka/material3-web-app')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.stargazers_count !== undefined) {
          starsDisplay.textContent = data.stargazers_count;
          forksDisplay.textContent = data.forks_count;
        } else {
          starsDisplay.textContent = '134';
          forksDisplay.textContent = '0';
        }
      })
      .catch(() => {
        starsDisplay.textContent = '134';
        forksDisplay.textContent = '0';
      });
  }
  if (starsDisplay && forksDisplay) {
    fetchRepoStats();
  }

  /* ---------------------------------------------------------------------
   * About section API integration
   *
   * Retrieve developer information and repository size from GitHub.  If
   * these requests fail (e.g. due to CORS), fallback values ensure the
   * about section still shows meaningful data.  The fallback avatar is
   * bundled with the project. */
  function loadAbout() {
    // Fetch user profile
    fetch('https://api.github.com/users/mosesmakaka')
      .then((res) => res.json())
      .then((user) => {
        if (user && user.login) {
          devName.textContent = user.name || user.login;
          devNickname.textContent = '@' + user.login;
          if (user.avatar_url) {
            avatarImg.src = user.avatar_url;
          }
        }
      })
      .catch(() => {
        devName.textContent = 'Moses Makaka';
        devNickname.textContent = '@mosesmakaka';
        avatarImg.src = 'images/avatar.png';
      });
    // Fetch repo details for size
    fetch('https://api.github.com/repos/mosesmakaka/material3-web-app')
      .then((res) => res.json())
      .then((repo) => {
        if (repo && typeof repo.size === 'number') {
          // GitHub returns size in kilobytes
          repoSizeSpan.textContent = `${Math.round(repo.size)} KB`;
        }
      })
      .catch(() => {
        repoSizeSpan.textContent = '134 KB';
      });
  }
  if (devName && devNickname && avatarImg && repoSizeSpan) {
    loadAbout();
  }

  /* ---------------------------------------------------------------------
   * Scroll animations for live and gallery items
   *
   * Use a single IntersectionObserver to animate elements in both the
   * live updates and gallery sections.  Each element fades and slides
   * upward when it enters the viewport, replicating the behaviour of
   * feature cards. */
  const itemObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (!el.dataset.animated) {
          el.dataset.animated = 'true';
          el.animate(
            [
              { opacity: 0, transform: 'translateY(40px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ],
            {
              duration: 600,
              easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
              fill: 'forwards'
            }
          );
        }
        itemObserver.unobserve(el);
      }
    });
  }, {
    threshold: 0.3
  });
  document.querySelectorAll('.live-card, .gallery-item').forEach((el) => {
    itemObserver.observe(el);
  });

  /* ---------------------------------------------------------------------
   * Joyful animations & navigation enhancements
   *
   * The following code adds dynamic interactions to the page beyond
   * basic theme switching.  It implements scroll‑triggered animations
   * for feature cards, a parallax effect on the hero section, a bounce
   * animation for the FAB on load, and a bottom navigation bar that
   * highlights the current section.  These patterns follow industry
   * standards by leveraging the Web Animations API, IntersectionObserver
   * and smooth scrolling.  They also align with the new motion physics
   * guidance in Material 3 Expressive, favouring spring‑like easings over
   * static durations【910172856191492†L82-L87】.
   */

  // Animate feature cards into view when scrolling.  Use an
  // IntersectionObserver to detect when each card enters the viewport.
  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // Skip if already animated
        if (!el.dataset.animated) {
          el.dataset.animated = 'true';
          el.animate(
            [
              { opacity: 0, transform: 'translateY(40px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ],
            {
              duration: 600,
              easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
              fill: 'forwards'
            }
          );
        }
        cardObserver.unobserve(el);
      }
    });
  }, {
    threshold: 0.3
  });
  document.querySelectorAll('.features .card').forEach((card) => {
    cardObserver.observe(card);
  });

  // Parallax effect on the hero section.  As the user scrolls, shift
  // the background position and scale slightly.  This creates a
  // feeling of depth and motion without compromising performance.
  const heroSection = document.querySelector('.hero');
  heroSection.style.willChange = 'transform, background-position';
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    const heroHeight = heroSection.offsetHeight;
    // Move the background at half the scroll rate.
    heroSection.style.backgroundPositionY = `${scrollY * 0.4}px`;
    // Scale the hero content up to 1.05x as you scroll through it.
    const ratio = Math.min(scrollY / heroHeight, 1);
    const scale = 1 + ratio * 0.05;
    heroSection.style.transform = `scale(${scale})`;
  });

  // Bounce animation for the floating action button on initial load.
  // Delay the animation slightly so that it plays after other elements
  // have been painted.  Use an overshoot easing to make it feel
  // expressive and joyful.
  requestAnimationFrame(() => {
    setTimeout(() => {
      fab.animate(
        [
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1.2)', opacity: 1, offset: 0.6 },
          { transform: 'scale(1)', opacity: 1 }
        ],
        {
          duration: 700,
          easing: 'cubic-bezier(0.2, 1.4, 0.4, 1)',
          fill: 'forwards'
        }
      );
    }, 500);
  });

  // Bottom navigation functionality.  Scroll to the respective section
  // when a nav item is clicked.  Highlight the nav item corresponding
  // to the section currently in view using another IntersectionObserver.
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  // Observe sections to toggle active state on nav items.
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const id = entry.target.getAttribute('id');
      const navItem = document.querySelector(`.bottom-nav .nav-item[data-target='${id}']`);
      if (navItem) {
        if (entry.isIntersecting) {
          navItems.forEach((btn) => btn.classList.remove('active'));
          navItem.classList.add('active');
        }
      }
    });
  }, {
    threshold: 0.5,
    rootMargin: '-30% 0px -50% 0px'
  });
  navItems.forEach((item) => {
    const targetId = item.getAttribute('data-target');
    const targetEl = document.getElementById(targetId);
    if (targetEl) sectionObserver.observe(targetEl);
  });
}

// Immediately initialize the site.  Because this script is included at
// the end of the body and tagged as type=module, the DOM will be fully
// parsed by the time this executes, so it is safe to run init() now.
init();