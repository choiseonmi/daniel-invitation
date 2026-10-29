"use strict";
// All interaction stays in this file; floral assets and page copy remain editable in HTML.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const $ = (selector) => document.querySelector(selector);
const revealItems = [...document.querySelectorAll('.reveal')];
const toast = $('#toast');
let toastTimer;
function notice(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2300);
}

// Reveal content only when observed; no hiding when JS is disabled.
if (!reduceMotion && 'IntersectionObserver' in window) {
  root.classList.add('js-ready');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        target.classList.add('is-visible');
        observer.unobserve(target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px 35px 0px' });
  revealItems.forEach((el) => observer.observe(el));
  // Prevent text from remaining invisible when the browser restores a previous scroll position.
  window.addEventListener('load', () => {
    revealItems.filter(el => el.getBoundingClientRect().top < innerHeight)
      .forEach(el => el.classList.add('is-visible'));
  }, { once: true });
} else {
  revealItems.forEach(el => el.classList.add('is-visible'));
}

// Crossfade at the cover boundary and a subtle page-read progress bar.
const cover = $('.cover');
const progressBar = $('#reading-progress');
const backTop = $('#backtop');
let scheduled = false;
function updateScrollUI() {
  scheduled = false;
  const y = window.scrollY || document.documentElement.scrollTop;
  if (cover && !reduceMotion) {
    const height = cover.getBoundingClientRect().height;
    const start = height * 0.43;
    const amount = Math.max(0, Math.min(1, (y - start) / (height * 0.50)));
    cover.style.setProperty('--transition-progress', amount.toFixed(3));
  }
  if (progressBar) {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    progressBar.style.transform = `scaleX(${Math.min(1, y / max)})`;
  }
  if (backTop) backTop.classList.toggle('visible', y > 650);
}
function scheduleScrollUI() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateScrollUI); }
}
window.addEventListener('scroll', scheduleScrollUI, { passive: true });
window.addEventListener('resize', scheduleScrollUI, { passive: true });
window.addEventListener('load', scheduleScrollUI);
scheduleScrollUI();
backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'instant' : 'smooth' }));

// Accordion. Collapse is immediate semantically and animated only when supported.
const accountToggle = $('#account-toggle');
const accountDetails = $('#account-details');
let runningAnimation;
accountToggle?.addEventListener('click', () => {
  if (!accountDetails) return;
  runningAnimation?.cancel();
  const opening = accountToggle.getAttribute('aria-expanded') !== 'true';
  accountToggle.setAttribute('aria-expanded', String(opening));
  accountToggle.querySelector('span:first-child').textContent = opening ? '계좌번호 닫기' : '계좌번호 보기';
  if (opening) {
    accountDetails.hidden = false;
    if (!reduceMotion && accountDetails.animate) {
      runningAnimation = accountDetails.animate([
        { opacity: 0, transform: 'translateY(-8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 270, easing: 'ease-out' });
    }
  } else if (!reduceMotion && accountDetails.animate) {
    runningAnimation = accountDetails.animate([
      { opacity: 1, transform: 'translateY(0)' },
      { opacity: 0, transform: 'translateY(-8px)' }
    ], { duration: 190, easing: 'ease-in' });
    runningAnimation.onfinish = () => { accountDetails.hidden = true; };
  } else {
    accountDetails.hidden = true;
  }
});

async function copyText(value, button) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
    } else {
      const field = document.createElement('textarea');
      field.value = value;
      field.style.cssText = 'position:fixed;left:-9999px;top:0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      field.remove();
      if (!ok) throw new Error('Unable to copy');
    }
    notice('복사했어요.');
    if (button) {
      button.classList.add('just-copied');
      window.setTimeout(() => button.classList.remove('just-copied'), 850);
    }
  } catch {
    notice('복사가 어렵다면 글씨를 길게 눌러 복사해 주세요.');
  }
}
$('#copy-account')?.addEventListener('click', (e) => copyText('287-084079-02-017', e.currentTarget));
$('.copy-address')?.addEventListener('click', (e) => copyText('경기 수원시 팔달구 월드컵로 310', e.currentTarget));
$('#share-btn')?.addEventListener('click', async () => {
  const url = location.href;
  if (location.protocol === 'file:') {
    notice('공유는 GitHub Pages에 배포한 뒤 이용해 주세요.');
    return;
  }
  if (navigator.share) {
    try {
      await navigator.share({
        title: '이창준 다니엘 사제수품 축하연',
        text: '2026년 12월 4일(금) 오후 6시 · 수원월드컵경기장 라메르아이 2층',
        url
      });
    } catch (err) {
      if (err.name !== 'AbortError') await copyText(url);
    }
  } else await copyText(url);
});


