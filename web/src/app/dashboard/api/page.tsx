'use client';

import { useState } from 'react';
import { KeyRound, Copy, Check, Terminal, BookOpen, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { authAPI } from '@/lib/api';

const API_HOST = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://payfollows.vercel.app';
const ACTION_URL = `${API_HOST}/api/v2/action`;

const ENDPOINTS = [
  {
    action: 'balance',
    desc: 'Get current wallet balance',
    body: '{ key, action: "balance" }',
    response: '{ "balance": "12.35", "currency": "USD" }',
  },
  {
    action: 'services',
    desc: 'List all active services with rates and limits',
    body: '{ key, action: "services" }',
    response: '[{ "service": "uuid", "name": "...", "rate": 2.75, "min": 50, "max": 100000, ... }]',
  },
  {
    action: 'add',
    desc: 'Place a new order (service is the UUID from the services list)',
    body: '{ key, action: "add", service, link, quantity }',
    response: '{ "order": "3f8a…-uuid" }',
  },
  {
    action: 'status',
    desc: 'Check one order, or several comma-separated ids',
    body: '{ key, action: "status", order }  |  { key, action: "status", orders: "id1,id2" }',
    response: '{ "charge": 1.23, "start_count": 10, "status": "Completed", "remains": 0, "currency": "USD" }',
  },
  {
    action: 'refill',
    desc: 'Request a refill for a completed order',
    body: '{ key, action: "refill", order }',
    response: '{ "refill": "provider-refill-id" }',
  },
  {
    action: 'cancel',
    desc: 'Cancel a pending or processing order',
    body: '{ key, action: "cancel", order }',
    response: '{ "cancel": 1, "order": "3f8a…-uuid" }',
  },
];

export default function ApiPage() {
  const { profile, refreshProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

  const hasKey = Boolean(profile?.api_key);
  const apiKey = profile?.api_key || 'api_key_generated_after_first_deposit';

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1600);
  };

  const handleRegenerate = async () => {
    if (!confirmRegen) {
      setConfirmRegen(true);
      setTimeout(() => setConfirmRegen(false), 4000);
      return;
    }
    setConfirmRegen(false);
    setRegenerating(true);
    try {
      const newKey = await authAPI.regenerateApiKey();
      await refreshProfile();
      toast.success('API key regenerated — update any integrations using the old key');
      if (newKey) {
        try {
          await navigator.clipboard.writeText(newKey);
          toast.success('New key copied to clipboard');
        } catch {
          /* clipboard may be unavailable; the key is still on screen */
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not regenerate the API key');
    } finally {
      setRegenerating(false);
    }
  };

  const curl = `curl -X POST ${ACTION_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"key":"${apiKey}","action":"balance"}'`;

  return (
    <DashboardShell variant="user" title="API Access">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary-400" /> Your API Key
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-primary-300">
              {apiKey}
            </code>
            <Button variant="secondary" onClick={() => copy(apiKey)} disabled={!hasKey}>
              {copied ? <Check className="text-emerald-400" /> : <Copy />} Copy Key
            </Button>
            <Button
              variant={confirmRegen ? 'destructive' : 'outline'}
              onClick={handleRegenerate}
              disabled={regenerating || !hasKey}
            >
              <RefreshCw className={regenerating ? 'animate-spin' : undefined} />
              {regenerating ? 'Regenerating…' : confirmRegen ? 'Click again to confirm' : 'Regenerate'}
            </Button>
          </div>
          <p className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            Keep this key secret — never expose it in browser-side code or public repositories.
            Regenerating immediately invalidates the previous key.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-400" /> Available Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            All requests are POST (form-urlencoded or JSON) to <code className="text-primary-300">{ACTION_URL}</code>.
            Every request must include your <code className="text-primary-300">key</code>. Order and service ids are
            UUIDs, exactly as returned by the API.
          </p>
          {ENDPOINTS.map((ep) => (
            <div key={ep.action} className="rounded-xl pf-card-inner p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="info">{ep.action}</Badge>
                <span className="text-sm text-white">{ep.desc}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{ep.body}</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-emerald-300/80">
                <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                {ep.response}
              </p>
            </div>
          ))}
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <p className="font-mono text-xs leading-relaxed text-amber-200/90">
              Errors always come back as <span className="text-white">{`{ "error": "reason" }`}</span> — for example
              &quot;Invalid API key&quot; or &quot;Insufficient balance&quot;. Parse the <code>error</code> field
              instead of relying only on the HTTP status.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-primary-400" /> Example Request
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-5 font-mono text-xs leading-relaxed text-emerald-300">
            {curl}
          </pre>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => copy(curl)}>
            <Copy /> Copy cURL
          </Button>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
