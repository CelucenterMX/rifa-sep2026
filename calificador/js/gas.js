import { GAS_URL } from './config.js';

/**
 * Calls the GAS backend via JSONP.
 * Returns a Promise that resolves with the response data.
 */
export function gasCall(params, timeoutMs = 9000) {
  return new Promise((resolve, reject) => {
    const cbName = `_gas_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tid    = setTimeout(() => {
      delete window[cbName];
      reject(new Error('timeout'));
    }, timeoutMs);

    window[cbName] = data => {
      clearTimeout(tid);
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
