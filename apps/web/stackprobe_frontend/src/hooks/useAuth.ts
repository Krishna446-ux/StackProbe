import { useState, useEffect, useCallback } from 'react';
import { checkAuth, logout as logoutApi } from '../api/auth.api';
import { setSessionExpiredHandler } from '../api/client';
import { ROUTES, isProtectedRoute } from '../constants/routes';

interface UseAuthReturn {
  authenticated: boolean;
  loadingAuth: boolean;
  authMessage: string;
  setAuthMessage: (msg: string) => void;
  handleLogout: () => Promise<void>;
  handleSessionExpired: () => void;
  navigate: (path: string) => void;
  currentPath: string;
}

export function useAuth(): UseAuthReturn {
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authMessage, setAuthMessage] = useState('');
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Routing helper
  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  }, []);

  // Handle expired session / 401 / 403
  const handleSessionExpired = useCallback(() => {
    setAuthenticated(false);
    setAuthMessage('Your session has expired. Please log in again.');
    window.history.replaceState(null, '', ROUTES.LOGIN);
    setCurrentPath(ROUTES.LOGIN);
  }, []);

  // Register the global session-expired handler for the API client
  useEffect(() => {
    setSessionExpiredHandler(handleSessionExpired);
  }, [handleSessionExpired]);

  // Sync with browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Initial authentication check
  useEffect(() => {
    const doCheck = async () => {
      try {
        const data = await checkAuth();
        setAuthenticated(data.authenticated);

        const path = window.location.pathname;
        if (data.authenticated) {
          if (path === '/' || path === ROUTES.LOGIN) {
            window.history.replaceState(null, '', ROUTES.SUBMIT);
            setCurrentPath(ROUTES.SUBMIT);
          }
        } else {
          if (isProtectedRoute(path)) {
            window.history.replaceState(null, '', ROUTES.LOGIN);
            setCurrentPath(ROUTES.LOGIN);
          }
        }
      } catch {
        setAuthenticated(false);
        if (isProtectedRoute(window.location.pathname)) {
          window.history.replaceState(null, '', ROUTES.LOGIN);
          setCurrentPath(ROUTES.LOGIN);
        }
      } finally {
        setLoadingAuth(false);
      }
    };
    doCheck();
  }, []);

  // Route protection guard
  useEffect(() => {
    if (loadingAuth) return;

    if (!authenticated && isProtectedRoute(currentPath)) {
      window.history.replaceState(null, '', ROUTES.LOGIN);
      setCurrentPath(ROUTES.LOGIN);
    } else if (authenticated && (currentPath === '/' || currentPath === ROUTES.LOGIN)) {
      window.history.replaceState(null, '', ROUTES.SUBMIT);
      setCurrentPath(ROUTES.SUBMIT);
    }
  }, [currentPath, authenticated, loadingAuth]);

  // Logout
  const handleLogout = useCallback(async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error('Logout request failed', err);
    }
    setAuthenticated(false);
    setAuthMessage('');
    navigate(ROUTES.LOGIN);
  }, [navigate]);

  return {
    authenticated,
    loadingAuth,
    authMessage,
    setAuthMessage,
    handleLogout,
    handleSessionExpired,
    navigate,
    currentPath,
  };
}
