import { useCallback, useEffect, useRef, useState } from 'react';
import { friendlyError } from '../lib/errors';

/**
 * Ejecuta una carga asíncrona y expone { data, loading, error, reload }.
 * Ignora respuestas de cargas anteriores (evita condiciones de carrera al cambiar de página).
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const callId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(async () => {
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await run();
      if (id === callId.current) setState({ data, loading: false, error: null });
    } catch (e) {
      console.error(e);
      if (id === callId.current) setState({ data: null, loading: false, error: friendlyError(e) });
    }
  }, [run]);

  useEffect(() => { reload(); }, [reload]);

  return { ...state, reload };
}
