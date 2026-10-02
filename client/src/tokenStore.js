// Single owner of where session tokens live. localStorage today; a native build
// can swap this module's internals for secure storage without touching callers.
const ACCESS = 'auth.access';
const REFRESH = 'auth.refresh';

const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* storage unavailable */ } };

export const tokenStore = {
  getAccess: () => read(ACCESS),
  getRefresh: () => read(REFRESH),
  hasSession: () => !!read(REFRESH),
  set: ({ accessToken, refreshToken }) => { write(ACCESS, accessToken); write(REFRESH, refreshToken); },
  clear: () => { write(ACCESS, null); write(REFRESH, null); },
};
