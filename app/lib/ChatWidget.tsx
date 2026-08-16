"use client";

import { useEffect, useRef, useState } from "react";
import { botGreeting, botReply, type BotLanguage } from "./chat-bot";

type Msg = { from: "bot" | "user"; text: string };

export function ChatWidget({ lang, lineId }: { lang: BotLanguage; lineId: string; lineHref: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMsgs([{ from: "bot", text: botGreeting[lang] }]);
  }, [lang]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const next: Msg[] = [...msgs, { from: "user", text }];
    setMsgs(next);
    setTyping(true);
    setTimeout(() => {
      setMsgs([...next, { from: "bot", text: botReply(text, lang, lineId) }]);
      setTyping(false);
    }, 600);
  }

  return (
    <>
      <button
        className={`chat-widget-btn${open ? " is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with SDDP"
        aria-expanded={open}
      >
        {open ? "✕" : <img src="/brand-logo.jpg" alt="SDDP chat" />}
      </button>

      {open && (
        <div className="chat-widget-panel" role="dialog" aria-label="SDDP Chat">
          <div className="chat-widget-header">
            <img src="/brand-logo.jpg" alt="SDDP" />
            <div>
              <b>SDDP Assistant</b>
              <small>Ask anything about the apartment</small>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat">✕</button>
          </div>

          <div className="chat-widget-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg chat-msg--${m.from}`}>
                {m.text.split("\n").map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                ))}
              </div>
            ))}
            {typing && (
              <div className="chat-msg chat-msg--bot chat-msg--typing">
                <span /><span /><span />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-widget-input">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={lang === "th" ? "พิมพ์ที่นี่…" : lang === "my" ? "ဒီမှာ ရိုက်ပါ…" : "Type a question…"}
            />
            <button onClick={send} disabled={!input.trim()} aria-label="Send">↑</button>
          </div>
        </div>
      )}
    </>
  );
}
