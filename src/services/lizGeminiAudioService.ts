import { getInternalGeminiKey } from './geminiKey';

class LizGeminiAudioService {
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private currentAudio: HTMLAudioElement | null = null;
    private currentAudioSource: AudioBufferSourceNode | null = null;
    private audioContext: AudioContext | null = null;

    /**
     * Converts raw PCM base64 from Gemini audio modality to AudioBuffer and plays it
     */
    private async playRawPcm(
        base64Pcm: string,
        sampleRate: number = 24000,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<boolean> {
        try {
            const binaryString = atob(base64Pcm);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const int16Array = new Int16Array(bytes.buffer);
            const float32Array = new Float32Array(int16Array.length);
            for (let i = 0; i < int16Array.length; i++) {
                float32Array[i] = int16Array[i] / 32768.0;
            }

            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!this.audioContext) {
                this.audioContext = new AudioCtx({ sampleRate });
            }
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, sampleRate);
            audioBuffer.getChannelData(0).set(float32Array);

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            this.currentAudioSource = source;

            source.onended = () => {
                this.currentAudioSource = null;
                if (onEnd) onEnd();
            };

            if (onStart) onStart();
            source.start(0);
            return true;
        } catch (e) {
            console.warn('[LIZ TTS] Falha na reprodução PCM do Gemini:', e);
            return false;
        }
    }

    /**
     * Synthesizes natural, humanized speech using Gemini 2.0/2.5 Flash Speech Generation
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

        // 1. Tentar Síntese Neural Humanizada com Gemini
        if (apiKey) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [
                                {
                                    role: 'user',
                                    parts: [
                                        {
                                            text: `Fale a seguinte mensagem de forma humana, empática, acolhedora e natural em português brasileiro:\n"${cleanText}"`,
                                        },
                                    ],
                                },
                            ],
                            generationConfig: {
                                responseModalities: ['AUDIO'],
                                speechConfig: {
                                    voiceConfig: {
                                        prebuiltVoiceConfig: {
                                            voiceName: 'Aoede', // Voz feminina natural e empática
                                        },
                                    },
                                },
                            },
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const candidate = data.candidates?.[0];
                    const audioPart = candidate?.content?.parts?.find(
                        (p: any) => p.inlineData && p.inlineData.mimeType?.startsWith('audio/')
                    );

                    if (audioPart?.inlineData?.data) {
                        const mime = audioPart.inlineData.mimeType || 'audio/mp3';
                        const sampleRate = mime.includes('rate=')
                            ? parseInt(mime.split('rate=')[1], 10)
                            : 24000;

                        const played = await this.playRawPcm(
                            audioPart.inlineData.data,
                            sampleRate,
                            onStart,
                            onEnd
                        );
                        if (played) return;
                    }
                }
            } catch (err) {
                console.warn('[LIZ TTS] Fallback para sintetizador nativo:', err);
            }
        }

        // 2. Fallback fluído via SpeechSynthesis do navegador
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
