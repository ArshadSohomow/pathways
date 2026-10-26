import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context";
import { computeLayout, LANDSCAPE_HEIGHT, rng, Layout } from "../lib/layout";
import { LandmarkVM, LandscapeFilters, EMPTY_LANDSCAPE_FILTERS, landmarkMatches, activeLandscapeFilterLabels, TYPE_META, STATUS_META, LandmarkStatus } from "../lib/landmarks";
import { LandmarkGlyph, Hiker, LandmarkArt, StatusBadgeIcon, GapBadge, PALETTE as C } from "./Glyphs";
import { fmtDate, datePart } from "../lib/dates";
import { Chip, EmptyState, LandmarkStatusPill, Toggle } from "./common";
import { IconChevronLeft, IconChevronRight, IconFilter, IconList, IconLocate, IconMap, IconReset, IconChevronDown } from "./icons";
import type { LandmarkType } from "../types";

export function useMedia(q: string) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [q]);
  return m;
}

export function landmarkDateText(v: LandmarkVM): string {
  if (!v.start && !v.end) return "Date not recorded";
  if (!v.start) return `Start not recorded – ${fmtDate(v.end)}`;
  const s = datePart(v.start);
  if (v.lm.landmarkType === "campsite") {
    if (v.status === "ongoing") return `${fmtDate(s)} – ongoing`;
    if (!v.end) return `${fmtDate(s)} – end not recorded`;
  }
  if (v.end && datePart(v.end) !== s && (v.lm.landmarkType === "campsite" || v.lm.landmarkType === "signpost" || v.lm.landmarkType === "bridge")) {
    return `${fmtDate(s)} – ${fmtDate(v.end)}`;
  }
  return fmtDate(s);
}

export function landmarkAria(v: LandmarkVM, mode: "patient" | "pro"): string {
  const t = TYPE_META[v.lm.landmarkType];
  const st = mode === "patient" ? STATUS_META[v.status].patientLabel : v.statusLabel;
  const dur = v.duration ? ` Duration: ${v.duration.label}.` : "";
  const gaps = v.gaps.length ? ` ${v.gaps.length} information gap${v.gaps.length > 1 ? "s" : ""}.` : "";
  const cur = v.isCurrent ? " Current recorded stage." : "";
  return `${t.label}, ${mode === "patient" ? t.plainMeaning : t.meaning}: ${v.lm.title}. ${landmarkDateText(v)}. Status: ${st}.${dur}${gaps}${cur}`;
}

