// 模型信息接口
export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}

// OpenAI 格式响应
interface OpenAIModelsResponse {
  data: Array<{
    id: string;
    object: string;
    created?: number;
    owned_by?: string;
  }>;
}

// Gemini 格式响应
interface GeminiModelsResponse {
  models: Array<{
    name: string;
    displayName?: string;
    description?: string;
    supportedGenerationMethods?: string[];
  }>;
}

/**
 * 查询可用模型列表
 * 支持 OpenAI 和 Gemini 两种 API 格式
 */
export const fetchModels = async (
  apiKey: string,
  endpoint?: string
): Promise<ModelInfo[]> => {
  const baseUrl = endpoint || 'https://generativelanguage.googleapis.com';

  // 先尝试 Gemini 格式
  try {
    const geminiModels = await fetchGeminiModels(apiKey, baseUrl);
    if (geminiModels.length > 0) {
      return geminiModels;
    }
  } catch (e) {
    console.log('[ModelService] Gemini format failed, trying OpenAI format...');
  }

  // 再尝试 OpenAI 格式
  try {
    const openaiModels = await fetchOpenAIModels(apiKey, baseUrl);
    if (openaiModels.length > 0) {
      return openaiModels;
    }
  } catch (e) {
    console.log('[ModelService] OpenAI format also failed');
  }

  throw new Error('无法获取模型列表，请检查 API Key 和接口地址');
};

/**
 * 使用 Gemini 格式查询模型
 * GET {baseUrl}/v1beta/models?key={apiKey}
 */
const fetchGeminiModels = async (
  apiKey: string,
  baseUrl: string
): Promise<ModelInfo[]> => {
  const url = `${baseUrl}/v1beta/models?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiModelsResponse = await response.json();

  if (!data.models || !Array.isArray(data.models)) {
    throw new Error('Invalid Gemini response format');
  }

  return data.models
    .filter(model => {
      // 只保留支持 generateContent 的模型
      const methods = model.supportedGenerationMethods || [];
      return methods.includes('generateContent');
    })
    .map(model => ({
      // Gemini 格式: "models/gemini-pro" -> "gemini-pro"
      id: model.name.replace('models/', ''),
      name: model.displayName || model.name.replace('models/', ''),
      description: model.description,
    }));
};

/**
 * 使用 OpenAI 格式查询模型
 * GET {baseUrl}/v1/models
 * Authorization: Bearer {apiKey}
 */
const fetchOpenAIModels = async (
  apiKey: string,
  baseUrl: string
): Promise<ModelInfo[]> => {
  const url = `${baseUrl}/v1/models`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data: OpenAIModelsResponse = await response.json();

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid OpenAI response format');
  }

  return data.data.map(model => ({
    id: model.id,
    name: model.id,
    description: model.owned_by ? `by ${model.owned_by}` : undefined,
  }));
};
