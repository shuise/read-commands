export async function sendScrollCommand(type) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    throw new Error('未找到当前标签页');
  }

  if (tab.url?.startsWith('chrome://') || tab.url?.startsWith('chrome-extension://')) {
    throw new Error('当前页面不支持滚动控制');
  }

  try {
    return await chrome.tabs.sendMessage(tab.id, { type });
  } catch {
    throw new Error('无法连接页面，请刷新后重试');
  }
}
