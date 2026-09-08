import React, { useEffect, useRef } from 'react';

export default function GoogleSignInButton({ onSuccess, onError, text = "sign_in_with", role = "volunteer", disabled = false }) {
  const googleBtnRef = useRef(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  useEffect(() => {
    // If Google GSI library is loaded and client ID is configured
    if (window.google?.accounts?.id && clientId && clientId !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              onSuccess({ credential: response.credential, role });
            } else if (onError) {
              onError('Google authentication failed.');
            }
          },
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: text,
            shape: 'rectangular',
            logo_alignment: 'left',
          });
        }
      } catch (err) {
        console.error('Google GSI initialization error:', err);
      }
    }
  }, [clientId, text, role, onSuccess, onError]);

  const handleCustomGoogleClick = () => {
    if (disabled) return;
    if (window.google?.accounts?.id && clientId && clientId !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com") {
      try {
        window.google.accounts.id.prompt();
        return;
      } catch (err) {
        console.log('Google prompt error, falling back to mock sign-in', err);
      }
    }

    // Fallback demo mode for local testing
    const demoEmail = prompt("Enter your Google Account email for test login:", "user.google@gmail.com");
    if (!demoEmail) return;
    const name = demoEmail.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase());
    
    // Create a client JWT payload format for demo
    const mockPayload = btoa(JSON.stringify({ email: demoEmail, name: name }));
    const mockCredential = `eyJhbGciOiJIUzI1NiJ9.${mockPayload}.signature`;

    onSuccess({ credential: mockCredential, email: demoEmail, name: name, role });
  };

  const isRealConfigured = clientId && clientId !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  return (
    <div style={{ width: '100%' }}>
      {isRealConfigured ? (
        <div ref={googleBtnRef} style={{ width: '100%', minHeight: '40px', display: 'flex', justifyContent: 'center' }} />
      ) : (
        <button
          type="button"
          onClick={handleCustomGoogleClick}
          disabled={disabled}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '0.65rem 1rem',
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-md, 10px)',
            color: 'var(--text-primary, #f8fafc)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.background = 'var(--bg-card, #1e293b)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span>Continue with Google</span>
        </button>
      )}
    </div>
  );
}
