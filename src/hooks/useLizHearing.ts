import { useState, useEffect, useRef, useCallback } from 'react';

// Declaration for Web Speech Recognition API
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message?: string;
}

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

export function useLizHearing(onCommandDetected?: (command: string) => void) {
    const [isListening, setIsListening] = useState<boolean>(false);
    const [wakeWordDetected, setWakeWordDetected] = useState<boolean>(false);
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const [finalTranscript, setFinalTranscript] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState<boolean>(false);

    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef<boolean>(false);
    const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('[useLizHearing] Web Speech Recognition API not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'pt-BR';

        recognition.onstart = () => {
            setIsListening(true);
            isListeningRef.current = true;
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = '';
            let finalStr = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcriptChunk = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalStr += transcriptChunk;
                } else {
                    interim += transcriptChunk;
                }
            }

            const currentText = (finalStr || interim).trim();
            setLiveTranscript(currentText);

            // Check for Wake Word ("Liz" or "Lis")
            const lowerText = currentText.toLowerCase();
            const containsWakeWord = /\bliz\b|\blis\b|ei liz|hey liz|olá liz/i.test(lowerText);

            if (containsWakeWord) {
                setWakeWordDetected(true);
            }

            // If final speech emitted
            if (finalStr.trim()) {
                setFinalTranscript(finalStr.trim());
                const cleanCommand = finalStr
                    .replace(/^(ei|hey|olá)?\s*(liz|lis)[,\s]*/i, '')
                    .trim();

                if (cleanCommand && onCommandDetected) {
                    setIsProcessing(true);
                    onCommandDetected(cleanCommand);
                    setTimeout(() => {
                        setIsProcessing(false);
                        setWakeWordDetected(false);
                        setLiveTranscript('');
                    }, 1200);
                }
            }

            // Auto silence timeout reset
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
                if (interim.trim() && containsWakeWord) {
                    const cleanCommand = interim
                        .replace(/^(ei|hey|olá)?\s*(liz|lis)[,\s]*/i, '')
                        .trim();
                    if (cleanCommand && onCommandDetected) {
                        setIsProcessing(true);
                        onCommandDetected(cleanCommand);
                        setTimeout(() => {
                            setIsProcessing(false);
                            setWakeWordDetected(false);
                            setLiveTranscript('');
                        }, 1200);
                    }
                }
            }, 1800);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            if (event.error !== 'no-speech') {
                console.warn('[useLizHearing] Speech Recognition Error:', event.error);
            }
        };

        recognition.onend = () => {
            // Auto-restart continuous listening if still enabled
            if (isListeningRef.current) {
                try {
                    recognition.start();
                } catch (err) {
                    // Ignore start collisions
                }
            } else {
                setIsListening(false);
                setWakeWordDetected(false);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            isListeningRef.current = false;
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {}
            }
        };
    }, [onCommandDetected]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        try {
            isListeningRef.current = true;
            setIsListening(true);
            recognitionRef.current.start();
        } catch (e) {
            // Already started
        }
    }, []);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        setIsListening(false);
        setWakeWordDetected(false);
        setLiveTranscript('');
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {}
        }
    }, []);

    const toggleListening = useCallback(() => {
        if (isListeningRef.current) {
            stopListening();
        } else {
            startListening();
        }
    }, [startListening, stopListening]);

    return {
        isListening,
        wakeWordDetected,
        liveTranscript,
        finalTranscript,
        isProcessing,
        startListening,
        stopListening,
        toggleListening,
    };
}
