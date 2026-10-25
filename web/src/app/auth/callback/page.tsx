'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Logo } from '@/components/shared/logo';
import { supabase } from '@/lib/supabase/client';

// Exchange the recovery/OAuth code for a session. This stack uses the
// browser-local supabase-js client (PKCE verifier in localStorage), so the
// exchange has to run client-side rather than in a route handler.
function CallbackView() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const next = params.get('next') || '/dashboard';
    const code = params.get('code');
    const urlError = params.get('error_description') || params.get('error');

    const finish = async () => {
      if (urlError) {
        setError(urlError);
        return;
      }
      if (!code) {
        setError('Missing authorization code. Please request a new link.');
        return;
      }

      try {
        // detectSessionInUrl may already have consumed the code; an exchange
        // failure therefore falls back to whatever session is now present.
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) throw exchangeError;
        }
        router.replace(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not verify your link');
      }
    };

    void finish();
  }, [params, router]);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />
      <div className="relative w-full max-w-md text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="glow-panel rounded-[28px] border border-[rgba(167,139,250,0.16)] bg-ink-900/85 p-8 shadow-glow-lg backdrop-blur-2xl">
          {error ? (
            <div className="space-y-4">
              <ShieldAlert className="mx-auto h-10 w-10 text-red-400" />
              <h1 className="font-display text-xl font-bold text-white">Verification failed</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => router.replace('/login')}
                className="text-sm font-semibold text-primary-400 hover:text-primary-300"
              >
                Back to login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary-400" />
              <h1 className="font-display text-xl font-bold text-white">Verifying your link…</h1>
              <p className="text-sm text-muted-foreground">Hold on while we sign you in securely.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackView />
    </Suspense>
  );
}
