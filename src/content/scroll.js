import { parseCommand } from '../lib/commands';

const SCROLL_SPEED_PX_PER_SEC = 50;
const TICK_MS = 50;
const PX_PER_TICK = (SCROLL_SPEED_PX_PER_SEC * TICK_MS) / 1000;

let scrollTimer = null;

function stopScroll() {
  if (scrollTimer !== null) {
    clearInterval(scrollTimer);
    scrollTimer = null;
  }
}

function startScroll() {
  stopScroll();
  scrollTimer = setInterval(() => {
    window.scrollBy({ top: PX_PER_TICK, behavior: 'auto' });
  }, TICK_MS);
}

function pageUp() {
  stopScroll();
  const lineH = parseFloat(getComputedStyle(document.body).lineHeight) || 20;
  window.scrollBy({ top: -(window.innerHeight - lineH), behavior: 'smooth' });
}

function pageDown() {
  stopScroll();
  const lineH = parseFloat(getComputedStyle(document.body).lineHeight) || 20;
  window.scrollBy({ top: window.innerHeight - lineH, behavior: 'smooth' });
}

function startScrollUp() {
  stopScroll();
  scrollTimer = setInterval(() => {
    window.scrollBy({ top: -PX_PER_TICK, behavior: 'auto' });
  }, TICK_MS);
}

function scrollToTop() {
  stopScroll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
  stopScroll();
  const scrollHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight
  );
  window.scrollTo({ top: scrollHeight, behavior: 'smooth' });
}

function simulateTranslate() {
  const opts = {
    key: 'a',
    code: 'KeyA',
    altKey: true,
    ctrlKey: false,
    metaKey: false,
    bubbles: true,
  };
  document.dispatchEvent(new KeyboardEvent('keydown', opts));
  document.dispatchEvent(new KeyboardEvent('keyup', opts));
}

// ---- Speech Recognition (injected into page main world for microphone access) ----

// #region debug-point cs-init
const DBG_URL = 'http://127.0.0.1:7778/event';
const DBG_SID = 'speech-recognition-broken';
function dbg(h, msg, d) {
  fetch(DBG_URL, { method: 'POST', body: JSON.stringify({ sessionId: DBG_SID, runId: 'pre-fix', hypothesisId: h, location: 'scroll.js', msg: '[DEBUG] ' + msg, data: d || {}, ts: Date.now() }) }).catch(() => {});
}
// #endregion

const EXT_NS = '__READ_COMMANDS__';

function sendToSidePanel(msg) {
  chrome.runtime.sendMessage(msg).catch(() => {});
}

function injectSpeechScript() {
  if (document.getElementById(EXT_NS)) return;
  const script = document.createElement('script');
  script.id = EXT_NS;
  script.src = chrome.runtime.getURL('speech-recognizer.js');
  document.documentElement.appendChild(script);
}

function handleTranscript(transcript) {
  sendToSidePanel({ type: 'recognitionResult', text: transcript });
  const command = parseCommand(transcript);
  if (command) {
    sendToSidePanel({ type: 'commandExecuted', command, transcript });
    switch (command) {
      case 'startScroll': startScroll(); break;
      case 'startScrollUp': startScrollUp(); break;
      case 'pageUp': pageUp(); break;
      case 'pageDown': pageDown(); break;
      case 'stopScroll': stopScroll(); break;
      case 'scrollToTop': scrollToTop(); break;
      case 'scrollToBottom': scrollToBottom(); break;
      case 'translate': simulateTranslate(); break;
    }
  }
}

function postToInjected(msg) {
  window.postMessage({ source: EXT_NS + '_cs', type: msg }, '*');
}

window.addEventListener('message', (event) => {
  if (event.data?.source !== EXT_NS) return;

  switch (event.data.type) {
    case 'result':
      dbg('C', 'cs-recv-result', { text: event.data.data });
      handleTranscript(event.data.data);
      break;
    case 'error':
      dbg('A', 'cs-recv-error', { error: event.data.data });
      sendToSidePanel({ type: 'recognitionError', error: event.data.data });
      break;
    case 'state':
      dbg('C', 'cs-recv-state', { listening: event.data.data });
      sendToSidePanel({ type: 'recognitionState', listening: event.data.data });
      break;
    case 'ready':
      dbg('A', 'cs-recv-ready', { pendingStart });
      if (pendingStart) {
        pendingStart = false;
        dbg('B', 'cs-send-start-after-ready', {});
        postToInjected('start');
      }
      break;
  }
});

let injectedReady = false;
let pendingStart = false;

function startRecognition() {
  dbg('B', 'startRecognition-called', { injectedReady, pendingStart });
  if (!injectedReady) {
    injectSpeechScript();
    injectedReady = true;
    pendingStart = true;
    dbg('B', 'script-injected-pending', {});
  } else {
    dbg('B', 'cs-send-start-direct', {});
    postToInjected('start');
  }
}

function stopRecognition() {
  dbg('E', 'stopRecognition-called', { pendingStart });
  pendingStart = false;
  postToInjected('stop');
}

// ---- Message Handling ----

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case 'startScroll':
      startScroll();
      sendResponse({ ok: true });
      return true;
    case 'startScrollUp':
      startScrollUp();
      sendResponse({ ok: true });
      return true;
    case 'pageUp':
      pageUp();
      sendResponse({ ok: true });
      return true;
    case 'pageDown':
      pageDown();
      sendResponse({ ok: true });
      return true;
    case 'stopScroll':
      stopScroll();
      sendResponse({ ok: true });
      return true;
    case 'scrollToTop':
      scrollToTop();
      sendResponse({ ok: true });
      return true;
    case 'scrollToBottom':
      scrollToBottom();
      sendResponse({ ok: true });
      return true;
    case 'translate':
      simulateTranslate();
      sendResponse({ ok: true });
      return true;
    case 'startListening':
      startRecognition();
      sendResponse({ ok: true });
      return true;
    case 'stopListening':
      stopRecognition();
      sendResponse({ ok: true });
      return true;
    default:
      sendResponse({ ok: false, error: 'unknown command' });
      return true;
  }
});