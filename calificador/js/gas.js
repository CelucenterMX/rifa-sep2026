import { GAS_URL } from './config.js';

/**
 * Calls the GAS backend via JSONP.
 * Returns a Promise that resolves with the response data.
 */
export function gasCall(params, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const cbName = `_gas_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    let settled  = false;

    const tid = setTimeout(() => {
      settled = true;
      reject(new Error('timeout'));
      // No borrar window[cbName] — si GAS llega tarde que sea no-op, no error
    }, timeoutMs);

    window[cbName] = data => {
      if (settled) { delete window[cbName]; return; } // llegó tarde, ignorar
      clearTimeout(tid);
      settled = true;
      delete window[cbName];
      resolve(data);
    };

    const qs = new URLSearchParams({ ...params, callback: cbName }).toString();
    const s  = document.createElement('script');
    s.onerror = () => {
      clearTimeout(tid);
      delete window[cbName];
      reject(new Error('network'));
    };
    s.src = `${GAS_URL}?${qs}`;
    document.head.appendChild(s);
    s.addEventListener('load', () => {
      try { document.head.removeChild(s); } catch {}
    });
  });
}
