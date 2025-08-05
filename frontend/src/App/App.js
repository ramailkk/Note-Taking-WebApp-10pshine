// App.js
import './App.css';
import 'quill/dist/quill.core.css';
import 'quill/dist/quill.snow.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from '../Authentication/Login';
import SignUp from '../Authentication/SignUp';
import Screen from './Screen';
import Dashboard from '../Dashboard/Dashboard';
import UserPage from '../UserPage/UserPage';

import Layout from '../App/AppLayout'; // New layout with Sidebar
import { useAuth } from '../Authentication/AuthContext';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  const { isLoggedIn } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={isLoggedIn ? "/home" : "/login"} />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/home" /> : <Login />} />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/home" /> : <SignUp />} />

        {isLoggedIn && (
          <Route element={<Layout />}>
            <Route path="/notes" element={<Screen />} />
            <Route path="/home" element={<Dashboard />} />
            <Route path="/user" element={<UserPage />} />
          </Route>
        )}

        {!isLoggedIn && (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
