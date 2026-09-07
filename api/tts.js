// Vercel Serverless Function — Edge TTS Proxy
// Usa vozes neurais da Microsoft (Francisca pt-BR) GRATUITAMENTE
// Rota: POST /api/tts

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, voice } = req.body || {};

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Campo "text" é obrigatório' });
        }

        // Limpar texto para síntese
        const cleanText = text
            .replace(/[*#_>`]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 500);

        if (!cleanText) {
            return res.status(400).json({ error: 'Texto vazio após limpeza' });
        }

        const { EdgeTTS } = await import('@andresaya/edge-tts');

        const tts = new EdgeTTS();
        const selectedVoice = voice || 'pt-BR-FranciscaNeural';

        await tts.synthesize(cleanText, selectedVoice);
        const audioBuffer = await tts.toBuffer();

        if (!audioBuffer || audioBuffer.length === 0) {
            return res.status(500).json({ error: 'Nenhum áudio gerado' });
        }

        // Retornar como base64 para fácil reprodução no frontend
        const base64Audio = audioBuffer.toString('base64');

        return res.status(200).json({
            success: true,
            audio: base64Audio,
            mimeType: 'audio/mpeg',
            voice: selectedVoice,
            textLength: cleanText.length,
            audioSize: audioBuffer.length,
        });
    } catch (err) {
        console.error('TTS Error:', err);
        return res.status(500).json({
            error: err.message || 'Erro na síntese de voz',
        });
    }
}
