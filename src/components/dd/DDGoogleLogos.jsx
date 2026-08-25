import React from "react";

// Official-style SVG logos for Google Workspace apps and ChatGPT

export function GoogleDriveLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 87.3 78" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="m6.6 66.85 3.5 6.05c.73 1.26 2.01 2.03 3.43 2.03h23.99l-7.13-12.35H10.08c-1.42 0-2.7.77-3.43 2.03z" fill="#1da461" />
      <path d="m32.54 42.25-7.13 12.35 7.13 12.35 7.13-12.35-7.13-12.35z" fill="#ffce45" />
      <path d="m46.11 66.85-7.13 12.35h35.5c1.42 0 2.7-.77 3.43-2.03l3.5-6.05-13.93-24.12z" fill="#ea4335" />
      <path d="m67.48 42.25-13.93-24.12-7.13 12.35 13.93 24.12z" fill="#4285f4" />
      <path d="m6.6 66.85 3.5-6.05 13.93-24.12-3.5-6.05c-.73-1.26-2.01-2.03-3.43-2.03l-10.5 18.2z" fill="#1e8e3e" />
      <path d="m46.11 66.85-7.13-12.35h-14.26l-7.13 12.35z" fill="#fbbc04" />
      <path d="m67.48 42.25 7.13-12.35-3.5-6.05c-.73-1.26-2.01-2.03-3.43-2.03h-21.06l7.13 12.35z" fill="#34a853" />
    </svg>
  );
}

export function GoogleDocsLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#4285f4" />
      <path d="M14 2l6 6h-6V2z" fill="#a1c2fa" />
      <path d="M8 13h8v1.5H8zm0 3h8v1.5H8zm0-6h5v1.5H8z" fill="#fff" />
    </svg>
  );
}

export function GoogleCalendarLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z" fill="#fff" />
      <path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v5H3V4z" fill="#4285f4" />
      <path d="M5 2v3M19 2v3" stroke="#ea4335" stroke-width="2" stroke-linecap="round" />
      <rect x="3" y="9" width="18" height="12" fill="none" stroke="#dadce0" stroke-width="1" />
      <text x="12" y="18" text-anchor="middle" font-size="8" font-family="Arial" font-weight="bold" fill="#4285f4">31</text>
    </svg>
  );
}

export function GmailLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#fff" stroke="#dadce0" stroke-width="0.5" />
      <path d="M2 6l10 7L22 6" fill="none" stroke="#ea4335" stroke-width="2" stroke-linejoin="round" />
      <path d="M2 6l10 7L22 6v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" fill="none" stroke="#4285f4" stroke-width="0" />
      <path d="M2.5 19.5L9 13M21.5 19.5L15 13" stroke="#34a853" stroke-width="1.5" stroke-linecap="round" />
      <path d="M2 7l10 7 10-7" fill="none" stroke="#ea4335" stroke-width="2" />
    </svg>
  );
}

export function GoogleSheetsLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#0f9d58" />
      <path d="M14 2l6 6h-6V2z" fill="#87ceac" />
      <path d="M8 13h8v1.5H8zm0 3h8v1.5H8zm0-6h5v1.5H8z" fill="#fff" />
      <rect x="8" y="13" width="2" height="1.5" fill="#0f9d58" opacity="0.3" />
    </svg>
  );
}

export function ChatGPTLogo({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.765.765 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.106v-5.678a.79.79 0 0 0-.407-.668zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.408 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.45l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

// Map connector integration type to logo component
export const GOOGLE_LOGOS = {
  googledrive: GoogleDriveLogo,
  googledocs: GoogleDocsLogo,
  googlesheets: GoogleSheetsLogo,
  googlecalendar: GoogleCalendarLogo,
  gmail: GmailLogo,
  chatgpt: ChatGPTLogo,
  "google drive": GoogleDriveLogo,
  "google docs": GoogleDocsLogo,
  "google sheets": GoogleSheetsLogo,
  "google calendar": GoogleCalendarLogo,
};