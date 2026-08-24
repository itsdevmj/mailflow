import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getResendEmail, listResendEmails, ResendEmail } from "@/lib/resend-mail";

const PAGE_SIZE = 12;
const stateViews = new Set(["starred", "archive", "spam", "trash", "label"]);

type StateWithLabels = {
  id: string;
  emailId: string;
  source: "RECEIVED" | "SENT";
  folder: "INBOX" | "ARCHIVE" | "SPAM" | "TRASH";
  isRead: boolean;
  starred: boolean;
  labels: { label: { id: string; name: string; color: string } }[];
};

function message(
  email: ResendEmail,
  state?: StateWithLabels | null,
  source: "RECEIVED" | "SENT" = "RECEIVED",
) {
  return {
    ...email,
    source: state?.source ?? source,
    state: {
      folder: state?.folder ?? "INBOX",
      isRead: state?.isRead ?? false,
      starred: state?.starred ?? false,
      labels: state?.labels.map(({ label }) => label) ?? [],
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const view = request.nextUrl.searchParams.get("view") ?? "inbox";
    const cursor = request.nextUrl.searchParams.get("cursor");
    const labelId = request.nextUrl.searchParams.get("label");

    if (stateViews.has(view)) {
      const where = view === "starred"
        ? { starred: true }
        : view === "label" && labelId
          ? { labels: { some: { labelId } } }
          : { folder: view.toUpperCase() as "ARCHIVE" | "SPAM" | "TRASH" };
      const states = await db.emailState.findMany({
        where,
        include: { labels: { include: { label: true } } },
        orderBy: { updatedAt: "desc" },
        take: PAGE_SIZE + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      const hasMore = states.length > PAGE_SIZE;
      const pageStates = states.slice(0, PAGE_SIZE) as StateWithLabels[];
      const messages = (await Promise.all(pageStates.map(async (state) => {
        try {
          return message(await getResendEmail(state.emailId, state.source), state);
        } catch {
          return null;
        }
      }))).filter(Boolean);
      return NextResponse.json({
        data: messages,
        hasMore,
        nextCursor: hasMore ? pageStates.at(-1)?.id : null,
      });
    }

    const source = view === "sent" ? "SENT" : "RECEIVED";
    const result = await listResendEmails(source, PAGE_SIZE, cursor);
    const ids = result.data.map((email) => email.id);
    const states = await db.emailState.findMany({
      where: { emailId: { in: ids }, source },
      include: { labels: { include: { label: true } } },
    }) as StateWithLabels[];
    const byId = new Map(states.map((state) => [state.emailId, state]));
    const messages = result.data
      .map((email) => message(email, byId.get(email.id), source))
      .filter((email) => {
        if (view === "sent") return true;
        if (email.state.folder !== "INBOX") return false;
        return view !== "unread" || !email.state.isRead;
      });

    return NextResponse.json({
      data: messages,
      hasMore: result.has_more,
      nextCursor: result.has_more ? result.data.at(-1)?.id : null,
    });
  } catch (cause) {
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : "Unable to load mailbox." },
      { status: 500 },
    );
  }
}
