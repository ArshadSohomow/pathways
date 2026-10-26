// Original landmark glyphs. Status is shown by ring style + badge shape, never colour alone.
import React from "react";
import type { LandmarkType } from "../types";
import type { LandmarkStatus } from "../lib/landmarks";

const C = {
  forest: "#285B46", teal: "#287D78", deepTeal: "#205B59", sage: "#DCE9D8", mint: "#EAF3E8", sun: "#F2D77A",
  earth: "#C8B69A", wood: "#8A6A44", woodDark: "#5F4A30", text: "#24352D", amber: "#9A6700", amberPale: "#FFF4D6", grey: "#6B7770", greyPale: "#F0F1EE", water: "#9CCFC8",
};

export function LandmarkArt({ type, variant }: { type: LandmarkType; variant?: string }) {
  switch (type) {
    case "signpost":
      return (
        <g>
          <rect x="30" y="16" width="4" height="34" rx="1.5" fill={C.wood} />
          <path d="M20 19h20l5 4.5-5 4.5H20z" fill="#FFFDF7" stroke={C.woodDark} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M44 31H24l-5 4.5 5 4.5h20z" fill={C.sage} stroke={C.woodDark} strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M24 23.5h12M28 35.5h12" stroke={C.forest} strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="32" cy="50.5" rx="9" ry="2" fill={C.forest} opacity=".25" />
        </g>
      );
    case "campsite":
      if (variant === "shelter")
        return (
          <g>
            <path d="M14 31 32 17l18 14" fill="none" stroke={C.woodDark} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M18 29.5V47h28V29.5L32 19z" fill="#FFFDF7" stroke={C.forest} strokeWidth="1.8" strokeLinejoin="round" />
            <rect x="28.5" y="36" width="7" height="11" rx="1" fill={C.teal} />
            <rect x="21.5" y="33" width="5" height="5" rx="1" fill={C.sun} stroke={C.forest} strokeWidth="1" />
            <rect x="38" y="33" width="5" height="5" rx="1" fill={C.sun} stroke={C.forest} strokeWidth="1" />
            <ellipse cx="32" cy="49" rx="16" ry="2.2" fill={C.forest} opacity=".2" />
          </g>
        );
      return (
        <g>
          <path d="M13 46 32 17l19 29z" fill={variant === "private" ? C.deepTeal : C.forest} />
          <path d="M32 17 22.5 46H41.5z" fill={variant === "private" ? C.teal : "#3F7A5E"} />
          <path d="M32 30.5 27.5 46h9z" fill="#FFF8E1" />
          <path d="M32 17v-3.5M32 13.5l5 1.8-5 1.7" stroke={C.woodDark} strokeWidth="1.4" fill={C.sun} strokeLinejoin="round" />
          <ellipse cx="32" cy="47.5" rx="20" ry="2.4" fill={C.forest} opacity=".2" />
        </g>
      );
    case "bridge":
      return (
        <g>
          <path d="M10 44c6-2 10 2 16 0s10-2 16 0 8 1.5 12 0" stroke={C.water} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M11 37c7-9 35-9 42 0" fill="none" stroke={C.woodDark} strokeWidth="3" strokeLinecap="round" />
          <path d="M11 37h42" stroke={C.wood} strokeWidth="3" strokeLinecap="round" />
          <path d="M17 31v6M24 28.5V37M32 27.5V37M40 28.5V37M47 31v6" stroke={C.woodDark} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M14 33c6-6 30-6 36 0" fill="none" stroke={C.woodDark} strokeWidth="1.6" />
        </g>
      );
    case "viewpoint":
      return (
        <g>
          <path d="M9 48 25 25l7 8 7-12 16 27z" fill={C.sage} stroke={C.forest} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M39 21v-9" stroke={C.woodDark} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M39 12.5h9l-2.5 3 2.5 3h-9z" fill={C.sun} stroke={C.woodDark} strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M22 29.5 25 25l3 3.5" stroke="#FFFDF7" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "trailhead":
    case "marker":
    default:
      return (
        <g>
          <rect x="30.5" y="30" width="3" height="18" rx="1" fill={C.wood} />
          <circle cx="32" cy="25" r="10" fill={variant === "overseas" ? C.deepTeal : variant === "private" ? C.teal : "#FFFDF7"} stroke={C.forest} strokeWidth="2" />
          {variant === "overseas" ? (
            <g stroke="#FFFDF7" strokeWidth="1.3" fill="none"><circle cx="32" cy="25" r="5.5" /><path d="M26.5 25h11M32 19.5c1.8 1.6 2.6 3.4 2.6 5.5s-.8 3.9-2.6 5.5c-1.8-1.6-2.6-3.4-2.6-5.5s.8-3.9 2.6-5.5z" /></g>
          ) : (
            <path d="m28 25 3 3 5-6" stroke={variant === "private" ? "#FFFDF7" : C.forest} strokeWidth="0" fill="none" />
          )}
          {variant !== "overseas" && <circle cx="32" cy="25" r="3.2" fill={variant === "private" ? "#FFFDF7" : C.sun} stroke={C.forest} strokeWidth="1.2" />}
          <ellipse cx="32" cy="48.5" rx="7" ry="1.8" fill={C.forest} opacity=".25" />
        </g>
      );
  }
}

function StatusRing({ status }: { status: LandmarkStatus }) {
  switch (status) {
    case "completed":
      return <circle cx="32" cy="32" r="29" fill={C.mint} stroke={C.forest} strokeWidth="2.5" />;
    case "ongoing":
      return (
        <g>
          <circle cx="32" cy="32" r="29.5" fill="#FFFFFF" stroke={C.teal} strokeWidth="3" />
          <circle cx="32" cy="32" r="25" fill="none" stroke={C.teal} strokeWidth="1.2" opacity=".6" />
        </g>
      );
    case "upcoming":
      return <circle cx="32" cy="32" r="29" fill="#FFFFFF" stroke={C.grey} strokeWidth="2" strokeDasharray="5 4" />;
    case "awaiting":
      return <circle cx="32" cy="32" r="29" fill={C.amberPale} stroke={C.amber} strokeWidth="2.5" strokeDasharray="10 4" />;
    case "not-recorded":
      return <circle cx="32" cy="32" r="29" fill={C.greyPale} stroke={C.grey} strokeWidth="2.5" strokeDasharray="2 4" strokeLinecap="round" />;
    case "cancelled":
      return <circle cx="32" cy="32" r="29" fill={C.greyPale} stroke={C.grey} strokeWidth="2" />;
  }
}

export function StatusBadgeIcon({ status, x = 50, y = 50, r = 9 }: { status: LandmarkStatus; x?: number; y?: number; r?: number }) {
  const fill = { completed: C.forest, ongoing: C.teal, upcoming: "#FFFFFF", awaiting: C.amber, "not-recorded": "#FFFFFF", cancelled: C.grey }[status];
  const stroke = status === "upcoming" || status === "not-recorded" ? C.grey : "#FFFFFF";
  const fg = status === "upcoming" || status === "not-recorded" ? C.text : "#FFFFFF";
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={r} fill={fill} stroke={stroke} strokeWidth="1.8" />
      <g stroke={fg} strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`scale(${r / 9})`}>
        {status === "completed" && <path d="m-4 0 2.8 2.8L4.2-3" />}
        {status === "ongoing" && <><circle r="3.6" /><circle r=".6" fill={fg} /></>}
        {status === "upcoming" && <><rect x="-4" y="-3.2" width="8" height="7" rx="1" /><path d="M-4 -.5h8M-2 -5v2.5M2 -5v2.5" /></>}
        {status === "awaiting" && <><circle cx="-3" cy="0" r=".6" fill={fg} /><circle cx="0" cy="0" r=".6" fill={fg} /><circle cx="3" cy="0" r=".6" fill={fg} /></>}
        {status === "not-recorded" && <><path d="M-2.4-2.4a2.5 2.5 0 1 1 3.2 2.4c-.6.3-.8.7-.8 1.4" /><circle cx="0" cy="3.6" r=".5" fill={fg} /></>}
        {status === "cancelled" && <path d="M-3-3 3 3M3-3-3 3" />}
      </g>
    </g>
  );
}

