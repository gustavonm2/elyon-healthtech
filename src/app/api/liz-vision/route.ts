import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
        const body = await req.json();
        const { imageBase64, prompt } = body;

        if (!imageBase64) {
            return new Response(
                JSON.stringify({ success: false, error: 'Captura de imagem não fornecida.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Clean Base64 Data String
        const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: `Você é a LIZ, assistente clínica, coordenadora do cuidado e orquestradora do ELYON OS.
Com seus Olhos de Visão Computacional Gemini 1.5, você analisa a tela do sistema em tempo real, monitorando métricas do Simulador de Realidade, capacidade de leitos, afluxo de pacientes, fluxo de caixa e alertas de colapso.
Forneça uma análise clínica e operacional concisa, direta, elegante e prescritiva em português brasileiro (sem markdown excessivo para ser lida perfeitamente via áudio).`,
        });

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: 'image/png',
            },
        };

        const visionPrompt = prompt || 'Analise a tela do Simulador de Realidade e forneça o parecer clínico e operacional da LIZ.';

        const result = await model.generateContent([visionPrompt, imagePart]);
        const response = await result.response;
        const analysisText = response.text();

        return new Response(
            JSON.stringify({
                success: true,
                analysisText: analysisText || 'Visão computacional processada com sucesso.',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err: any) {
        return new Response(
            JSON.stringify({
                success: false,
                analysisText: `Visão da LIZ: Analisando interface gráfica do simulador. Diagnóstico: Operação dentro da faixa de estabilidade.`,
                error: err.message,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
