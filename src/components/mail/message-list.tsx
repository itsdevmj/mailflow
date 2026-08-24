"use client";

import {
  ChevronLeft, ChevronRight, Inbox, LoaderCircle, ShieldAlert, Star,
} from "lucide-react";
import { displayDate, senderParts } from "@/lib/mail-format";
import { MailMessage } from "@/types/mail";

type Props = {
  title: string;
  messages: MailMessage[];
  selectedId?: string;
  loading: boolean;
  error: string;
  query: string;
  page: number;
  hasMore: boolean;
  onSelect: (message: MailMessage) => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleStar: (message: MailMessage) => void;
};

export function MessageList({
  title, messages, selectedId, loading, error, query, page, hasMore,
  onSelect, onPrevious, onNext, onToggleStar,
}: Props) {
  return (
    <section className="message-list">
      <div className="list-header">
        <div><h1>{title}</h1><p>{loading ? "Syncing mailbox…" : `${messages.length} messages`}</p></div>
      </div>
      <div className="mail-items">
        {loading && <div className="empty-state"><LoaderCircle className="spin" size={24} /><span>Loading messages</span></div>}
        {!loading && error && <div className="empty-state error-state"><ShieldAlert size={24} /><span>{error}</span></div>}
        {!loading && !error && messages.map((message) => {
          const sender = senderParts(message.from);
          return (
            <button
              className={`mail-item ${message.id === selectedId ? "selected" : ""} ${message.state.isRead ? "is-read" : "is-unread"}`}
              key={`${message.source}-${message.id}`}
              onClick={() => onSelect(message)}
            >
              <span className="unread-indicator" />
              <span className="mail-avatar">{sender.initials}</span>
              <span className="mail-copy">
                <span className="sender-row"><strong>{sender.name}</strong><time>{displayDate(message.created_at)}</time></span>
                <b>{message.subject || "(no subject)"}</b>
                <span className="preview">To: {message.to.join(", ")}</span>
                {!!message.state.labels.length && <span className="message-labels">{message.state.labels.map((label) => <i key={label.id} style={{ color: label.color }}>{label.name}</i>)}</span>}
              </span>
              <span
                role="button"
                tabIndex={0}
                className={`mail-star ${message.state.starred ? "starred" : ""}`}
                onClick={(event) => { event.stopPropagation(); onToggleStar(message); }}
                onKeyDown={(event) => { if (event.key === "Enter") onToggleStar(message); }}
                aria-label={message.state.starred ? "Remove star" : "Add star"}
              >
                <Star size={15} fill={message.state.starred ? "currentColor" : "none"} />
              </span>
            </button>
          );
        })}
        {!loading && !error && !messages.length && (
          <div className="empty-state"><Inbox size={27} /><span>{query ? "No matching messages" : "Nothing here yet"}</span></div>
        )}
      </div>
      <footer className="pagination-footer">
        <button disabled={page === 0 || loading} onClick={onPrevious}><ChevronLeft size={16} /><span>Previous</span></button>
        <div><strong>{page + 1}</strong><span>Page</span></div>
        <button disabled={!hasMore || loading} onClick={onNext}><span>Next</span><ChevronRight size={16} /></button>
      </footer>
    </section>
  );
}
