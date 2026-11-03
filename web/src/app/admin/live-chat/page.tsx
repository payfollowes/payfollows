'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, CircleDot, Loader2, MessageSquare, Send } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/shell';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { chatAPI } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { ChatChannel, ChatMessage } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

const POLL_MS = 6_000;
const initials = (name?: string | null) =>
  (name?.trim().split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') || 'U').toUpperCase();

const channelBadge = (status: ChatChannel['status']) => {
  if (status === 'open') return 'success' as const;
  if (status === 'pending') return 'warning' as const;
  return 'secondary' as const;
};

export default function AdminLiveChatPage() {
  const { profile: adminProfile } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadChannels = useCallback(async () => {
    try {
      const list = await chatAPI.listChannels();
      setChannels(list);
      if (list.length && !activeId) setActiveId(list[0].id);
    } catch {
      /* keep the chat list available while transient requests retry */
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
      setSendError(null);
    } catch {
      /* transient polling errors are non-fatal */
    }
  }, []);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    void loadMessages(activeId);
    const id = setInterval(() => void loadMessages(activeId), POLL_MS);
    return () => clearInterval(id);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const active = channels.find((channel) => channel.id === activeId) ?? null;
  const userName = active?.user?.username || 'User';
  const adminName = adminProfile?.username || 'Support';

  const selectChannel = (channelId: string) => {
    setActiveId(channelId);
    setMessages([]);
    setSendError(null);
    setMobileChatOpen(true);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || !activeId || sending || active?.status === 'closed') return;
    setSending(true);
    setSendError(null);
    try {
      const msg = await chatAPI.sendMessage(activeId, text, 'admin');
      setMessages((prev) => [...prev, msg]);
      setBody('');
      void loadChannels();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not send the reply');
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: ChatChannel['status']) => {
    if (!activeId) return;
    try {
      await chatAPI.setChannelStatus(activeId, status);
      void loadChannels();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Could not update conversation status');
    }
  };

  return (
    <DashboardShell variant="admin" title="Live Chat">
      <div className="grid min-w-0 gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">
        <Card className={cn('flex max-h-[calc(100dvh-13rem)] min-w-0 flex-col lg:max-h-[calc(100vh-12rem)]', mobileChatOpen ? 'hidden lg:flex' : 'flex')}>
          <CardHeader className="border-b border-white/[0.07] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-white">Conversations</p>
                <p className="mt-1 text-xs text-muted-foreground">{channels.length} total</p>
              </div>
              <MessageSquare className="h-5 w-5 text-primary-300" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin text-primary-400" /></div>
            ) : channels.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              channels.map((channel) => {
                const name = channel.user?.username || 'User';
                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => selectChannel(channel.id)}
                    aria-current={activeId === channel.id ? 'true' : undefined}
                    className={cn(
                      'flex w-full min-w-0 items-start gap-3 rounded-2xl border p-3 text-left transition-all',
                      activeId === channel.id
                        ? 'border-primary-500/50 bg-primary-500/10'
                        : 'border-white/[0.07] bg-white/[0.03] hover:border-white/20'
                    )}
                  >
                    <Avatar className="h-10 w-10 shrink-0 border border-white/10">
                      <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-white">{name}</span>
                        <Badge variant={channelBadge(channel.status)} className="shrink-0 capitalize">{channel.status}</Badge>
                      </span>
                      {channel.user?.email && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{channel.user.email}</span>}
                      <span className="mt-1 block truncate text-xs text-muted-foreground">{channel.last_message || 'No messages yet'}</span>
                      {channel.last_message_at && <span className="mt-1 block text-[10px] text-muted-foreground/70">{formatDateTime(channel.last_message_at)}</span>}
                    </span>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className={cn('h-[calc(100dvh-13rem)] min-h-[360px] min-w-0 flex-col sm:h-[calc(100vh-12rem)] sm:min-h-[480px] lg:h-[calc(100vh-12rem)]', mobileChatOpen ? 'flex' : 'hidden lg:flex')}>
          <CardHeader className="flex flex-col gap-3 border-b border-white/[0.07] p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <button
                type="button"
                onClick={() => setMobileChatOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-white lg:hidden"
                aria-label="Back to conversations"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              {active ? (
                <>
                  <Avatar className="h-10 w-10 shrink-0 border border-primary-300/25">
                    <AvatarFallback>{initials(userName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{userName}</p>
                    <p className="truncate text-xs text-muted-foreground">{active.user?.email || active.user_id}</p>
                  </div>
                </>
              ) : (
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-5 w-5 shrink-0 text-primary-400" aria-hidden="true" />
                  <span className="truncate">Select a conversation</span>
                </div>
              )}
            </div>
            {active && (
              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CircleDot className={cn('h-4 w-4', active.status === 'open' ? 'text-emerald-400' : 'text-muted-foreground')} />
                  <span className="capitalize">{active.status}</span>
                </div>
                {active.status !== 'closed' ? (
                  <Button size="sm" variant="outline" onClick={() => void setStatus('closed')}>Close</Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => void setStatus('open')}>Reopen</Button>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-5">
            {!active ? (
              <div className="m-auto text-center text-sm text-muted-foreground">
                <MessageSquare className="mx-auto mb-3 h-9 w-9 text-primary-400/60" aria-hidden="true" />
                Pick a conversation from the list.
              </div>
            ) : messages.length === 0 ? (
              <div className="m-auto text-center text-sm text-muted-foreground">No messages in this conversation yet.</div>
            ) : (
              messages.map((message) => {
                const mine = message.sender_role === 'admin';
                return (
                  <div key={message.id} className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                    {!mine && (
                      <Avatar className="h-8 w-8 shrink-0 border border-white/10">
                        <AvatarFallback className="text-[10px]">{initials(userName)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn('max-w-[86%] rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[75%] sm:px-4', mine ? 'rounded-br-md bg-primary-gradient text-white' : 'rounded-bl-md border border-white/10 bg-white/[0.05] text-foreground')}>
                      <p className="mb-1 text-[10px] font-semibold opacity-75">{mine ? adminName : userName}</p>
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                      <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-muted-foreground')}>{formatDateTime(message.created_at)}</p>
                    </div>
                    {mine && (
                      <Avatar className="h-8 w-8 shrink-0 border border-primary-300/20">
                        <AvatarFallback className="text-[10px]">{initials(adminName)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })
            )}
            {sendError && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">{sendError}</p>}
            <div ref={bottomRef} />
          </CardContent>

          {active && (
            <form onSubmit={send} className="flex flex-col gap-2 border-t border-white/[0.07] p-3 sm:flex-row sm:gap-3 sm:p-4">
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={active.status === 'closed' ? 'Reopen this conversation to reply' : 'Reply as support…'}
                maxLength={2000}
                disabled={active.status === 'closed'}
                className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white placeholder:text-muted-foreground focus:border-primary-500/50 focus:outline-none disabled:opacity-60 sm:h-12 sm:rounded-2xl"
              />
              <Button type="submit" loading={sending} disabled={!body.trim() || active.status === 'closed'} className="w-full shrink-0 sm:w-auto">
                <Send /> Reply
              </Button>
            </form>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
