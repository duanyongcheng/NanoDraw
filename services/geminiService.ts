import { GoogleGenAI, Content, Part } from "@google/genai";
import { AppSettings } from '../types';

export const generateContent = async (
  apiKey: string,
  history: Content[],
  prompt: string,
  images: { base64Data: string; mimeType: string }[],
  settings: AppSettings
) => {
  const ai = new GoogleGenAI({ apiKey });

  // Construct the new user turn
  const userParts: Part[] = [];
  
  // Add images first (if any)
  images.forEach((img) => {
    userParts.push({
      inlineData: {
        mimeType: img.mimeType,
        data: img.base64Data,
      },
    });
  });

  // Add text prompt
  if (prompt.trim()) {
    userParts.push({ text: prompt });
  }

  const currentUserContent: Content = {
    role: "user",
    parts: userParts,
  };

  const contentsPayload = [...history, currentUserContent];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: contentsPayload,
      config: {
        imageConfig: {
          imageSize: settings.resolution,
          aspectRatio: settings.aspectRatio,
        },
        tools: settings.useGrounding ? [{ googleSearch: {} }] : [],
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // We need to return both the raw content object (for history) and the UI accessible data
    // The SDK's response structure typically wraps candidates.
    // We want the 'content' from the first candidate.
    
    const candidate = response.candidates?.[0];
    
    if (!candidate || !candidate.content) {
      throw new Error("No content generated.");
    }

    return {
      userContent: currentUserContent,
      modelContent: candidate.content,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};