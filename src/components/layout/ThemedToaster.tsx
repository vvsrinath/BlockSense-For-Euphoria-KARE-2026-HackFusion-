import { Toaster } from 'sonner';
import { useSettings } from '../../contexts/SettingsContext';

export function ThemedToaster() {
  const { resolvedTheme } = useSettings();
  return <Toaster theme={resolvedTheme} position="bottom-right" richColors={false} closeButton duration={2800} offset={88} />;
}