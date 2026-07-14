/**
 * TravelWell.World — Atlas conversation hook (the persistent spine).
 *
 * Wraps the store-backed Atlas conversation so any surface (the dock, later the
 * guided flow) can read the same history and send messages. The conversation
 * lives in the store (persisted, survives navigation + reload), so this hook is
 * just the send loop: append the traveler's message, ground Atlas, append the
 * reply. Nothing here owns state — that's the point.
 */
import { useStore } from "@/store/useStore";
import { askAtlas } from "@/lib/supabase";
import { buildAtlasContext } from "@/lib/insights";

// How many recent turns we actually send to the model. History can grow to the
// store cap (50); we send a tighter window to keep cost + latency in check while
// the full conversation stays visible to the traveler.
const SEND_WINDOW = 12;

export function useAtlas() {
  const messages = useStore((s) => s.atlasMessages);
  const busy = useStore((s) => s.atlasBusy);
  const primed = useStore((s) => s.atlasPrimed);
  const dock = useStore((s) => s.atlasDock);

  async function send(text: string) {
    const trimmed = text.trim();
    const st = useStore.getState();
    if (!trimmed || st.atlasBusy) return;
    // Sending always implies the intro is behind us, so the message renders.
    if (!st.atlasPrimed) st.setAtlasPrimed(true);
    st.addAtlasMessage({ role: "user", content: trimmed });
    st.setAtlasBusy(true);
    try {
      // Ground Atlas in the live journey (Travel I.D., SI/region/trip, curated
      // happenings) and send a recent window of the conversation.
      const ctx = await buildAtlasContext();
      const history = useStore.getState().atlasMessages.slice(-SEND_WINDOW);
      const { reply } = await askAtlas(history, ctx, useStore.getState().locale);
      useStore.getState().addAtlasMessage({ role: "assistant", content: reply });
    } finally {
      useStore.getState().setAtlasBusy(false);
    }
  }

  return {
    messages,
    busy,
    primed,
    dock,
    send,
    setMessages: useStore.getState().setAtlasMessages,
    setPrimed: useStore.getState().setAtlasPrimed,
    open: useStore.getState().openAtlas,
    collapse: useStore.getState().collapseAtlas,
    hide: useStore.getState().hideAtlas,
    reset: useStore.getState().resetAtlas,
  };
}
