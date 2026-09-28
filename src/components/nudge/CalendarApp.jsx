import React from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { upcomingBookings, durationLabel, bookingWhen } from "@/lib/nudge/bookingStore";
import { clockLabel, shortDayLabel } from "@/lib/nudge/localTime";

/** Every appointment booked or brought in, grouped by the day it falls on. */
export default function CalendarApp({ bookings, onCancel }) {
  const soon = upcomingBookings(bookings);

  // Already in time order, so consecutive days group in one pass.
  const days = [];
  soon.forEach((booking) => {
    const at = new Date(bookingWhen(booking));
    const label = shortDayLabel(at);
    let day = days[days.length - 1];
    if (!day || day.label !== label) {
      day = { label, items: [] };
      days.push(day);
    }
    day.items.push(booking);
  });

  if (!soon.length) {
    return (
      <div className="nudge-cal-empty">
        <CalendarDays className="w-5 h-5" />
        <p>
          Nothing booked yet.
          <br />
          Open Booking to add your first appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="nudge-cal">
      {days.map((day) => (
        <div key={day.label} className="nudge-cal-day">
          <p className="nudge-cal-label">{day.label}</p>
          {day.items.map((booking) => (
            <div key={booking.id} className="nudge-cal-item">
              <span className="nudge-cal-time">{clockLabel(new Date(bookingWhen(booking)))}</span>
              <span className="nudge-cal-body">
                <span className="nudge-cal-title">{booking.title}</span>
                <span className="nudge-cal-sub">
                  {[durationLabel(booking.minutes), booking.where, booking.who].filter(Boolean).join(" · ") ||
                    `Ref ${booking.ref}`}
                </span>
              </span>
              <button
                type="button"
                className="nudge-cal-x"
                onClick={() => onCancel(booking.id)}
                aria-label={`Cancel ${booking.title}`}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}