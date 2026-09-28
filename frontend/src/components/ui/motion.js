import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const MOTION_KEY = 'ecad_reduce_motion';

/** True when the OS asks for reduced motion OR the user enabled it in Settings. */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  if (document.documentElement.dataset.reduceMotion === 'true') return true;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

export function getReduceMotionSetting() {
  return localStorage.getItem(MOTION_KEY) === 'true';
}

export function setReduceMotionSetting(value) {
  localStorage.setItem(MOTION_KEY, value ? 'true' : 'false');
  applyReduceMotionSetting();
}

/** Apply the persisted in-app motion preference to <html>. Called at startup. */
export function applyReduceMotionSetting() {
  document.documentElement.dataset.reduceMotion = getReduceMotionSetting() ? 'true' : 'false';
}

/**
 * Animate a number from 0 to `target` once. Returns the current display value.
 * Skips animation for reduced-motion users and non-finite targets.
 */
export function useCountUp(target, duration = 900) {
  const numeric = typeof target === 'number' && Number.isFinite(target);
  const [value, setValue] = useState(numeric && !prefersReducedMotion() ? 0 : target);
  const frame = useRef();

  useEffect(() => {
    if (!numeric || prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, duration, numeric]);

  return value;
}

/**
 * Scroll-reveal: elements inside `ref` matching `selector` fade/slide in the
 * first time they enter the viewport. Siblings are staggered automatically.
 * Reduced-motion users (OS or in-app setting) get everything visible at once.
 * Hidden state is only applied after JS runs, so content never stays invisible.
 */
export function useScrollReveal(ref, selector, { stagger = 90, maxDelay = 540 } = {}) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const els = Array.from(root.querySelectorAll(selector));
    els.forEach((el) => {
      el.setAttribute('data-reveal', '');
      const idx = Array.prototype.indexOf.call(el.parentElement?.children || [], el);
      el.style.setProperty('--reveal-delay', `${Math.min(Math.max(idx, 0) * stagger, maxDelay)}ms`);
    });

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.setAttribute('data-revealed', ''));
      return undefined;
    }

    root.classList.add('reveal-ready');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // An attribute (not a class) so React re-renders of `className`
            // (e.g. toggling an FAQ open) never wipe the revealed state.
            entry.target.setAttribute('data-revealed', '');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref, selector, stagger, maxDelay]);
}

/**
 * Returns true while the header should be hidden: the user is scrolling down
 * past `offset`. Scrolling up (or being near the top) shows it again.
 */
export function useHideOnScroll({ offset = 90, tolerance = 6, disabled = false } = {}) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (disabled) {
      setHidden(false);
      return undefined;
    }
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      const delta = y - lastY;
      if (y <= offset) setHidden(false);
      else if (delta > tolerance) setHidden(true);
      else if (delta < -tolerance) setHidden(false);
      if (Math.abs(delta) > tolerance || y <= offset) lastY = y;
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset, tolerance, disabled]);

  return hidden;
}