export function GapBadge({ x = 52, y = 12 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M0-10 10 7.5H-10z" fill={C.sun} stroke={C.amber} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M0-3.5v4.5" stroke={C.text} strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="4.3" r="1.1" fill={C.text} />
    </g>
  );
}

export function LandmarkGlyph({ type, variant, status, hasGap, size = 56, dim }: { type: LandmarkType; variant?: string; status: LandmarkStatus; hasGap?: boolean; size?: number; dim?: boolean }) {
  const faded = status === "upcoming" || status === "cancelled";
  return (
    <svg width={size} height={size} viewBox="-2 -2 68 68" aria-hidden="true" style={{ overflow: "visible", opacity: dim ? 0.35 : 1 }}>
      <StatusRing status={status} />
      <g opacity={faded ? 0.6 : 1}><LandmarkArt type={type} variant={variant} /></g>
      <StatusBadgeIcon status={status} />
      {hasGap && <GapBadge />}
    </svg>
  );
}

export function Hiker({ size = 34 }: { size?: number }) {
  // Small silhouetted walker with a pack and pole. Represents position in the record — not progress.
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 30 42" aria-hidden="true">
      <circle cx="16" cy="5" r="3.6" fill={C.text} />
      <path d="M13.5 10.5c2.6-1 5.2-.4 6 1.8l1.6 7.6-2.6.6-1.3-4.7-.9 6.9 3.9 8.4-2.7 1.3-4.4-8.6-2.8 9.6-2.9-.7 3.7-14.3.4-3.5-2 3.2-2.4-1.3 3.2-5.6c.6-.9 1.3-.9 3.2-1z" fill={C.text} />
      <path d="M9.5 11.5c-1.8.6-2.6 2.4-2.1 4.4l.8 3.4 3.4-1 .9-6.9z" fill={C.forest} />
      <path d="M22.3 15.5 25 40" stroke={C.woodDark} strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="15" cy="40.5" rx="9" ry="1.5" fill={C.forest} opacity=".25" />
    </svg>
  );
}

export const PALETTE = C;
