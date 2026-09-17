/**
 * ELYON Landing Page — Redirect to static HTML landing
 *
 * The premium landing page is built as a standalone HTML experience
 * using dc-runtime. This component redirects to it while preserving
 * PWA standalone behavior (redirects to /app-paciente).
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // PWA standalone → go directly to patient app
        const isStandalone =
            (window.navigator as any).standalone ||
            window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
            navigate('/app-paciente', { replace: true });
            return;
        }

        // Normal browser → redirect to static landing page
        window.location.href = '/landing/index.html';
    }, [navigate]);

    // Brief loading state while redirecting
    return (
        <div
            className="min-h-screen bg-white flex items-center justify-center"
            style={{ fontFamily: "'Inter Tight', system-ui, sans-serif" }}
        >
            <div className="text-center">
                <p
                    className="text-[11px] tracking-[0.22em] uppercase font-medium"
                    style={{ color: '#8A94A6' }}
                >
                    Carregando...
                </p>
            </div>
        </div>
    );
};

export default Home;
