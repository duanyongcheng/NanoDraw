import type { Content, Part as SDKPart } from "@google/genai";
import { AppSettings, Part } from '../types';
import {
  isCustomApiResponse,
  convertCustomResponseToParts,
  parseMarkdownImages,
} from './customApiAdapter';

// 默认 API 端点
const DEFAULT_ENDPOINT = 'https://generativelanguage.googleapis.com';

// 判断是否为 Google 官方 API
const isOfficialGoogleApi = (endpoint?: string): boolean => {
  if (!endpoint) return true;
  // 只有明确包含 Google 官方域名才认为是官方 API
  return endpoint.includes('generativelanguage.googleapis.com') ||
         endpoint.includes('googleapis.com');
};

// Helper to construct user content
const constructUserContent = (prompt: string, images: { base64Data: string; mimeType: string }[]): Content => {
  const userParts: SDKPart[] = [];
  
  images.forEach((img) => {
    userParts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64Data,
      },
    });
  });

  if (prompt.trim()) {
    userParts.push({ text: prompt });
  }

  return {
    role: "user",
    parts: userParts,
  };
};

// Helper to format Gemini API errors
const formatGeminiError = (error: any): Error => {
  let message = "发生了未知错误，请稍后重试。";
  const errorMsg = error?.message || error?.toString() || "";

  if (errorMsg.includes("401") || errorMsg.includes("API key not valid")) {
    message = "API Key 无效或过期，请检查您的设置。";
  } else if (errorMsg.includes("403")) {
    message = "访问被拒绝。请检查您的网络连接（可能需要切换节点）或 API Key 权限。";
  } else if (errorMsg.includes("Thinking_config.include_thoughts") || errorMsg.includes("thinking is enabled")) {
    message = "当前模型不支持思考过程。请在设置中关闭“显示思考过程”，或切换到支持思考的模型。";
  } else if (errorMsg.includes("400")) {
    message = "请求参数无效 (400 Bad Request)。请检查您的设置或提示词。";
  } else if (errorMsg.includes("429")) {
    message = "请求过于频繁，请稍后再试（429 Too Many Requests）。";
  } else if (errorMsg.includes("503")) {
    message = "Gemini 服务暂时不可用，请稍后重试（503 Service Unavailable）。";
  } else if (errorMsg.includes("TypeError") || errorMsg.includes("Failed to fetch") || errorMsg.includes("NetworkError")) {
    message = "网络请求失败。可能是网络连接问题，或者请求内容过多（如图片太大、历史记录过长）。";
  } else if (errorMsg.includes("SAFETY")) {
    message = "生成的内容因安全策略被拦截。请尝试修改您的提示词。";
  } else if (errorMsg.includes("404")) {
    message = "请求的模型不存在或路径错误 (404 Not Found)。";
  } else if (errorMsg.includes("500")) {
    message = "Gemini 服务器内部错误，请稍后重试 (500 Internal Server Error)。";
  } else {
      // 保留原始错误信息以便调试，但在前面加上中文提示
      message = `请求出错: ${errorMsg}`;
  }

  const newError = new Error(message);
  (newError as any).originalError = error;
  return newError;
};

