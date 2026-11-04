/* =====================================================================
   room.ts — the state every work page ("room") shares.
   Inside the home page a room is loaded early in an iframe (?embed) and sits
   out of sight: nothing plays until the home page says {wall:'enter'}.
   Messages in:  {wall:'enter'|'exit'|'reset'|'mode'}   (mode is applied by lib/runtime)
   Messages out: {wall:'close'} (back button, Esc)  ·  {wall:'go', to} (runtime go())
   ===================================================================== */
import { isEmbed } from "@/lib/runtime";

export type RoomEvent = "enter" | "exit" | "reset";
type Fn = (e: RoomEvent) => void;

export const room = { embed: false, live: true, ls: new Set<Fn>() };

export const onRoom = (fn: Fn) => { room.ls.add(fn); return () => { room.ls.delete(fn); }; };
export const emitRoom = (e: RoomEvent) => room.ls.forEach(f => { try { f(e); } catch (err) { console.error(err); } });

/** called once by <Room/> before the templates' own effects need it */
export function initRoomFlags() {
  room.embed = isEmbed();
  room.live = !room.embed;
}

const ORIGIN = () => (location.origin === "null" ? "*" : location.origin);
if (typeof window !== "undefined") initRoomFlags();

export const BACK_HREF = "/work";

/** leave the room: back to the doors */
export function closeRoom() {
  if (room.embed) parent.postMessage({ wall: "close" }, ORIGIN());
  // a full page load, like every other cross-page link on the site (the doors live on the home page)
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  else location.href = BACK_HREF;
}

/** an overlay of the shared chrome (menu, request form) is open: Esc belongs to it */
export const layerOpen = () => !!document.querySelector("#navm:not([hidden]), #modal:not([hidden])");
