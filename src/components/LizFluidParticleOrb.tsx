import React, { useEffect, useRef } from 'react';

interface LizFluidParticleOrbProps {
    isSpeaking: boolean;
    isListening: boolean;
    isProcessing: boolean;
    wakeWordDetected?: boolean;
    size?: number;
}

export const LizFluidParticleOrb: React.FC<LizFluidParticleOrbProps> = ({
    isSpeaking,
    isListening,
    isProcessing,
    wakeWordDetected = false,
    size = 480,
}) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;

        // Particle configuration for the 3D Fluid Noise Ring / Sphere
        const pointCount = 360;
        const layerCount = 18;

        const render = () => {
            time += isSpeaking ? 0.04 : isListening ? 0.025 : 0.015;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const baseRadius = (canvas.width / 2) * 0.45;

            // Draw multi-layered organic fluid wave ring
            for (let layer = 0; layer < layerCount; layer++) {
                const layerOffset = (layer / layerCount) * Math.PI * 2;
                const currentRadius = baseRadius + (layer - layerCount / 2) * 1.8;

                ctx.beginPath();
                ctx.lineWidth = layer === Math.floor(layerCount / 2) ? 2.5 : 1.2;

                for (let i = 0; i <= pointCount; i++) {
                    const angle = (i / pointCount) * Math.PI * 2;

                    // Perlin-style Multi-Frequency Sine Wave Noise
                    const wave1 = Math.sin(angle * 6 + time + layerOffset) * 12;
                    const wave2 = Math.cos(angle * 12 - time * 1.5) * 8;
                    const wave3 = Math.sin(angle * 18 + time * 2) * 4;

                    // Dynamic Speech / Listening Amplitude Amplification
                    const ampMultiplier = isSpeaking
                        ? 2.8 + Math.sin(time * 8) * 0.8
                        : isListening || wakeWordDetected
                        ? 1.8 + Math.sin(time * 5) * 0.4
                        : isProcessing
                        ? 1.4
                        : 0.8;

                    const totalDisplacement = (wave1 + wave2 + wave3) * ampMultiplier;
                    const r = currentRadius + totalDisplacement;

                    const x = centerX + Math.cos(angle) * r;
                    const y = centerY + Math.sin(angle) * r;

                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.closePath();

                // Dynamic Dual-Color Gradient (Neon Blue/Cyan at bottom to Orange/Red/Pink at top)
                const grad = ctx.createLinearGradient(0, centerY + baseRadius, 0, centerY - baseRadius);

                if (isSpeaking) {
                    grad.addColorStop(0, '#00F2FE'); // Electric Cyan
                    grad.addColorStop(0.3, '#3B82F6'); // Neon Blue
                    grad.addColorStop(0.7, '#FF3366'); // Hot Pink/Red
                    grad.addColorStop(1, '#FF6B00'); // Neon Orange
                } else if (isListening || wakeWordDetected) {
                    grad.addColorStop(0, '#00F2FE');
                    grad.addColorStop(0.5, '#14B8A6');
                    grad.addColorStop(1, '#38BDF8');
                } else if (isProcessing) {
                    grad.addColorStop(0, '#F59E0B');
                    grad.addColorStop(1, '#EF4444');
                } else {
                    grad.addColorStop(0, '#00C6FF');
                    grad.addColorStop(0.5, '#0072FF');
                    grad.addColorStop(1, '#FF4B2B');
                }

                ctx.strokeStyle = grad;
                ctx.globalAlpha = 0.25 + (layer / layerCount) * 0.65;
                ctx.shadowBlur = isSpeaking ? 25 : 12;
                ctx.shadowColor = layer % 2 === 0 ? '#00F2FE' : '#FF3366';
                ctx.stroke();
            }

            // Draw inner glowing core particles
            const particleCount = 40;
            for (let p = 0; p < particleCount; p++) {
                const pAngle = (p / particleCount) * Math.PI * 2 + time * 0.5;
                const pDist = baseRadius * 0.6 + Math.sin(time + p) * 20;
                const px = centerX + Math.cos(pAngle) * pDist;
                const py = centerY + Math.sin(pAngle) * pDist;

                ctx.beginPath();
                ctx.arc(px, py, Math.random() * 2 + 1, 0, Math.PI * 2);
                ctx.fillStyle = p % 2 === 0 ? '#00F2FE' : '#FF3366';
                ctx.globalAlpha = 0.8;
                ctx.fill();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isSpeaking, isListening, isProcessing, wakeWordDetected]);

    return (
        <div className="relative flex flex-col items-center justify-center select-none py-4 my-auto">
            
            {/* Ambient Background Aura */}
            <div
                className={`absolute rounded-full transition-all duration-700 blur-3xl pointer-events-none ${
                    isSpeaking
                        ? 'bg-gradient-to-r from-cyan-500 via-pink-500 to-orange-500 w-96 h-96 opacity-60 animate-pulse'
                        : isListening || wakeWordDetected
                        ? 'bg-teal-400/40 w-96 h-96 opacity-50 animate-ping'
                        : 'bg-gradient-to-r from-blue-600 to-red-500 w-80 h-80 opacity-25'
                }`}
            />

            {/* CANVAS 2D/3D FLUID MESH ORB */}
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="relative z-10 drop-shadow-[0_0_40px_rgba(0,242,254,0.5)] cursor-pointer transition-transform duration-300 hover:scale-105"
            />
        </div>
    );
};

export default LizFluidParticleOrb;
