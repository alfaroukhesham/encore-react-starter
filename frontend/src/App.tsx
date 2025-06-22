import React, { useState, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { Toaster } from 'sonner';
import AuthGuard from './components/AuthGuard';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

type AppView = 'auth' | 'dashboard' | 'forgot-password' | 'reset-password';

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('auth');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check for reset token in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      setResetToken(token);
      setCurrentView('reset-password');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleForgotPassword = () => {
    setCurrentView('forgot-password');
  };

  const handleBackToAuth = () => {
    setCurrentView('auth');
    setResetToken(null);
  };

  const handleResetSuccess = () => {
    setCurrentView('auth');
    setResetToken(null);
  };

  // Show password reset form if we have a token
  if (currentView === 'reset-password' && resetToken) {
    return (
      <ResetPassword
        token={resetToken}
        onSuccess={handleResetSuccess}
        onBack={handleBackToAuth}
      />
    );
  }

  // Show forgot password form
  if (currentView === 'forgot-password') {
    return <ForgotPassword onBack={handleBackToAuth} />;
  }

  // Main authentication flow with AuthGuard
  return (
    <AuthGuard
      fallback={
        <AuthForm onForgotPassword={handleForgotPassword} />
      }
    >
      <Dashboard />
    </AuthGuard>
  );
}

function App() {
  return (
    <Provider store={store}>
      <div className="App">
        <AppContent />
        <Toaster 
          position="top-right" 
          richColors 
          expand={false}
          duration={4000}
        />
      </div>
    </Provider>
  );
}

export default App;
