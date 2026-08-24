"use client";

import {
  Archive, ArrowLeft, ChevronDown, LoaderCircle, Mail, MailOpen,
  Reply, RotateCcw, Send, ShieldAlert, Star, Tag, Trash2,
} from "lucide-react";
import { displayDate, plainText, senderParts } from "@/lib/mail-format";
import { Label, MailFolder, MailMessage } from "@/types/mail";

type Props = {
  message: MailMessage | null;
  loading: boolean;
  labels: Label[];
  labelMenuOpen: boolean;
  onLabelMenu: () => void;
  onBack: () => void;
  onReply: () => void;
  onForward: () => void;
  onUpdate: (update: { isRead?: boolean; starred?: boolean; folder?: MailFolder; labelId?: string; labelAction?: "add" | "remove" }) => void;
};

function emailDocument(html: string, styles: string) {
  const head = `<meta name="viewport" content="width=device-width"><base target="_blank"><style>${styles}</style>`;
  const content = html.replace(/<!doctype[^>]*>/i, "").trim();

  if (/<html[\s>]/i.test(content)) {
    if (/<head[\s>]/i.test(content)) {
      return `<!doctype html>${content.replace(/<head([^>]*)>/i, `<head$1>${head}`)}`;
    }
    return `<!doctype html>${content.replace(/<html([^>]*)>/i, `<html$1><head>${head}</head>`)}`;
  }

  if (/<body[\s>]/i.test(content)) {
    return `<!doctype html><html><head>${head}</head>${content}</html>`;
  }

  return `<!doctype html><html><head>${head}</head><body>${content}</body></html>`;
}

export function Reader({
  message, loading, labels, labelMenuOpen, onLabelMenu, onBack, onReply, onForward, onUpdate,
}: Props) {
  if (!message) {
    return (
      <article className="reader">
        <div className="reader-empty">
          {loading ? <LoaderCircle className="spin" size={28} /> : <Mail size={32} />}
          <span>{loading ? "Loading message…" : "Select a message to read"}</span>
        </div>
      </article>
    );
  }

  const sender = senderParts(message.from);
  const inTrash = message.state.folder === "TRASH";
  const renderableHtml = message.html?.replace(
    /<img\b(?=[^>]*(?:width\s*=\s*["']?[01](?:["'\s>])|height\s*=\s*["']?[01](?:["'\s>])|style\s*=\s*["'][^"']*display\s*:\s*none|class\s*=\s*["'][^"']*(?:tracking|pixel|open)[^"']*["']|src\s*=\s*["'][^"']*\/tr\/op\/))[^>]*>/gi,
    "",
  );
  const isRichEmail = Boolean(renderableHtml && (
    /<(img|picture|svg)\b/i.test(renderableHtml)
    || /\b(background|background-color)\s*:/i.test(renderableHtml)
    || /\bbgcolor\s*=/i.test(renderableHtml)
  ));
  const emailStyles = isRichEmail
    ? "html{color-scheme:dark;background:#fff;filter:invert(.92) hue-rotate(180deg)}body{margin:0;padding:32px;background:#fff;font-family:Arial,sans-serif;overflow-wrap:anywhere}img,picture,video,svg{max-width:100%;height:auto;filter:invert(1) hue-rotate(180deg)}"
    : "html,body{color-scheme:dark;background:#111318!important;color:#dfe2e8!important}body{margin:0;padding:32px;font-family:Arial,sans-serif;line-height:1.7;overflow-wrap:anywhere}body *{background:transparent!important;color:#dfe2e8!important;-webkit-text-fill-color:#dfe2e8!important;opacity:1!important;box-shadow:none!important;text-shadow:none!important}a,a *{color:#aaa4ff!important;-webkit-text-fill-color:#aaa4ff!important}";
  return (
    <article className="reader">
      <div className="reader-actions">
        <div>
          <button className="icon-button reader-back" onClick={onBack} aria-label="Back to messages"><ArrowLeft size={18} /></button>
          {inTrash ? (
            <button className="icon-button" onClick={() => onUpdate({ folder: "INBOX" })} aria-label="Restore"><RotateCcw size={18} /></button>
          ) : (
            <>
              <button className="icon-button" onClick={() => onUpdate({ folder: "ARCHIVE" })} aria-label="Archive"><Archive size={18} /></button>
              <button className="icon-button" onClick={() => onUpdate({ folder: "TRASH" })} aria-label="Move to trash"><Trash2 size={18} /></button>
              <button className="icon-button" onClick={() => onUpdate({ folder: "SPAM" })} aria-label="Mark as spam"><ShieldAlert size={18} /></button>
            </>
          )}
          <button className="icon-button" onClick={() => onUpdate({ isRead: !message.state.isRead })} aria-label={message.state.isRead ? "Mark unread" : "Mark read"}>
            {message.state.isRead ? <Mail size={18} /> : <MailOpen size={18} />}
          </button>
        </div>
        <div className="label-menu-wrap">
          <button className="icon-button" onClick={onLabelMenu} aria-label="Manage labels"><Tag size={18} /></button>
          {labelMenuOpen && (
            <div className="label-menu">
              <strong>Labels</strong>
              {labels.map((label) => {
                const assigned = message.state.labels.some((item) => item.id === label.id);
                return (
                  <button key={label.id} onClick={() => onUpdate({ labelId: label.id, labelAction: assigned ? "remove" : "add" })}>
                    <span className="label-check">{assigned ? "✓" : ""}</span>
                    <i style={{ background: label.color }} />
                    <span>{label.name}</span>
                  </button>
                );
              })}
              {!labels.length && <small>Create a label from the sidebar first.</small>}
            </div>
          )}
        </div>
      </div>
      <div className="reader-content">
        <div className="subject-line">
          <span className="pill">{message.source === "SENT" ? "Sent" : "Inbox"}</span>
          <h2>{message.subject || "(no subject)"}</h2>
          <button className={`subject-star ${message.state.starred ? "starred" : ""}`} onClick={() => onUpdate({ starred: !message.state.starred })} aria-label="Toggle star">
            <Star size={19} fill={message.state.starred ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="from-row">
          <span className="large-avatar">{sender.initials}</span>
          <div><strong>{sender.name}</strong><span>&lt;{sender.email}&gt;</span><small>to {message.to.join(", ")} <ChevronDown size={12} /></small></div>
          <time>{displayDate(message.created_at)}</time>
          <button className="icon-button" onClick={onReply} aria-label="Reply"><Reply size={17} /></button>
        </div>
        <div className="message-body">
          {renderableHtml ? (
            <iframe
              className="email-frame"
              title={`Email: ${message.subject || "No subject"}`}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              srcDoc={emailDocument(renderableHtml, emailStyles)}
            />
          ) : (
            <div className="plain-email">{plainText(message).split("\n").map((line, index) => <p key={index}>{line || <>&nbsp;</>}</p>)}</div>
          )}
        </div>
        <div className="reply-actions">
          <button onClick={onReply}><Reply size={17} />Reply</button>
          <button onClick={onForward}><Send size={17} />Forward</button>
        </div>
      </div>
    </article>
  );
}
