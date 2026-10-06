import { DatePortal } from './components/portal/DatePortal';
import { TimeTravelTransition } from './components/portal/TimeTravelTransition';
import { HistoricalShell } from './components/world/HistoricalShell';
import { SimulationProvider, useSim } from './state/simulation';
import { EraThemeProvider } from './theme/EraThemeProvider';

function Stage() {
  const { phase, date, travel } = useSim();
  const inWorld = phase === 'world' || (phase === 'traveling' && travel?.direction === 'forward');
  return (
    <>
      {phase === 'portal' || (phase === 'traveling' && travel?.direction === 'back') ? <DatePortal /> : null}
      {inWorld ? (
        <EraThemeProvider date={date}>
          <HistoricalShell />
        </EraThemeProvider>
      ) : null}
      {phase === 'traveling' ? <TimeTravelTransition /> : null}
    </>
  );
}

export default function App() {
  return (
    <SimulationProvider>
      <Stage />
    </SimulationProvider>
  );
}
