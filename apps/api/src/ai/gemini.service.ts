import { Injectable } from "@nestjs/common";
import { runtimeEnv } from "@platform/config";
import { createApiException } from "../common/api-error.util";

interface GeminiCandidatePart {
  text?: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiCandidatePart[];
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export interface GeminiJsonResult<TResponse> {
  data: TResponse;
  usage: {
    promptTokenCount: number;
    candidateTokenCount: number;
    totalTokenCount: number;
  };
}

@Injectable()
export class GeminiService {
  async generateJson<TResponse>({
    systemInstruction,
    userPrompt,
    temperature = 0.4
  }: {
    systemInstruction: string;
    userPrompt: string;
    temperature?: number;
  }): Promise<GeminiJsonResult<TResponse>> {
    if (!runtimeEnv.geminiApiKey) {
      throw createApiException(
        503,
        "AI_TEMPORARILY_UNAVAILABLE",
        "Gemini AI is not configured for this environment."
      );
    }

    const modelName = this.resolveModelName(runtimeEnv.geminiModel);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${runtimeEnv.geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature,
            candidateCount: 1
          }
        })
      }
    );

    const payload = (await response.json().catch(() => null)) as GeminiGenerateContentResponse | null;

    if (!response.ok || !payload) {
      throw createApiException(
        503,
        "AI_TEMPORARILY_UNAVAILABLE",
        "Gemini AI request failed."
      );
    }

    if (payload.promptFeedback?.blockReason) {
      throw createApiException(
        503,
        "AI_TEMPORARILY_UNAVAILABLE",
        "Gemini AI blocked the prompt for this request."
      );
    }

    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!text) {
      throw createApiException(
        503,
        "AI_TEMPORARILY_UNAVAILABLE",
        "Gemini AI did not return usable content."
      );
    }

    try {
      return {
        data: this.parseJsonResponse<TResponse>(text),
        usage: {
          promptTokenCount: payload.usageMetadata?.promptTokenCount ?? 0,
          candidateTokenCount: payload.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokenCount:
            payload.usageMetadata?.totalTokenCount ??
            (payload.usageMetadata?.promptTokenCount ?? 0) +
              (payload.usageMetadata?.candidatesTokenCount ?? 0)
        }
      };
    } catch {
      throw createApiException(
        503,
        "AI_TEMPORARILY_UNAVAILABLE",
        "Gemini AI returned an invalid JSON payload."
      );
    }
  }

  private resolveModelName(model: string) {
    return model.startsWith("models/") ? model : `models/${model}`;
  }

  private parseJsonResponse<TResponse>(text: string): TResponse {
    const trimmed = text.trim();
    const withoutFence =
      trimmed.startsWith("```") && trimmed.endsWith("```")
        ? trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
        : trimmed;

    return JSON.parse(withoutFence) as TResponse;
  }
}
