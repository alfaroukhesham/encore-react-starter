import React, { useState, useEffect } from 'react';
import { TokenService } from '../../services/tokenService';

export const TokenInfo: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState({
    hasToken: false,
    tokenValid: false,
    tokenExpired: false,
    userInfo: null as any,
    tokenSource: 'none' as 'localStorage' | 'cookies' | 'none'
  });

  const updateTokenInfo = () => {
    const info = TokenService.getTokenInfo();
    setTokenInfo(info);
    console.log('Token info updated:', info);
  };

  useEffect(() => {
    updateTokenInfo();
    
    // Update token info every 5 seconds
    const interval = setInterval(updateTokenInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClearTokens = () => {
    TokenService.clearTokens();
    updateTokenInfo();
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-3">Token Information</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="font-medium">Has Token:</span>
          <span className={tokenInfo.hasToken ? 'text-green-600' : 'text-red-600'}>
            {tokenInfo.hasToken ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Token Valid Format:</span>
          <span className={tokenInfo.tokenValid ? 'text-green-600' : 'text-red-600'}>
            {tokenInfo.tokenValid ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Token Expired:</span>
          <span className={tokenInfo.tokenExpired ? 'text-red-600' : 'text-green-600'}>
            {tokenInfo.tokenExpired ? 'Yes' : 'No'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Token Source:</span>
          <span className={tokenInfo.tokenSource === 'none' ? 'text-red-600' : 'text-blue-600'}>
            {tokenInfo.tokenSource}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="font-medium">Authenticated by Token:</span>
          <span className={TokenService.isAuthenticated() ? 'text-green-600' : 'text-red-600'}>
            {TokenService.isAuthenticated() ? 'Yes' : 'No'}
          </span>
        </div>
        
        {tokenInfo.userInfo && (
          <div className="mt-3 p-2 bg-white rounded border">
            <div className="font-medium text-gray-700 mb-1">User Info from Token:</div>
            <div className="text-xs text-gray-600">
              <div>ID: {tokenInfo.userInfo.userId}</div>
              <div>Email: {tokenInfo.userInfo.email}</div>
              <div>Verified: {tokenInfo.userInfo.is_verified ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}
      </div>
      
      <button
        onClick={handleClearTokens}
        className="mt-3 px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
      >
        Clear Tokens
      </button>
    </div>
  );
};