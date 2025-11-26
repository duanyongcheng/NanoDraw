# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 **React 19 + Vite 6 + TypeScript** 的纯前端应用,专为与 Google 的 **Gemini 3 Pro** 模型交互而设计。应用使用 **Zustand** 进行状态管理,**Tailwind CSS 4** 处理样式,提供流畅的多模态聊天界面体验。

### 核心特性
- 支持文本和图像(最多14张)的多模态输入
- 流式/非流式响应模式切换
- 思维链可视化(Thinking Process)展示
- Waiting Arcade Mode:在AI思考时提供小游戏(Snake、Dino、2048、Game of Life)
- Google Search Grounding 集成
- 明/暗主题切换,完全响应式设计

## 开发命令

```bash
# 安装依赖
npm install
# 或者
pnpm install

# 启动开发服务器 (默认端口 3000, host 0.0.0.0)
npm run dev

# 构建生产版本
npm run build

# 预览构建后的应用
npm run preview
```

## 技术架构与关键设计

### 1. 状态管理架构 (Zustand)

项目使用 Zustand 实现全局状态管理,分为两个独立的 store:

- **`store/useAppStore.ts`**: 核心应用状态
  - 管理 API Key、应用设置(`AppSettings`)、聊天消息(`ChatMessage[]`)
  - 使用 `persist` 中间件将 `apiKey` 和 `settings` 持久化到 localStorage
  - **Single Source of Truth**: `messages` 数组是唯一的消息来源
  - 关键方法:
    - `addMessage()`: 添加新消息
    - `updateLastMessage()`: 流式更新最后一条消息的 parts
    - `deleteMessage()`: 删除指定消息
    - `sliceMessages()`: 裁剪消息历史(用于重新生成)

- **`store/useUiStore.ts`**: UI 交互状态
  - 管理 Toast 通知、全局对话框、音效等 UI 临时状态
  - 不进行持久化

### 2. 服务层设计 (`services/geminiService.ts`)

封装了与 Google GenAI SDK 的所有交互逻辑:

- **`streamGeminiResponse()`**: 流式生成响应
  - 返回 AsyncGenerator,逐步 yield 更新的 `modelParts`
  - 自动合并相同类型的连续 text parts(避免闪烁)
  - 过滤历史记录中的 `thought` parts,避免发送回模型

- **`generateContent()`**: 非流式生成响应
  - 适用于一次性获取完整响应的场景

- **关键设计**:
  - 使用 `constructUserContent()` 统一构造用户输入(文本+图像)
  - 使用 `processSdkParts()` 将 SDK 原生 Parts 转换为应用内部的 `Part` 类型
  - 支持自定义 API Endpoint(通过 `httpOptions.baseUrl`)

### 3. 类型系统 (`types.ts`)

```typescript
// 核心类型
Part: { text?, inlineData?, thought?, thoughtSignature? }
Content: { role: 'user'|'model', parts: Part[] }
ChatMessage: Content + { id, timestamp, isError?, thinkingDuration? }
AppSettings: { resolution, aspectRatio, useGrounding, enableThinking, streamResponse, customEndpoint, modelName, theme }
Attachment: { file, preview, base64Data, mimeType }
```

**设计原则**:
- `Part` 与 Google GenAI SDK 的 Part 类型保持兼容,但扩展了 `thought` 和 `thoughtSignature` 字段
- `ChatMessage` 包含 UI 层所需的所有元数据(id、timestamp、error 状态等)

### 4. 组件架构

#### 核心组件
- **`App.tsx`**: 根组件
  - 处理 URL 参数注入(apikey、endpoint、model)
  - 管理全局主题切换(监听系统主题变化)
  - 布局:Header + ChatInterface + SettingsPanel(可折叠侧边栏)

- **`components/ChatInterface.tsx`**: 主聊天逻辑
  - 管理消息发送、流式接收、停止生成、重新生成逻辑
  - 控制 Waiting Arcade Mode 的显示/隐藏
  - 使用 `AbortController` 处理请求取消

- **`components/MessageBubble.tsx`**: 消息渲染
  - 使用 `react-markdown` + `remark-gfm` 渲染 Markdown
  - 支持思维链可视化(可折叠的 thought parts)
  - 提供删除、重新生成操作

- **`components/InputArea.tsx`**: 输入区域
  - 支持文本输入 + 多图上传(最多14张)
  - 图片压缩与 Base64 转换
  - Textarea 自适应高度(最多8行)

