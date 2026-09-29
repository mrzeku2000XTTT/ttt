import { EVENT_COLOR } from "./constants";

/**
 * EventService — every meaningful thing that happens becomes an event.
 * The right-hand live feed reads straight from here.
 */
export class EventService {
  constructor(limit = 600) {
    this.limit = limit;
    this.events = [];
    this.seq = 0;
  }

  push(e) {
    const ev = {
      id: `E${++this.seq}`,
      day: 0,
      clock: "00:00",
      amount: 0,
      category: "WORLD",
      color: EVENT_COLOR.WORLD,
      ...e,
    };
    ev.color = EVENT_COLOR[ev.category] || EVENT_COLOR.WORLD;
    this.events.unshift(ev);
    if (this.events.length > this.limit) this.events.length = this.limit;
    return ev;
  }

  recent(n = 40, category) {
    if (!category || category === "ALL") return this.events.slice(0, n);
    return this.events.filter((e) => e.category === category).slice(0, n);
  }

  count() {
    return this.seq;
  }
}