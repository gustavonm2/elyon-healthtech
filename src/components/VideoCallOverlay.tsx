import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Maximize, Minimize, GripHorizontal } from 'lucide-react';

interface VideoCallOverlayProps {
    patientName: string;
    onClose: () => void;
}

const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({ patientName, onClose }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    return (
        <div className={`fixed z-50 transition-all duration-300 shadow-[0_12px_48px_rgba(0,0,0,0.25)] bg-[#0F172A] rounded-2xl overflow-hidden border border-gray-700 flex flex-col ${isMinimized
                ? 'bottom-6 right-6 w-64 h-auto'
                : 'bottom-6 right-6 w-80 sm:w-96 sm:right-10 h-[500px]'
            }`}>
            {/* Draggable Handle & Controls */}
            <div className="bg-gray-900/80 px-4 py-2 flex items-center justify-between cursor-move">
                <div className="flex items-center text-gray-300">
                    <GripHorizontal className="w-4 h-4 mr-2" />
                    <span className="text-xs font-semibold tracking-wider capitalize">Telemedicina</span>
                </div>
                <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    {isMinimized ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
                </button>
            </div>

            {!isMinimized && (
                <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
                    {/* Main Camera (Patient) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {/* Paciente Mock - placeholder */}
                        <div className="h-28 w-28 rounded-full bg-gray-800 flex items-center justify-center text-4xl font-bold text-gray-500 shadow-inner">
                            {patientName.charAt(0)}
                        </div>
                    </div>

                    <div className="absolute top-4 left-4 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm z-10 flex items-center">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                        <span className="text-white text-xs font-medium">{patientName}</span>
                    </div>

                    {/* Self Camera (Doctor) PIP */}
                    <div className={`absolute bottom-20 right-4 w-24 h-32 bg-gray-800 rounded-lg border-2 border-gray-700 shadow-lg overflow-hidden flex items-center justify-center transition-all ${isVideoOff ? 'opacity-80' : ''}`}>
                        {isVideoOff ? (
                            <VideoOff className="w-6 h-6 text-gray-500" />
                        ) : (
                            <div className="text-white text-xs text-center p-2 opacity-50">Sua Câmera</div>
                        )}
                    </div>
                </div>
            )}

            {/* Action Bar */}
            <div className="bg-gray-900 px-4 py-4 flex items-center justify-center gap-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-gray-800 text-white hover:bg-gray-700'
                        }`}
                >
                    {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
                <button
                    onClick={onClose}
                    className="h-12 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg shadow-red-500/20"
                >
                    <PhoneOff className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default VideoCallOverlay;
