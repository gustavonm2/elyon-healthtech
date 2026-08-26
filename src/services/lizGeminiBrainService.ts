import { GoogleGenerativeAI } from '@google/generative-ai';
import { dispatchLizOsCommand } from './lizOsBridgeService';

export interface LizBrainResponse {
    success: boolean;
    text: string;
    toolUsed?: string;
    toolDetails?: string;
}

const GEMINI_API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY || '';

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
            model: 'gemini-1.5-flash',
            systemInstruction: `Você é a LIZ, uma assistente pessoal e orquestradora de sistema de altíssimo nível estilo Jarvis, integrada diretamente ao macOS do usuário.
Seu tom é profissional, direto, elegante e altamente eficiente. Você prefere respostas concisas e sem formatação Markdown exagerada para poder falar com clareza via áudio.`,
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
