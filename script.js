(function () {
  'use strict';

  const STYLE_ID = 'yt-speed-time-style';
  const DISPLAY_ID = 'yt-speed-time-display';
  const POLL_INTERVAL = 500;

  function secondsToTimestamp(secs) {
    secs = Math.max(0, Math.floor(secs));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const mm = String(m).padStart(h > 0 ? 2 : 1, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${DISPLAY_ID} {
        display: inline-flex;
        align-items: center;
        margin-left: 6px;
        padding: 0 6px;
        height: 20px;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 4px;
        font-size: 12px;
        font-family: 'YouTube Sans', 'Roboto', sans-serif;
        font-weight: 500;
        color: #fff;
        white-space: nowrap;
        vertical-align: middle;
        pointer-events: none;
        line-height: 20px;
        gap: 3px;
      }
      #${DISPLAY_ID} .yt-st-sep {
        opacity: 0.5;
        margin: 0 1px;
      }
      #${DISPLAY_ID} .yt-st-badge {
        font-size: 10px;
        font-weight: 700;
        opacity: 0.7;
        background: rgba(255,255,255,0.15);
        border-radius: 3px;
        padding: 1px 3px;
        margin-left: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  function setDisplayContent(el, adjCurrent, adjDuration, speedLabel) {
    while (el.firstChild) el.removeChild(el.firstChild);

    const currentSpan = document.createElement('span');
    currentSpan.textContent = adjCurrent;

    const sep = document.createElement('span');
    sep.className = 'yt-st-sep';
    sep.textContent = '/';

    const durationSpan = document.createElement('span');
    durationSpan.textContent = adjDuration;

    const badge = document.createElement('span');
    badge.className = 'yt-st-badge';
    badge.textContent = speedLabel;

    el.appendChild(currentSpan);
    el.appendChild(sep);
    el.appendChild(durationSpan);
    el.appendChild(badge);
  }

  let pollTimer = null;

  function update() {
    const video = document.querySelector('video.html5-main-video');
    if (!video) return;

    const speed = video.playbackRate;

    if (speed === 1) {
      const existing = document.getElementById(DISPLAY_ID);
      if (existing) existing.remove();
      return;
    }

    const current = video.currentTime;
    const duration = video.duration;
    const timeContents = document.querySelector('.ytp-time-contents');
    if (!timeContents) return;

    let el = document.getElementById(DISPLAY_ID);
    if (!el || !timeContents.contains(el)) {
      if (el) el.remove();
      el = document.createElement('span');
      el.id = DISPLAY_ID;
      timeContents.appendChild(el);
      injectStyles();
    }

    const adjCurrent = secondsToTimestamp(current / speed);
    const adjDuration = isFinite(duration) ? secondsToTimestamp(duration / speed) : '?';
    const speedLabel = Number.isInteger(speed) ? `${speed}x` : `${parseFloat(speed.toFixed(2))}x`;

    setDisplayContent(el, adjCurrent, adjDuration, speedLabel);
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(update, POLL_INTERVAL);
  }

  function stopPolling() {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  function onNavigate() {
    stopPolling();
    const el = document.getElementById(DISPLAY_ID);
    if (el) el.remove();
    setTimeout(startPolling, 1200);
  }

  document.addEventListener('yt-navigate-finish', onNavigate);
  startPolling();

})();
