class LizGeminiAudioService {
    private currentUtterance: SpeechSynthesisUtterance | null = null;

    /**
     * High-Fidelity Fluid Speech Engine matching UPA Reception Panel (rate: 0.82, pitch: 1.0)
     */
    public playNeuralSpeech(
        text: string,
        onStart?: () => void,
        onEnd?: () => void
    ): void {
        this.stop();

        const cleanText = text
            .replace(/[*#_>]/g, '')
            .replace(/[:;]/g, ',')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanText || typeof window === 'undefined' || !('speechSynthesis' in window)) {
            if (onEnd) onEnd();
            return;
        }

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.82; // Calibrated fluid pace matching UPA reception call panel
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const ptVoice =
            voices.find((v) => v.lang.startsWith('pt-BR')) ||
            voices.find((v) => v.lang.startsWith('pt'));

        if (ptVoice) {
            utterance.voice = ptVoice;
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
    }

    public stop() {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        this.currentUtterance = null;
    }
}

export const lizGeminiAudioService = new LizGeminiAudioService();
export default lizGeminiAudioService;
