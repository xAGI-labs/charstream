/**
 * Utility to help debug authentication issues
 */

// Function to detect authentication state
export function debugAuthState() {
  try {
    // Check for Clerk session in localStorage 
    const hasClerkSession = Object.keys(localStorage).some(key => 
      key.startsWith('clerk.') || key.includes('__clerk')
    );

    // Check for cookies
    const hasCookies = document.cookie.includes('__session=') || 
                       document.cookie.includes('__clerk');
    
    console.group('Auth Debug Info');
    console.log('Has Clerk session data in localStorage:', hasClerkSession);
    console.log('Has auth cookies:', hasCookies);
    console.log('Current pathname:', window.location.pathname);
    console.log('Referrer:', document.referrer);
    console.groupEnd();

    return {
      hasClerkSession,
      hasCookies,
      pathname: window.location.pathname,
      referrer: document.referrer
    };
  } catch (error) {
    console.error('Error debugging auth state:', error);
    return null;
  }
}

// Function to clear authentication state (use with caution!)
export function clearAuthData() {
  try {
    // Clear only Clerk-related items to avoid wiping entire localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('clerk.') || key.includes('__clerk')) {
        localStorage.removeItem(key);
      }
    });
    
    // Attempt to clear cookies by expiring them
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('clerk') || name.includes('__session')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
      }
    });

    console.log('Auth data cleared. Please refresh the page and try signing in again.');
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
}
