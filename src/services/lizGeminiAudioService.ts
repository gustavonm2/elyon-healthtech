import { getInternalGeminiKey } from './geminiKey';

// Global TTS log emitter for in-app debug terminal
export interface LizTtsLogEntry {
    id: string;
    time: string;
    type: 'info' | 'success' | 'warn' | 'error';
    message: string;
}

export const emitTtsLog = (message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    console.log(`[TTS ${type.toUpperCase()}] ${time} - ${message}`);
    if (typeof window !== 'undefined') {
        const event = new CustomEvent('liz-tts-log', {
            detail: { id: `log-${Date.now()}-${Math.random()}`, time, type, message },
        });
        window.dispatchEvent(event);
    }
};

/**
 * Converts raw PCM 16-bit linear buffer to standard RIFF/WAVE ArrayBuffer
 */
function createWavBuffer(pcmBytes: Uint8Array, sampleRate: number = 24000, numChannels: number = 1): ArrayBuffer {
    const byteRate = sampleRate * numChannels * 2;
    const blockAlign = numChannels * 2;
    const dataSize = pcmBytes.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeString(offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // RIFF identifier
    writeString(0, 'RIFF');
    // RIFF chunk length
    view.setUint32(4, 36 + dataSize, true);
    // RIFF type
    writeString(8, 'WAVE');
    // format chunk identifier
    writeString(12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (1 = PCM)
    view.setUint16(20, 1, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, byteRate, true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, blockAlign, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier
    writeString(36, 'data');
    // data chunk length
    view.setUint32(40, dataSize, true);

    // Write PCM audio samples
    new Uint8Array(buffer, 44).set(pcmBytes);

    return buffer;
}

class LizGeminiAudioService {
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private currentAudio: HTMLAudioElement | null = null;
    private currentAudioSource: AudioBufferSourceNode | null = null;
    private audioContext: AudioContext | null = null;

    /**
     * Garante inicialização / desbloqueio de áudio em gestos do usuário
     */
    public unlockAudioContext() {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!this.audioContext && AudioCtx) {
                this.audioContext = new AudioCtx({ sampleRate: 24000 });
            }
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    emitTtsLog(`AudioContext desbloqueado com sucesso (state: ${this.audioContext?.state})`, 'success');
                });
            }
        } catch (e: any) {
            emitTtsLog(`Aviso ao desbloquear AudioContext: ${e.message}`, 'warn');
        }
    }

    /**
     * Pipeline 1: Converte PCM para WAV e reproduz via HTMLAudioElement (imune a limitações de WebAudio)
     */
    private playViaHtmlAudio(
        wavBuffer: ArrayBuffer,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                const blob = new Blob([wavBuffer], { type: 'audio/wav' });
                const blobUrl = URL.createObjectURL(blob);
                const audio = new Audio(blobUrl);
                this.currentAudio = audio;

                audio.onplay = () => {
                    emitTtsLog('reprodução iniciada (HTMLAudioElement WAV)', 'success');
                    if (onStart) onStart();
                };

                audio.onended = () => {
                    emitTtsLog('reprodução finalizada (HTMLAudioElement WAV)', 'success');
                    URL.revokeObjectURL(blobUrl);
                    this.currentAudio = null;
                    if (onEnd) onEnd();
                    resolve(true);
                };

                audio.onerror = (e) => {
                    emitTtsLog(`Erro no HTMLAudioElement (${JSON.stringify(e)}), tentando WebAudio fallback`, 'warn');
                    URL.revokeObjectURL(blobUrl);
                    this.currentAudio = null;
                    resolve(false);
                };

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        emitTtsLog(`Autoplay bloqueado no HTMLAudio (${err.message}), tentando WebAudio`, 'warn');
                        URL.revokeObjectURL(blobUrl);
                        this.currentAudio = null;
                        resolve(false);
                    });
                }
            } catch (err: any) {
                emitTtsLog(`Falha ao instanciar HTMLAudio: ${err.message}`, 'error');
                resolve(false);
            }
        });
    }

    /**
     * Pipeline 2: WebAudio Context com ArrayBuffer e Int16 -> Float32
     */
    private async playViaWebAudio(
        pcmBytes: Uint8Array,
        sampleRate: number = 24000,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<boolean> {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!this.audioContext && AudioCtx) {
                this.audioContext = new AudioCtx({ sampleRate });
            }
            if (!this.audioContext) {
                emitTtsLog('WebAudio Context não disponível no navegador', 'error');
                return false;
            }

            if (this.audioContext.state === 'suspended') {
                emitTtsLog(`AudioContext state antes de resume: ${this.audioContext.state}`, 'warn');
                await this.audioContext.resume();
            }
            emitTtsLog(`AudioContext state: ${this.audioContext.state}`, 'info');

            // Garante alinhamento de 16-bit
            const sampleCount = Math.floor(pcmBytes.length / 2);
            const dataView = new DataView(pcmBytes.buffer, pcmBytes.byteOffset, pcmBytes.byteLength);
            const float32Array = new Float32Array(sampleCount);

            for (let i = 0; i < sampleCount; i++) {
                // PCM 16-bit signed little-endian
                const int16 = dataView.getInt16(i * 2, true);
                float32Array[i] = int16 / 32768.0;
            }

            const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, sampleRate);
            audioBuffer.getChannelData(0).set(float32Array);
            emitTtsLog(`AudioBuffer criado (samples: ${audioBuffer.length}, duration: ${audioBuffer.duration.toFixed(2)}s)`, 'success');

            if (audioBuffer.length === 0) {
                emitTtsLog('AudioBuffer vazio', 'error');
                return false;
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            this.currentAudioSource = source;

            source.onended = () => {
                emitTtsLog('reprodução finalizada (WebAudio)', 'success');
                this.currentAudioSource = null;
                if (onEnd) onEnd();
            };

            emitTtsLog('reprodução iniciada (WebAudio)', 'success');
            if (onStart) onStart();
            source.start(0);
            return true;
        } catch (e: any) {
            emitTtsLog(`Falha no WebAudio playback: ${e.message}`, 'error');
            return false;
        }
    }

    /**
     * Síntese de Voz Neural Humanizada com Gemini 2.5 Flash Preview TTS
     */
    public async playNeuralSpeech(
        text: string,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<void> {
        this.stop();

        const cleanText = text
            .replace(/[*#_>`]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText || typeof window === 'undefined') {
            if (onEnd) onEnd();
            return;
        }

        const apiKey = getInternalGeminiKey();

        // 1. Tentar Síntese Neural Humanizada com Gemini TTS (com multi-model fallback e timeout de 8s)
        if (apiKey) {
            const candidateModels = [
                'gemini-2.5-flash-preview-tts',
                'gemini-3.1-flash-tts-preview',
            ];

            for (const model of candidateModels) {
                try {
                    emitTtsLog(`Solicitando áudio neural (${model}): "${cleanText.slice(0, 40)}..."`, 'info');

                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);

                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [
                                    {
                                        role: 'user',
                                        parts: [
                                            {
                                                text: `Fale com carinho, tom empático, calmo e acolhedor em português do Brasil:\n"${cleanText}"`,
                                            },
                                        ],
                                    },
                                ],
                                generationConfig: {
                                    responseModalities: ['AUDIO'],
                                    speechConfig: {
                                        voiceConfig: {
                                            prebuiltVoiceConfig: {
                                                voiceName: 'Aoede',
                                            },
                                        },
                                    },
                                },
                            }),
                            signal: controller.signal,
                        }
                    );
                    clearTimeout(timeoutId);

                    emitTtsLog(`Resposta recebida de ${model} (HTTP Status: ${response.status})`, response.ok ? 'success' : 'warn');

                    if (response.ok) {
                        const data = await response.json();
                        const candidate = data.candidates?.[0];
                        const audioPart = candidate?.content?.parts?.find(
                            (p: any) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
                        );

                        if (audioPart?.inlineData?.data) {
                            const mime = audioPart.inlineData.mimeType || 'audio/L16;codec=pcm;rate=24000';
                            emitTtsLog(`MIME/content-type: ${mime}`, 'info');

                            const sampleRate = mime.includes('rate=')
                                ? parseInt(mime.split('rate=')[1], 10)
                                : 24000;

                            const binaryString = atob(audioPart.inlineData.data);
                            const pcmBytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                pcmBytes[i] = binaryString.charCodeAt(i);
                            }
                            emitTtsLog(`Áudio decodificado (${pcmBytes.length} bytes PCM)`, 'success');

                            // 1. WAV Playback
                            const wavBuffer = createWavBuffer(pcmBytes, sampleRate, 1);
                            const playedHtml = await this.playViaHtmlAudio(wavBuffer, onStart, onEnd);
                            if (playedHtml) return;

                            // 2. WebAudio Playback
                            const playedWeb = await this.playViaWebAudio(pcmBytes, sampleRate, onStart, onEnd);
                            if (playedWeb) return;
                        }
                    } else {
                        const errData = await response.json();
                        emitTtsLog(`Modelo ${model} indisponível: ${errData.error?.message || response.statusText}`, 'warn');
                    }
                } catch (err: any) {
                    emitTtsLog(`Falha na chamada (${model}): ${err.name === 'AbortError' ? 'Timeout (8s)' : err.message}`, 'warn');
                }
            }
        } else {
            emitTtsLog('Chave Gemini API não configurada para TTS', 'warn');
        }

        // 3. Fallback imediato e audível no navegador
        emitTtsLog('Ativando fallback de voz do navegador...', 'info');
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const speakWithNative = () => {
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.lang = 'pt-BR';
                utterance.rate = 0.90;
                utterance.pitch = 1.05;
                utterance.volume = 1.0;

                const voices = window.speechSynthesis.getVoices();
                const ptFemaleVoice =
                    voices.find(
                        (v) =>
                            v.lang.startsWith('pt-BR') &&
                            (v.name.toLowerCase().includes('luciana') ||
                                v.name.toLowerCase().includes('leticia') ||
                                v.name.toLowerCase().includes('maria') ||
                                v.name.toLowerCase().includes('female') ||
                                v.name.toLowerCase().includes('fernanda') ||
                                v.name.toLowerCase().includes('google português'))
                    ) ||
                    voices.find((v) => v.lang.startsWith('pt-BR')) ||
                    voices.find((v) => v.lang.startsWith('pt'));

                if (ptFemaleVoice) {
                    utterance.voice = ptFemaleVoice;
                    emitTtsLog(`Voz selecionada: ${ptFemaleVoice.name}`, 'info');
                }

                utterance.onstart = () => {
                    emitTtsLog('Reprodução em andamento (Voz do Navegador)', 'success');
                    if (onStart) onStart();
                };

                utterance.onend = () => {
                    emitTtsLog('Reprodução concluída', 'success');
                    if (onEnd) onEnd();
                };

                utterance.onerror = (e: any) => {
                    emitTtsLog(`Erro na reprodução nativa: ${e.error || 'desconhecido'}`, 'error');
                    if (onEnd) onEnd();
                };

                this.currentUtterance = utterance;
                window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                speakWithNative();
            } else {
                window.speechSynthesis.onvoiceschanged = () => {
                    speakWithNative();
                };
            }
        } else {
            if (onEnd) onEnd();
        }
    }

    public stop() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        if (this.currentAudioSource) {
            try {
                this.currentAudioSource.stop();
            } catch (e) {
                // ignore
            }
            this.currentAudioSource = null;
        }
        this.currentUtterance = null;
    }
}

export const lizGeminiAudioService = new LizGeminiAudioService();
export default lizGeminiAudioService;