// Helper to process SDK parts into app Parts
const processSdkParts = (sdkParts: SDKPart[]): Part[] => {
  const appParts: Part[] = [];

  for (const part of sdkParts) {
    const signature = (part as any).thoughtSignature;
    const isThought = !!(part as any).thought;

    // Handle Text (Thought or Regular)
    if (part.text !== undefined) {
      // 检查文本中是否包含 Markdown 图片链接
      const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
      if (markdownImageRegex.test(part.text)) {
        // 解析 Markdown 图片并转换为 Parts
        const parsedParts = parseMarkdownImages(part.text);
        for (const parsed of parsedParts) {
          appParts.push({ ...parsed, thought: isThought });
        }
      } else {
        const lastPart = appParts[appParts.length - 1];

        // Check if we should append to the last part or start a new one.
        // Append if: Last part exists AND is text AND matches thought type.
        if (
          lastPart &&
          lastPart.text !== undefined &&
          !!lastPart.thought === isThought
        ) {
          lastPart.text += part.text;
          if (signature) {
              lastPart.thoughtSignature = signature;
          }
        } else {
          // New text block
          const newPart: Part = {
            text: part.text,
            thought: isThought
          };
          if (signature) {
              newPart.thoughtSignature = signature;
          }
          appParts.push(newPart);
        }
      }
    }
    // Handle Images
    else if (part.inlineData) {
      const newPart: Part = {
        inlineData: {
            mimeType: part.inlineData.mimeType || 'image/png',
            data: part.inlineData.data || ''
        },
        thought: isThought
      };
      if (signature) {
          newPart.thoughtSignature = signature;
      }
      appParts.push(newPart);
    }
  }
  return appParts;
};

/**
 * 使用原生 fetch 调用自定义 API
 * 用于处理返回非标准格式的第三方 API
 */
