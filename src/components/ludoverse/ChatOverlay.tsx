import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Smile, MessageCircle } from 'lucide-react';
import { AppAvatar, SkeletonBox, Toast } from './UIComponents';
import { ChatMessage, ScreenStateMode } from '../../types/ludoverse';

interface ChatOverlayProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  messages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
  currentUserId?: string;
  participantCount?: number;
  stateMode?: ScreenStateMode;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({
  isOpen,
  open,
  onClose,
  messages = [],
  onSendMessage = () => {},
  currentUserId = 'user-1',
  participantCount = 4,
  stateMode = 'DATA',
}) => {
  const isVisible = open !== undefined ? open : Boolean(isOpen);
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number>(0);
  const [toastAlert, setToastAlert] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isLoading = stateMode === 'LOADING';
  const isEmpty = stateMode === 'EMPTY';
  const isError = stateMode === 'ERROR';

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  });

  // 30 seconds auto-hide logic for live messages
  useEffect(() => {
    if (stateMode === 'EMPTY') {
      setActiveMessages([]);
      return;
    }

    const now = Date.now();
    const valid = messagesRef.current.filter((m) => {
      const ts = m.timestamp ?? m.time ?? now;
      return now - ts < 30000 || ts > now - 60000;
    });
    setActiveMessages(valid);

    const interval = setInterval(() => {
      const current = Date.now();
      setActiveMessages((prev) =>
        prev.filter((m) => {
          const ts = m.timestamp ?? m.time ?? current;
          return current - ts < 30000;
        })
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [stateMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputText.trim();

    // Rule: Block empty/whitespace-only messages
    if (!trimmed) return;

    // Rule: Max 200 chars
    if (trimmed.length > 200) {
      setToastAlert('Max 200 characters per message');
      return;
    }

    // Rule: Rate limit: 1 msg per 1 second (toast on spam)
    const now = Date.now();
    if (now - lastSentTime < 1000) {
      setToastAlert('Please wait 1 second before sending again');
      return;
    }

    setLastSentTime(now);
    onSendMessage(trimmed);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleSelectEmoji = (emoji: string) => {
    if (inputText.length + emoji.length <= 200) {
      setInputText((prev) => prev + emoji);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity">
      {/* Toast Alert */}
      {toastAlert && (
        <Toast message={toastAlert} type="error" onClose={() => setToastAlert(null)} />
      )}

      {/* 40% Screen Height Bottom Sheet */}
      <div className="w-full max-w-[420px] h-[40%] bg-white dark:bg-[#16213E] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden select-none animate-in slide-in-from-bottom duration-200">
        {/* Header: "Room Chat" title + participant count + X close button */}
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-sm font-semibold">Room Chat</h3>
            <span className="text-[11px] text-[#8D99AE] font-medium">
              ({participantCount} participants)
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 text-[#8D99AE] hover:text-current transition-all"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message simulation if error state */}
        {isError && (
          <div className="px-4 py-1.5 bg-red-500/15 text-center text-xs text-[#EF476F] font-semibold">
            Message failed to send. Tap to retry.
          </div>
        )}

        {/* Messages List (Scrollable, newest at bottom) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
          {isLoading ? (
            <div className="space-y-3">
              <SkeletonBox className="h-10 w-3/4" />
              <SkeletonBox className="h-10 w-1/2 ml-auto" />
              <SkeletonBox className="h-10 w-2/3" />
            </div>
          ) : isEmpty || activeMessages.length === 0 ? (
            /* Empty state: centered chat bubble icon + "No messages yet" */
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-full bg-slate-800/10 dark:bg-white/5 flex items-center justify-center text-[#8D99AE] mb-2">
                <MessageCircle className="w-6 h-6" />
              </div>
              <p className="text-xs text-[#8D99AE] font-medium">No messages yet</p>
            </div>
          ) : (
            activeMessages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              const formattedTime = new Date(msg.timestamp ?? msg.time ?? Date.now()).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 animate-in fade-in duration-200 ${
                    isMe ? 'flex-row-reverse' : ''
                  }`}
                >
                  <AppAvatar
                    photoUrl={msg.senderAvatar}
                    name={msg.senderName}
                    size={32}
                    className="w-8 h-8 text-[11px] shrink-0"
                  />

                  <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : ''}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[12px] text-[#8D99AE] font-normal">
                        {isMe ? 'You' : msg.senderName || 'Player'}
                      </span>
                      <span className="text-[10px] text-[#8D99AE]">{formattedTime}</span>
                    </div>

                    <div
                      className={`px-3.5 py-2 rounded-2xl text-[14px] leading-snug font-normal ${
                        isMe
                          ? 'bg-[#E63946] text-white rounded-tr-none'
                          : 'bg-black/5 dark:bg-white/10 text-current rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Emoji Picker Tray */}
        {showEmojiPicker && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-black/5 dark:bg-white/5">
            {['👋', '🎲', '🔥', '👏', '🎯', '😂'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelectEmoji(emoji)}
                className="w-8 h-8 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-base active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar (Bottom): Rounded text field + circular red Send button */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0"
        >
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#8D99AE] hover:text-current active:scale-95"
            aria-label="Pick emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={inputText}
            maxLength={200}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message..."
            className="flex-1 h-11 px-4 rounded-full bg-black/5 dark:bg-white/5 border border-slate-300 dark:border-slate-700/80 text-sm font-medium focus:outline-none focus:border-[#E63946]"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-11 h-11 rounded-full bg-[#E63946] text-white flex items-center justify-center hover:bg-[#d62839] active:scale-[0.97] disabled:opacity-40 transition-all shadow-md shrink-0"
            aria-label="Send message"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
