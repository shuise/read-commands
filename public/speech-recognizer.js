(function () {
  // #region debug-point init
  var DBG_URL = 'http://127.0.0.1:7778/event';
  var DBG_SID = 'speech-recognition-broken';
  function dbg(h, msg, d) {
    try { fetch(DBG_URL, { method: 'POST', body: JSON.stringify({ sessionId: DBG_SID, runId: 'pre-fix', hypothesisId: h, location: 'speech-recognizer.js', msg: '[DEBUG] ' + msg, data: d || {}, ts: Date.now() }) }).catch(function(){}); } catch(e) {}
  }
  dbg('A', 'script-loaded', {});
  // #endregion

  const NS = '__READ_COMMANDS__';
  let recognition = null;
  let listening = false;

  function post(type, data) {
    window.postMessage({ source: NS, type: type, data: data }, '*');
  }

  function start() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      dbg('A', 'no-speech-api', {});
      post('error', '当前浏览器不支持 Web Speech API');
      return;
    }

    dbg('B', 'start-called', { hadPrevious: !!recognition });

    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }

    recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = function (e) {
      var t = e.results[e.results.length - 1][0].transcript.trim();
      dbg('C', 'onresult', { transcript: t });
      post('result', t);
    };

    recognition.onerror = function (e) {
      dbg('C', 'onerror', { error: e.error, message: e.message });
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      post(
        'error',
        e.error === 'not-allowed' || e.error === 'permission-denied'
          ? '麦克风权限被拒绝。请在浏览器地址栏左侧的🔒图标中允许当前网站的「麦克风」权限，然后刷新页面重试。'
          : '语音识别错误：' + e.error
      );
      listening = false;
      post('state', false);
    };

    recognition.onend = function () {
      dbg('C', 'onend', { listening: listening });
      if (listening) {
        setTimeout(function () {
          if (listening) {
            dbg('C', 'onend-reconnect', {});
            try { recognition.start(); } catch (e) {
              dbg('C', 'onend-reconnect-fail', { error: e.message });
              post('error', '语音识别重连失败：' + e.message);
              listening = false;
              post('state', false);
            }
          }
        }, 200);
      } else {
        post('state', false);
      }
    };

    try {
      recognition.start();
      listening = true;
      post('state', true);
      dbg('B', 'start-success', {});
    } catch (e) {
      dbg('B', 'start-exception', { error: e.message });
      post('error', '启动语音识别失败：' + e.message);
    }
  }

  function stop() {
    dbg('E', 'stop-called', { hadRecognition: !!recognition });
    listening = false;
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    recognition = null;
    post('state', false);
  }

  window.addEventListener('message', function (e) {
    if (e.data && e.data.source === NS + '_cs') {
      dbg('B', 'msg-received', { type: e.data.type });
      if (e.data.type === 'start') start();
      else if (e.data.type === 'stop') stop();
    }
  });

  dbg('A', 'ready-sent', {});
  post('ready', true);
})();