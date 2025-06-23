import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser } from '../store/authSlice';
import ChangePassword from './ChangePassword';
import { toast } from 'sonner';
import Client, { Local } from '../lib/client';

// Initialize Encore client
const client = new Client(Local);

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  
  const [count, setCount] = useState(0);
  const [isIncrementing, setIsIncrementing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Load initial counter value
  useEffect(() => {
    const loadCounter = async () => {
      try {
        const result = await client.api.get();
        setCount(result.value);
      } catch (error) {
        console.error('Failed to load counter:', error);
        // Don't show error toast for initial load, just keep count at 0
      }
    };
    
    loadCounter();
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.success('Logged out locally');
    }
  };

  const incrementCounter = async () => {
    setIsIncrementing(true);
    try {
      const result = await client.api.increment();
      setCount(result.value);
    } catch (error: any) {
      console.error('Counter increment failed:', error);
      
      if (error?.message?.includes('CORS')) {
        toast.error('Connection error: Please check if the backend is running');
      } else if (error?.message?.toLowerCase().includes('network')) {
        toast.error('Network error: Please check your connection');
      } else {
        toast.error('Failed to increment counter. Please try again.');
      }
    } finally {
      setIsIncrementing(false);
    }
  };

  if (!user) {
    return null; // This shouldn't happen due to AuthGuard, but just in case
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to your Dashboard
          </h1>
          <p className="text-gray-600">
            Logged in as: <span className="font-medium">{user.email}</span>
          </p>
          <div className="flex items-center justify-center mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              user.is_verified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {user.is_verified ? '✓ Verified' : '⚠ Unverified'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            User ID: {user.id}
          </p>
        </div>

        <div className="space-y-4">
          {/* Counter Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Counter Demo
            </h2>
            <p className="text-3xl font-bold text-indigo-600 text-center mb-4">
              {count}
            </p>
            <button
              onClick={incrementCounter}
              disabled={isIncrementing}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isIncrementing ? 'Incrementing...' : 'Increment Counter'}
            </button>
          </div>

          {/* Account Actions */}
          <div className="space-y-3">
            <button
              onClick={() => setShowChangePassword(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Change Password
            </button>

            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>

        {/* User Info Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
            Account Information
          </h3>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Verified:</span> 
              <span className={user.is_verified ? 'text-green-600' : 'text-yellow-600'}>
                {user.is_verified ? 'Yes' : 'No'}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Account ID:</span> {user.id}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePassword onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
};

export default Dashboard; 