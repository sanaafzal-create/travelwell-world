/**
 * SSR-ONLY swap for `@/data/places`.
 *
 * zustand v4 renders from `getServerState || getInitialState` on the server, so
 * seeding the catalog with `setState` after the store is created is invisible to
 * a server render — and `create()` copies the api onto the hook, so the internal
 * `api.getServerState` cannot be patched from outside either. Measured: the store
 * reported 504 destinations while the component rendering from it saw 44.
 *
 * So the INITIAL state has to be right. This module re-exports `places.ts`
 * unchanged except for `DESTINATIONS`, which becomes the merged set — bundled
 * rows plus every dropped-in dossier. The prerender aliases `@/data/places` to
 * this file; the browser bundle never sees it, so the 6MB library stays out of
 * what a traveller downloads.
 */
export * from "../../src/data/places";
import { mergedDestinations } from "../lib/destination-batches";
import type { Destination } from "../../src/data/places";

export const DESTINATIONS = mergedDestinations() as unknown as Record<string, Destination[]>;
