/**
 * 自定义 API 适配器
 * 用于处理非标准 Gemini API 响应格式
 */

import { Part } from '../types';

// Markdown 图片链接正则: ![alt](url)
const MARKDOWN_IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

/**
 * 解析自定义 API 响应中的内容
 * 支持的格式:
 * 1. { body: { content: "..." } }
 * 2. { modelOutput: { text: "..." } }
 * 3. 直接的文本内容
 */
export interface CustomApiResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: {
    stream?: boolean;
    image?: boolean;
    content?: string;
  };
  modelOutput?: {
    text?: string;
  };
}

/**
 * 从文本中提取 Markdown 图片链接并转换为 Part 数组
 */
export function parseMarkdownImages(text: string): Part[] {
  const parts: Part[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 重置正则表达式
  MARKDOWN_IMAGE_REGEX.lastIndex = 0;

  while ((match = MARKDOWN_IMAGE_REGEX.exec(text)) !== null) {
    // 添加图片前的文本（如果有）
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index).trim();
      if (textBefore) {
        parts.push({ text: textBefore });
      }
    }

    // 添加图片 URL
    const imageUrl = match[2];
    parts.push({ imageUrl });

    lastIndex = match.index + match[0].length;
  }

  // 添加剩余的文本（如果有）
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText) {
      parts.push({ text: remainingText });
    }
  }

  return parts;
}

/**
 * 检测响应是否为自定义格式
 */
export function isCustomApiResponse(data: any): data is CustomApiResponse {
  if (!data || typeof data !== 'object') return false;

  // 检查是否有 body.content 或 modelOutput.text
  return (
    (data.body && typeof data.body.content === 'string') ||
    (data.modelOutput && typeof data.modelOutput.text === 'string')
  );
}

/**
 * 将自定义 API 响应转换为标准 Part 数组
 */
export function convertCustomResponseToParts(response: CustomApiResponse): Part[] {
  // 优先使用 body.content，其次使用 modelOutput.text
  const content = response.body?.content || response.modelOutput?.text || '';

  if (!content) {
    return [];
  }

  // 检查是否包含 Markdown 图片
  if (MARKDOWN_IMAGE_REGEX.test(content)) {
    MARKDOWN_IMAGE_REGEX.lastIndex = 0; // 重置正则
    return parseMarkdownImages(content);
  }

  // 普通文本
  return [{ text: content }];
}

/**
 * 尝试解析 SSE (Server-Sent Events) 数据
 * 格式: data: {...}\n\n
 */
export function parseSSEData(text: string): any[] {
  const results: any[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const jsonStr = line.slice(6).trim();
      if (jsonStr && jsonStr !== '[DONE]') {
        try {
          results.push(JSON.parse(jsonStr));
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  return results;
}

/**
 * 判断文本是否为 SSE 格式
 */
export function isSSEFormat(text: string): boolean {
  return text.includes('data: ');
}
