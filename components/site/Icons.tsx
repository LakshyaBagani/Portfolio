/* tiny inline icons (stroke = currentColor) */
type P = { className?: string };
const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
export const IconArrow = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" {...S}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
export const IconArrowUpRight = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" {...S}><path d="M7 17L17 7M9 7h8v8" /></svg>);
export const IconArrowUp = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" {...S}><path d="M12 19V5M6 11l6-6 6 6" /></svg>);
export const IconArrowLeft = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" {...S}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>);
export const IconClose = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" {...S}><path d="M6 6l12 12M18 6L6 18" /></svg>);
export const IconMenu = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" {...S}><path d="M4 8h16M4 16h16" /></svg>);
export const IconCheck = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" {...S}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const IconSpark = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6z" /></svg>);
export const IconRewind = ({ className }: P) => (<svg className={className} viewBox="0 0 24 24" {...S} strokeWidth={1.6}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l3 2" /></svg>);
