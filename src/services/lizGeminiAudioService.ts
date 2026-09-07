// LIZ Voice Service — Edge TTS Neural (via API serverless)
// Prioridade: Edge TTS Francisca Neural com retry automático

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

class LizGeminiAudioService {
    private currentAudio: HTMLAudioElement | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private audioQueue: string[] = [];
    private isPlaying = false;
    private requestId = 0;

    /**
     * Método mantido para compatibilidade
     */
    public unlockAudioContext() {
        // No-op
    }

    /**
     * Reprodução de voz neural humanizada
     * Tenta Edge TTS com retry, só usa fallback como último recurso
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

        // ID único para esta requisição — se outra vier enquanto esta está pendente, cancelar
        const myId = ++this.requestId;

        emitTtsLog(`Preparando fala: "${cleanText.slice(0, 60)}..."`, 'info');

        // Tentar Edge TTS com até 2 tentativas
        for (let attempt = 1; attempt <= 2; attempt++) {
            if (this.requestId !== myId) {
                emitTtsLog('Requisição cancelada (nova fala solicitada)', 'info');
                return;
            }

            const success = await this.tryEdgeTts(cleanText, onStart, onEnd, attempt);
            if (success) return;

            if (attempt < 2) {
                emitTtsLog(`Tentativa ${attempt} falhou, retentando...`, 'warn');
                // Pequeno delay antes do retry
                await new Promise((r) => setTimeout(r, 500));
            }
        }

        // Se chegou aqui, Edge TTS falhou 2 vezes — usar fallback
        if (this.requestId !== myId) return;
        emitTtsLog('Edge TTS indisponível, usando voz do navegador', 'warn');
        this.fallbackWebSpeech(cleanText, onStart, onEnd);
    }

    /**
     * Chama a API serverless /api/tts que usa Edge TTS Francisca Neural
     */
    private async tryEdgeTts(
        text: string,
        onStart?: () => void,
        onEnd?: () => void,
        attempt: number = 1
    ): Promise<boolean> {
        try {
            emitTtsLog(`[Tentativa ${attempt}] Solicitando Francisca Neural...`, 'info');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    voice: 'pt-BR-FranciscaNeural',
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                emitTtsLog(`API retornou ${response.status}: ${errData.error || response.statusText}`, 'warn');
                return false;
            }

            const data = await response.json();

            if (!data.success || !data.audio) {
                emitTtsLog('API não retornou áudio', 'warn');
                return false;
            }

            emitTtsLog(`Áudio recebido (${data.audioSize} bytes)`, 'success');

            // Reproduzir o MP3
            return await this.playMp3Base64(data.audio, onStart, onEnd);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                emitTtsLog(`Timeout na tentativa ${attempt} (20s)`, 'warn');
            } else {
                emitTtsLog(`Erro na tentativa ${attempt}: ${err.message}`, 'warn');
            }
            return false;
        }
    }

    /**
     * Reproduz áudio MP3 em base64 via HTMLAudioElement
     * Usa preload e canplaythrough para garantir reprodução confiável
     */
    private playMp3Base64(
        base64Audio: string,
        onStart?: () => void,
        onEnd?: () => void
    ): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                // Parar qualquer áudio anterior
                if (this.currentAudio) {
                    this.currentAudio.pause();
                    this.currentAudio.removeAttribute('src');
                    this.currentAudio.load();
                    this.currentAudio = null;
                }

                const audio = new Audio();
                this.currentAudio = audio;

                // Configurar antes de definir o src
                audio.preload = 'auto';
                audio.volume = 1.0;

                let started = false;
                let resolved = false;

                const cleanup = () => {
                    if (resolved) return;
                    resolved = true;
                    this.currentAudio = null;
                };

                audio.oncanplaythrough = () => {
                    if (started) return;
                    started = true;
                    emitTtsLog('🔊 Áudio carregado, iniciando reprodução...', 'info');

                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise
                            .then(() => {
                                emitTtsLog('🔊 Reprodução iniciada (Francisca Neural)', 'success');
                                if (onStart) onStart();
                            })
                            .catch((err) => {
                                emitTtsLog(`Autoplay bloqueado: ${err.message}`, 'warn');
                                cleanup();
                                // Tentar reprodução com gesto do usuário
                                this.tryPlayWithUserGesture(audio, onStart, onEnd, resolve);
                            });
                    }
                };

                audio.onended = () => {
                    emitTtsLog('✅ Reprodução concluída', 'success');
                    cleanup();
                    if (onEnd) onEnd();
                    resolve(true);
                };

                audio.onerror = (e) => {
                    const error = audio.error;
                    emitTtsLog(`Erro no player: ${error?.message || 'desconhecido'} (code: ${error?.code})`, 'error');
                    cleanup();
                    if (onEnd) onEnd();
                    resolve(false);
                };

                // Timeout de segurança — se não reproduzir em 10s, considerar falha
                const safetyTimeout = setTimeout(() => {
                    if (!started && !resolved) {
                        emitTtsLog('Timeout ao carregar áudio (10s)', 'warn');
                        cleanup();
                        resolve(false);
                    }
                }, 10000);

                audio.addEventListener('ended', () => clearTimeout(safetyTimeout), { once: true });
                audio.addEventListener('canplaythrough', () => clearTimeout(safetyTimeout), { once: true });

                // Definir source — isso dispara o carregamento
                audio.src = `data:audio/mpeg;base64,${base64Audio}`;
                audio.load();

            } catch (err: any) {
                emitTtsLog(`Falha ao criar player: ${err.message}`, 'error');
                resolve(false);
            }
        });
    }

    /**
     * Em caso de autoplay bloqueado, espera um gesto do usuário para reproduzir
     */
    private tryPlayWithUserGesture(
        audio: HTMLAudioElement,
        onStart?: () => void,
        onEnd?: () => void,
        resolve?: (value: boolean) => void
    ) {
        emitTtsLog('Aguardando interação do usuário para reproduzir...', 'info');

        const playOnGesture = () => {
            audio.play()
                .then(() => {
                    emitTtsLog('🔊 Reprodução iniciada após gesto', 'success');
                    if (onStart) onStart();

                    audio.onended = () => {
                        emitTtsLog('✅ Reprodução concluída', 'success');
                        if (onEnd) onEnd();
                        if (resolve) resolve(true);
                    };
                })
                .catch(() => {
                    if (onEnd) onEnd();
                    if (resolve) resolve(false);
                });

            // Remover listeners
            document.removeEventListener('click', playOnGesture);
            document.removeEventListener('touchstart', playOnGesture);
        };

        document.addEventListener('click', playOnGesture, { once: true });
        document.addEventListener('touchstart', playOnGesture, { once: true });

        // Timeout — se não clicar em 5s, desistir
        setTimeout(() => {
            document.removeEventListener('click', playOnGesture);
            document.removeEventListener('touchstart', playOnGesture);
            if (onEnd) onEnd();
            if (resolve) resolve(false);
        }, 5000);
    }

    /**
     * Fallback: Web Speech API (só se Edge TTS falhar completamente)
     */
    private fallbackWebSpeech(
        text: string,
        onStart?: () => void,
        onEnd?: () => void
    ) {
        if (!('speechSynthesis' in window)) {
            emitTtsLog('Web Speech API não disponível', 'error');
            if (onEnd) onEnd();
            return;
        }

        window.speechSynthesis.cancel();

        const doSpeak = () => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 0.92;
            utterance.pitch = 1.08;
            utterance.volume = 1.0;

            const voices = window.speechSynthesis.getVoices();
            const ptVoice = voices.find((v) => v.lang.startsWith('pt-BR')) || voices.find((v) => v.lang.startsWith('pt'));
            if (ptVoice) {
                utterance.voice = ptVoice;
                emitTtsLog(`Voz fallback: "${ptVoice.name}"`, 'info');
            }

            utterance.onstart = () => {
                emitTtsLog('🔊 Reprodução (Web Speech)', 'info');
                if (onStart) onStart();
            };

            utterance.onend = () => {
                emitTtsLog('✅ Concluída (Web Speech)', 'success');
                this.currentUtterance = null;
                if (onEnd) onEnd();
            };

            utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
                if (e.error !== 'interrupted' && e.error !== 'canceled') {
                    emitTtsLog(`Erro Web Speech: ${e.error}`, 'error');
                }
                this.currentUtterance = null;
                if (onEnd) onEnd();
            };

            this.currentUtterance = utterance;
            window.speechSynthesis.speak(utterance);
        };

        if (window.speechSynthesis.getVoices().length > 0) {
            doSpeak();
        } else {
            window.speechSynthesis.onvoiceschanged = () => doSpeak();
        }
    }

    public stop() {
        // Cancelar qualquer requisição pendente
        this.requestId++;

        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.removeAttribute('src');
            this.currentAudio.load();
            this.currentAudio = null;
        }
        this.currentUtterance = null;
    }
}

export const lizGeminiAudioService = new LizGeminiAudioService();
export default lizGeminiAudioService;
