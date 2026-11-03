'use client';

import { useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MAX_MESSAGE_LENGTH = 2000;

type MessageComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder: string;
  actionLabel: string;
  inputLabel: string;
};

export function MessageComposer({
  value,
  onChange,
  onSubmit,
  disabled = false,
  sending = false,
  placeholder,
  actionLabel,
  inputLabel,
}: MessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [value]);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <form onSubmit={onSubmit} className="shrink-0 border-t border-white/[0.07] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pb-4">
      <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#11111a] px-1.5 py-1.5 transition-colors focus-within:border-primary-500/55 focus-within:ring-2 focus-within:ring-primary-500/10">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={inputLabel}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          disabled={disabled || sending}
          className="max-h-32 min-h-11 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent px-2.5 py-3 text-base leading-5 text-white placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
        />
        <Button
          type="submit"
          size="icon"
          aria-label={actionLabel}
          title={actionLabel}
          loading={sending}
          disabled={!value.trim() || disabled}
          className="mb-0.5 h-10 w-10 shrink-0 rounded-xl p-0 sm:h-11 sm:w-auto sm:px-4"
        >
          {!sending && <Send aria-hidden="true" />}
          <span className="hidden sm:inline">{actionLabel}</span>
        </Button>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-3 px-1 text-[10px] text-muted-foreground/75 sm:text-[11px]">
        <span>Enter to send <span className="px-0.5 text-white/25">·</span> Shift+Enter for a new line</span>
        <span className="shrink-0 tabular-nums">{value.length}/{MAX_MESSAGE_LENGTH}</span>
      </div>
    </form>
  );
}
