"use client";

import { LogOut, Menu, Search, Settings, PenLine, RefreshCw, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Composer } from "./composer";
import { MessageList } from "./message-list";
import { Reader } from "./reader";
import { Sidebar } from "./sidebar";
import { Brand } from "@/components/brand";
import { senderParts } from "@/lib/mail-format";
import { Draft, Label, MailFolder, MailMessage, MailView } from "@/types/mail";

const viewTitles: Record<MailView, string> = {
  inbox: "Inbox",
  unread: "Unread",
  starred: "Starred",
  sent: "Sent",
  drafts: "Drafts",
  archive: "Archive",
  spam: "Spam",
  trash: "Trash",
  label: "Label",
};

const folderViews = new Set<MailView>([
  "inbox", "unread", "starred", "sent", "drafts", "archive", "spam", "trash",
]);

function mailboxPath(view: MailView, labelId?: string | null) {
  return view === "label" && labelId ? `/label/${encodeURIComponent(labelId)}` : `/${view}`;
}

type MailboxAppProps = {
  adminEmail: string;
  initialMessageId?: string;
  initialView?: MailView;
  initialLabelId?: string;
};

export function MailboxApp({
  adminEmail,
  initialMessageId,
  initialView = "inbox",
  initialLabelId,
}: MailboxAppProps) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<MailView>(initialView);
  const [activeLabelId, setActiveLabelId] = useState<string | null>(initialLabelId ?? null);
  const [labels, setLabels] = useState<Label[]>([]);
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selected, setSelected] = useState<MailMessage | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [readerLoading, setReaderLoading] = useState(Boolean(initialMessageId));
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerInitial, setComposerInitial] = useState<Partial<Draft> | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobileReading, setMobileReading] = useState(false);
  const [labelMenuOpen, setLabelMenuOpen] = useState(false);
  const [createLabelOpen, setCreateLabelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadLabels = useCallback(async () => {
    const response = await fetch("/api/labels");
    if (response.ok) setLabels(await response.json());
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/labels")
      .then((response) => response.ok ? response.json() : [])
      .then((result) => { if (active) setLabels(result); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      setSelected(null);
      try {
        if (activeView === "drafts") {
          const response = await fetch("/api/drafts");
          const result = await response.json();
          if (!response.ok) throw new Error(result.error);
          if (!active) return;
          setDrafts(result);
          setMessages(result.map((draft: Draft) => ({
            id: draft.id,
            from: adminEmail,
            to: draft.to ? [draft.to] : [],
            subject: draft.subject || "(no subject)",
            created_at: draft.updatedAt,
            source: "SENT",
            text: draft.message,
            state: { folder: "INBOX", isRead: true, starred: false, labels: [] },
          })));
          setHasMore(false);
          setNextCursor(null);
          return;
        }
        const params = new URLSearchParams({ view: activeView });
        const cursor = cursors[page];
        if (cursor) params.set("cursor", cursor);
        if (activeView === "label" && activeLabelId) params.set("label", activeLabelId);
        const response = await fetch(`/api/mailbox?${params}`);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        if (!active) return;
        setMessages(result.data);
        setHasMore(Boolean(result.hasMore));
        setNextCursor(result.nextCursor ?? null);
      } catch (cause) {
        if (active) {
          setMessages([]);
          setError(cause instanceof Error ? cause.message : "Unable to load mailbox.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [activeLabelId, activeView, adminEmail, cursors, page, refreshKey]);

  const loadDirectMessage = useCallback(async (
    id: string,
    source?: MailMessage["source"],
    showMobile = true,
  ) => {
    setSelected(null);
    setReaderLoading(true);
    if (showMobile) setMobileReading(true);
    try {
      const query = source ? `?source=${source}` : "";
      const response = await fetch(`/api/mailbox/${encodeURIComponent(id)}${query}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setSelected(result);
      setMessages((current) => current.map((item) =>
        item.id === id ? { ...item, state: { ...item.state, isRead: true } } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load message.");
    } finally {
      setReaderLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialMessageId) return;
    queueMicrotask(() => void loadDirectMessage(initialMessageId, undefined, false));
  }, [initialMessageId, loadDirectMessage]);

  useEffect(() => {
    function restoreUrlMessage() {
      const segments = window.location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
      if (segments[0] === "mail" && segments[1]) {
        void loadDirectMessage(segments[1], undefined, false);
        return;
      }
      setSelected(null);
      setMobileReading(false);
      if (segments[0] === "label" && segments[1]) {
        setActiveView("label");
        setActiveLabelId(segments[1]);
      } else if (folderViews.has(segments[0] as MailView)) {
        setActiveView(segments[0] as MailView);
        setActiveLabelId(null);
      } else {
        setActiveView("inbox");
        setActiveLabelId(null);
      }
      setPage(0);
      setCursors([null]);
    }
    window.addEventListener("popstate", restoreUrlMessage);
    return () => window.removeEventListener("popstate", restoreUrlMessage);
  }, [loadDirectMessage]);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return messages;
    return messages.filter((message) =>
      `${message.from} ${message.to.join(" ")} ${message.subject}`.toLowerCase().includes(value));
  }, [messages, query]);

  function changeView(view: MailView, labelId?: string) {
    setActiveView(view);
    setActiveLabelId(labelId ?? null);
    setPage(0);
    setCursors([null]);
    setMobileReading(false);
    setMobileNavOpen(false);
    setLabelMenuOpen(false);
    window.history.pushState({}, "", mailboxPath(view, labelId));
  }

  async function selectMessage(summary: MailMessage, showMobile = true) {
    if (activeView === "drafts") {
      const draft = drafts.find((item) => item.id === summary.id);
      if (draft) {
        setComposerInitial(draft);
        setComposerOpen(true);
      }
      return;
    }
    window.history.pushState({}, "", `/mail/${encodeURIComponent(summary.id)}`);
    await loadDirectMessage(summary.id, summary.source, showMobile);
  }

  async function updateMessage(
    message: MailMessage,
    update: { isRead?: boolean; starred?: boolean; folder?: MailFolder; labelId?: string; labelAction?: "add" | "remove" },
  ) {
    const response = await fetch(`/api/mailbox/${encodeURIComponent(message.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: message.source, ...update }),
    });
    const state = await response.json();
    if (!response.ok) {
      setError(state.error ?? "Unable to update message.");
      return;
    }
    const updated = { ...message, state };
    setSelected((current) => current?.id === message.id ? updated : current);
    setMessages((current) => current.map((item) => item.id === message.id ? updated : item));
    if (
      update.folder ||
      (activeView === "starred" && update.starred === false) ||
      (activeView === "unread" && update.isRead === true)
    ) {
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setSelected(null);
      setMobileReading(false);
      window.history.pushState({}, "", mailboxPath(activeView, activeLabelId));
    }
  }

  function nextPage() {
    if (!hasMore || !nextCursor) return;
    setCursors((current) => [...current.slice(0, page + 1), nextCursor]);
    setPage((current) => current + 1);
  }

  function openCompose(initial: Partial<Draft> | null = null) {
    setComposerInitial(initial);
    setComposerOpen(true);
  }

  function reply() {
    if (!selected) return;
    openCompose({
      to: senderParts(selected.from).email,
      subject: selected.subject.toLowerCase().startsWith("re:") ? selected.subject : `Re: ${selected.subject}`,
      replyToId: selected.id,
    });
  }

  function forward() {
    if (!selected) return;
    const content = selected.text
      ?? selected.html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      ?? "";
    openCompose({
      subject: selected.subject.toLowerCase().startsWith("fwd:") ? selected.subject : `Fwd: ${selected.subject}`,
      message: `\n\n---------- Forwarded message ----------\nFrom: ${selected.from}\nDate: ${new Date(selected.created_at).toLocaleString()}\nSubject: ${selected.subject}\nTo: ${selected.to.join(", ")}\n\n${content}`,
    });
  }

  async function createLabel(name: string, color: string) {
    const response = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (response.ok) {
      await loadLabels();
      setCreateLabelOpen(false);
    } else {
      const result = await response.json();
      setError(result.error ?? "Unable to create label.");
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const activeLabel = labels.find((label) => label.id === activeLabelId);
  const title = activeView === "label" ? activeLabel?.name ?? "Label" : viewTitles[activeView];

  return (
    <main className="mail-shell">
      <header className="topbar">
        <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open menu"><Menu size={19} /></button>
        <Brand />
        <button className="compose-button compact-compose" onClick={() => openCompose()}><PenLine size={17} /><span>Compose</span></button>
        <label className="search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search this page" /><kbd>/</kbd></label>
        <div className="top-actions">
          <button className="icon-button" onClick={() => setRefreshKey((value) => value + 1)} aria-label="Refresh"><RefreshCw size={18} /></button>
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Settings"><Settings size={18} /></button>
          <button className="avatar avatar-button" onClick={() => setAccountOpen((value) => !value)} aria-label="Account menu">{adminEmail.slice(0, 2).toUpperCase()}</button>
          {accountOpen && (
            <div className="account-menu">
              <div><span className="avatar">{adminEmail.slice(0, 2).toUpperCase()}</span><span><strong>Private mailbox</strong><small>{adminEmail}</small></span></div>
              <button onClick={() => { setAccountOpen(false); setSettingsOpen(true); }}><Settings size={16} />Settings</button>
              <button onClick={() => void logout()}><LogOut size={16} />Sign out</button>
            </div>
          )}
        </div>
      </header>
      <div className={`workspace ${mobileReading ? "mobile-reading" : ""}`}>
        <Sidebar
          activeView={activeView}
          activeLabelId={activeLabelId}
          labels={labels}
          open={mobileNavOpen}
          adminEmail={adminEmail}
          onClose={() => setMobileNavOpen(false)}
          onCompose={() => openCompose()}
          onView={changeView}
          onCreateLabel={() => setCreateLabelOpen(true)}
          onLogout={logout}
        />
        <MessageList
          title={title}
          messages={filtered}
          selectedId={selected?.id}
          loading={loading}
          error={error}
          query={query}
          page={page}
          hasMore={hasMore}
          onSelect={selectMessage}
          onPrevious={() => setPage((value) => Math.max(0, value - 1))}
          onNext={nextPage}
          onToggleStar={(message) => void updateMessage(message, { starred: !message.state.starred })}
        />
        <Reader
          message={selected}
          loading={readerLoading}
          labels={labels}
          labelMenuOpen={labelMenuOpen}
          onLabelMenu={() => setLabelMenuOpen((value) => !value)}
          onBack={() => {
            setSelected(null);
            setMobileReading(false);
            window.history.pushState({}, "", mailboxPath(activeView, activeLabelId));
          }}
          onReply={reply}
          onForward={forward}
          onUpdate={(update) => selected && void updateMessage(selected, update)}
        />
      </div>
      {composerOpen && (
        <Composer
          initial={composerInitial}
          onClose={() => setComposerOpen(false)}
          onSent={() => { setRefreshKey((value) => value + 1); setComposerInitial(null); }}
        />
      )}
      {createLabelOpen && (
        <CreateLabelDialog onClose={() => setCreateLabelOpen(false)} onCreate={createLabel} />
      )}
      {settingsOpen && (
        <SettingsDialog adminEmail={adminEmail} onClose={() => setSettingsOpen(false)} onLogout={logout} />
      )}
    </main>
  );
}

function SettingsDialog({ adminEmail, onClose, onLogout }: { adminEmail: string; onClose: () => void; onLogout: () => void }) {
  return (
    <div className="modal-backdrop">
      <section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header><div><span className="settings-icon"><Settings size={18} /></span><div><h2 id="settings-title">Mailbox settings</h2><p>Account and application details</p></div></div><button className="icon-button" onClick={onClose} aria-label="Close settings"><X size={18} /></button></header>
        <div className="settings-row"><UserRound size={18} /><div><strong>Administrator</strong><span>{adminEmail}</span></div></div>
        <div className="settings-row"><RefreshCw size={18} /><div><strong>Live Resend sync</strong><span>Messages refresh from your Resend account.</span></div></div>
        <footer><button onClick={() => void onLogout()}><LogOut size={16} />Sign out</button><button onClick={onClose}>Done</button></footer>
      </section>
    </div>
  );
}

function CreateLabelDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, color: string) => void }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7c6cf2");
  return (
    <div className="modal-backdrop">
      <form className="label-dialog" onSubmit={(event) => { event.preventDefault(); void onCreate(name, color); }}>
        <div><h2>New label</h2><button type="button" className="icon-button" onClick={onClose}><X size={18} /></button></div>
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} required autoFocus maxLength={30} /></label>
        <label>Color<input value={color} onChange={(event) => setColor(event.target.value)} type="color" /></label>
        <footer><button type="button" onClick={onClose}>Cancel</button><button type="submit">Create label</button></footer>
      </form>
    </div>
  );
}
