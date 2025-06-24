/**
 * Validate email format (basic validation)
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { valid: boolean; message?: string } => {
  if (!password) {
    return { valid: false, message: "Password is required" };
  }
  
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long" };
  }
  
  // Add more password rules here if needed
  
  return { valid: true };
};

/**
 * Validate HTTP response format
 */
export const validateHttpResponse = (response: any, expectedStatus: number): boolean => {
  if (expectedStatus >= 200 && expectedStatus < 300) {
    return response && (response.success !== undefined || response.message !== undefined);
  } else {
    return response && response.code && response.message;
  }
}; 