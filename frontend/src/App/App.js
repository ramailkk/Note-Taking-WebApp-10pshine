import './App.css';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import Screen from './Screen';
import Login from '../Authentication/Login';
import SignUp from '../Authentication/SignUp';
import {useAuth} from "../Authentication/AuthContext"

import { BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
function App() {
  const { token, isLoggedIn } = useAuth();
  // localStorage.clear();
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={isLoggedIn ? "/screen" : "/login"} />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/screen" /> : <Login />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/screen" /> : <SignUp />} />
        <Route path="/screen" element={isLoggedIn ? <Screen /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
