-- ===========================================================================
-- Real notification triggers: announcements, live chat, support tickets
-- Every event lands in public.notifications so the topbar bell (45s polling
-- + refetch on window focus) shows it with an unread badge.
-- Date: 2026-10-26
-- ===========================================================================

-- 1. Published announcement -> one notification per non-admin user ----------
CREATE OR REPLACE FUNCTION public.notify_on_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.status <> 'published' THEN
    RETURN NEW;
  END IF;
  -- On update only fire when the announcement transitions into published,
  -- so edits to an already-published row do not re-notify everyone.
  IF TG_OP = 'UPDATE' AND OLD.status = 'published' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT
    p.id,
    'Announcement: ' || NEW.subject,
    left(NEW.message, 180),
    'system',
    '/dashboard'
  FROM public.user_profiles p
  WHERE p.role <> 'admin';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_announcement ON public.announcements;
CREATE TRIGGER trg_notify_announcement
  AFTER INSERT OR UPDATE OF status ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_announcement();

-- 2. Live chat messages -> notify the other side ----------------------------
CREATE OR REPLACE FUNCTION public.notify_on_chat_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_channel public.chat_channels%ROWTYPE;
BEGIN
  SELECT * INTO v_channel FROM public.chat_channels WHERE id = NEW.channel_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_role = 'admin' THEN
    -- Admin reply -> the channel owner
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      v_channel.user_id,
      'New chat reply',
      left(NEW.body, 180),
      'support',
      '/dashboard/live-chat'
    );
  ELSIF NEW.sender_role = 'user' THEN
    -- User message -> every admin gets an inbox notification
    INSERT INTO public.notifications (user_id, title, body, type, link)
    SELECT
      p.id,
      'New chat message',
      left(NEW.body, 180),
      'support',
      '/admin/live-chat'
    FROM public.user_profiles p
    WHERE p.role = 'admin';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_chat_message ON public.chat_messages;
CREATE TRIGGER trg_notify_chat_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_chat_message();

-- 3. Support ticket reply -> notify the ticket owner -------------------------
CREATE OR REPLACE FUNCTION public.notify_on_ticket_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.reply IS NOT NULL AND NEW.reply IS DISTINCT FROM OLD.reply THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      NEW.user_id,
      'Support ticket replied',
      'Your ticket "' || NEW.subject || '" has a new reply',
      'support',
      '/dashboard/support'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_ticket_reply ON public.support_tickets;
CREATE TRIGGER trg_notify_ticket_reply
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_ticket_reply();
