export const DASHBOARD_URL = 'https://itch.io/dashboard';
export const EXPORT_URL = 'https://itch.io/dashboard/export-purchases/all';

// The dashboard analytics endpoint serves per-day per-game view counts as JSON
// for same-origin XHRs. itch.io caps the range at one year.
export const analyticsUrl = (): string => {
  const day = 86_400_000;
  const fmt = (date: Date) => date.toISOString().slice(0, 10);
  return `https://itch.io/dashboard/analytics?range_left=${fmt(new Date(Date.now() - 365 * day))}&range_right=${fmt(new Date())}`;
};

export const CHALLENGE_FALLBACK_MS = 8_000;
export const REPROBE_DELAY_MS = 10_000;
export const MAX_REPROBES = 2;
export const CHALLENGE_TIMEOUT_MS = 60_000;
export const STALL_WATCHDOG_MS = 30_000;

// A fetch launched from the Cloudflare challenge page itself can restart the
// verification and trap it in a loop — the detector below is inert on purpose.
// Only interstitial markers count: Cloudflare injects a "challenge-platform"
// beacon on normal pages too, so that string must not be treated as a challenge.
export const detectScript = `
  (function () {
    var html = '';
    try { html = document.documentElement.outerHTML || ''; } catch (e) {}
    var challenge =
      (document.title || '').indexOf('Just a moment') !== -1 ||
      html.indexOf('_cf_chl_opt') !== -1;
    if (challenge) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'challenge' }));
      return;
    }
    if (location.host === 'itch.io' && location.pathname.indexOf('/login') !== -1) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'login' }));
      return;
    }
    if (location.host === 'itch.io' && location.pathname.indexOf('/dashboard') === 0) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'ready' }));
    }
  })();
  true;
`;

// Only ever injected after the detector confirmed a real dashboard page.
export const fetchScript = (target: string) => `
  (function () {
    fetch(${JSON.stringify(target)}, { credentials: 'include' })
      .then(function (r) {
        return r.text().then(function (text) {
          return {
            url: r.url,
            type: (r.headers.get('content-type') || '').toLowerCase(),
            text: text,
          };
        });
      })
      .then(function (res) {
        var challenge =
          res.text.indexOf('_cf_chl_opt') !== -1 ||
          (res.type.indexOf('text/html') !== -1 && res.text.indexOf('Just a moment') !== -1);
        if (challenge) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'fetch-blocked' }));
          return;
        }
        var isCsv =
          res.type.indexOf('csv') !== -1 ||
          (res.type.indexOf('text/plain') !== -1 && res.text.charAt(0) !== '<');
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            kind: isCsv ? 'csv' : 'page',
            url: res.url,
            csv: isCsv ? res.text : undefined,
          })
        );
      })
      .catch(function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'fetch-error' }));
      });
  })();
  true;
`;

// Same-origin fetch for dashboard endpoints that answer XHRs with JSON.
// itch.io only serves the JSON variant when the request looks like XHR —
// a plain fetch receives the full HTML page instead.
export const fetchJsonScript = (target: string) => `
  (function () {
    fetch(${JSON.stringify(target)}, {
      credentials: 'include',
      headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then(function (r) {
        return r.text().then(function (text) {
          return {
            url: r.url,
            type: (r.headers.get('content-type') || '').toLowerCase(),
            text: text,
          };
        });
      })
      .then(function (res) {
        var challenge = res.text.indexOf('_cf_chl_opt') !== -1;
        if (challenge) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'fetch-blocked' }));
          return;
        }
        var isJson = res.type.indexOf('json') !== -1 && res.text.charAt(0) === '{';
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            kind: isJson ? 'analytics' : 'page',
            url: res.url,
            payload: isJson ? res.text : undefined,
          })
        );
      })
      .catch(function () {
        window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'fetch-error' }));
      });
  })();
  true;
`;

export type SyncEngineMessage =
  | { kind: 'challenge' }
  | { kind: 'login' }
  | { kind: 'ready' }
  | { kind: 'csv'; csv: string }
  | { kind: 'analytics'; payload: string }
  | { kind: 'page'; url: string }
  | { kind: 'fetch-blocked' }
  | { kind: 'fetch-error' };
