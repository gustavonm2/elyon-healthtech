import { useState, useEffect, useCallback, useRef } from 'react';

export function useLizVoice() {
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);

    const speak = useCallback(
        (text: string) => {
            if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
                setIsSpeaking(true);
                setTimeout(() => setIsSpeaking(false), 3000);
                return;
            }

            window.speechSynthesis.cancel();

            const cleanText = text
                .replace(/[*#_>]/g, '')
                .replace(/[:;]/g, ',')
                .replace(/\s+/g, ' ')
                .trim();

            if (!cleanText) return;

            const buildAndSpeak = () => {
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

                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);

                window.speechSynthesis.speak(utterance);
            };

            if (window.speechSynthesis.getVoices().length > 0) {
                buildAndSpeak();
            } else {
                window.speechSynthesis.onvoiceschanged = buildAndSpeak;
            }
        },
        [isMuted]
    );

    const cancel = useCallback(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
            }
            return next;
        });
    }, []);

    return {
        isSpeaking,
        isMuted,
        toggleMute,
        speak,
        cancel,
    };
}
