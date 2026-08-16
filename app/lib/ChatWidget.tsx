"use client";

import { useEffect, useRef, useState } from "react";
import { botGreeting, botReply, type BotLanguage } from "./chat-bot";

type Msg = { from: "bot" | "user"; text: string };

export function ChatWidget({ lang, lineId, lineHref }: { lang: BotLanguage; lineId: string; lineHref: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-greet when language changes
  useEffect(() => {
    setMsgs([{ from: "bot", text: botGreeting[lang] }]);
  }, [lang]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMsgs((prev) => [...prev, { from: "user", text }]);
    setTyping(true);
    setTimeout(() => {
      const reply = botReply(text, lang, lineId);
      setMsgs((prev) => [...prev, { from: "bot", text: reply }]);
      setTyping(false);
    }, 600);
  }

  return (
    <>
      <button
        className="chat-widget-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with SDDP"
        aria-expanded={open}
      >
        {open ? "✕" : "💬"}
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
                {m.text.split("\n").map((line, j) => (
                  <span key={j}>{line}{j < m.text.split("\n").length - 1 && <br />}</span>
                ))}
              </div>
            ))}
            {typing && <div className="chat-msg chat-msg--bot chat-msg--typing"><span /><span /><span /></div>}
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

          <a className="chat-widget-line" href={lineHref} target="_blank" rel="noreferrer">
            <img src="/brand-logo.jpg" alt="" />
            <span>{lang === "th" ? "คุยกับทีมงานจริงบน Line" : lang === "my" ? "Line တွင် တကယ့်ဝန်ထမ်းနှင့် စကားပြောရန်" : "Talk to a real person on Line"}<b> @{lineId}</b></span>
          </a>
        </div>
      )}
    </>
  );
}
