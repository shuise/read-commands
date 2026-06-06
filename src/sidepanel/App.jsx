import { useCallback, useEffect, useState } from 'react';
import { sendScrollCommand } from '../lib/messaging';

async function sendToContent(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    throw new Error('未找到当前标签页');
  }

  if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
    throw new Error('当前页面不支持语音控制');
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, { type });
  } catch {
    throw new Error('无法连接页面，请刷新后重试');
  }
}

export default function App() {
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('等待指令');

  useEffect(() => {
    const handler = (message) => {
      switch (message.type) {
        case 'recognitionResult':
          setLastHeard(message.text);
          break;
        case 'commandExecuted':
          setStatus(`识别：${message.transcript} → ${message.command}`);
          break;
        case 'recognitionError':
          setError(message.error);
          break;
        case 'recognitionState':
          setListening(message.listening);
          if (!message.listening) {
            setLastHeard('');
          }
          break;
      }
    };

    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  const start = useCallback(async () => {
    setError('');
    setLastHeard('');
    try {
      await sendToContent('startListening');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      await sendToContent('stopListening');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const runManual = async (type) => {
    setError('');
    setStatus(`手动：${type}`);
    try {
      await sendScrollCommand(type);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="panel">
      <header>
        <h1>阅读控制</h1>
      </header>

      <section className="voice-section">
        <button
          type="button"
          className={`mic-btn ${listening ? 'active' : ''}`}
          onClick={listening ? stop : start}
        >
          {listening ? '停止聆听' : '开始语音聆听'}
        </button>

        {lastHeard && <p className="heard">最近识别：{lastHeard}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="status">
        <span className="label">状态</span>
        <span>{status}</span>
      </section>

      <section className="manual">
        <h2>手动控制</h2>
        <div className="btn-grid">
          <button type="button" onClick={() => runManual('startScroll')}>
            下滚
          </button>
          <button type="button" onClick={() => runManual('startScrollUp')}>
            上滚
          </button>
          <button type="button" onClick={() => runManual('pageUp')}>
            上一页
          </button>
          <button type="button" onClick={() => runManual('pageDown')}>
            下一页
          </button>
          <button type="button" onClick={() => runManual('stopScroll')}>
            停止
          </button>
          <button type="button" onClick={() => runManual('scrollToTop')}>
            顶部
          </button>
          <button type="button" onClick={() => runManual('scrollToBottom')}>
            底部
          </button>
          <button type="button" onClick={() => runManual('translate')}>
            翻译
          </button>
        </div>
      </section>
    </div>
  );
}