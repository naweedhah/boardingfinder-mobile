import { useColorScheme } from 'react-native';

const light = {
  background: '#F5F7FB',
  surface: '#FFFFFF',
  text: '#14213D',
  muted: '#5B6578',
  border: '#DDE3ED',
  primary: '#2F6DB5',
  primaryText: '#FFFFFF',
  danger: '#C0392B',
  success: '#1E8E5A',
  warning: '#B7791F',
  chipBg: '#E8EFF9',
  bubbleMine: '#2F6DB5',
  bubbleTheirs: '#FFFFFF',
};

const dark: typeof light = {
  background: '#0E1420',
  surface: '#182133',
  text: '#E8EDF6',
  muted: '#9AA6BC',
  border: '#2A3650',
  primary: '#5B95DB',
  primaryText: '#0E1420',
  danger: '#E5675A',
  success: '#4CC38A',
  warning: '#E0A84A',
  chipBg: '#22304A',
  bubbleMine: '#3C7BC6',
  bubbleTheirs: '#22304A',
};

export type Colors = typeof light;

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
