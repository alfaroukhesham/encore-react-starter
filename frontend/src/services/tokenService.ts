/**
 * Token Service for managing authentication tokens in localStorage
 */
class TokenServiceClass {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Get the access token from localStorage
   */
  getToken(): string | null {
    // First try localStorage
    const storedToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (storedToken) {
      console.log('Found token in localStorage');
      return storedToken;
    }

    // Then try to extract from cookies
    const cookieToken = this.getTokenFromCookie('access_token');
    if (cookieToken) {
      console.log('Found token in cookies');
      return cookieToken;
    }

    console.log('No token found in localStorage or cookies');
    return null;
  }

  /**
   * Get the refresh token from localStorage
   */
  getRefreshToken(): string | null {
    // First try localStorage
    const storedToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (storedToken) {
      return storedToken;
    }

    // Then try to extract from cookies
    return this.getTokenFromCookie('refresh_token');
  }

  /**
   * Extract token from document.cookie
   */
  private getTokenFromCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name && cookieValue) {
        return decodeURIComponent(cookieValue);
      }
    }
    return null;
  }

  /**
   * Set the access token in localStorage
   */
  setToken(token: string): void {
    console.log('Storing access token in localStorage');
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  /**
   * Set the refresh token in localStorage
   */
  setRefreshToken(token: string): void {
    console.log('Storing refresh token in localStorage');
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  /**
   * Check if user is authenticated (has a valid token)
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) {
      console.log('No token found - user not authenticated');
      return false;
    }

    // Check if token is expired
    const isExpired = this.isTokenExpired(token);
    if (isExpired) {
      console.log('Token is expired - user not authenticated');
      return false;
    }

    console.log('User is authenticated');
    return true;
  }

  /**
   * Remove all tokens from localStorage
   */
  clearTokens(): void {
    console.log('Clearing tokens from localStorage');
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp && payload.exp < currentTime) {
        console.log('Token expired at:', new Date(payload.exp * 1000));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error parsing token:', error);
      return true; // Treat invalid tokens as expired
    }
  }

  /**
   * Get user info from token
   */
  getUserFromToken(): { userId: string; email: string; is_verified: boolean } | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.sub,
        email: payload.email,
        is_verified: payload.is_verified
      };
    } catch (error) {
      console.error('Error parsing user from token:', error);
      return null;
    }
  }

  /**
   * Get authorization header for API requests
   */
  getAuthHeader(): { Authorization?: string } {
    const token = this.getToken();
    if (!token) {
      console.log('No token available for auth header');
      return {};
    }

    console.log('Adding Authorization header with token');
    return {
      Authorization: `Bearer ${token}`
    };
  }

  /**
   * Debug method to check token status
   */
  getTokenInfo(): {
    hasToken: boolean;
    tokenValid: boolean;
    tokenExpired: boolean;
    userInfo: any;
    tokenSource: 'localStorage' | 'cookies' | 'none';
  } {
    const localStorageToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    const cookieToken = this.getTokenFromCookie('access_token');
    const token = this.getToken();
    
    let tokenSource: 'localStorage' | 'cookies' | 'none' = 'none';
    if (localStorageToken) tokenSource = 'localStorage';
    else if (cookieToken) tokenSource = 'cookies';

    return {
      hasToken: !!token,
      tokenValid: token ? !this.isTokenExpired(token) : false,
      tokenExpired: token ? this.isTokenExpired(token) : false,
      userInfo: this.getUserFromToken(),
      tokenSource
    };
  }
}

export const TokenService = new TokenServiceClass(); 