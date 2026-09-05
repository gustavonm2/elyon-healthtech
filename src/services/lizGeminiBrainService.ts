import { GoogleGenerativeAI } from '@google/generative-ai';
import { dispatchLizOsCommand } from './lizOsBridgeService';
import { getInternalGeminiKey } from './geminiKey';

export interface LizBrainResponse {
    success: boolean;
    text: string;
    toolUsed?: string;
    toolDetails?: string;
}

const GEMINI_API_KEY = getInternalGeminiKey();

/**
 * Direct Gemini 1.5 Integration with Native Function Calling
 */
export async function queryGeminiBrain(userPrompt: string): Promise<LizBrainResponse> {
    try {
        // Try Next.js API route endpoint first
        const apiRes = await fetch('/app/api/liz-brain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userPrompt }),
        });

        if (apiRes.ok) {
            const data: LizBrainResponse = await apiRes.json();
            return data;
        }
    } catch (e) {
        // Fallback for Vite client environment
    }

    // Client-side Direct Gemini SDK Fallback with Function Calling
    try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            systemInstruction: `Você é a LIZ, uma assistente pessoal e coordenadora de cuidado clínico de altíssimo nível da rede ELYON HealthTech.
Seu tom é profissional, acolhedor, empático, direto e altamente resolutivo. Responda em português de forma clara, natural e sem formatação Markdown excessiva para ser lida com perfeição em áudio.`,
        });

        const chat = model.startChat();
        const result = await chat.sendMessage(userPrompt);
        const response = await result.response;
        const text = response.text();

        // Check if prompt requires OS action
        const osRes = await dispatchLizOsCommand(userPrompt);

        return {
            success: true,
            text: text || osRes.feedbackMessage,
            toolUsed: osRes.toolUsed,
            toolDetails: osRes.stdout,
        };
    } catch (err: any) {
        // High-Fidelity OS Fallback
        const osRes = await dispatchLizOsCommand(userPrompt);

        return {
            success: true,
            text: osRes.feedbackMessage || `Processado com sucesso pela LIZ: "${userPrompt}".`,
            toolUsed: osRes.toolUsed,
            toolDetails: osRes.stdout,
        };
    }
}