#### UI 组件
- **`components/ui/ToastContainer.tsx`**: Toast 通知系统
- **`components/ui/GlobalDialog.tsx`**: 全局确认对话框
- **`components/games/`**: 内置小游戏组件

### 5. 消息处理流程 (`utils/messageUtils.ts`)

- **`convertMessagesToHistory()`**: 将 `ChatMessage[]` 转换为 API 所需的 `Content[]` 格式
  - 过滤掉错误消息(`isError: true`)
  - 自动移除空消息

### 6. 流式响应处理机制

**关键流程** (`ChatInterface.tsx`):

```
1. 用户发送消息 → 添加用户消息到 store
2. 添加空的 model 消息占位符
3. 启动流式生成 → 逐步更新占位符的 parts
4. 检测 thought parts:
   - 如果当前生成的是 thought → 标记 isThinking = true,计算 thinkingDuration
   - 如果从 thought 切换到非 thought → 标记 isThinking = false
5. 最终更新完整消息(包含 thinkingDuration 元数据)
```

**设计亮点**:
- 通过 `updateLastMessage()` 实现增量更新,避免重新渲染整个消息列表
- 使用 `thinkingDuration` 字段记录思维链耗时,用于 UI 展示

### 7. 重新生成机制

- 支持对任意消息(user/model)点击"重新生成"
- 自动定位到对应的 user 消息,裁剪历史记录,然后重新发送
- 使用 `sliceMessages(index)` 删除目标消息及其后续所有消息

## 重要约定

### 代码风格
- 所有组件使用函数式组件 + React Hooks
- 使用 TypeScript 严格模式
- 样式使用 Tailwind CSS 的 utility classes,避免自定义 CSS
- 所有异步操作使用 `async/await` + `try/catch`

### 命名规范
- 组件文件使用 PascalCase(如 `ChatInterface.tsx`)
- Store/Utils 使用 camelCase(如 `useAppStore.ts`)
- 类型定义集中在 `types.ts`,使用 PascalCase

### 状态更新原则
- **永远不要**直接修改 Zustand store 的状态,必须通过 actions
- 更新嵌套对象时使用扩展运算符(`{ ...state.settings, ...newSettings }`)
- 数组操作使用不可变方法(`map`, `filter`, `slice`)

### API 调用规范
- 所有 API 调用必须支持 `AbortSignal` 以便用户可以停止生成
- 错误处理:区分 `AbortError` 和其他错误类型
- API Key 永远存储在 localStorage,不要硬编码

### 图片处理
- 图片上传后立即转为 Base64(使用 `FileReader`)
- 在传递给 API 前移除 Base64 前缀(`data:image/png;base64,`)
- 支持的 MIME 类型在 SDK 中自动处理

## 调试与开发技巧

### 查看消息历史结构
在浏览器控制台:
```javascript
useAppStore.getState().messages
```

### 清除持久化状态
```javascript
localStorage.removeItem('gemini-pro-storage')
```

### 测试流式响应
- 确保 `settings.streamResponse === true`
- 在 `ChatInterface.tsx` 的 `for await (const chunk of stream)` 中添加断点

### 检查 API 请求
- 打开 Network 面板,筛选 `generateContentStream` 或 `generateContent`
- 查看 Request Payload 中的 `contents` 和 `config` 字段

## 常见问题与解决方案

### 思维链不显示
- 检查 `settings.enableThinking` 是否为 `true`
- 确认模型返回的 parts 中包含 `thought: true` 字段

### 流式响应卡顿/重复渲染
- 确保 `processSdkParts()` 正确合并相同类型的连续 text parts
- 检查 `updateLastMessage()` 是否创建了新的数组副本(`[...parts]`)

### 图片上传失败
- 验证 MIME 类型是否正确(必须是 `image/jpeg`, `image/png` 等)
- 检查 Base64 数据是否正确移除了前缀

### 重新生成不工作
- 确认 `sliceMessages()` 正确裁剪了消息数组
- 检查 `convertMessagesToHistory()` 是否过滤了错误消息

## 部署注意事项

- 构建前确保 `vite.config.ts` 中的 `baseUrl` 正确
- 生产环境建议使用环境变量管理 API Endpoint(通过 URL 参数或 localStorage)
- 静态部署到任意 CDN 即可(Vercel、Netlify、Cloudflare Pages 等)
- 不需要后端服务器,完全客户端运行
