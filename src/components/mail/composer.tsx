"use client";

import { LoaderCircle, Send, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Draft } from "@/types/mail";

type Props = {
  initial?: Partial<Draft> | null;
  onClose: () => void;
  onSent: () => void;
};

export function Composer({ initial, onClose, onSent }: Props) {
  const [draftId, setDraftId] = useState<string | undefined>(initial?.id);
  const [to, setTo] = useState(initial?.to ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [message, setMessage] = useState(initial?.message ?? "");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const saving = useRef(false);

  useEffect(() => {
    if ((!to && !subject && !message) || saving.current) return;
    const timeout = window.setTimeout(async () => {
      saving.current = true;
      try {
        const response = await fetch(draftId ? `/api/drafts/${draftId}` : "/api/drafts", {
          method: draftId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to, subject, message }),
        });
        const result = await response.json();
        if (response.ok && !draftId) setDraftId(result.id);
      } finally {
        saving.current = false;
      }
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [draftId, message, subject, to]);

  async function sendEmail(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setNotice("");
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, message, draftId }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Email could not be sent.");
      setNotice("Message sent");
      window.setTimeout(() => {
        onSent();
        onClose();
      }, 700);
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Unable to send email.");
    } finally {
      setSending(false);
    }
  }

  async function discard() {
    if (draftId) await fetch(`/api/drafts/${draftId}`, { method: "DELETE" });
    onClose();
  }

  return (
    <div className="composer" role="dialog" aria-modal="true" aria-label="New message">
      <div className="composer-header">
        <span>{draftId ? "Draft" : "New message"}</span>
        <button className="icon-button" onClick={onClose} aria-label="Close composer"><X size={18} /></button>
      </div>
      <form onSubmit={sendEmail}>
        <label className="composer-field"><span>To</span><input value={to} onChange={(event) => setTo(event.target.value)} type="email" required placeholder="recipient@example.com" /></label>
        <label className="composer-field"><span>Subject</span><input value={subject} onChange={(event) => setSubject(event.target.value)} required placeholder="What is this about?" /></label>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required placeholder="Write your message…" />
        {notice && <div className={notice === "Message sent" ? "notice success" : "notice"}>{notice}</div>}
        <div className="composer-footer">
          <button type="submit" className="send-button" disabled={sending}>
            {sending ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}
            {sending ? "Sending…" : "Send"}
          </button>
          <span className="draft-status">{draftId ? "Saved" : ""}</span>
          <button type="button" className="icon-button delete-draft" onClick={discard} aria-label="Discard draft"><Trash2 size={18} /></button>
        </div>
      </form>
    </div>
  );
}
