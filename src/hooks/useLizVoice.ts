import { useState, useCallback } from 'react';
import { lizGeminiAudioService } from '../services/lizGeminiAudioService';

export function useLizVoice() {
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [isMuted, setIsMuted] = useState<boolean>(false);

    const speak = useCallback(
        (text: string) => {
            if (isMuted || typeof window === 'undefined') {
                setIsSpeaking(true);
                setTimeout(() => setIsSpeaking(false), 2500);
                return;
            }

            lizGeminiAudioService.playNeuralSpeech(
                text,
                () => setIsSpeaking(true),
                () => setIsSpeaking(false)
            );
        },
        [isMuted]
    );

    const cancel = useCallback(() => {
        lizGeminiAudioService.stop();
        setIsSpeaking(false);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (next) {
                lizGeminiAudioService.stop();
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
