export type MailSource = "RECEIVED" | "SENT";
export type MailFolder = "INBOX" | "ARCHIVE" | "SPAM" | "TRASH";
export type MailView =
  | "inbox"
  | "unread"
  | "starred"
  | "sent"
  | "drafts"
  | "archive"
  | "spam"
  | "trash"
  | "label";

export type Label = {
  id: string;
  name: string;
  color: string;
};

export type MailState = {
  folder: MailFolder;
  isRead: boolean;
  starred: boolean;
  labels: Label[];
};

export type MailMessage = {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  source: MailSource;
  text?: string | null;
  html?: string | null;
  state: MailState;
};

export type Draft = {
  id: string;
  to: string;
  subject: string;
  message: string;
  replyToId?: string | null;
  updatedAt: string;
};
