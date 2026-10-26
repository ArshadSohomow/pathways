// Small original stroke icon set (24×24, 1.75 stroke) in the spirit of Lucide.
import React from "react";

type P = { size?: number; className?: string; title?: string };
const S = ({ size = 18, className, title, children }: P & { children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden={title ? undefined : true} role={title ? "img" : undefined}>
    {title && <title>{title}</title>}
    {children}
  </svg>
);

export const IconHome = (p: P) => <S {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5h13V10" /><path d="M10 19.5v-5h4v5" /></S>;
export const IconMap = (p: P) => <S {...p}><path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z" /><path d="M8.5 4v13.5M15.5 6.5V20" /></S>;
export const IconCalendar = (p: P) => <S {...p}><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></S>;
export const IconPill = (p: P) => <S {...p}><rect x="2.8" y="8.2" width="18.4" height="7.6" rx="3.8" transform="rotate(-45 12 12)" /><path d="m9.3 9.3 5.4 5.4" /></S>;
export const IconUsers = (p: P) => <S {...p}><circle cx="9" cy="8.5" r="3.2" /><path d="M3 19.5c.6-3.2 3-5 6-5s5.4 1.8 6 5" /><circle cx="17" cy="9.5" r="2.4" /><path d="M16.5 14.6c2.3.2 3.9 1.7 4.5 4" /></S>;
export const IconFile = (p: P) => <S {...p}><path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" /><path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h5" /></S>;
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" /></S>;
export const IconSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></S>;
export const IconX = (p: P) => <S {...p}><path d="M6 6l12 12M18 6 6 18" /></S>;
export const IconChevronRight = (p: P) => <S {...p}><path d="m9 6 6 6-6 6" /></S>;
export const IconChevronLeft = (p: P) => <S {...p}><path d="m15 6-6 6 6 6" /></S>;
export const IconChevronDown = (p: P) => <S {...p}><path d="m6 9 6 6 6-6" /></S>;
export const IconArrowLeft = (p: P) => <S {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></S>;
export const IconAlert = (p: P) => <S {...p}><path d="M12 4 2.8 19.5h18.4z" /><path d="M12 10v4.5M12 17.3v.2" /></S>;
export const IconInfo = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5.5M12 7.8v.2" /></S>;
export const IconCheck = (p: P) => <S {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></S>;
export const IconClock = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></S>;
export const IconFilter = (p: P) => <S {...p}><path d="M4 5h16l-6.2 7.4V19l-3.6-1.8v-4.8z" /></S>;
export const IconList = (p: P) => <S {...p}><path d="M9 6.5h11M9 12h11M9 17.5h11" /><circle cx="4.8" cy="6.5" r=".8" /><circle cx="4.8" cy="12" r=".8" /><circle cx="4.8" cy="17.5" r=".8" /></S>;
export const IconLocate = (p: P) => <S {...p}><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" /></S>;
export const IconLink = (p: P) => <S {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></S>;
export const IconBuilding = (p: P) => <S {...p}><rect x="4.5" y="3.5" width="15" height="17" rx="1.5" /><path d="M9 7.5h1.5M13.5 7.5H15M9 11h1.5M13.5 11H15M9 14.5h1.5M13.5 14.5H15M10.5 20.5v-3h3v3" /></S>;
export const IconGlobe = (p: P) => <S {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z" /></S>;
export const IconShield = (p: P) => <S {...p}><path d="M12 3.5 5 6v5.5c0 4.2 2.8 7.6 7 9 4.2-1.4 7-4.8 7-9V6z" /><path d="m9 12 2.2 2.2L15.5 10" /></S>;
export const IconFlag = (p: P) => <S {...p}><path d="M5 21V4.5M5 4.5h11.5l-2 4 2 4H5" /></S>;
export const IconLayers = (p: P) => <S {...p}><path d="m12 4 8.5 4.5L12 13 3.5 8.5z" /><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5" /></S>;
export const IconMenu = (p: P) => <S {...p}><path d="M4 7h16M4 12h16M4 17h16" /></S>;
export const IconReset = (p: P) => <S {...p}><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4.5 4.5v4h4" /></S>;
export const IconEye = (p: P) => <S {...p}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></S>;
export const IconHospital = (p: P) => <S {...p}><rect x="3.5" y="7" width="17" height="13.5" rx="1.5" /><path d="M8 7V3.5h8V7M12 10.5v6M9 13.5h6" /></S>;
export const IconArrowRight = (p: P) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>;
export const IconDatabase = (p: P) => <S {...p}><ellipse cx="12" cy="6" rx="7.5" ry="2.8" /><path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" /></S>;
export const IconPhone = (p: P) => <S {...p}><path d="M5 4h3.5l1.7 4.3-2.2 1.4a11 11 0 0 0 6.3 6.3l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.7 20 4 13.3 3.5 5.6A1.5 1.5 0 0 1 5 4z" /></S>;
export const IconSun = (p: P) => <S {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></S>;
