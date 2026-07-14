// src/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Components/Sidebar';
import { useAuth } from '../Authentication/AuthContext';
import { ToastProvider } from '../Components/Toast';
import { ConfirmProvider } from '../Components/ConfirmModal';

const Layout = () => {
  const { isLoggedIn } = useAuth();

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="d-flex flex-row">
          {isLoggedIn && <Sidebar />}
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
};

export default Layout;

