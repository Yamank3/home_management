import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, AUTH_EXPIRED_EVENT } from '../api.js';
import { tokenStore } from '../tokenStore.js';

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set when the session check failed for a reason other than "not logged in"
  // (offline, server down) so we don't bounce a signed-in user to the login page.
  const [connectError, setConnectError] = useState(false);

  useEffect(() => {
    const onExpired = () => { setUser(null); setHousehold(null); };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const loadSession = useCallback(() => {
    if (!tokenStore.hasSession()) { setLoading(false); return; }
    setLoading(true);
    setConnectError(false);
    authApi.me()
      .then(({ user, household }) => { setUser(user); setHousehold(household); })
      .catch((err) => {
        if (err.status === 401) { setUser(null); setHousehold(null); }
        else setConnectError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadSession, [loadSession]);

  const login = async (email, password) => {
    const { user, household } = await authApi.login({ email, password });
    setUser(user);
    setHousehold(household);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    setHousehold(null);
  };

  const updateUser = (updated) => setUser(updated);
  const updateHouseholdCtx = (updated) => setHousehold(updated);

  return (
    <AuthContext.Provider value={{ user, household, loading, connectError, retry: loadSession, login, logout, updateUser, updateHouseholdCtx }}>
      {children}
    </AuthContext.Provider>
  );
}