const fetchWithCustomApi = async (
  apiKey: string,
  history: Content[],
  prompt: string,
  images: { base64Data: string; mimeType: string }[],
  settings: AppSettings,
  signal?: AbortSignal
): Promise<{ userContent: Content; modelParts: Part[] }> => {
  const endpoint = settings.customEndpoint || DEFAULT_ENDPOINT;
  const model = settings.modelName || "gemini-3-pro-image-preview";

  // 构建请求 URL
  const url = `${endpoint}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // 过滤历史记录中的 thought parts
  const cleanHistory = history.map(item => {
    if (item.role === 'model') {
      return {
        ...item,
        parts: item.parts.filter(p => !p.thought).map(p => {
          // 移除 imageUrl，只保留标准字段
          const { imageUrl, thought, thoughtSignature, ...rest } = p as any;
          return rest;
        })
      };
    }
    return item;
  }).filter(item => item.parts.length > 0);

  const currentUserContent = constructUserContent(prompt, images);
  const contentsPayload = [...cleanHistory, currentUserContent];

  // 构建请求体
  const requestBody: any = {
    contents: contentsPayload,
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    }
  };

  // 添加 Pro 模式配置
  if (settings.isPro) {
    requestBody.generationConfig.imageConfig = {
      imageSize: settings.resolution,
      ...(settings.aspectRatio !== 'Auto' ? { aspectRatio: settings.aspectRatio } : {}),
    };

    if (settings.useGrounding) {
      requestBody.tools = [{ googleSearch: {} }];
    }

    if (settings.enableThinking) {
      requestBody.generationConfig.thinkingConfig = {
        includeThoughts: true,
      };
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  // 读取响应文本
  const text = await response.text();
  console.log('[CustomAPI] Raw response:', text.slice(0, 500));

  let data: any = null;

  // 检查是否为 SSE 格式 (以 "data:" 开头)
  if (text.trim().startsWith('data:')) {
    console.log('[CustomAPI] Detected SSE format');
    // SSE 格式，解析所有 data: 行并合并 parts
    const lines = text.split('\n');
    const allParts: any[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('data:')) {
        const jsonStr = trimmedLine.slice(5).trim();
        if (jsonStr && jsonStr !== '[DONE]') {
          try {
            const parsed = JSON.parse(jsonStr);
            // 提取 parts
            const parts = parsed.candidates?.[0]?.content?.parts || [];
            allParts.push(...parts);
          } catch (e) {
            console.log('[CustomAPI] Failed to parse SSE line:', jsonStr.slice(0, 100));
          }
        }
      }
    }

    if (allParts.length > 0) {
      console.log('[CustomAPI] Extracted parts from SSE:', allParts);
      // 使用 processSdkParts 处理，它会自动解析 Markdown 图片
      const modelParts = processSdkParts(allParts);
      console.log('[CustomAPI] Processed parts:', modelParts);
      return { userContent: currentUserContent, modelParts };
    }
  }

  // 尝试直接解析为 JSON
  try {
    data = JSON.parse(text);
    console.log('[CustomAPI] Parsed JSON:', data);
  } catch {
    // 非 JSON 格式，检查是否包含 Markdown 图片
    if (text.includes('![')) {
      console.log('[CustomAPI] Found markdown image in raw text');
      const parts = parseMarkdownImages(text);
      return { userContent: currentUserContent, modelParts: parts };
    }
    throw new Error(`无法解析响应: ${text.slice(0, 200)}`);
  }

  // 检查是否为自定义格式
  if (isCustomApiResponse(data)) {
    console.log('[CustomAPI] Detected custom API response format');
    const modelParts = convertCustomResponseToParts(data);
    console.log('[CustomAPI] Converted parts:', modelParts);
    return { userContent: currentUserContent, modelParts };
  }

  // 标准 Gemini 格式
  const candidate = data.candidates?.[0];
  if (candidate?.content?.parts) {
    console.log('[CustomAPI] Detected standard Gemini format');
    const modelParts = processSdkParts(candidate.content.parts);
    return { userContent: currentUserContent, modelParts };
  }

  // 检查响应文本是否包含 Markdown 图片
  const responseText = JSON.stringify(data);
  if (responseText.includes('![')) {
    console.log('[CustomAPI] Found markdown image in JSON string');
    const parts = parseMarkdownImages(responseText);
    if (parts.length > 0) {
      return { userContent: currentUserContent, modelParts: parts };
    }
  }

  console.error('[CustomAPI] Unable to parse response:', data);
  throw new Error("无法解析 API 响应格式");
};

export const streamGeminiResponse = async function* (
  apiKey: string,
  history: Content[],
  prompt: string,
  images: { base64Data: string; mimeType: string }[],
  settings: AppSettings,
  signal?: AbortSignal
) {
  console.log('[GeminiService] Endpoint:', settings.customEndpoint);
  console.log('[GeminiService] Is official Google API:', isOfficialGoogleApi(settings.customEndpoint));

  // 对于非官方 Google API，使用非流式请求（因为自定义 API 可能不支持标准流式格式）
  if (!isOfficialGoogleApi(settings.customEndpoint)) {
    console.log('[GeminiService] Using custom API adapter');
    try {
      const result = await fetchWithCustomApi(apiKey, history, prompt, images, settings, signal);
      yield result;
      return;
    } catch (error) {
      console.error("Custom API Stream Error:", error);
      throw formatGeminiError(error);
    }
  }

  console.log('[GeminiService] Using Google SDK');
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI(
    { apiKey, httpOptions: { baseUrl: settings.customEndpoint || DEFAULT_ENDPOINT } }
  );

  // Filter out thought parts from history to avoid sending thought chains back to the model
  const cleanHistory = history.map(item => {
    if (item.role === 'model') {
      return {
        ...item,
        parts: item.parts.filter(p => !p.thought)
      };
    }
    return item;
  }).filter(item => item.parts.length > 0);

  const currentUserContent = constructUserContent(prompt, images);
  const contentsPayload = [...cleanHistory, currentUserContent];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: settings.modelName || "gemini-3-pro-image-preview",
      contents: contentsPayload,
      config: {
        ...(settings.isPro ? {
          imageConfig: {
            imageSize: settings.resolution,
            ...(settings.aspectRatio !== 'Auto' ? { aspectRatio: settings.aspectRatio } : {}),
          },
          tools: settings.useGrounding ? [{ googleSearch: {} }] : [],
        } : {}),
        responseModalities: ["TEXT", "IMAGE"],
        ...(settings.isPro && settings.enableThinking ? {
            thinkingConfig: {
                includeThoughts: true,
            }
        } : {}),
      },
    });

    let currentParts: Part[] = [];

    for await (const chunk of responseStream) {
      if (signal?.aborted) {
        break;
      }
      const candidates = chunk.candidates;
      if (!candidates || candidates.length === 0) continue;
      
      const newParts = candidates[0].content?.parts || [];

      // Use the helper logic but incrementally
      // We can't reuse processSdkParts directly because we need to accumulate state (currentParts)
      // So we keep the loop logic here
      for (const part of newParts) {
        const signature = (part as any).thoughtSignature;
        const isThought = !!(part as any).thought;

        // Handle Text (Thought or Regular)
        if (part.text !== undefined) {
          const lastPart = currentParts[currentParts.length - 1];

          if (
            lastPart && 
            lastPart.text !== undefined && 
            !!lastPart.thought === isThought
          ) {
            lastPart.text += part.text;
            if (signature) {
                lastPart.thoughtSignature = signature;
            }
          } else {
            const newPart: Part = { 
              text: part.text, 
              thought: isThought 
            };
            if (signature) {
                newPart.thoughtSignature = signature;
            }
            currentParts.push(newPart);
          }
        } 
        else if (part.inlineData) {
          const newPart: Part = { 
            inlineData: {
                mimeType: part.inlineData.mimeType || 'image/png',
                data: part.inlineData.data || ''
            }, 
            thought: isThought 
          };
          if (signature) {
              newPart.thoughtSignature = signature;
          }
          currentParts.push(newPart);
        }
      }

      yield {
        userContent: currentUserContent,
        modelParts: currentParts // Yield the accumulated parts
      };
    }
  } catch (error) {
    console.error("Gemini API Stream Error:", error);
    throw formatGeminiError(error);
  }
};

export const generateContent = async (
  apiKey: string,
  history: Content[],
  prompt: string,
  images: { base64Data: string; mimeType: string }[],
  settings: AppSettings,
  signal?: AbortSignal
) => {
  console.log('[GeminiService:generateContent] Endpoint:', settings.customEndpoint);
  console.log('[GeminiService:generateContent] Is official Google API:', isOfficialGoogleApi(settings.customEndpoint));

  // 对于非官方 Google API，直接使用自定义适配器
  if (!isOfficialGoogleApi(settings.customEndpoint)) {
    console.log('[GeminiService:generateContent] Using custom API adapter');
    try {
      return await fetchWithCustomApi(apiKey, history, prompt, images, settings, signal);
    } catch (error) {
      console.error("Custom API Error:", error);
      throw formatGeminiError(error);
    }
  }

  // 官方 API 使用 SDK
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI(
    { apiKey, httpOptions: { baseUrl: settings.customEndpoint || DEFAULT_ENDPOINT } }
  );

  // Filter out thought parts from history
  const cleanHistory = history.map(item => {
    if (item.role === 'model') {
      return {
        ...item,
        parts: item.parts.filter(p => !p.thought)
      };
    }
    return item;
  }).filter(item => item.parts.length > 0);

  const currentUserContent = constructUserContent(prompt, images);
  const contentsPayload = [...cleanHistory, currentUserContent];

  try {
    // If signal is aborted before we start, throw immediately
    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    const response = await ai.models.generateContent({
      model: settings.modelName || "gemini-3-pro-image-preview",
      contents: contentsPayload,
      config: {
        ...(settings.isPro ? {
          imageConfig: {
            imageSize: settings.resolution,
            ...(settings.aspectRatio !== 'Auto' ? { aspectRatio: settings.aspectRatio } : {}),
          },
          tools: settings.useGrounding ? [{ googleSearch: {} }] : [],
        } : {}),
        responseModalities: ["TEXT", "IMAGE"],
        ...(settings.isPro && settings.enableThinking ? {
            thinkingConfig: {
                includeThoughts: true,
            }
        } : {}),
      },
    });

    if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
    }

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
      throw new Error("No content generated.");
    }

    const modelParts = processSdkParts(candidate.content.parts);

    return {
      userContent: currentUserContent,
      modelParts: modelParts
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw formatGeminiError(error);
  }
};
