import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginUser, signupUser, clearError } from '../../store/authSlice';
import { toast } from 'sonner';

interface AuthFormProps {
  onForgotPassword: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onForgotPassword }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  // Handle Redux errors with toast notifications - only for user-initiated actions
  useEffect(() => {
    if (error && hasAttemptedAuth) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch, hasAttemptedAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setHasAttemptedAuth(true);

    try {
      if (isSignUp) {
        await dispatch(signupUser({ email, password })).unwrap();
        toast.success('Account created successfully!');
      } else {
        await dispatch(loginUser({ email, password })).unwrap();
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      // Error is already handled by Redux and useEffect
      console.error('Auth error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setHasAttemptedAuth(false); // Reset attempt flag when switching modes
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500"
              disabled={isLoading}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                disabled={isLoading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (min 6 characters)"
                disabled={isLoading}
              />
            </div>
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={isLoading}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading 
                ? (isSignUp ? 'Creating Account...' : 'Signing In...')
                : (isSignUp ? 'Sign Up' : 'Sign In')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm; 