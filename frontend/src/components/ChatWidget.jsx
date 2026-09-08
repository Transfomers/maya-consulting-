import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, MessageSquare, RotateCcw, Send, Square, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useSettings } from "@/lib/SettingsContext";
import { CHAT } from "@/constants/testIds";
import {
  getChatSessionId,
  resetChatSessionId,
  streamCraftiAnswer,
  userMessageForStatus,
} from "@/lib/craftiChat";

const EASE = [0.16, 1, 0.3, 1];

let sequence = 0;
const nextId = () => (sequence += 1);

const ChatWidget = () => {
  const { t, lang } = useLang();
  const chat = t.chat;
  const settings = useSettings();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [answered, setAnswered] = useState([]);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const listRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const stopReply = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setThinking(false);
    setStreaming(false);
  }, []);

  const greet = useCallback(() => {
    stopReply();
    resetChatSessionId();
    setMessages([{ id: nextId(), from: "bot", text: chat.greeting }]);
    setAnswered([]);
    setDraft("");
  }, [chat, stopReply]);

  // Switching language restarts the conversation rather than leaving a mixed transcript.
  useEffect(() => {
    greet();
  }, [greet]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, thinking, streaming, open]);

  useEffect(() => {
    if (!open) return undefined;
    inputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const ask = useCallback(
    async (question, topicId) => {
      const text = question.trim();
      if (!text || thinking) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const botId = nextId();
      setMessages((prev) => [
        ...prev,
        { id: nextId(), from: "user", text },
        { id: botId, from: "bot", text: "" },
      ]);
      setDraft("");
      setThinking(true);
      setStreaming(false);
      if (topicId) {
        setAnswered((prev) => (prev.includes(topicId) ? prev : [...prev, topicId]));
      }

      try {
        await streamCraftiAnswer(text, {
          sessionId: getChatSessionId(),
          language: lang,
          controller,
          onToken: (_token, completeAnswer) => {
            setStreaming(true);
            setMessages((prev) =>
              prev.map((message) =>
                message.id === botId ? { ...message, text: completeAnswer } : message
              )
            );
          },
        });
      } catch (error) {
        if (error?.name === "AbortError") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === botId && !message.text
                ? { ...message, text: chat.cancelled }
                : message
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === botId
                ? {
                    ...message,
                    text: userMessageForStatus(error?.status, chat.errors),
                    isError: true,
                    ctaLabel: chat.fallbackCta,
                    ctaTo: "/contact",
                  }
                : message
            )
          );
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setThinking(false);
        setStreaming(false);
      }
    },
    [chat, lang, thinking]
  );

  const suggestions = useMemo(() => {
    const remaining = chat.topics.filter((topic) => !answered.includes(topic.id));
    return remaining.length ? remaining : chat.topics;
  }, [chat, answered]);

  const handleSubmit = (event) => {
    event.preventDefault();
    ask(draft);
  };

  const side = lang === "ar" ? "left-5" : "right-5";
  const logo = settings?.branding?.logo_light || "/assets/logo-mark-light.png";
  const showTyping = thinking && !streaming;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
            role="dialog"
            aria-label={chat.title}
            data-testid={CHAT.panel}
            className={`fixed bottom-24 z-[90] flex w-[calc(100vw-2.5rem)] max-w-sm flex-col border border-forest bg-bone ${side}`}
            style={{ height: "min(32rem, calc(100vh - 11rem))" }}
          >
            <header className="flex items-center gap-3 bg-forest px-4 py-3">
              <img src={logo} alt="" className="h-7 w-auto" />
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm font-bold tracking-tight text-bone">{chat.title}</p>
                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-bone/60">
                  <span className="inline-block h-1.5 w-1.5 bg-vivid" aria-hidden="true" />
                  {chat.status}
                </p>
              </div>
              <button
                type="button"
                onClick={greet}
                title={chat.restart}
                aria-label={chat.restart}
                data-testid={CHAT.restartButton}
                className="text-bone/70 transition-colors hover:text-bone"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title={chat.closeLabel}
                aria-label={chat.closeLabel}
                data-testid={CHAT.closeButton}
                className="text-bone/70 transition-colors hover:text-bone"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div
              ref={listRef}
              data-lenis-prevent
              data-testid={CHAT.messageList}
              aria-live="polite"
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.map((message) =>
                message.from === "bot" ? (
                  <div key={message.id} className="flex justify-start">
                    {message.text ? (
                      <div
                        data-testid={CHAT.botMessage}
                        className="max-w-[88%] border border-forest/15 bg-white px-3.5 py-3"
                      >
                        <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                          {message.text}
                        </p>
                        {message.ctaTo && (
                          <Link
                            to={message.ctaTo}
                            onClick={() => setOpen(false)}
                            data-testid={CHAT.answerLink}
                            className="mt-3 inline-flex items-center gap-1 border-b border-maple pb-0.5 font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-maple transition-colors hover:border-forest hover:text-forest"
                          >
                            {message.ctaLabel}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div key={message.id} className="flex justify-end">
                    <p
                      data-testid={CHAT.userMessage}
                      className="max-w-[88%] bg-forest px-3.5 py-3 text-[13px] leading-relaxed text-bone"
                    >
                      {message.text}
                    </p>
                  </div>
                )
              )}

              {showTyping && (
                <div className="flex justify-start">
                  <div
                    data-testid={CHAT.typingIndicator}
                    aria-label={chat.typing}
                    className="flex items-center gap-1.5 border border-forest/15 bg-white px-3.5 py-4"
                  >
                    {[0, 1, 2].map((dot) => (
                      <motion.span
                        key={dot}
                        className="h-1.5 w-1.5 bg-forest/60"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: dot * 0.18 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-forest/15 px-4 pb-3 pt-3">
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-sage">
                {chat.suggestionsLabel}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1" data-lenis-prevent>
                {suggestions.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => ask(topic.q, topic.id)}
                    disabled={thinking}
                    data-testid={CHAT.suggestion}
                    className="whitespace-nowrap border border-forest/25 px-3 py-1.5 text-[11px] font-semibold text-forest transition-colors hover:border-forest hover:bg-forest hover:text-bone disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {topic.q}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex items-stretch gap-2 border-t border-forest/15 bg-white p-3">
              <input
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={chat.placeholder}
                aria-label={chat.placeholder}
                data-testid={CHAT.input}
                disabled={thinking}
                className="min-w-0 flex-1 border border-forest/25 bg-bone px-3 py-2.5 text-[13px] text-ink transition-colors placeholder:text-sage/70 focus:border-forest focus:outline-none disabled:opacity-60"
              />
              {thinking ? (
                <button
                  type="button"
                  onClick={stopReply}
                  title={chat.cancelLabel}
                  aria-label={chat.cancelLabel}
                  data-testid={CHAT.cancelButton}
                  className="flex items-center justify-center bg-forest px-4 text-bone transition-colors hover:bg-maple"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  title={chat.sendLabel}
                  aria-label={chat.sendLabel}
                  data-testid={CHAT.sendButton}
                  className="flex items-center justify-center bg-forest px-4 text-bone transition-colors hover:bg-maple disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </form>

            <p className="bg-white px-4 pb-3 text-[10px] leading-snug text-sage">{chat.note}</p>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-label={open ? chat.closeLabel : chat.openLabel}
        data-testid={CHAT.launcher}
        className={`fixed bottom-5 z-[90] flex items-center gap-2 bg-forest px-4 py-3.5 text-bone transition-colors hover:bg-maple ${side}`}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageSquare className="h-5 w-5" />
            <span className="hidden font-heading text-[11px] font-bold uppercase tracking-[0.16em] sm:inline">
              {chat.launch}
            </span>
          </>
        )}
      </button>
    </>
  );
};

export default ChatWidget;
