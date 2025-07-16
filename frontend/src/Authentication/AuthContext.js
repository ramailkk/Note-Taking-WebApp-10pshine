import { createContext, useContext, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode"; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000; // in seconds
      return decoded.exp > now;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
  const checkAndRefreshToken = async () => {
    if (!token || isTokenValid(token)) return;

    try {
      const res = await fetch("http://localhost:5000/auth/refresh", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        login(data.token);
      } else {
        logout();
      }
    } catch (err) {
      console.error("Token refresh error:", err);
      logout();
    }
  };

  checkAndRefreshToken();
}, [token]);


  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };
  console.log(isTokenValid(token));
  return (
    <AuthContext.Provider value={{ token, login, logout, isLoggedIn: !!token && isTokenValid(token) }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
