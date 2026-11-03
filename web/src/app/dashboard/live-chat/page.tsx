'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, Loader2, ShieldCheck } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ChatChannel, ChatMessage } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const POLL_MS = 6_000;
const initials = (name?: string | null) =>
  (name?.trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || 'U').toUpperCase();

export default function UserLiveChatPage() {
  const { user, profile } = useAuth();
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
    let timer: ReturnType<typeof setInterval> | undefined;
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
        if (active) setBootError(err instanceof Error ? err.message : 'Could not open the chat');
      });
    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [refreshMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || !channel || sending || channel.status === 'closed') return;
    setSending(true);
    try {
      const msg = await chatAPI.sendMessage(channel.id, text, 'user');
      setMessages((prev) => [...prev, msg]);
      setBody('');
      setBootError(null);
    } catch (err) {
      setBootError(err instanceof Error ? err.message : 'Could not send the message');
    } finally {
      setSending(false);
    }
  };

  const displayName = profile?.username || user?.username || 'Your profile';
  const displayEmail = profile?.email || user?.email || '';
  const ownInitials = initials(displayName);

  return (
    <DashboardShell variant="user" title="Live Chat">
      <Card className="flex h-[calc(100dvh-13rem)] min-h-[360px] min-w-0 flex-col sm:h-[calc(100vh-12rem)] sm:min-h-[480px]">
        <CardHeader className="flex flex-col gap-3 border-b border-white/[0.07] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11 border border-primary-300/25 shadow-glow-sm">
              <AvatarFallback>{ownInitials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white sm:text-base">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{displayEmail || 'PayFollows account'}</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-primary-300">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-foreground">Support conversation</span>
                <span className="block">{channel?.status === 'closed' ? 'Closed' : 'Replies appear here'}</span>
              </span>
            </div>
            {channel?.status === 'closed' && (
              <span className="shrink-0 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-300">Closed</span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-5">
          {bootError && (
            <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">{bootError}</p>
          )}
          {!channel && !bootError && (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Opening your conversation…
            </div>
          )}
          {messages.length === 0 && channel && (
            <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground">
              <div>
                <MessageSquare className="mx-auto mb-3 h-10 w-10 text-primary-400/60" aria-hidden="true" />
                <p>No messages yet. Say hello and our team will reply here.</p>
              </div>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_role === 'user' && (!m.sender_id || m.sender_id === user?.id);
            const senderName = mine ? displayName : 'PayFollows Support';
            return (
              <div key={m.id} className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                {!mine && (
                  <Avatar className="h-8 w-8 shrink-0 border border-white/10">
                    <AvatarFallback className="text-[10px]">PF</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn('max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[78%] sm:px-4', mine ? 'rounded-br-md bg-primary-gradient text-white' : 'rounded-bl-md border border-white/10 bg-white/[0.05] text-foreground')}>
                  <p className="mb-1 text-[10px] font-semibold opacity-75">{senderName}</p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-muted-foreground')}>{formatDateTime(m.created_at)}</p>
                </div>
                {mine && (
                  <Avatar className="h-8 w-8 shrink-0 border border-primary-300/20">
                    <AvatarFallback className="text-[10px]">{ownInitials}</AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </CardContent>

        <form onSubmit={send} className="flex flex-col gap-2 border-t border-white/[0.07] p-3 sm:flex-row sm:gap-3 sm:p-4">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={channel?.status === 'closed' ? 'This conversation is closed' : 'Type your message…'}
            maxLength={2000}
            disabled={!channel || channel.status === 'closed'}
            className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary-500/50 focus:outline-none disabled:opacity-60 sm:h-12 sm:rounded-2xl"
          />
          <Button type="submit" size="lg" loading={sending} disabled={!body.trim() || !channel || channel.status === 'closed'} className="w-full shrink-0 sm:w-auto">
            <Send /> Send
          </Button>
        </form>
      </Card>
    </DashboardShell>
  );
}
