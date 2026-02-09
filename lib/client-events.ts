export async function emitEvent(type: string, payload: any) {
  try {
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    });
  } catch (e) {
    // ignore for now
  }
}
