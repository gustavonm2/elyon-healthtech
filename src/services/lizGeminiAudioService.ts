import { getInternalGeminiKey } from './geminiKey';

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
                    console.log('[TTS] AudioContext desbloqueado com sucesso (state:', this.audioContext?.state, ')');
                });
            }
        } catch (e) {
            console.warn('[TTS] Aviso ao desbloquear AudioContext:', e);
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
                    console.log('[TTS] reprodução iniciada (HTMLAudioElement)');
                    if (onStart) onStart();
                };

                audio.onended = () => {
                    console.log('[TTS] reprodução finalizada (HTMLAudioElement)');
                    URL.revokeObjectURL(blobUrl);
                    this.currentAudio = null;
                    if (onEnd) onEnd();
                    resolve(true);
                };

                audio.onerror = (e) => {
                    console.warn('[TTS] Erro no HTMLAudioElement, tentando WebAudio fallback:', e);
                    URL.revokeObjectURL(blobUrl);
                    this.currentAudio = null;
                    resolve(false);
                };

                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        console.warn('[TTS] Autoplay bloqueado no HTMLAudio, caindo para WebAudio:', err);
                        URL.revokeObjectURL(blobUrl);
                        this.currentAudio = null;
                        resolve(false);
                    });
                }
            } catch (err) {
                console.warn('[TTS] Falha ao instanciar HTMLAudio:', err);
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
            if (!this.audioContext) return false;

            if (this.audioContext.state === 'suspended') {
                console.log('[TTS] AudioContext state antes de resume:', this.audioContext.state);
                await this.audioContext.resume();
            }
            console.log('[TTS] AudioContext state:', this.audioContext.state);

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
            console.log('[TTS] AudioBuffer criado (samples:', audioBuffer.length, 'duration:', audioBuffer.duration.toFixed(2), 's)');

            if (audioBuffer.length === 0) {
                console.warn('[TTS] AudioBuffer vazio');
                return false;
            }

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            this.currentAudioSource = source;

            source.onended = () => {
                console.log('[TTS] reprodução finalizada (WebAudio)');
                this.currentAudioSource = null;
                if (onEnd) onEnd();
            };

            console.log('[TTS] reprodução iniciada (WebAudio)');
            if (onStart) onStart();
            source.start(0);
            return true;
        } catch (e) {
            console.warn('[TTS] Falha no WebAudio playback:', e);
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

        // 1. Tentar Síntese Neural Humanizada com Gemini 2.5 Flash Preview TTS
        if (apiKey) {
            try {
                console.log('[TTS] Solicitando áudio neural para:', `"${cleanText.slice(0, 60)}..."`);
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: 'user',
                                    parts: [
                                        {
                                            text: `Fale a seguinte mensagem com tom humanizado, calmo, empático e acolhedor em português do Brasil:\n"${cleanText}"`,
                                        },
                                    ],
                                },
                            ],
                            generationConfig: {
                                responseModalities: ['AUDIO'],
                                speechConfig: {
                                    voiceConfig: {
                                        prebuiltVoiceConfig: {
                                            voiceName: 'Aoede', // Voz feminina humanizada
                                        },
                                    },
                                },
                            },
                        }),
                    }
                );

                console.log('[TTS] resposta recebida (Status:', response.status, ')');

                if (response.ok) {
                    const data = await response.json();
                    const candidate = data.candidates?.[0];
                    const audioPart = candidate?.content?.parts?.find(
                        (p: any) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
                    );

                    if (audioPart?.inlineData?.data) {
                        const mime = audioPart.inlineData.mimeType || 'audio/L16;codec=pcm;rate=24000';
                        console.log('[TTS] MIME/content-type recebido:', mime);

                        const sampleRate = mime.includes('rate=')
                            ? parseInt(mime.split('rate=')[1], 10)
                            : 24000;

                        // Decodificação Base64 -> Uint8Array
                        const binaryString = atob(audioPart.inlineData.data);
                        const pcmBytes = new Uint8Array(binaryString.length);
                        for (let i = 0; i < binaryString.length; i++) {
                            pcmBytes[i] = binaryString.charCodeAt(i);
                        }
                        console.log('[TTS] áudio base64 decodificado');
                        console.log('[TTS] tamanho do áudio em bytes:', pcmBytes.length);

                        // Criação de WAV oficial
                        const wavBuffer = createWavBuffer(pcmBytes, sampleRate, 1);

                        // Método 1: Reprodução direta via HTMLAudioElement (WAV)
                        const playedHtml = await this.playViaHtmlAudio(wavBuffer, onStart, onEnd);
                        if (playedHtml) return;

                        // Método 2: Fallback WebAudio Context
                        const playedWeb = await this.playViaWebAudio(pcmBytes, sampleRate, onStart, onEnd);
                        if (playedWeb) return;
                    }
                } else {
                    const errData = await response.json();
                    console.warn('[TTS] Gemini API retornou erro:', errData);
                }
            } catch (err) {
                console.warn('[TTS] Falha no fluxo Gemini TTS:', err);
            }
        }

        // 3. Fallback fluído via SpeechSynthesis do navegador
        console.log('[TTS] Utilizando fallback nativo SpeechSynthesis');
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.88;
            utterance.pitch = 1.05;
            utterance.volume = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const ptFemaleVoice =
                voices.find(
                    (v) =>
                        v.lang.startsWith('pt-BR') &&
                        (v.name.includes('Luciana') ||
                            v.name.includes('Francisca') ||
                            v.name.includes('Female') ||
                            v.name.includes('Helena') ||
                            v.name.includes('Google português do Brasil'))
                ) ||
                voices.find((v) => v.lang.startsWith('pt-BR')) ||
                voices.find((v) => v.lang.startsWith('pt'));

            if (ptFemaleVoice) {
                utterance.voice = ptFemaleVoice;
            }

            utterance.onstart = () => {
                if (onStart) onStart();
            };

            utterance.onend = () => {
                if (onEnd) onEnd();
            };

            utterance.onerror = () => {
                if (onEnd) onEnd();
            };

            this.currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);
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
