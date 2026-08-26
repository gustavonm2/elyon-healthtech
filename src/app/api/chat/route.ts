import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages, systemPrompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY ausente nas variáveis de ambiente.' }, { status: 500 });
    }

    // Formatação estrita para a API do Gemini 1.5
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: formattedMessages
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Falha na comunicação com o Gemini.');
    }

    const data = await response.json();
    const textoExtraido = data.candidates[0].content.parts[0].text;

    return NextResponse.json({ role: 'assistant', content: textoExtraido });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
