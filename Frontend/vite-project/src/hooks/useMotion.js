import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';

function subscribeReducedMotion(onStoreChange) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onStoreChange);
    return () => mediaQuery.removeEventListener('change', onStoreChange);
  }
  mediaQuery.addListener?.(onStoreChange);
  return () => mediaQuery.removeListener?.(onStoreChange);
}

function getReducedMotionSnapshot() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return Boolean(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function getServerReducedMotionSnapshot() {
  return false;
}

export function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot
  );
}

export function useScrollReveal(containerRef) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const root = containerRef?.current;
    if (!root) return undefined;

    const targets = Array.from(root.querySelectorAll('[data-reveal]'));
    if (!targets.length) return undefined;

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      for (const element of targets) {
        element.setAttribute('data-visible', 'true');
      }
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-visible', 'true');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    for (const element of targets) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [containerRef, reducedMotion]);
}

export function useSlidingPill(containerRef, activeIndex) {
  const pillRef = useRef(null);

  useLayoutEffect(() => {
    const container = containerRef?.current;
    const pill = pillRef.current;
    if (!container || !pill) return undefined;

    const syncPosition = () => {
      const items = container.querySelectorAll('[data-pill-item]');
      const activeEl = items[activeIndex];
      if (!activeEl) {
        pill.style.opacity = '0';
        return;
      }
      const x = activeEl.offsetLeft;
      const y = activeEl.offsetTop;
      const width = activeEl.offsetWidth;
      const height = activeEl.offsetHeight;
      pill.style.width = `${width}px`;
      pill.style.height = `${height}px`;
      pill.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      pill.style.opacity = width > 0 ? '1' : '0';
    };

    syncPosition();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(syncPosition);
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', syncPosition);
      return () => window.removeEventListener('resize', syncPosition);
    }

    return undefined;
  }, [containerRef, activeIndex]);

  return pillRef;
}

export function useTilt3D(targetRef, { maxDeg = 3.2, disabled = false } = {}) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const element = targetRef?.current;
    if (!element || disabled || reducedMotion || typeof window === 'undefined') {
      return undefined;
    }
    if (
      typeof window.matchMedia === 'function' &&
      !window.matchMedia('(hover: hover) and (pointer: fine)').matches
    ) {
      return undefined;
    }

    let frameId = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let running = false;

    const step = () => {
      currentX += (targetX - currentX) * 0.16;
      currentY += (targetY - currentY) * 0.16;

      const settled =
        Math.abs(targetX - currentX) < 0.015 && Math.abs(targetY - currentY) < 0.015;

      if (settled && targetX === 0 && targetY === 0) {
        currentX = 0;
        currentY = 0;
        element.style.transform = '';
        running = false;
        return;
      }

      element.style.transform = `perspective(1200px) rotateX(${currentX.toFixed(3)}deg) rotateY(${currentY.toFixed(3)}deg) translateZ(0)`;
      frameId = window.requestAnimationFrame(step);
    };

    const ensureLoop = () => {
      if (!running) {
        running = true;
        frameId = window.requestAnimationFrame(step);
      }
    };

    const handlePointerMove = (event) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = -ny * maxDeg * 2;
      targetY = nx * maxDeg * 2;
      element.style.setProperty('--glint-x', `${((nx + 0.5) * 100).toFixed(1)}%`);
      element.style.setProperty('--glint-y', `${((ny + 0.5) * 100).toFixed(1)}%`);
      ensureLoop();
    };

    const handlePointerLeave = () => {
      targetX = 0;
      targetY = 0;
      ensureLoop();
    };

    element.addEventListener('pointermove', handlePointerMove, { passive: true });
    element.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    return () => {
      running = false;
      window.cancelAnimationFrame(frameId);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', handlePointerLeave);
      element.style.transform = '';
    };
  }, [targetRef, maxDeg, disabled, reducedMotion]);
}

export function useCountUp(target, { durationMs = 520 } = {}) {
  const numericTarget = Number.isFinite(Number(target)) ? Math.round(Number(target)) : 0;
  const reducedMotion = useReducedMotion();
  const canAnimate =
    !reducedMotion &&
    typeof window !== 'undefined' &&
    typeof IntersectionObserver !== 'undefined' &&
    typeof window.requestAnimationFrame === 'function';

  const [animatedValue, setAnimatedValue] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (!canAnimate) return undefined;
    const from = currentRef.current;
    const to = numericTarget;
    if (from === to) return undefined;

    let frameId = 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      const nextValue = Math.round(from + (to - from) * eased);
      currentRef.current = nextValue;
      setAnimatedValue(nextValue);
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [canAnimate, numericTarget, durationMs]);

  return canAnimate ? animatedValue : numericTarget;
}
