/* =====================================================================
   config.ts — shared geometry of the ability card. Card space: u across
   (0 left → 1 right), v down (0 top → 1 bottom). Art is drawn in "k"
   units: the card is 1000k wide and KH tall.
   ===================================================================== */

export const CARD_W = 6.3;
export const CARD_H = 8.8;
export const KH = (1000 * CARD_H) / CARD_W; // 1396.8

/** the portrait window, in card uv */
export const WIN = { u0: 0.0841, u1: 0.9159, v0: 0.148, v1: 0.512 };
/** the area the window's background painting covers (card uv) — larger than the window so it can drift behind it */
export const BGR = { u0: -0.06, u1: 1.06, v0: 0.07, v1: 0.6 };
/** where the (unseen) fire sits, in card uv: it warms the smoke, the subject's edge and the gems */
export const FIRE_CARD: [number, number] = [0.71, 0.435];
/** the warm glow in the window's upper right */
export const KILN_CARD: [number, number] = [0.74, 0.2];

/** the subject (portrait cut-out) leans out of the card: its head is in front of the face, its shoulders behind it */
export const SUB = { zHelm: 0.34, zFeet: -0.12, helmV: 0.1193, feetV: 0.5166 };

/** depths of the card's layers (world units, + toward the viewer) */
export const Z = { bg: -0.9, fogFar: -1, fogNear: -0.3, rim: -0.05, laminate: 0.003, mask: 0.001 };

/** card body: thickness, rounded rim, corner radius */
export const BODY = { t: 0.16, rim: 0.045, corner: 0.26 };

export const CAM_D = 32;
export const FILL = 0.78;

export const cardToLocal = (u: number, v: number): [number, number] => [(u - 0.5) * CARD_W, (0.5 - v) * CARD_H];
/** keeps a layer at depth z registered with the card face when seen head-on */
export const comp = (z: number) => (CAM_D - z) / CAM_D;