// ---------------------------------------------------------------- scenery
function Scenery({ layout }: { layout: Layout }) {
  const { width: W } = layout;
  const els = useMemo(() => {
    const r = rng(Math.round(W) * 7 + 3);
    const ridge = (base: number, amp: number, stepX: number, jitter: number) => {
      let d = `M0,${base}`;
      for (let x = 0; x <= W + stepX; x += stepX) {
        const peak = base - amp * (0.45 + r() * 0.55);
        d += ` L${x + stepX * 0.5 + (r() - 0.5) * jitter},${peak} L${x + stepX},${base - amp * 0.18 * r()}`;
      }
      return d + ` L${W + stepX},${LANDSCAPE_HEIGHT} L0,${LANDSCAPE_HEIGHT}Z`;
    };
    const hill = (base: number, amp: number, period: number, phase: number) => {
      let d = `M0,${base}`;
      for (let x = 0; x <= W; x += 20) d += ` L${x},${base + Math.sin(x / period + phase) * amp + Math.sin(x / (period * 0.37) + phase * 2) * amp * 0.3}`;
      return d + ` L${W},${LANDSCAPE_HEIGHT} L0,${LANDSCAPE_HEIGHT}Z`;
    };
    const avoid = layout.placed.map((p) => ({ x: p.x, y: p.y }));
    const clear = (x: number, y: number, rx: number, ry: number) => avoid.every((a) => Math.abs(a.x - x) > rx || Math.abs(a.y - y) > ry);
    const trees: { x: number; y: number; s: number; tone: number }[] = [];
    for (let x = 10; x < W; x += 26 + r() * 30) {
      const y = 178 + r() * 16;
      if (clear(x, y, 82, 70)) trees.push({ x, y, s: 0.55 + r() * 0.35, tone: 0 });
    }
    for (let x = 0; x < W; x += 60 + r() * 110) {
      const y = 448 + r() * 22;
      if (clear(x, y, 80, 115)) trees.push({ x, y, s: 1 + r() * 0.5, tone: 1 });
    }
    for (let x = 40; x < W; x += 140 + r() * 160) {
      const y = 262 + r() * 18;
      if (clear(x, y, 92, 75)) trees.push({ x, y, s: 0.75 + r() * 0.3, tone: 2 });
    }
    const flowers: { x: number; y: number; c: string }[] = [];
    for (let i = 0; i < W / 18; i++) {
      const x = r() * W, y = 380 + r() * 85;
      if (clear(x, y, 72, 100)) flowers.push({ x, y, c: r() > 0.5 ? C.sun : "#FFFFFF" });
    }
    const clouds = Array.from({ length: Math.ceil(W / 420) }, (_, i) => ({ x: 120 + i * 420 + r() * 160, y: 28 + r() * 40, s: 0.7 + r() * 0.5 }));
    return {
      far: ridge(165, 110, 190, 60), mid: ridge(186, 80, 140, 40),
      hill1: hill(198, 12, 160, 0.4), hill2: hill(258, 10, 210, 1.7), meadow: hill(352, 8, 260, 2.6),
      trees, flowers, clouds,
    };
  }, [W, layout.placed]);
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E5F1EE" />
          <stop offset=".55" stopColor="#F6F8EC" />
          <stop offset="1" stopColor="#FBF6E3" />
        </linearGradient>
        <radialGradient id="sunglow"><stop offset="0" stopColor={C.sun} stopOpacity=".55" /><stop offset="1" stopColor={C.sun} stopOpacity="0" /></radialGradient>
        <linearGradient id="meadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E3EEDB" /><stop offset="1" stopColor="#D5E6CF" /></linearGradient>
      </defs>
      <rect width={W} height={LANDSCAPE_HEIGHT} fill="url(#sky)" />
      <circle cx={W - 150} cy={58} r={90} fill="url(#sunglow)" />
      <circle cx={W - 150} cy={58} r={28} fill={C.sun} />
      {els.clouds.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) scale(${c.s})`} fill="#FFFFFF" opacity=".8">
          <ellipse cx="0" cy="0" rx="34" ry="10" /><ellipse cx="-12" cy="-7" rx="16" ry="10" /><ellipse cx="12" cy="-9" rx="18" ry="12" />
        </g>
      ))}
      <path d={els.far} fill="#C9DDD3" />
      <path d={els.mid} fill="#B3CFC0" />
      <path d={els.hill1} fill="#CFE2C9" />
      {els.trees.filter((t) => t.tone === 0).map((t, i) => <Pine key={`a${i}`} x={t.x} y={t.y} s={t.s} fill="#5E8C72" />)}
      <path d={els.hill2} fill="#DAE9D3" />
      {els.trees.filter((t) => t.tone === 2).map((t, i) => <Pine key={`c${i}`} x={t.x} y={t.y} s={t.s} fill="#3F7A5E" />)}
      <path d={els.meadow} fill="url(#meadow)" />
      {els.flowers.map((f, i) => <circle key={i} cx={f.x} cy={f.y} r={2.2} fill={f.c} stroke="#B9C9A8" strokeWidth=".6" />)}
      {els.trees.filter((t) => t.tone === 1).map((t, i) => <Pine key={`b${i}`} x={t.x} y={t.y} s={t.s} fill={C.forest} />)}
    </g>
  );
}

function Pine({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.6" y="-4" width="3.2" height="8" fill="#6B5435" />
      <path d="M0-42 10-24H5l9 14H-14l9-14h-5z" fill={fill} />
      <path d="M0-30 12-4H-12z" fill={fill} />
    </g>
  );
}

// ---------------------------------------------------------------- controls
function Controls({ f, setF, listView, setListView, onCurrent, shown, total }: { f: LandscapeFilters; setF: (f: LandscapeFilters) => void; listView: boolean; setListView: (v: boolean) => void; onCurrent: () => void; shown: number; total: number }) {
  const { repo, mode } = useApp();
  const [openPanel, setOpenPanel] = useState(false);
  const branches = repo.ds.branches.filter((b) => repo.ds.landmarks.some((l) => l.trailBranchId === b.id));
  const services = repo.ds.services;
  const orgs = repo.ds.organisations;
  const active = activeLandscapeFilterLabels(f, repo);
  const set = <K extends keyof LandscapeFilters>(k: K, v: LandscapeFilters[K]) => setF({ ...f, [k]: v });
  return (
    <div className="lcontrols">
      <div className="lcontrols__row">
        <div className="seg" role="group" aria-label="Journey view">
          <button type="button" aria-pressed={!listView} className={!listView ? "is-on" : ""} onClick={() => setListView(false)}><IconMap size={16} /> Trail</button>
          <button type="button" aria-pressed={listView} className={listView ? "is-on" : ""} onClick={() => setListView(true)}><IconList size={16} /> List</button>
        </div>
        <label className="field field--inline">
          <span className="field__label">Pathway</span>
          <select value={f.branchId} onChange={(e) => set("branchId", e.target.value)}>
            <option value="all">Show full journey</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{mode === "patient" ? b.plainName : b.name}</option>)}
          </select>
        </label>
        <Toggle pressed={f.milestonesOnly} onChange={(v) => set("milestonesOnly", v)}>Milestones</Toggle>
        <Toggle pressed={f.ongoingOnly} onChange={(v) => set("ongoingOnly", v)}>Ongoing care</Toggle>
        <Toggle pressed={f.gapsOnly} onChange={(v) => set("gapsOnly", v)}>Information gaps</Toggle>
        <button type="button" className="btn btn--ghost" aria-expanded={openPanel} aria-controls="lfilters-more" onClick={() => setOpenPanel(!openPanel)}>
          <IconFilter size={16} /> More filters <IconChevronDown size={14} />
        </button>
        <span className="lcontrols__spacer" />
        <button type="button" className="btn btn--ghost" onClick={onCurrent}><IconLocate size={16} /> Current stage</button>
        <button type="button" className="btn btn--ghost" onClick={() => setF(EMPTY_LANDSCAPE_FILTERS)} disabled={!active.length}><IconReset size={16} /> Reset</button>
      </div>
      {openPanel && (
        <div className="lcontrols__more" id="lfilters-more">
          <label className="field"><span className="field__label">Service</span>
            <select value={f.serviceId} onChange={(e) => set("serviceId", e.target.value)}>
              <option value="all">All services</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({repo.orgName(s.organisationId)})</option>)}
            </select>
          </label>
          <label className="field"><span className="field__label">Provider</span>
            <select value={f.organisationId} onChange={(e) => set("organisationId", e.target.value)}>
              <option value="all">All providers</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <label className="field"><span className="field__label">From</span><input type="date" value={f.from ?? ""} onChange={(e) => set("from", e.target.value || undefined)} /></label>
          <label className="field"><span className="field__label">To</span><input type="date" value={f.to ?? ""} onChange={(e) => set("to", e.target.value || undefined)} /></label>
        </div>
      )}
      <div className="lcontrols__status" aria-live="polite">
        {active.length > 0 ? (
          <>
            <span className="muted">Showing {shown} of {total} landmarks ·</span>
            {active.map((a) => <Chip key={a.key} onRemove={() => setF({ ...f, [a.key]: (EMPTY_LANDSCAPE_FILTERS as any)[a.key] })}>{a.label}</Chip>)}
          </>
        ) : (
          <span className="muted">Showing the full journey · {total} landmarks</span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- main component
export function Landscape({ compact = false, initialList = false }: { compact?: boolean; initialList?: boolean }) {
  const { landmarks, repo, mode, open, highlight, panel } = useApp();
  const mobile = useMedia("(max-width: 760px)");
  const [f, setF] = useState<LandscapeFilters>(EMPTY_LANDSCAPE_FILTERS);
  const [listView, setListView] = useState(initialList);
  const matches = useMemo(() => new Set(landmarks.filter((v) => landmarkMatches(v, f)).map((v) => v.lm.id)), [landmarks, f]);
  useEffect(() => setF(EMPTY_LANDSCAPE_FILTERS), [repo]);
  const btnRefs = useRef(new Map<string, HTMLButtonElement>());
  const scroller = useRef<HTMLDivElement>(null);
  const current = landmarks.find((v) => v.isCurrent);
  const selected = panel.length && panel[panel.length - 1].kind === "landmark" ? panel[panel.length - 1].id : highlight;

  const focusLandmark = (id: string | undefined, focus = true) => {
    if (!id) return;
    const el = btnRefs.current.get(id);
    if (!el) return;
    const sc = scroller.current;
    if (sc && !mobile) {
      const left = el.offsetLeft + el.offsetWidth / 2 - sc.clientWidth / 2;
      sc.scrollTo({ left: Math.max(0, left), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } else {
      el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
    if (focus) el.focus({ preventScroll: true });
  };
  useEffect(() => { if (highlight) setTimeout(() => focusLandmark(highlight, false), 60); }, [highlight, mobile, listView]);
  useEffect(() => { if (!highlight && current) setTimeout(() => focusLandmark(current.lm.id, false), 60); }, [repo, mobile]);

  const register = (id: string) => (el: HTMLButtonElement | null) => { if (el) btnRefs.current.set(id, el); else btnRefs.current.delete(id); };
  const onKey = (e: React.KeyboardEvent, idx: number) => {
    const visible = landmarks.filter((v) => matches.has(v.lm.id));
    const pos = visible.findIndex((v) => v.lm.id === landmarks[idx].lm.id);
    let next: LandmarkVM | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = visible[pos + 1];
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = visible[pos - 1];
    if (e.key === "Home") next = visible[0];
    if (e.key === "End") next = visible[visible.length - 1];
    if (next) { e.preventDefault(); focusLandmark(next.lm.id); }
  };

  const shown = matches.size;
  const openLm = (v: LandmarkVM) => open({ kind: "landmark", id: v.lm.id }, { replace: true });

  return (
    <div className={`landscape ${compact ? "landscape--compact" : ""}`}>
      {!compact && <Controls f={f} setF={setF} listView={listView} setListView={setListView} onCurrent={() => { setF(EMPTY_LANDSCAPE_FILTERS); setTimeout(() => focusLandmark(current?.lm.id), 30); }} shown={shown} total={landmarks.length} />}
      <p className="sr-only" id="trail-help">
        The journey is shown as a trail of landmarks in date order. Use Tab or the arrow keys to move between landmarks and Enter to open details. A full chronological list is available with the List button and in the timeline below.
      </p>
      {shown === 0 ? (
        <EmptyState title="No landmarks match these filters" action={<button type="button" className="btn" onClick={() => setF(EMPTY_LANDSCAPE_FILTERS)}><IconReset size={16} /> Reset filters</button>}>
          Try removing a filter. Your full record is unchanged.
        </EmptyState>
      ) : listView ? (
        <LandmarkList items={landmarks.filter((v) => matches.has(v.lm.id))} onOpen={openLm} register={register} onKey={onKey} selected={selected} />
      ) : mobile ? (
        <VerticalTrail items={landmarks} matches={matches} onOpen={openLm} register={register} onKey={onKey} selected={selected} />
      ) : (
        <HorizontalTrail items={landmarks} matches={matches} onOpen={openLm} register={register} onKey={onKey} selected={selected} scroller={scroller} />
      )}
      {!compact && <Legend />}
    </div>
  );
}

type TrailProps = { items: LandmarkVM[]; matches?: Set<string>; onOpen: (v: LandmarkVM) => void; register: (id: string) => (el: HTMLButtonElement | null) => void; onKey: (e: React.KeyboardEvent, idx: number) => void; selected: string | null };

function HorizontalTrail({ items, matches, onOpen, register, onKey, selected, scroller }: TrailProps & { scroller: React.RefObject<HTMLDivElement> }) {
  const { repo, mode } = useApp();
  const wrap = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(1000);
  const [edges, setEdges] = useState({ left: false, right: false });
  useLayoutEffect(() => {
    if (!wrap.current) return;
    const ro = new ResizeObserver((e) => setCw(Math.round(e[0].contentRect.width)));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  const layout = useMemo(() => computeLayout(items, repo.ds.branches, cw, mode === "patient"), [items, repo, cw, mode]);
  const updateEdges = () => { const s = scroller.current; if (s) setEdges({ left: s.scrollLeft > 4, right: s.scrollLeft + s.clientWidth < s.scrollWidth - 4 }); };
  useEffect(updateEdges, [layout]);
  const scrollBy = (dx: number) => scroller.current?.scrollBy({ left: dx, behavior: "smooth" });
  const current = layout.placed.find((p) => p.vm.isCurrent);
  const isMatch = (id: string) => !matches || matches.has(id);

  return (
    <div className="htrail" ref={wrap}>
      {edges.left && <button type="button" className="htrail__nav htrail__nav--l" onClick={() => scrollBy(-cw * 0.7)} aria-label="Scroll the trail to earlier landmarks"><IconChevronLeft size={20} /></button>}
      {edges.right && <button type="button" className="htrail__nav htrail__nav--r" onClick={() => scrollBy(cw * 0.7)} aria-label="Scroll the trail to later landmarks"><IconChevronRight size={20} /></button>}
      <div className="htrail__scroll" ref={scroller} onScroll={updateEdges} tabIndex={-1}>
        <div className="htrail__canvas" style={{ width: layout.width, height: layout.height }}>
          <svg width={layout.width} height={layout.height} className="htrail__svg" aria-hidden="true">
            <Scenery layout={layout} />
            {layout.paths.map((p) => (
              <g key={p.branchId}>
                {p.segments.map((s, i) => (
                  <g key={i}>
                    <path d={s.d} stroke="#EFE3C8" strokeWidth={s.future ? 10 : 16} fill="none" strokeLinecap="round" opacity={s.future ? 0.8 : 1} />
                    <path d={s.d} stroke={s.future ? "#A89676" : "#B49F79"} strokeWidth={s.future ? 2 : 2.4} fill="none" strokeDasharray={s.future ? "3 7" : "7 6"} strokeLinecap="round" />
                  </g>
                ))}
              </g>
            ))}
            {layout.paths.filter((p) => repo.branch(p.branchId)?.parentBranchId).map((p) => (
              <g key={`lbl-${p.branchId}`} transform={`translate(${p.start.x} ${p.start.y - 22})`}>
                <rect x={-p.label.length * 3.4 - 10} y={-11} width={p.label.length * 6.8 + 20} height={20} rx={10} fill="#FFFDF7" stroke={C.earth} />
                <text textAnchor="middle" y={3.5} fontSize="11.5" fontWeight={600} fill={C.text} fontFamily="var(--font-body)">{p.label}</text>
              </g>
            ))}
          </svg>
          {current && (
            <div className="hiker" style={{ left: current.x - 66, top: current.y - 34 }} title="You are here: the most recent recorded stage">
              <Hiker size={26} />
            </div>
          )}
          <ol className="htrail__list" aria-label="Journey landmarks, in date order" aria-describedby="trail-help">
            {layout.placed.map((p, idx) => {
              const v = p.vm;
              const m = isMatch(v.lm.id);
              return (
                <li key={v.lm.id} style={{ left: p.x, top: p.y }} className={`lmk lmk--${v.lm.landmarkType} ${m ? "" : "is-dim"} ${selected === v.lm.id ? "is-selected" : ""}`}>
                  <button
                    ref={register(v.lm.id)}
                    type="button"
                    className="lmk__btn"
                    aria-label={landmarkAria(v, mode)}
                    aria-current={v.isCurrent ? "step" : undefined}
                    tabIndex={m ? 0 : -1}
                    aria-hidden={m ? undefined : true}
                    onClick={() => onOpen(v)}
                    onKeyDown={(e) => onKey(e, items.indexOf(v))}
                  >
                    <LandmarkGlyph type={v.lm.landmarkType} variant={v.lm.visualVariant} status={v.status} hasGap={v.gaps.length > 0} size={v.lm.landmarkType === "marker" ? 46 : 58} />
                    <span className="lmk__label">
                      <span className="lmk__title">{v.lm.title}</span>
                      <span className="lmk__date">{landmarkDateText(v)}</span>
                      {v.lm.landmarkType === "campsite" && v.duration && <span className="lmk__dur">{v.duration.kind === "ongoing" ? `${v.duration.days} days so far` : v.duration.kind === "complete" ? `${v.duration.days} days` : "Duration unknown"}</span>}
                      <span className={`lmk__status lmk__status--${v.status}`}>{mode === "patient" ? STATUS_META[v.status].patientLabel : v.statusLabel}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

function VerticalTrail({ items, matches, onOpen, register, onKey, selected }: TrailProps) {
  const { repo, mode } = useApp();
  const laneOf = new Map(repo.ds.branches.map((b) => [b.id, b.lane] as const));
  const visible = items.filter((v) => !matches || matches.has(v.lm.id));
  const xFor = (v?: LandmarkVM) => (v ? 34 + (laneOf.get(v.lm.trailBranchId) ?? 0) * 18 : 34);
  return (
    <div className="vtrail">
      <svg className="vtrail__top" viewBox="0 0 360 70" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <rect width="360" height="70" fill="#E8F2EC" />
        <circle cx="300" cy="26" r="14" fill={C.sun} />
        <path d="M0 62 50 22l30 22 40-34 50 42 40-26 50 30 40-20 60 30V70H0z" fill="#B3CFC0" />
        <path d="M0 70c40-12 80-6 120-10s90-12 130-4 80 10 110 6V70z" fill="#DAE9D3" />
      </svg>
      <ol className="vtrail__list" aria-label="Journey landmarks, in date order" aria-describedby="trail-help">
        {visible.map((v, i) => {
          const prev = visible[i - 1], next = visible[i + 1];
          const x = xFor(v), px = prev ? xFor(prev) : x, nx = next ? xFor(next) : x;
          const branch = repo.branch(v.lm.trailBranchId);
          return (
            <li key={v.lm.id} className={`vrow ${selected === v.lm.id ? "is-selected" : ""}`}>
              <svg className="vrow__path" width="72" height="100%" preserveAspectRatio="none" viewBox="0 0 72 100" aria-hidden="true">
                {prev && <path d={`M${px},0 C${px},30 ${x},20 ${x},50`} stroke="#E4D6B8" strokeWidth="9" fill="none" />}
                {next && <path d={`M${x},50 C${x},80 ${nx},70 ${nx},100`} stroke={next.status === "upcoming" ? "#EFE5CF" : "#E4D6B8"} strokeWidth="9" fill="none" />}
                {prev && <path d={`M${px},0 C${px},30 ${x},20 ${x},50`} stroke="#B49F79" strokeWidth="1.6" strokeDasharray="5 5" fill="none" />}
                {next && <path d={`M${x},50 C${x},80 ${nx},70 ${nx},100`} stroke="#B49F79" strokeWidth="1.6" strokeDasharray={next.status === "upcoming" ? "2 6" : "5 5"} fill="none" />}
              </svg>
              <div className="vrow__glyph" style={{ left: x - 24 }}>
                <LandmarkGlyph type={v.lm.landmarkType} variant={v.lm.visualVariant} status={v.status} hasGap={v.gaps.length > 0} size={48} />
              </div>
              <button ref={register(v.lm.id)} type="button" className="vrow__card" aria-label={landmarkAria(v, mode)} aria-current={v.isCurrent ? "step" : undefined} onClick={() => onOpen(v)} onKeyDown={(e) => onKey(e, items.indexOf(v))}>
                <span className="vrow__kind">{TYPE_META[v.lm.landmarkType].label} · {mode === "patient" ? branch?.plainName : branch?.name}</span>
                <span className="vrow__title">{v.lm.title}</span>
                <span className="vrow__date">{landmarkDateText(v)}{v.duration && v.lm.landmarkType === "campsite" ? ` · ${v.duration.kind === "ongoing" ? `${v.duration.days} days so far` : v.duration.kind === "complete" ? `${v.duration.days} days` : "duration unknown"}` : ""}</span>
                <span className="vrow__meta">
                  <LandmarkStatusPill status={v.status} label={mode === "patient" ? undefined : v.statusLabel} />
                  {v.gaps.length > 0 && <span className="pill pill--attention pill--sm">{v.gaps.length} gap{v.gaps.length > 1 ? "s" : ""}</span>}
                  {v.isCurrent && <span className="pill pill--current pill--sm">Most recent stage</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function LandmarkList({ items, onOpen, register, onKey, selected }: TrailProps) {
  const { mode, repo } = useApp();
  return (
    <ol className="llist" aria-label="Journey landmarks, in date order">
      {items.map((v, i) => (
        <li key={v.lm.id} className={selected === v.lm.id ? "is-selected" : ""}>
          <button ref={register(v.lm.id)} type="button" className="llist__btn" onClick={() => onOpen(v)} onKeyDown={(e) => onKey(e, i)} aria-current={v.isCurrent ? "step" : undefined}>
            <LandmarkGlyph type={v.lm.landmarkType} variant={v.lm.visualVariant} status={v.status} hasGap={v.gaps.length > 0} size={40} />
            <span className="llist__main">
              <span className="llist__title">{v.lm.title}</span>
              <span className="llist__sub">{TYPE_META[v.lm.landmarkType].label}: {mode === "patient" ? TYPE_META[v.lm.landmarkType].plainMeaning : TYPE_META[v.lm.landmarkType].meaning} · {mode === "patient" ? repo.branch(v.lm.trailBranchId)?.plainName : repo.branch(v.lm.trailBranchId)?.name}</span>
            </span>
            <span className="llist__date">{landmarkDateText(v)}{v.duration && v.lm.landmarkType === "campsite" ? <><br /><span className="muted">{v.duration.label}</span></> : null}</span>
            <span className="llist__status">
              <LandmarkStatusPill status={v.status} label={mode === "patient" ? undefined : v.statusLabel} />
              {v.gaps.length > 0 && <span className="pill pill--attention pill--sm">{v.gaps.length} gap{v.gaps.length > 1 ? "s" : ""}</span>}
              {v.isCurrent && <span className="pill pill--current pill--sm">Most recent stage</span>}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function Legend() {
  const { mode } = useApp();
  const [openL, setOpenL] = useState(true);
  const types: LandmarkType[] = ["signpost", "campsite", "bridge", "viewpoint", "marker"];
  const statuses: LandmarkStatus[] = ["completed", "ongoing", "upcoming", "awaiting", "not-recorded", "cancelled"];
  return (
    <details className="legend" open={openL} onToggle={(e) => setOpenL((e.target as HTMLDetailsElement).open)}>
      <summary>How to read the trail</summary>
      <div className="legend__grid">
        <ul className="legend__list" aria-label="Landmark types">
          {types.map((t) => (
            <li key={t}>
              <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><LandmarkArt type={t} /></svg>
              <span><strong>{TYPE_META[t].label}</strong> — {mode === "patient" ? TYPE_META[t].plainMeaning : TYPE_META[t].meaning}</span>
            </li>
          ))}
          <li>
            <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true"><GapBadge x={32} y={34} /></svg>
            <span><strong>Information gap</strong> — something is missing or unclear in the records (not a judgement about care)</span>
          </li>
          <li>
            <Hiker size={18} />
            <span><strong>Walker</strong> — the most recent recorded stage. It shows position in the record, not progress or health.</span>
          </li>
        </ul>
        <ul className="legend__list legend__list--status" aria-label="Status markers">
          {statuses.map((s) => (
            <li key={s}>
              <svg width="26" height="26" viewBox="40 40 20 20" aria-hidden="true"><StatusBadgeIcon status={s} x={50} y={50} r={8.5} /></svg>
              <span><strong>{mode === "patient" ? STATUS_META[s].patientLabel : STATUS_META[s].label}</strong> — {STATUS_META[s].description}</span>
            </li>
          ))}
          <li>
            <svg width="40" height="12" aria-hidden="true"><path d="M2 6h36" stroke="#A89676" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round" /></svg>
            <span>Dotted trail leads to a booked, future step.</span>
          </li>
        </ul>
      </div>
    </details>
  );
}
