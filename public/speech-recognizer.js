(function () {
  const NS = '__READ_COMMANDS__';
  let recognition = null;
  let listening = false;

  function post(type, data) {
    window.postMessage({ source: NS, type: type, data: data }, '*');
  }

  function start() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      post('error', '当前浏览器不支持 Web Speech API');
      return;
    }

    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }

    recognition = new SR();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = function (e) {
      var t = e.results[e.results.length - 1][0].transcript.trim();
      post('result', t);
    };

    recognition.onerror = function (e) {
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
      if (listening) {
        setTimeout(function () {
          if (listening) {
            try { recognition.start(); } catch (e) {
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
    } catch (e) {
      post('error', '启动语音识别失败：' + e.message);
    }
  }

  function stop() {
    listening = false;
    if (recognition) {
      try { recognition.stop(); } catch (e) {}
    }
    recognition = null;
    post('state', false);
  }

  window.addEventListener('message', function (e) {
    if (e.data && e.data.source === NS + '_cs') {
      if (e.data.type === 'start') start();
      else if (e.data.type === 'stop') stop();
    }
  });

  post('ready', true);
})();