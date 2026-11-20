import { useMemo } from 'react';
import { resolveInitialArcadeRoute } from './arcade/gamesCatalog';
import { ArcadePortal } from './components/ArcadePortal';

export default function App() {
  const initialRoute = useMemo(() => {
    if (typeof window === 'undefined') {
      return { activeGameId: null, autoStartTiltedPines: false };
    }
    return resolveInitialArcadeRoute(window.location.search);
  }, []);

  return (
    <ArcadePortal
      initialGameId={initialRoute.activeGameId}
      autoStartTiltedPines={initialRoute.autoStartTiltedPines}
    />
  );
}
