"use client";
import { useEffect, useRef } from "react";
import { DOORS } from "@/lib/content";
import { mountDoors } from "./doors/wall";
import { initRoutes } from "./doors/routes";
import "./doors.css";

/** the wall of doors: hover cracks a door open, click walks you through it into the work page (iframe layer) */
export default function Doors() {
  const ref = useRef<HTMLElement>(null);
  const badge = useRef<HTMLDivElement>(null), veil = useRef<HTMLDivElement>(null), shade = useRef<HTMLDivElement>(null);
  const passage = useRef<HTMLDivElement>(null), wallv = useRef<HTMLDivElement>(null);
  // true while a door's page is open (or being walked into / out of): the address bar belongs to the door then
  const wall = useRef({ open: false });

  useEffect(() => initRoutes(() => wall.current.open), []);
  useEffect(() => {
    const sec = ref.current;
    if (!sec || !badge.current || !veil.current || !shade.current || !passage.current || !wallv.current) return;
    return mountDoors({ sec, badge: badge.current, veil: veil.current, shade: shade.current, passage: passage.current, wallv: wallv.current }, wall.current);
  }, []);

  return (
    <>
      <section id="works" className="doors" aria-labelledby="doorsTitle" ref={ref}>
        <div className="doors__tex" aria-hidden="true"></div>
        <div className="doors__pin">
          <div className="shell doors__wall">
            <h2 className="sr-only" id="doorsTitle">My work, one door per discipline</h2>
            <p className="paint" aria-hidden="true">Magic happens <br className="mbr" />behind the doors</p>
            <p className="doors__hint" aria-hidden="true">Swipe along the wall</p>
            <div className="dinfo" id="dinfo" aria-live="polite"><h3 className="dinfo__h"></h3><p className="dinfo__t"></p><ul className="dinfo__p"></ul></div>
            <p className="doors__dots" aria-hidden="true">{DOORS.filter(d => !d.secret).map((d, k) => <i key={d.slug} className={k === 0 ? "on" : undefined}></i>)}</p>
            <ul className="doors__row">
              {DOORS.map((d, i) => (
                <li key={d.slug} className={`unit${d.secret ? " unit--secret" : ""}`} style={{ ["--i" as string]: i, ["--door" as string]: d.color, ["--door-dk" as string]: d.colorDk }} inert={d.secret || undefined}>
                  <button className="doorway" aria-label={`Open the ${d.plate} door`}>
                    <span className="casing"></span>
                    <span className="opening">
                      <span className="room"></span>
                      <span className="spill"></span>
                      <span className="door">
                        <span className="door__flute"></span>
                        <span className="plate">{d.plate}</span>
                        <span className="handle"><span className="handle__lever"></span><span className="handle__lock"></span></span>
                        <span className="door__shade"></span>
                        <span className="leak"></span>
                      </span>
                      <span className="sill"></span>
                    </span>
                    <span className="pool"></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="doors__floor" aria-hidden="true"></div>
        </div>
      </section>
      {/* door cursor + walk-through layers + the work pages behind the doors */}
      <div className="door-cursor" id="doorCursor" aria-hidden="true" ref={badge}>Click to enter</div>
      <div className="veil" id="veil" aria-hidden="true" hidden ref={veil}></div>
      <div className="shade" id="shade" aria-hidden="true" hidden ref={shade}></div>
      <div className="passage" id="passage" aria-hidden="true" hidden ref={passage}></div>
      <div className="wallv" id="wallv" ref={wallv}></div>
    </>
  );
}
