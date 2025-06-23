/**
 * Set authentication cookies in HTTP response
 */
export const setCookies = (res: any, accessToken: string, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // For development, use Lax with no Secure flag
  // For production, use Strict with Secure flag
  const cookieOptions = isProduction 
    ? 'HttpOnly; Secure; SameSite=Strict'
    : 'HttpOnly; SameSite=Lax';
  
  res.setHeader('Set-Cookie', [
    `access_token=${accessToken}; ${cookieOptions}; Max-Age=${30 * 60}; Path=/`,
    `refresh_token=${refreshToken}; ${cookieOptions}; Max-Age=${7 * 24 * 60 * 60}; Path=/`
  ]);
  console.log('Setting cookies with options:', cookieOptions);
  console.log('Access token cookie:', `access_token=${accessToken.substring(0, 20)}...; ${cookieOptions}; Max-Age=${30 * 60}; Path=/`);
};

/**
 * Clear authentication cookies in HTTP response
 */
export const clearCookies = (res: any) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const cookieOptions = isProduction 
    ? 'HttpOnly; Secure; SameSite=Strict'
    : 'HttpOnly; SameSite=Lax';
  
  res.setHeader('Set-Cookie', [
    `access_token=; ${cookieOptions}; Max-Age=0; Path=/`,
    `refresh_token=; ${cookieOptions}; Max-Age=0; Path=/`
  ]);
}; 