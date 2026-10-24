'use client';

import { useState } from 'react';
import { KeyRound, Copy, Check, Terminal, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';

const ENDPOINTS = [
  { method: 'POST', path: '/api/v2/action', desc: 'Place a new order', body: '{ key, action: "add", service, link, quantity }' },
  { method: 'POST', path: '/api/v2/action', desc: 'Check order status', body: '{ key, action: "status", order: 12345 }' },
  { method: 'POST', path: '/api/v2/action', desc: 'Request refill', body: '{ key, action: "refill", order: 12345 }' },
  { method: 'POST', path: '/api/v2/action', desc: 'List services', body: '{ key, action: "services" }' },
  { method: 'POST', path: '/api/v2/action', desc: 'Account balance', body: '{ key, action: "balance" }' },
];

export default function ApiPage() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const apiKey = profile?.api_key || 'api_key_generated_after_first_deposit';

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 1600);
  };

  const curl = `curl -X POST https://payfollows.vercel.app/api/v2/action \\
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
            <Button variant="secondary" onClick={() => copy(apiKey)}>
              {copied ? <Check className="text-emerald-400" /> : <Copy />} Copy Key
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Keep this key secret. Never expose it in browser-side code or public repositories.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-400" /> Available Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ENDPOINTS.map((ep) => (
            <div key={ep.desc} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={ep.method === 'POST' ? 'info' : 'secondary'}>{ep.method}</Badge>
                <code className="text-sm text-white">{ep.path}</code>
                <span className="text-xs text-muted-foreground">— {ep.desc}</span>
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{ep.body}</p>
            </div>
          ))}
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
