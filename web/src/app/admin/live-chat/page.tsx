'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Loader2, CircleDot } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { chatAPI } from '@/lib/api';
import type { ChatChannel, ChatMessage } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const POLL_MS = 6_000;

const channelBadge = (status: ChatChannel['status']) => {
  if (status === 'open') return 'success' as const;
  if (status === 'pending') return 'warning' as const;
  return 'secondary' as const;
};

export default function AdminLiveChatPage() {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChannels = useCallback(async () => {
    try {
      const list = await chatAPI.listChannels();
      setChannels(list);
      if (list.length && !activeId) setActiveId(list[0].id);
    } catch {
      /* non-fatal */
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    void loadChannels();
    const id = setInterval(() => void loadChannels(), POLL_MS);
    return () => clearInterval(id);
  }, [loadChannels]);

  const loadMessages = useCallback(async (channelId: string) => {
    try {
      setMessages(await chatAPI.listMessages(channelId));
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
    const id = setInterval(() => void loadMessages(activeId), POLL_MS);
    return () => clearInterval(id);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const active = channels.find((c) => c.id === activeId) ?? null;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      const msg = await chatAPI.sendMessage(activeId, text, 'admin');
      setMessages((prev) => [...prev, msg]);
      setBody('');
      void loadChannels();
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: ChatChannel['status']) => {
    if (!activeId) return;
    try {
      await chatAPI.setChannelStatus(activeId, status);
      void loadChannels();
    } catch {
      /* non-fatal */
    }
  };

  return (
    <DashboardShell variant="admin" title="Live Chat">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="max-h-[calc(100vh-12rem)] overflow-y-auto">
          <CardHeader>
            <CardTitle className="text-base">Conversations ({channels.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
              </div>
            ) : channels.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              channels.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'w-full rounded-2xl border p-3.5 text-left transition-all',
                    activeId === c.id
                      ? 'border-primary-500/50 bg-primary-500/10'
                      : 'border-white/[0.07] bg-white/[0.03] hover:border-white/20'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">
                      {c.user?.username ?? 'User'}
                    </p>
                    <Badge variant={channelBadge(c.status)} className="capitalize">
                      {c.status}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {c.last_message || 'No messages yet'}
                  </p>
                  {c.last_message_at && (
                    <p className="mt-1 text-[10px] text-muted-foreground/70">{formatDateTime(c.last_message_at)}</p>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="flex h-[calc(100vh-12rem)] min-h-[480px] flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/[0.07]">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-primary-400" />
              {active ? active.user?.username ?? active.user_id : 'Select a conversation'}
            </CardTitle>
            {active && (
              <div className="flex items-center gap-2">
                {active.status !== 'closed' ? (
                  <Button size="sm" variant="outline" onClick={() => setStatus('closed')}>
                    Close
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => setStatus('open')}>
                    Reopen
                  </Button>
                )}
                <CircleDot className={cn('h-4 w-4', active.status === 'open' ? 'text-emerald-400' : 'text-muted-foreground')} />
              </div>
            )}
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            {!active ? (
              <p className="m-auto text-sm text-muted-foreground">Pick a conversation from the left.</p>
            ) : (
              messages.map((m) => {
                const mine = m.sender_role === 'admin';
                return (
                  <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                        mine
                          ? 'rounded-br-md bg-primary-gradient text-white'
                          : 'rounded-bl-md border border-white/10 bg-white/[0.05] text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-muted-foreground')}>
                        {formatDateTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </CardContent>

          {active && (
            <form onSubmit={send} className="flex gap-3 border-t border-white/[0.07] p-4">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Reply as support…"
                maxLength={2000}
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary-500/50 focus:outline-none"
              />
              <Button type="submit" loading={sending} disabled={!body.trim()}>
                <Send /> Reply
              </Button>
            </form>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
