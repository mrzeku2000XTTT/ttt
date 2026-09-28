// The exact output of a real run of the agent, on this schedule. The landing
// preview and the sample cards both read from here, so nothing on the page is a
// figure we made up.

export const SAMPLE_SCHEDULE = `Mon Sep 28 · 09:30-10:15 · Design review with Ana and Priya @ Zoom
Mon Sep 28 · 11:00-11:30 · Dentist @ 220 Oak Street (20 min drive)
Mon Sep 28 · 12:00-12:30 · Lunch with Sam @ Cafe Lune
Mon Sep 28 · 13:30-15:00 · Client onboarding call @ Google Meet
Mon Sep 28 · 15:15-16:00 · Ship release notes — needs the changelog from Priya
Mon Sep 28 · 18:30-19:30 · Yoga class @ Studio 4`;

export const SAMPLE_BRIEF = {
  headline: "Monday — 6 things, first at 9:30",
  dateLabel: "Monday, September 28",
  notifications: [
    { app: "Calendar", time: "9:30 AM", title: "Design review", body: "The meeting with Ana and Priya is starting.", detail: "Location is Zoom.", tone: "now" },
    { app: "Maps", time: "in 18 min", title: "Dentist", body: "The drive to 220 Oak Street takes twenty minutes.", detail: "Appointment is at 11:00 AM.", tone: "heads-up" },
    { app: "Calendar", time: "11:00 AM", title: "Dentist", body: "Your appointment is at 220 Oak Street.", detail: "", tone: "next" },
    { app: "Calendar", time: "12:00 PM", title: "Lunch with Sam", body: "You are meeting at Cafe Lune.", detail: "", tone: "later" },
    { app: "Calendar", time: "1:30 PM", title: "Client onboarding call", body: "The meeting is held on Google Meet.", detail: "", tone: "later" },
    { app: "Reminders", time: "3:15 PM", title: "Ship release notes", body: "The release notes task is scheduled.", detail: "Requires the changelog from Priya.", tone: "later" },
    { app: "Calendar", time: "6:30 PM", title: "Yoga class", body: "Your class is at Studio 4.", detail: "", tone: "later" },
  ],
};