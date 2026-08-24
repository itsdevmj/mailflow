"use client";

import {
  Archive, FileText, Inbox, LogOut, Mail, Plus, Send, ShieldAlert,
  Star, Trash2, X,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Label, MailView } from "@/types/mail";

const folders: { id: MailView; label: string; icon: typeof Inbox }[] = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "unread", label: "Unread", icon: Mail },
  { id: "starred", label: "Starred", icon: Star },
  { id: "sent", label: "Sent", icon: Send },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "spam", label: "Spam", icon: ShieldAlert },
  { id: "trash", label: "Trash", icon: Trash2 },
];

type Props = {
  activeView: MailView;
  activeLabelId: string | null;
  labels: Label[];
  open: boolean;
  adminEmail: string;
  onClose: () => void;
  onCompose: () => void;
  onView: (view: MailView, labelId?: string) => void;
  onCreateLabel: () => void;
  onLogout: () => void;
};

export function Sidebar({
  activeView, activeLabelId, labels, open, adminEmail, onClose, onCompose,
  onView, onCreateLabel, onLogout,
}: Props) {
  return (
    <>
      {open && <button className="nav-backdrop" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="mobile-nav-header">
          <Brand />
          <button className="icon-button" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>
        <button className="sidebar-compose" onClick={onCompose}>
          <Plus size={18} /><span>Compose</span>
        </button>
        <nav aria-label="Mailbox folders">
          {folders.map(({ id, label, icon: Icon }) => (
            <button
              className={`nav-item ${activeView === id ? "active" : ""}`}
              key={id}
              onClick={() => onView(id)}
            >
              <Icon size={17} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="labels-title">
          <span>Labels</span>
          <button onClick={onCreateLabel} aria-label="Create label"><Plus size={15} /></button>
        </div>
        <div className="label-list">
          {labels.map((label) => (
            <button
              className={`nav-item ${activeView === "label" && activeLabelId === label.id ? "active" : ""}`}
              key={label.id}
              onClick={() => onView("label", label.id)}
            >
              <span className="label-dot" style={{ background: label.color }} />
              <span>{label.name}</span>
            </button>
          ))}
          {!labels.length && <p className="no-labels">No labels yet</p>}
        </div>
        <button className="account" onClick={onLogout} title="Sign out">
          <span className="avatar">{adminEmail.slice(0, 2).toUpperCase()}</span>
          <span><strong>Private mailbox</strong><small>{adminEmail}</small></span>
          <LogOut size={16} />
        </button>
      </aside>
    </>
  );
}
