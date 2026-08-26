import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ColorPalette {
  id: string;
  name: string;
  emoji: string;
  description: string;
  swatches: string[];
  variables: Record<string, string>;
}

export const PALETTES: ColorPalette[] = [
  {
    id: 'blue-clinical',
    name: 'Azul Clínico',
    emoji: '🔵',
    description: 'Padrão corporativo médico',
    swatches: ['#1D3461', '#2C4E6E', '#EEF4FA'],
    variables: {
      '--color-primary':         '#1D3461',
      '--color-primary-hover':   '#162749',
      '--color-primary-light':   '#EEF4FA',
      '--color-primary-ring':    '#A8C4DA',
      '--color-primary-text':    '#162749',
      '--color-accent':          '#2C4E6E',
      '--color-sidebar-bg':      '#FFFFFF',
      '--color-sidebar-border':  '#E2E8F0',
      '--color-sidebar-logo-bg': '#1D3461',
      '--color-sidebar-text':    '#475569',
      '--color-page-bg':         '#F1F5F9',
      '--color-login-bg':        '#F8FAFC',
      '--color-card-bg':         '#FFFFFF',
      '--color-nav-active-bg':   '#EEF4FA',
      '--color-nav-active-text': '#1D3461',
      '--color-nav-icon':        '#64748B',
      '--color-text-primary':    '#0F172A',
      '--color-text-secondary':  '#475569',
      '--color-text-muted':      '#64748B',
      '--color-border':          '#E2E8F0',
      '--color-border-light':    '#F1F5F9',
      '--color-surface':         '#F8FAFC',
    },
  },
  {
    id: 'azul-noturno',
    name: 'Azul Noturno',
    emoji: '🌌',
    description: 'Inspirado no céu noturno estrelado',
    swatches: ['#243B55', '#2C4E6E', '#EEF4FA'],
    variables: {
      '--color-primary':         '#243B55',
      '--color-primary-hover':   '#1A2E42',
      '--color-primary-light':   '#EEF4FA',
      '--color-primary-ring':    '#A8C4DA',
      '--color-primary-text':    '#1A2E42',
      '--color-accent':          '#2C4E6E',
      '--color-sidebar-bg':      '#FFFFFF',
      '--color-sidebar-border':  '#D6E4EE',
      '--color-sidebar-logo-bg': '#243B55',
      '--color-sidebar-text':    '#3D566E',
      '--color-page-bg':         '#F0F5F9',
      '--color-login-bg':        '#F5F8FB',
      '--color-card-bg':         '#FFFFFF',
      '--color-nav-active-bg':   '#EEF4FA',
      '--color-nav-active-text': '#243B55',
      '--color-nav-icon':        '#6B8FA8',
      '--color-text-primary':    '#0D1E2D',
      '--color-text-secondary':  '#3D566E',
      '--color-text-muted':      '#6B8FA8',
      '--color-border':          '#D6E4EE',
      '--color-border-light':    '#EEF4FA',
      '--color-surface':         '#F5F8FB',
    },
  },
  {
    id: 'navy',
    name: 'Azul Marinho',
    emoji: '🌊',
    description: 'Profissional e confiável',
    swatches: ['#1E3A5F', '#2D5A8E', '#EEF4FF'],
    variables: {
      '--color-primary':         '#1E3A5F',
      '--color-primary-hover':   '#162D4A',
      '--color-primary-light':   '#EEF4FF',
      '--color-primary-ring':    '#BFCFEF',
      '--color-primary-text':    '#EEF4FF',
      '--color-accent':          '#2D5A8E',
      '--color-sidebar-bg':      '#162D4A',
      '--color-sidebar-border':  '#1E3A5F',
      '--color-sidebar-logo-bg': '#1E3A5F',
      '--color-sidebar-text':    '#CBD5E1',
      '--color-page-bg':         '#EEF2F7',
      '--color-login-bg':        '#EEF2F7',
      '--color-card-bg':         '#FFFFFF',
      '--color-nav-active-bg':   '#1E3A5F',
      '--color-nav-active-text': '#FFFFFF',
      '--color-nav-icon':        '#94A3B8',
      '--color-text-primary':    '#0F172A',
      '--color-text-secondary':  '#475569',
      '--color-text-muted':      '#64748B',
      '--color-border':          '#D0D9E8',
      '--color-border-light':    '#E8EEF5',
      '--color-surface':         '#F4F7FC',
    },
  },
  {
    id: 'sage-green',
    name: 'Verde Sage',
    emoji: '🌿',
    description: 'Saúde e bem-estar',
    swatches: ['#059669', '#34D399', '#ECFDF5'],
    variables: {
      '--color-primary':         '#059669',
      '--color-primary-hover':   '#047857',
      '--color-primary-light':   '#ECFDF5',
      '--color-primary-ring':    '#A7F3D0',
      '--color-primary-text':    '#065F46',
      '--color-accent':          '#10B981',
      '--color-sidebar-bg':      '#FFFFFF',
      '--color-sidebar-border':  '#D1FAE5',
      '--color-sidebar-logo-bg': '#059669',
      '--color-sidebar-text':    '#065F46',
      '--color-page-bg':         '#F0FDF4',
      '--color-login-bg':        '#F0FDF4',
      '--color-card-bg':         '#FFFFFF',
      '--color-nav-active-bg':   '#ECFDF5',
      '--color-nav-active-text': '#059669',
      '--color-nav-icon':        '#6EE7B7',
      '--color-text-primary':    '#064E3B',
      '--color-text-secondary':  '#065F46',
      '--color-text-muted':      '#6B7280',
      '--color-border':          '#D1FAE5',
      '--color-border-light':    '#ECFDF5',
      '--color-surface':         '#F0FDF4',
    },
  },
  {
    id: 'forest-green',
    name: 'Verde Floresta',
    emoji: '🌲',
    description: 'Natureza e solidez',
    swatches: ['#166534', '#15803D', '#DCFCE7'],
    variables: {
      '--color-primary':         '#166534',
      '--color-primary-hover':   '#14532D',
      '--color-primary-light':   '#DCFCE7',
      '--color-primary-ring':    '#86EFAC',
      '--color-primary-text':    '#DCFCE7',
      '--color-accent':          '#15803D',
      '--color-sidebar-bg':      '#14532D',
      '--color-sidebar-border':  '#166534',
      '--color-sidebar-logo-bg': '#166534',
      '--color-sidebar-text':    '#BBF7D0',
      '--color-page-bg':         '#F0FDF4',
      '--color-login-bg':        '#F0FDF4',
      '--color-card-bg':         '#FFFFFF',
      '--color-nav-active-bg':   '#166534',
      '--color-nav-active-text': '#FFFFFF',
      '--color-nav-icon':        '#86EFAC',
      '--color-text-primary':    '#14532D',
      '--color-text-secondary':  '#166534',
      '--color-text-muted':      '#4B7A5A',
      '--color-border':          '#BBF7D0',
      '--color-border-light':    '#DCFCE7',
      '--color-surface':         '#F0FDF4',
    },
  },
  {
    id: 'beige-nude',
    name: 'Bege & Nude',
    emoji: '🪵',
    description: 'Acolhedor e elegante',
    swatches: ['#A07850', '#C9A87C', '#FAF7F2'],
    variables: {
      '--color-primary':         '#A07850',
      '--color-primary-hover':   '#8A6440',
      '--color-primary-light':   '#FAF7F2',
      '--color-primary-ring':    '#E8D5B7',
      '--color-primary-text':    '#8A6440',
      '--color-accent':          '#C9A87C',
      '--color-sidebar-bg':      '#FAF7F2',
      '--color-sidebar-border':  '#E8D5B7',
      '--color-sidebar-logo-bg': '#A07850',
      '--color-sidebar-text':    '#6B4C35',
      '--color-page-bg':         '#F5F0E8',
      '--color-login-bg':        '#FAF7F2',
      '--color-card-bg':         '#FEFCF9',
      '--color-nav-active-bg':   '#F0E8DB',
      '--color-nav-active-text': '#A07850',
      '--color-nav-icon':        '#C9A87C',
      '--color-text-primary':    '#3D2B1F',
      '--color-text-secondary':  '#6B4C35',
      '--color-text-muted':      '#9C7B5C',
      '--color-border':          '#E8D5B7',
      '--color-border-light':    '#F0E8DB',
      '--color-surface':         '#FAF7F2',
    },
  },
  {
    id: 'modern-purple',
    name: 'Roxo Moderno',
    emoji: '💜',
    description: 'Inovação & tendência 2024',
    swatches: ['#7C3AED', '#A855F7', '#F5F3FF'],
    variables: {
      '--color-primary':         '#7C3AED',
      '--color-primary-hover':   '#6D28D9',
      '--color-primary-light':   '#F5F3FF',
      '--color-primary-ring':    '#DDD6FE',
      '--color-primary-text':    '#6D28D9',
      '--color-accent':          '#A855F7',
      '--color-sidebar-bg':      '#FFFFFF',
      '--color-sidebar-border':  '#EDE9FE',
      '--color-sidebar-logo-bg': '#7C3AED',
      '--color-sidebar-text':    '#4C1D95',
      '--color-page-bg':         '#FAF9FF',
      '--color-login-bg':        '#FAFBFF',
      '--color-card-bg':         '#FFFFFF',
      '--color-nav-active-bg':   '#F5F3FF',
      '--color-nav-active-text': '#7C3AED',
      '--color-nav-icon':        '#A78BFA',
      '--color-text-primary':    '#1E1B4B',
      '--color-text-secondary':  '#4C1D95',
      '--color-text-muted':      '#6D28D9',
      '--color-border':          '#EDE9FE',
      '--color-border-light':    '#F5F3FF',
      '--color-surface':         '#FAFBFF',
    },
  },
  {
    id: 'graphite',
    name: 'Grafite Premium',
    emoji: '🖤',
    description: 'Enterprise e sofisticado',
    swatches: ['#1E293B', '#334155', '#F1F5F9'],
    variables: {
      '--color-primary':         '#334155',
      '--color-primary-hover':   '#1E293B',
      '--color-primary-light':   '#F1F5F9',
      '--color-primary-ring':    '#CBD5E1',
      '--color-primary-text':    '#F1F5F9',
      '--color-accent':          '#475569',
      '--color-sidebar-bg':      '#1E293B',
      '--color-sidebar-border':  '#334155',
      '--color-sidebar-logo-bg': '#334155',
      '--color-sidebar-text':    '#CBD5E1',
      '--color-page-bg':         '#F1F5F9',
      '--color-login-bg':        '#F1F5F9',
      '--color-card-bg':         '#FFFFFF',
      '--color-nav-active-bg':   '#334155',
      '--color-nav-active-text': '#FFFFFF',
      '--color-nav-icon':        '#94A3B8',
      '--color-text-primary':    '#0F172A',
      '--color-text-secondary':  '#334155',
      '--color-text-muted':      '#64748B',
      '--color-border':          '#CBD5E1',
      '--color-border-light':    '#E2E8F0',
      '--color-surface':         '#F8FAFC',
    },
  },
];

const DEFAULT_PALETTE_ID = 'blue-clinical';

interface ThemeContextType {
  activePalette: ColorPalette;
  setPalette: (id: string) => void;
  palettes: ColorPalette[];
}

const ThemeContext = createContext<ThemeContextType>({
  activePalette: PALETTES[0],
  setPalette: () => {},
  palettes: PALETTES,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [paletteId, setPaletteId] = useState<string>(() => {
    return localStorage.getItem('sci-theme') || DEFAULT_PALETTE_ID;
  });

  const activePalette = PALETTES.find(p => p.id === paletteId) || PALETTES[0];

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(activePalette.variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    localStorage.setItem('sci-theme', paletteId);
  }, [paletteId, activePalette]);

  return (
    <ThemeContext.Provider value={{ activePalette, setPalette: setPaletteId, palettes: PALETTES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
