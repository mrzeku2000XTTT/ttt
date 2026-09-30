export default function replayReducer(events, index) {
  const event = events[index];
  if (!event) return {windows:[],activeApp:''};
  // Pure historical state projection. No clients, writes, dispatch or inference.
  return event.view_state || {windows:[],activeApp:''};
}