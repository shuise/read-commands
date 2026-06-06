const COMMAND_MAP = {
  startScroll: ['滚动', '滚', '开始滚动', '继续'],
  startScrollUp: ['上滚', '向上滚动', '往上滚'],
  pageUp: ['上翻', '上一页', '上页', '往上'],
  pageDown: ['下翻', '向下', '下一页', '下页', '往下'],
  stopScroll: ['停止', '停', '暂停', '别滚了'],
  scrollToTop: ['顶部', '回到顶部', '最上面', '页首'],
  scrollToBottom: ['底部', '到底部', '最下面', '页尾'],
  translate: ['翻译', '翻译页面', '翻译此页', '划词翻译'],
};

export function parseCommand(transcript) {
  const text = transcript.replace(/\s/g, '');

  for (const [type, keywords] of Object.entries(COMMAND_MAP)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return type;
    }
  }

  return null;
}

export const COMMAND_LABELS = {
  startScroll: '滚动',
  startScrollUp: '上滚',
  pageUp: '上翻',
  pageDown: '下翻',
  stopScroll: '停止',
  scrollToTop: '顶部',
  scrollToBottom: '底部',
  translate: '翻译',
};