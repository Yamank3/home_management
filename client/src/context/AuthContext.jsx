import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api.js';

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

  useEffect(() => {
    authApi.me()
      .then(({ user, household }) => { setUser(user); setHousehold(household); })
      .catch(() => { setUser(null); setHousehold(null); })
      .finally(() => setLoading(false));
  }, []);

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
    <AuthContext.Provider value={{ user, household, loading, login, logout, updateUser, updateHouseholdCtx }}>
      {children}
    </AuthContext.Provider>
  );
}
