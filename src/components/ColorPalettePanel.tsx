import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import type { ColorPalette } from '../contexts/ThemeContext';

interface Props {
  onClose: () => void;
  onGestorMasterAccess?: () => void;
}

const ColorPalettePanel: React.FC<Props> = ({ onClose, onGestorMasterAccess }) => {
  const { activePalette, setPalette, palettes } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className="fixed bottom-20 right-4 z-50 w-[300px] rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)',
          border: '1px solid rgba(0,0,0,0.07)',
          animation: 'sciPaletteSlideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header gradient */}
        <div
          className="px-4 py-3.5 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)',
          }}
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-white opacity-90" />
            <span className="text-white font-bold text-[13px] tracking-wide">Paleta de Cores</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-opacity p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="px-4 pt-2.5 pb-1 text-[11px] text-slate-400 font-medium">
          Selecione o esquema de cores do sistema
        </p>

        {/* Palette list */}
        <div className="px-2 pb-2 space-y-0.5 max-h-[400px] overflow-y-auto">
          {palettes.map((palette: ColorPalette) => {
            const isActive = palette.id === activePalette.id;
            return (
              <button
                key={palette.id}
                onClick={() => setPalette(palette.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group"
                style={{
                  background: isActive ? 'var(--color-primary-light)' : 'transparent',
                  border: `1.5px solid ${isActive ? 'var(--color-primary-ring)' : 'transparent'}`,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {/* Swatches */}
                <div className="flex items-center flex-shrink-0">
                  {palette.swatches.map((color, i) => (
                    <div
                      key={i}
                      className="rounded-full border border-black/10"
                      style={{
                        width: i === 0 ? 18 : 13,
                        height: i === 0 ? 18 : 13,
                        background: color,
                        marginLeft: i > 0 ? -4 : 0,
                        marginTop: i === 0 ? 0 : 2,
                        zIndex: 3 - i,
                        position: 'relative',
                      }}
                    />
                  ))}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[12px]">{palette.emoji}</span>
                    <span
                      className="text-[12px] font-bold truncate"
                      style={{ color: isActive ? 'var(--color-primary)' : '#334155' }}
                    >
                      {palette.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium truncate">{palette.description}</p>
                </div>

                {/* Check indicator */}
                <div
                  className="w-4.5 h-4.5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    width: 18,
                    height: 18,
                    background: isActive ? 'var(--color-primary)' : 'transparent',
                    border: isActive ? 'none' : '1.5px solid #CBD5E1',
                  }}
                >
                  {isActive && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        {onGestorMasterAccess && (
          <div className="border-t border-slate-100 px-4 py-2.5">
            <button
              onClick={onGestorMasterAccess}
              className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              Acessar Gestão Master →
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes sciPaletteSlideUp {
          from { opacity: 0; transform: translateY(14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default ColorPalettePanel;
