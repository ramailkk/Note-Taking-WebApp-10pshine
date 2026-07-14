import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNote } from "../Components/NoteContext.js";

const AuthContext = createContext();

const isTokenValid = (token) => {
  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;
    return decoded.exp > now;
  } catch (e) {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const savedToken = localStorage.getItem("token");
    return savedToken ? isTokenValid(savedToken) : false;
  });

  const { resetNoteContext } = useNote();

  // Logout function
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("activeSection");
    resetNoteContext();
    setToken(null);
    setIsLoggedIn(false);
  };

  // Schedule auto logout based on token expiry
  useEffect(() => {
    if (!token) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const expiryTime = decoded.exp * 1000; // exp is in seconds
      const now = Date.now();
      const timeout = expiryTime - now;

      if (timeout <= 0) {
        logout();
        return;
      }

      setIsLoggedIn(true);

      // Set a timer to logout at expiry
      const timer = setTimeout(() => {
        logout();
      }, timeout);

      return () => clearTimeout(timer);
    } catch (e) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setIsLoggedIn(true);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
