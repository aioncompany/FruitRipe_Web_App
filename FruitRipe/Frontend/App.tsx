import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import ChamberDetail from './pages/ChamberDetail';
import Settings from './pages/Settings';

// Since we cannot use React Router DOM's BrowserRouter (no server config)
// We implement a simple Hash Router for this SPA.

const Router: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-slate-900">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>;
  }

  // Auth Guard
  if (
    !isAuthenticated &&
    !route.startsWith('#/login') &&
    !route.startsWith('#/reset') &&
    !route.startsWith('#/register')
  ) {
    window.location.hash = '#/login';
    return null;
  }

  if (isAuthenticated && (route === '' || route === '#/' || route.startsWith('#/login'))) {
    if(route.startsWith('#/login')) {
        window.location.hash = '#/';
        return null;
    }
  }

  // Routing Logic
  if (route.startsWith('#/login')) {
    return <Login />;
  }
  if (route.startsWith('#/register')) {
    return <Register />;
  }
  if (route.startsWith('#/reset')) {
    return <ResetPassword />;
  }

  // Protected Routes
  if (isAuthenticated) {
    if (route === '' || route === '#/') {
      return (
        <Layout>
          <Dashboard />
        </Layout>
      );
    }
    
    if (route.startsWith('#/chamber/')) {
      return (
        <Layout>
          <ChamberDetail />
        </Layout>
      );
    }

    if (route.startsWith('#/settings')) {
      return (
        <Layout>
          <Settings />
        </Layout>
      );
    }
  }

  return <div>404 Not Found</div>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Router />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;