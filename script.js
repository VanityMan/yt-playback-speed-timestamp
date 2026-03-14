// YouTube Speed-Adjusted Time Display
// Paste this into YouTube Enhancer > Custom Scripts

(function () {
  'use strict';

  const DISPLAY_ID = 'yt-speed-time-display';
  const POLL_INTERVAL_MS = 990;
  const NAV_RESTART_DELAY_MS = 1200;

  function secondsToTimestamp(secs) {
    secs = Math.max(0, Math.floor(secs));
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const ss = String(s).padStart(2, '0');
    if (d > 0) {
      return `${d}:${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${ss}`;
    }
    if (h > 0) {
      return `${h}:${String(m).padStart(2, '0')}:${ss}`;
    }
    return `${m}:${ss}`;
  }

  function parseSponsorBlockDuration() {
    const el = document.getElementById('sponsorBlockDurationAfterSkips');
    if (!el) return null;
    const text = el.textContent.replace(/[^0-9:]/g, '');
    if (!text) return null;
    const parts = text.split(':').map(Number);
    if (parts.some(isNaN)) return null;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return null;
  }

  const WRAPPER_STYLE = [
    'display:inline-flex',
    'align-items:center',
    'margin-left:6px',
    'padding:0 6px',
    'height:20px',
    'background:rgba(255,255,255,0.12)',
    'border:1px solid rgba(255,255,255,0.2)',
    'border-radius:4px',
    'font-size:12px',
    'font-family:YouTube Sans,Roboto,sans-serif',
    'font-weight:500',
    'color:#fff',
    'white-space:nowrap',
    'vertical-align:middle',
    'pointer-events:none',
    'line-height:20px',
    'gap:3px',
  ].join(';');

  const SEP_STYLE = 'opacity:0.5;margin:0 1px';

  const BADGE_STYLE = [
    'font-size:10px',
    'font-weight:700',
    'opacity:0.7',
    'background:rgba(255,255,255,0.15)',
    'border-radius:3px',
    'padding:1px 3px',
    'margin-left:2px',
  ].join(';');

  function createDisplay() {
    const wrapper = document.createElement('span');
    wrapper.id = DISPLAY_ID;
    wrapper.setAttribute('style', WRAPPER_STYLE);

    const elapsed = document.createElement('span');
    const sep = document.createElement('span');
    sep.setAttribute('style', SEP_STYLE);
    sep.textContent = '/';
    const duration = document.createElement('span');
    const badge = document.createElement('span');
    badge.setAttribute('style', BADGE_STYLE);

    wrapper.appendChild(elapsed);
    wrapper.appendChild(sep);
    wrapper.appendChild(duration);
    wrapper.appendChild(badge);

    wrapper._elapsed = elapsed;
    wrapper._duration = duration;
    wrapper._badge = badge;

    return wrapper;
  }

  function update() {
    const video = document.querySelector('video.html5-main-video');
    if (!video) return;

    const speed = video.playbackRate;
    const el = document.getElementById(DISPLAY_ID);

    if (speed === 1) {
      if (el) el.remove();
      return;
    }

    const timeContents = document.querySelector('.ytp-time-contents');
    if (!timeContents) return;

    const display = (el && timeContents.contains(el)) ? el : (() => {
      if (el) el.remove();
      const fresh = createDisplay();
      timeContents.appendChild(fresh);
      return fresh;
    })();

    const sbDuration = parseSponsorBlockDuration();
    const rawDuration = isFinite(video.duration) ? video.duration : null;
    const effectiveDuration = sbDuration ?? rawDuration;

    display._elapsed.textContent = secondsToTimestamp(video.currentTime / speed);
    display._duration.textContent = effectiveDuration !== null ? secondsToTimestamp(effectiveDuration / speed) : '?';
    display._badge.textContent = Number.isInteger(speed) ? `${speed}x` : `${speed.toFixed(2)}x`;
  }

  // Re-attach the seeked listener whenever the video element changes,
  // since YouTube replaces it between navigations
  let attachedVideo = null;

  function attachSeekedListener() {
    const video = document.querySelector('video.html5-main-video');
    if (!video || video === attachedVideo) return;
    if (attachedVideo) attachedVideo.removeEventListener('seeked', update);
    video.addEventListener('seeked', update);
    attachedVideo = video;
  }

  let pollTimer = null;

  function poll() {
    attachSeekedListener();
    update();
  }

  document.addEventListener('yt-navigate-finish', () => {
    clearInterval(pollTimer);
    pollTimer = null;
    attachedVideo = null;
    const el = document.getElementById(DISPLAY_ID);
    if (el) el.remove();
    setTimeout(() => {
      if (!pollTimer) pollTimer = setInterval(poll, POLL_INTERVAL_MS);
    }, NAV_RESTART_DELAY_MS);
  });

  pollTimer = setInterval(poll, POLL_INTERVAL_MS);

})();
