import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// NOTE: We use sessionStorage (not localStorage) for ffds_token and ffds_user
// so that each browser tab gets its own independent session.
// This allows Consumer / Manager / Driver roles to be open simultaneously
// in different tabs without their JWT tokens overwriting each other.

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('ffds_token');
    const savedUser = sessionStorage.getItem('ffds_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (newToken, newUser) => {
    sessionStorage.setItem('ffds_token', newToken);
    sessionStorage.setItem('ffds_user', JSON.stringify(newUser));
    if (newUser.language) {
      localStorage.setItem('ffds_language', newUser.language); // language preference is still shared
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    sessionStorage.removeItem('ffds_token');
    sessionStorage.removeItem('ffds_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
