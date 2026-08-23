// Shared sample workspace data for DD — matches the reference dashboard.
export const DD_USER = { name: "Alex Smith", plan: "Premium" };

export const DD_EVENTS = [
  { id: "e1", title: "Client call", time: "10:00 AM – 11:00 AM", icon: "📞" },
  { id: "e2", title: "Project review", time: "2:00 PM – 3:00 PM", icon: "📋" },
  { id: "e3", title: "Design sync", time: "4:30 PM – 5:00 PM", icon: "🎨" },
];

export const DD_PRIORITIES = [
  { id: "p1", title: "Reply to Sarah's email", done: false },
  { id: "p2", title: "Review Q2 presentation", done: false },
  { id: "p3", title: "Prepare client call", done: true },
];

export const DD_FILES = [
  { id: "f1", name: "Q2 Presentation", app: "Google Slides", icon: "🖼️" },
  { id: "f2", name: "Marketing Plan 2026", app: "Google Docs", icon: "📄" },
  { id: "f3", name: "Budget Tracker", app: "Google Sheets", icon: "📊" },
  { id: "f4", name: "Brand Guidelines", app: "Google Drive", icon: "📁" },
];

export const DD_EMAILS = [
  { id: "m1", sender: "Sarah Johnson", time: "9:24 AM", initials: "SJ", color: "bg-rose-100 text-rose-600" },
  { id: "m2", sender: "Michael Chen", time: "8:50 AM", initials: "MC", color: "bg-sky-100 text-sky-600" },
  { id: "m3", sender: "Design Team", time: "Yesterday", initials: "DT", color: "bg-violet-100 text-violet-600" },
  { id: "m4", sender: "Alex Smith", time: "Yesterday", initials: "AS", color: "bg-amber-100 text-amber-600" },
];

export const DD_INSIGHTS = [
  { id: "i1", text: "Reply to client" },
  { id: "i2", text: "Meeting at 2:00 PM" },
  { id: "i3", text: "Review presentation" },
];

export const DD_CONNECTED = [
  { id: "c1", name: "Gmail", status: "Connected", color: "bg-rose-50 text-rose-500", letter: "G" },
  { id: "c2", name: "Google Calendar", status: "Connected", color: "bg-sky-50 text-sky-500", letter: "C" },
  { id: "c3", name: "Google Drive", status: "Connected", color: "bg-amber-50 text-amber-500", letter: "D" },
  { id: "c4", name: "Slack", status: "Connected", color: "bg-violet-50 text-violet-500", letter: "S" },
  { id: "c5", name: "Notion", status: "Connected", color: "bg-neutral-100 text-neutral-700", letter: "N" },
  { id: "c6", name: "Microsoft Outlook", status: "Connected", color: "bg-blue-50 text-blue-500", letter: "O" },
];

export const DD_ACTIVITY = [
  { id: "a1", text: "DD created a calendar event", time: "2m ago", icon: "📅" },
  { id: "a2", text: "Email summarized", time: "14m ago", icon: "✉️" },
  { id: "a3", text: "File uploaded to Drive", time: "1h ago", icon: "📁" },
  { id: "a4", text: "Task completed", time: "3h ago", icon: "✅" },
];

export const DD_QUICK_ACTIONS = [
  "Summarize my emails",
  "What's on my calendar?",
  "Find my latest presentation",
  "Create a meeting",
  "More",
];