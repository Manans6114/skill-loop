import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setTokens } from '@/lib/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = () => {
      const accessToken = searchParams.get('access_token');
      const idToken = searchParams.get('id_token');
      const error = searchParams.get('error');
      
      if (error) {
        console.error('Auth error:', error);
        navigate('/auth?error=' + error);
        return;
      }

      if (accessToken || idToken) {
        // Store tokens - prefer id_token as it's always a JWT
        // access_token may be opaque if no API audience is configured
        const tokenToUse = idToken || accessToken;
        setTokens(tokenToUse!, idToken || undefined);
        
        // Build user object from URL params
        const user = {
          id: searchParams.get('user_id') || '',
          email: searchParams.get('user_email') || '',
          name: searchParams.get('user_name') || '',
          avatar: searchParams.get('user_avatar') || undefined,
          credits: parseInt(searchParams.get('user_credits') || '0', 10),
          rating: searchParams.get('user_rating') ? parseFloat(searchParams.get('user_rating')!) : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        
        // Store user data
        localStorage.setItem('skillloop_user', JSON.stringify(user));
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } else {
        // No tokens, redirect to auth
        navigate('/auth?error=no_tokens');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo mx-auto"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;


