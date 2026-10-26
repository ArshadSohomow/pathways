// Browser acceptance tests for the spec's patient and professional tasks.
// Usage: node scripts/acceptance.cjs http://localhost:4173   (needs Playwright + Chromium)
const { chromium } = require("playwright");
const BASE = (process.argv[2] || "http://localhost:4173") + "/#/";
const results = [];
const check = async (name, fn) => {
  try { const detail = await fn(); results.push({ name, ok: true, detail }); }
  catch (e) { results.push({ name, ok: false, detail: String(e.message || e).split("\n")[0] }); }
};
const assert = (c, m) => { if (!c) throw new Error(m); };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  const go = async (path) => { await p.goto(BASE + path); await p.waitForTimeout(350); };
  const panelTitle = () => p.locator("#panel-title").innerText();
  const panelText = () => p.locator(".panel").innerText();
  const close = () => p.keyboard.press("Escape");

  // ---------------- patient tasks
  await check("P1 Understand the current recorded stage", async () => {
    await go("patient/pt-imogen/overview");
    const t = await p.locator(".sit").innerText();
    assert(/Referral: joint specialists/.test(t), "current stage missing"); return "Overview names 'Referral: joint specialists' (Awaiting review)";
  });
  await check("P2 Find the latest significant event", async () => {
    const t = await p.locator(".sit").innerText(); assert(/Referral received by Rheumatology/.test(t), "missing"); return "Referral received by Rheumatology, 12 Oct 2026";
  });
  await check("P3 Click a signpost and understand a referral", async () => {
    await go("patient/pt-imogen/journey");
    await p.getByRole("button", { name: /^Signpost.*Referral: gut specialists/ }).click();
    const t = await panelText(); assert(/Waiting for a decision/.test(t) && /28 days/.test(t), "wait not shown"); await close(); return "Panel shows sent/received/decision and a 28-day wait";
  });
  await check("P4 Click a campsite and get period + duration", async () => {
    await p.getByRole("button", { name: /^Campsite.*Hospital stay/ }).click();
    const t = await panelText(); assert(/7 Jul 2026/.test(t) && /15 Jul 2026/.test(t) && /8 days/.test(t), "duration"); await close(); return "7 Jul – 15 Jul 2026, 8 days";
  });
  await check("P5 Find the next confirmed appointment", async () => {
    await go("patient/pt-imogen/overview"); const t = await p.locator(".sit").innerText();
    assert(/Wednesday 4 Nov 2026, 10:30/.test(t), "next appt"); return "Gastroenterology, Wed 4 Nov 2026 10:30";
  });
  await check("P6 Identify which information is missing", async () => {
    const n = await p.locator(".unknowns li").count(); assert(n > 0, "no unknowns"); return `${n} plain-language items in 'What isn't known yet'`;
  });
  await check("P7 Find a medication record and its status", async () => {
    await go("patient/pt-imogen/medications"); await p.getByRole("button", { name: /Azathioprine 100 mg/ }).first().click();
    const t = await panelText(); assert(/Awaiting reconciliation/.test(t), "status"); await close(); return "Azathioprine 100 mg: Awaiting reconciliation, with history";
  });
  await check("P8 Find an overseas event and its source", async () => {
    await go("patient/pt-imogen/journey"); await p.locator(".gsearch input").fill("Spain"); await p.waitForTimeout(150);
    await p.locator(".gsearch li").first().click(); await p.waitForTimeout(200);
    const t = await panelText(); assert(/Overseas document \(patient supplied\)/.test(t) && /Received \/ imported/.test(t), "source"); await close(); return "Source: overseas document (unverified); event 18 Jun, imported 11 Aug";
  });
  await check("P9 Switch landscape → chronological list", async () => {
    await p.getByRole("button", { name: "List", exact: true }).click(); const n = await p.locator(".llist li").count();
    assert(n === 20, `list has ${n}`); await p.getByRole("button", { name: "Trail", exact: true }).click(); return "List view shows all 20 landmarks; timeline below lists 36 events";
  });
  await check("P10 Navigate the journey without a mouse", async () => {
    await p.getByRole("button", { name: /First GP visit/ }).focus();
    for (let i = 0; i < 4; i++) await p.keyboard.press("ArrowRight");
    const lbl = await p.evaluate(() => document.activeElement.getAttribute("aria-label"));
    await p.keyboard.press("Enter"); await p.waitForTimeout(200);
    const inPanel = await p.evaluate(() => !!document.activeElement.closest(".panel"));
    await close(); await p.waitForTimeout(100);
    const back = await p.evaluate(() => document.activeElement.getAttribute("aria-label"));
    assert(inPanel && back === lbl, "focus management"); return `Arrow keys → "${lbl.split(":")[1].split(".")[0].trim()}", Enter opens, Esc returns focus`;
  });

  // ---------------- professional tasks
  await check("C1 Reconstruct the journey across providers", async () => {
    await go("pro/pt-imogen/journey"); const t = await p.locator(".tfilters__count").innerText(); assert(/36 of 36/.test(t), t);
    const orgs = await p.evaluate(() => document.querySelectorAll(".tl__meta").length); return `36 events from 6 organisations, in event-date order (${orgs} rows)`;
  });
  await check("C2 Trace a referral to its latest status", async () => {
    await go("pro/pt-imogen/referrals"); await p.locator("table .linkbtn").first().click();
    const t = await panelText(); assert(/Status history/i.test(t), "history"); await close(); return "Status history, linked events, appointments, signpost link";
  });
  await check("C3 Find an appointment with no recorded outcome", async () => {
    await go("pro/pt-imogen/encounters"); await p.getByLabel("Past appointments without a recorded outcome").check();
    const rows = await p.locator("table tbody tr").count(); assert(rows === 1, `rows ${rows}`); return "Filter isolates 2 Sep 2026 gastroenterology follow-up";
  });
  await check("C4 Identify a missing discharge follow-up", async () => {
    await go("pro/pt-walter/actions"); const t = await p.locator(".findings").innerText(); assert(/Discharge without a recorded follow-up/.test(t), "R4"); return "Walter: R4 + R2 findings on the rehab handover";
  });
  await check("C5 Review a medication discrepancy", async () => {
    await go("pro/pt-imogen/medications"); const n = await p.locator(".recon__col").count(); assert(n === 2, "recon"); return "Side-by-side 50 mg (GP) vs 100 mg (hospital) with sources";
  });
  await check("C6 Identify the source of a record", async () => {
    await go("pro/pt-imogen/records"); const n = await p.locator("table").first().locator("tbody tr").count(); assert(n === 6, "sources"); return "6 record sources with jurisdiction and verification";
  });
  await check("C7 Understand the duration of service involvement", async () => {
    await go("pro/pt-imogen/teams"); const t = await p.locator(".team").first().innerText(); assert(/days/.test(t) || /Duration/.test(t), "dur"); return "Involvement chart + per-service duration";
  });
  await check("C8 Filter events by service and date", async () => {
    await go("pro/pt-imogen/journey");
    await p.getByRole("button", { name: /^Service/ }).click(); await p.getByLabel(/Gastroenterology outpatients/).check(); await p.getByRole("button", { name: "Done" }).click();
    await p.locator(".tfilters input[type=date]").first().fill("2026-04-01");
    const t = await p.locator(".tfilters__count").innerText(); assert(/^\s*4 of 36/.test(t), t); return t.trim();
  });
  await check("C9 Follow referral → assessment → follow-up links", async () => {
    await go("pro/pt-imogen/referrals"); await p.getByRole("button", { name: /PW-REF/ }).nth(3).click(); await p.waitForTimeout(150);
    await p.locator(".panel .evrow").last().click(); await p.waitForTimeout(150); const t1 = await panelTitle();
    await p.locator(".panel .evrow").last().click(); await p.waitForTimeout(150); const t2 = await panelTitle();
    await close(); return `Referral → "${t1}" → "${t2}" (Back button keeps the trail)`;
  });
  await check("C10 Distinguish missing documentation from failure of care", async () => {
    await go("pro/pt-imogen/actions"); await p.locator(".finding .linkbtn--sm").first().click();
    const t = await panelText(); assert(/does not prove that care was not provided/.test(t), "caveat"); await close(); return "Every finding states that incomplete documentation does not prove care was not provided";
  });

  // ---------------- functional
  await check("F Ongoing episodes have no invented end date", async () => {
    await go("patient/pt-imogen/journey"); await p.getByRole("button", { name: /^Campsite.*Gastroenterology care/ }).click();
    const t = await panelText(); assert(/Ongoing — no end date recorded/.test(t) && /so far/.test(t), "ongoing"); await close(); return "Ongoing — 230 days so far, no end date";
  });
  await check("F Missing dates give honest unknown duration", async () => {
    await go("patient/pt-noor/journey"); await p.getByRole("button", { name: /^Campsite.*Asthma care with GP/ }).click();
    const t = await panelText(); assert(/duration cannot be determined/i.test(t), "unknown"); await close(); return "Noor: 'Ongoing — duration cannot be determined'";
  });
  await check("F Landscape filters + empty state + reset", async () => {
    await go("patient/pt-noor/journey"); await p.getByRole("button", { name: "Information gaps", exact: true }).click();
    await p.getByRole("button", { name: "Ongoing care", exact: true }).click(); await p.getByRole("button", { name: "Milestones", exact: true }).click();
    const s = await p.locator(".lcontrols__status").innerText();
    await p.getByRole("button", { name: /More filters/ }).click(); await p.getByLabel("From").first().fill("2026-12-01");
    const empty = await p.getByText("No landmarks match these filters").count();
    await p.getByRole("button", { name: /Reset filters/ }).click(); const after = await p.locator(".lcontrols__status").innerText();
    assert(empty === 1 && /full journey/.test(after), "empty/reset"); return `${s.split("·")[0].trim()} → empty state → reset`;
  });
  await check("F Mode switch keeps the same data", async () => {
    await go("patient/pt-walter/overview"); const a = await p.locator(".lmk").count();
    await p.getByRole("radio", { name: "Professional view" }).click(); await p.waitForTimeout(300); const b2 = await p.locator(".lmk").count();
    assert(a === b2 && a === 10, `${a} vs ${b2}`); return "Same 10 landmarks in both views";
  });
  await check("F Every page renders for every patient without errors", async () => {
    const pages = { patient: ["overview", "journey", "appointments", "medications", "teams", "documents", "details"], pro: ["overview", "journey", "referrals", "encounters", "medications", "teams", "actions", "records", "audit"] };
    let n = 0;
    for (const pt of ["pt-imogen", "pt-walter", "pt-noor"]) for (const m of ["patient", "pro"]) for (const pg of pages[m]) { await go(`${m}/${pt}/${pg}`); n++; }
    assert(errors.length === 0, errors.join("; ")); return `${n} page renders, 0 runtime errors`;
  });
  await check("F Every landmark opens a panel (all patients)", async () => {
    let n = 0;
    for (const pt of ["pt-imogen", "pt-walter", "pt-noor"]) {
      await go(`patient/${pt}/journey`); await p.getByRole("button", { name: "List", exact: true }).click();
      const c = await p.locator(".llist__btn").count();
      for (let i = 0; i < c; i++) { await p.locator(".llist__btn").nth(i).click(); await p.locator("#panel-title").waitFor(); await close(); n++; }
    }
    return `${n} landmarks opened`;
  });

  // ---------------- mobile
  const m = await b.newPage({ viewport: { width: 375, height: 812 } });
  await check("M Mobile: vertical trail, no horizontal scroll, full-screen panel", async () => {
    await m.goto(BASE + "patient/pt-imogen/journey"); await m.waitForTimeout(400);
    const sw = await m.evaluate(() => document.documentElement.scrollWidth); const rows = await m.locator(".vrow").count();
    await m.locator(".vrow__card").first().click(); const w = await m.locator(".panel").evaluate((e) => e.getBoundingClientRect().width);
    assert(sw <= 375 && rows === 20 && w >= 374, `sw ${sw} rows ${rows} w ${w}`); return `scrollWidth ${sw}px, ${rows} trail cards, panel ${Math.round(w)}px wide`;
  });

  await b.close();
  const pass = results.filter((r) => r.ok).length;
  for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name} — ${r.detail}`);
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
