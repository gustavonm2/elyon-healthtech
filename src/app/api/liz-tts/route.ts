import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const text = body.text || 'Olá, sou a LIZ.';

        // Clean text for speech
        const cleanText = text
            .replace(/[*#_>]/g, '')
            .replace(/[:;]/g, ',')
            .trim()
            .slice(0, 400);

        if (!cleanText) {
            return NextResponse.json({ success: false, error: 'Texto vazio.' }, { status: 400 });
        }

        // Server-side fetch to High-Quality Neural TTS (prevents CORS blocking in browser)
        const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodeURIComponent(cleanText)}`;

        const response = await fetch(ttsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/',
            },
        });

        if (!response.ok) {
            throw new Error(`TTS HTTP error ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');
        const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;

        return NextResponse.json({
            success: true,
            audioDataUrl,
        });
    } catch (err: any) {
        return NextResponse.json(
            { success: false, error: err.message || 'Erro no servidor de voz neural.' },
            { status: 500 }
        );
    }
}
