'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ChatChannel, ChatMessage } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const POLL_MS = 6_000;

export default function UserLiveChatPage() {
  const { user } = useAuth();
  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshMessages = useCallback(async (channelId: string) => {
    try {
      const list = await chatAPI.listMessages(channelId);
      setMessages(list);
    } catch {
      /* transient polling errors are non-fatal */
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    let active = true;
    chatAPI
      .getOrCreateChannel()
      .then((c) => {
        if (!active) return;
        setChannel(c);
        void refreshMessages(c.id);
        timer = setInterval(() => void refreshMessages(c.id), POLL_MS);
      })
      .catch((err) => {
        setBootError(err instanceof Error ? err.message : 'Could not open the chat');
      });
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [refreshMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || !channel || sending) return;
    setSending(true);
    try {
      const msg = await chatAPI.sendMessage(channel.id, text, 'user');
      setMessages((prev) => [...prev, msg]);
      setBody('');
    } catch (err) {
      setBootError(err instanceof Error ? err.message : 'Could not send the message');
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardShell variant="user" title="Live Chat">
      <Card className="flex h-[calc(100vh-12rem)] min-h-[480px] flex-col">
        <CardHeader className="border-b border-white/[0.07]">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary-400" /> Support conversation
            {channel?.status === 'closed' && (
              <span className="ml-auto rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-300">
                Closed
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          {bootError && (
            <p className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{bootError}</p>
          )}
          {!channel && !bootError && (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Opening your conversation…
            </div>
          )}
          {messages.length === 0 && channel && (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              <div>
                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-primary-400/60" />
                <p>No messages yet. Say hello and our team will reply here.</p>
              </div>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_role === 'user' && (!m.sender_id || m.sender_id === user?.id);
            return (
              <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[78%] rounded-2xl px-4 py-2.5 text-sm',
                    mine
                      ? 'rounded-br-md bg-primary-gradient text-white'
                      : 'rounded-bl-md border border-white/10 bg-white/[0.05] text-foreground'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-muted-foreground')}>
                    {m.sender_role === 'admin' ? 'Support · ' : ''}
                    {formatDateTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </CardContent>

        <form onSubmit={send} className="flex gap-3 border-t border-white/[0.07] p-4">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type your message…"
            maxLength={2000}
            className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary-500/50 focus:outline-none"
          />
          <Button type="submit" size="lg" loading={sending} disabled={!body.trim() || channel?.status === 'closed'}>
            <Send /> Send
          </Button>
        </form>
      </Card>
    </DashboardShell>
  );
}
