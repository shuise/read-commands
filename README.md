# 浏览器阅读控制插件

通过语音或按钮控制当前网页的阅读滚动。

## 功能

| 指令 | 效果 |
|------|------|
| 下滚 | 网页以 50 px/s 的速度向下滚动 |
| 上滚 | 网页以 50 px/s 的速度向上滚动 |
| 上翻 | 向上滚动一屏 |
| 下翻 | 向下滚动一屏 |
| 停止 | 停止所有滚动 |
| 顶部 | 滚动到顶部 |
| 底部 | 滚动到底部 |

支持语音关键词：滚动/下滚、上滚、上翻/向上、下翻/向下、停止、顶部、底部（及常见同义词）。

## 技术栈

- Chrome Extension (Manifest V3)
- React + Vite
- Web Speech API（中文语音识别）
- Side Panel 侧边栏 UI

## 开发

```bash
npm install
npm run generate-icons   # 生成插件图标
npm run build            # 构建到 dist/
npm run dev              # 监听模式构建
```

## 安装

1. 运行 `npm run build`
2. 打开 Chrome → `chrome://extensions`
3. 开启「开发者模式」
4. 点击「加载已解压的扩展程序」，选择 `dist/` 目录

## 使用

1. 打开任意普通网页（`http://` 或 `https://`）
2. 点击工具栏上的插件图标，打开侧边栏
3. 点击「开始语音聆听」，说出指令；或使用下方手动按钮
4. 若页面无响应，刷新页面后重试

## 项目结构

```
src/
├── background.js       # 后台服务，打开 Side Panel
├── content/scroll.js   # 注入页面的滚动控制与语音识别逻辑
├── lib/                # 指令解析与消息通信
└── sidepanel/          # React 侧边栏 UI
```