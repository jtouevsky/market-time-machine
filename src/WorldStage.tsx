import type { ISODate } from './core/dates';
import { HistoricalShell } from './components/world/HistoricalShell';
import { EraThemeProvider } from './theme/EraThemeProvider';

export default function WorldStage({ date }: { date: ISODate }) {
  return (
    <EraThemeProvider date={date}>
      <HistoricalShell />
    </EraThemeProvider>
  );
}
