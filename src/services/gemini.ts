import { GoogleGenerativeAI } from "@google/generative-ai";
import { clinicalSystemPrompt } from "./clinicalPrompt";
import type { ChatMessage } from '../types';

let chatSession: any = null;

const IN_BROWSER = typeof window !== 'undefined';
let apiKey = '';

// Se temos a store criada, tentamos pegar a chave de lá.
if (IN_BROWSER) {
   const storageStr = localStorage.getItem('medflow-settings');
   if (storageStr) {
       try {
           const settings = JSON.parse(storageStr);
           if (settings.state && settings.state.geminiApiKey) {
               apiKey = settings.state.geminiApiKey;
           }
       } catch (e) {
           console.error("Erro ao ler apiKey do localStorage on load.");
       }
   }
}

// Fallback para env var caso não venha da UI
if (!apiKey && import.meta.env.VITE_GEMINI_API_KEY) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY;
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

// Para o AI Command Bar global
export interface AIActionResponse {
    action: 'NAVIGATE' | 'SCHEDULE_PATIENT' | 'OPEN_PATIENT' | 'CREATE_TASK' | 'SEND_TEAM_MESSAGE' | 'CREATE_NOTICE' | 'AUTOMATION_CAMPAIGN' | 'UNKNOWN';
    payload: any;
    feedbackMessage: string;
}

export const resetChat = () => {
    if (!model) return;
    chatSession = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: clinicalSystemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Entendido. Atuarei estritamente como o assistente clínico IA do MedFlow, seguindo as diretrizes de segurança, ética médica e os fluxos de trabalho do sistema (avaliação, conduta, etc.). Aguardo os dados do paciente para iniciar o auxílio no prontuário." }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.2, // Baixa temperatura para respostas mais precisas/factuais
      },
    });
};

export const getGeminiChatResponse = async (
  message: string,
  patientData: any,
  _history: ChatMessage[]
): Promise<string> => {
   if (!apiKey || !model) {
       return "A chave da API do Gemini não está configurada. Por favor, acesse Configurações > Integrações para adicionar sua chave.";
   }

  if (!chatSession) {
    resetChat();
  }

  try {
    const contextPrompt = `Contexto Automático do Paciente (NÃO RESPONDA A ISSO DIRETAMENTE, APENAS USE COMO BASE):\n${JSON.stringify(patientData)}\n\nO médico digitou: ${message}`;
    const result = await chatSession.sendMessage(contextPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Erro ao chamar a API do Gemini:", error);
    return "Desculpe, ocorreu um erro na comunicação com a IA. Por favor, verifique sua conexão ou a chave da API e tente novamente.";
  }
};
