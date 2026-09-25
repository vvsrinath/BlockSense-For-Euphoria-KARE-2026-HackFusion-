export interface ChartPalette {
  incoming: string;
  outgoing: string;
  grid: string;
  axis: string;
  surface: string;
  ink: string;
}

export const chartPalette: Record<'light' | 'dark', ChartPalette> = {
  light: { incoming: '#2563EB', outgoing: '#06B6D4', grid: '#E5EAF1', axis: '#64748B', surface: '#FFFFFF', ink: '#111827' },
  dark: { incoming: '#3B82F6', outgoing: '#22D3EE', grid: '#1E293B', axis: '#94A3B8', surface: '#111827', ink: '#F8FAFC' }
};