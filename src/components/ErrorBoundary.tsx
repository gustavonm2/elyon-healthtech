import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0F172A] text-slate-100 p-8 flex items-center justify-center font-sans">
                    <div className="max-w-2xl w-full bg-slate-900 border border-rose-600/60 rounded-2xl p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-lg">
                                ⚠️
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-rose-400">
                                    {this.props.fallbackTitle || 'Erro ao Renderizar Componente'}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Capturado pelo ErrorBoundary do ELYON System
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono text-rose-300 overflow-x-auto">
                            <p className="font-bold">{this.state.error?.toString()}</p>
                            {this.state.errorInfo?.componentStack && (
                                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                                    {this.state.errorInfo.componentStack}
                                </pre>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition"
                        >
                            Recarregar Página
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
