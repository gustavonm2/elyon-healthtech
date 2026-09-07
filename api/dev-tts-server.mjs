// Servidor local para a API TTS (desenvolvimento)
// Roda em porta separada e é acessado via proxy do Vite

import http from 'node:http';

const PORT = 3001;

async function handleTts(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    // Ler body
    let body = '';
    for await (const chunk of req) {
        body += chunk;
    }

    try {
        const { text, voice } = JSON.parse(body);

        if (!text || typeof text !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Campo "text" é obrigatório' }));
            return;
        }

        const cleanText = text
            .replace(/[*#_>`]/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 500);

        if (!cleanText) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Texto vazio' }));
            return;
        }

        const { EdgeTTS } = await import('@andresaya/edge-tts');

        const tts = new EdgeTTS();
        const selectedVoice = voice || 'pt-BR-FranciscaNeural';

        console.log(`[TTS] Sintetizando com ${selectedVoice}: "${cleanText.slice(0, 60)}..."`);

        await tts.synthesize(cleanText, selectedVoice);
        const audioBuffer = await tts.toBuffer();

        if (!audioBuffer || audioBuffer.length === 0) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Nenhum áudio gerado' }));
            return;
        }

        const base64Audio = audioBuffer.toString('base64');

        console.log(`[TTS] ✅ Áudio gerado: ${audioBuffer.length} bytes`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            audio: base64Audio,
            mimeType: 'audio/mpeg',
            voice: selectedVoice,
            textLength: cleanText.length,
            audioSize: audioBuffer.length,
        }));
    } catch (err) {
        console.error('[TTS] Erro:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message || 'Erro na síntese' }));
    }
}

const server = http.createServer((req, res) => {
    if (req.url === '/api/tts') {
        handleTts(req, res);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`\n🎤 TTS Server rodando em http://localhost:${PORT}/api/tts`);
    console.log(`   Voz: pt-BR-FranciscaNeural (Microsoft Neural)`);
    console.log(`   Uso: POST { "text": "seu texto" }\n`);
});
