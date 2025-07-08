// Simple authentication check utility

export function checkAuthentication(): {
  isAuthenticated: boolean;
  accessToken: string | null;
  message: string;
} {
  if (typeof window === 'undefined') {
    return {
      isAuthenticated: false,
      accessToken: null,
      message: 'Server-side rendering'
    };
  }

  const accessToken = localStorage.getItem('access_token');
  const user = localStorage.getItem('user_data');

  if (!accessToken) {
    return {
      isAuthenticated: false,
      accessToken: null,
      message: 'No access token found. Please log in.'
    };
  }

  if (!user) {
    return {
      isAuthenticated: false,
      accessToken: null,
      message: 'No user data found. Please log in.'
    };
  }

  // Basic JWT expiration check
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < currentTime) {
      return {
        isAuthenticated: false,
        accessToken: null,
        message: 'Access token has expired. Please log in again.'
      };
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      accessToken: null,
      message: 'Invalid access token format. Please log in again.'
    };
  }

  return {
    isAuthenticated: true,
    accessToken,
    message: 'Authenticated successfully'
  };
}

export function createTestUser(): void {
  if (typeof window === 'undefined') return;

  // Create a test token for development (WARNING: Only for development!)
  const testPayload = {
    sub: "1",
    email: "test@example.com",
    role: "candidate",
    exp: Math.floor(Date.now() / 1000) + (30 * 60) // 30 minutes from now
  };

  const testToken = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })) + "." +
                   btoa(JSON.stringify(testPayload)) + "." +
                   btoa("test-signature");

  const testUser = {
    id: 1,
    email: "test@example.com",
    name: "Test User",
    role: "candidate",
    is_verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  localStorage.setItem('access_token', testToken);
  localStorage.setItem('user_data', JSON.stringify(testUser));

  console.log('Test user created! You can now use the resume analysis features.');
} 