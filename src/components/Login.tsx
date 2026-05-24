import React from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { Shield, Sparkles, Lock, Zap } from 'lucide-react';

export function Login() {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setError(
          'Domain not authorized. Add your domain to Firebase Console → Authentication → Settings → Authorized domains.'
        );
      } else {
        setError(err?.message || 'Failed to login');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-shell font-sans">
      <div className="login-card">
        <div className="login-brand" aria-hidden>
          <div
            style={{
              width: '1.25rem',
              height: '1.25rem',
              background: 'var(--color-primary-fg)',
              borderRadius: '4px',
              transform: 'rotate(45deg)',
              opacity: 0.94,
              position: 'relative',
              zIndex: 1,
            }}
          />
        </div>

        <div className="text-center">
          <h1 className="page-title" style={{ fontSize: '1.5rem' }}>
            Welcome to Founder OS
          </h1>
          <p className="page-subtitle">
            Your operating system for projects, finance, and focus.
          </p>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="login-google-btn focus-ring"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && <div className="login-error">{error}</div>}

          <div className="login-divider">What you get</div>

          <div className="login-features">
            <div className="login-feature">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>AI insights</span>
            </div>
            <div className="login-feature">
              <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Quick capture</span>
            </div>
            <div className="login-feature">
              <Shield className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>Privacy mode</span>
            </div>
            <div className="login-feature">
              <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>End-to-end synced</span>
            </div>
          </div>
        </div>
      </div>

      <p
        className="text-[11px] text-[var(--color-ink-muted)] mt-6 text-center relative z-10"
        style={{ maxWidth: '420px' }}
      >
        By continuing you agree to keep building things that matter.
      </p>
    </div>
  );
}
