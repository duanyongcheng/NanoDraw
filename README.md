# Gemini 3 Pro Client (Frontend Only)

这是一个基于 React 的现代化纯前端应用，专为与 Google 的 **Gemini 3 Pro** 模型交互而设计。它提供了一个流畅的聊天界面，支持多模态输入（文本和图片），并包含丰富的自定义配置选项。

## ✨ 主要特性

- **纯前端架构**：基于 React + Vite 构建，无需后端服务器，直接在浏览器中运行。
- **Gemini 3 Pro 支持**：默认配置为 `gemini-3-pro-image-preview` 模型，支持最新的 AI 能力。
- **多模态交互**：
  - 支持文本对话。
  - 支持图片上传与分析（最多支持 14 张参考图片）。
- **思维链可视化**：支持显示模型的思维过程（Thinking Process），通过可折叠的 UI 展示。
- **实时流式响应**：类似打字机的流畅回复体验。
- **Markdown 渲染**：
  - 完美支持代码块高亮。
  - 支持表格、列表、引用等富文本格式。
  - 支持 GFM (GitHub Flavored Markdown)。
- **高度可配置**：
  - **API 设置**：支持自定义 API Endpoint 和模型名称。
  - **图像参数**：可调整生成图像的分辨率（1K/2K/4K）和长宽比。
  - **Grounding**：集成 Google Search Grounding 开关，支持联网搜索。
- **现代化 UI/UX**：
  - **主题切换**：支持明亮（Light）、暗黑（Dark）及跟随系统主题。
  - **响应式设计**：完美适配桌面端和移动端。
  - **安全隐私**：API Key 仅保存在内存中，刷新页面即清除，确保安全。

## 🛠️ 技术栈

- **核心框架**: [React 19](https://react.dev/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **语言**: [TypeScript](https://www.typescriptlang.org/)
- **样式方案**: [Tailwind CSS 4](https://tailwindcss.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **AI SDK**: [Google GenAI SDK](https://www.npmjs.com/package/@google/genai)
- **图标库**: [Lucide React](https://lucide.dev/)
- **Markdown**: React Markdown + Remark GFM

## 🚀 快速开始

### 前置要求

- Node.js (建议 v18 或更高版本)
- 包管理器 (npm, yarn, pnpm 或 bun)
- Google Gemini API Key ([在此获取](https://aistudio.google.com/app/apikey))

### 安装与运行

1. **克隆仓库**

   ```bash
   git clone <repository-url>
   cd gemini-3-pro---frontend-only
   ```

2. **安装依赖**

   ```bash
   npm install
   # 或者使用 pnpm
   pnpm install
   ```

3. **启动开发服务器**

   ```bash
   npm run dev
   ```

   启动后，在浏览器访问控制台输出的地址（通常是 `http://localhost:5173`）。

4. **构建生产版本**

   ```bash
   npm run build
   ```

## ⚙️ 使用说明

### 1. 配置 API Key
首次进入应用时，会弹窗提示输入 **Gemini API Key**。
> 注意：API Key 仅存储在当前的浏览器内存中，刷新页面后会被清除。

### 2. URL 参数配置
支持通过 URL 参数快速预设配置，方便分享或特定场景使用：

- `apikey`: 预填 API Key
- `endpoint`: 自定义 API 端点 (Base URL)
- `model`: 自定义模型名称

**示例：**
```
http://localhost:5173/?endpoint=https://my-proxy.com&model=gemini-2.0-flash
```

### 3. 高级设置
点击右上角的设置图标（⚙️）打开设置面板，可以调整：
- **主题外观**：切换深色/浅色模式。
- **图像生成设置**：调整分辨率和比例。
- **Google Search Grounding**：开启后允许模型通过 Google 搜索获取实时信息。
- **数据管理**：清除对话历史或重置 API Key。

## 📂 项目结构

```
src/
├── components/         # UI 组件
│   ├── ApiKeyModal.tsx     # API Key 输入弹窗
│   ├── ChatInterface.tsx   # 主聊天区域
│   ├── InputArea.tsx       # 输入框与文件上传
│   ├── MessageBubble.tsx   # 消息气泡与 Markdown 渲染
│   └── SettingsPanel.tsx   # 设置面板
├── services/           # 服务层
│   └── geminiService.ts    # Google GenAI SDK 集成
├── store/              # 状态管理
│   └── useAppStore.ts      # Zustand Store
├── types.ts            # TypeScript 类型定义
├── App.tsx             # 根组件
└── index.tsx           # 入口文件
```

## 📝 License

MIT
