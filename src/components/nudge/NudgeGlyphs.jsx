/**
 * The marks NUDGE draws itself. Booking was the one action still wearing the
 * store's generic sparkle, so it gets its own: an appointment card with a tick
 * through it — the booking, confirmed.
 */
export function BookItGlyph({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1.9" y="2.7" width="12.2" height="11.4" rx="3.1" />
      <path d="M5.35 8.5 7.25 10.4l3.5-4" />
    </svg>
  );
}