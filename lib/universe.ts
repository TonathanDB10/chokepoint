import type { Stock, Theme, ThemeId } from "./types";

export const THEMES: Record<ThemeId, Theme> = {
  optical: {
    id: "optical",
    title: "Optical Bottleneck",
    subtitle: "AI infrastructure: compute → memory → networking → power → light",
    question:
      "If optical interconnects become the binding constraint in AI infrastructure from 2027–2029, which companies capture the largest incremental economics relative to what is already priced into their shares?",
    chain: ["Compute", "HBM", "Networking", "Power", "Optics"],
    sleeveNote:
      "Weights are the provisional $100k test sleeve from the discussion. They were explicitly not meant to be deployed until the mispricing screen was done.",
  },
  humanoid: {
    id: "humanoid",
    title: "Humanoid Bottleneck",
    subtitle: "Physical AI: what every serious humanoid manufacturer has to buy",
    question:
      "We do not need one billion humanoids. We need humanoid production to scale enough that a few difficult-to-replace components become binding constraints. Which suppliers own those components, and at what price?",
    chain: ["Sensing", "Motion", "Magnets", "Precision reducers", "Batteries"],
    sleeveNote:
      "The discussion ranked these seven but never sized them. These starting weights follow its conclusion: carry MP, NOVT and Harmonic Drive forward, keep Keyence and Amphenol as quality infrastructure, de-emphasise Nidec and Teledyne.",
  },
};

export const UNIVERSE: Stock[] = [
  // ─── Optical Bottleneck ───────────────────────────────────────────────
  {
    symbol: "LITE",
    ticker: "LITE",
    name: "Lumentum",
    theme: "optical",
    tier: "Bottleneck owner",
    exchange: "NasdaqGS",
    currency: "USD",
    bottleneck: "Lasers / EML / OCS / NPO / CPO light sources",
    threadRank: 1,
    provisionalWeight: 22,
    scores: { bottleneckExposure: 5, revenueSensitivity: 5, moat: 4, evidence: 5 },
    thesis:
      "The most direct expression of \"AI needs vastly more light.\" Scarce laser and photonics capacity is the chokepoint if scale-up networking moves from copper to optics.",
    evidence: [
      "FY26 Q4 revenue $1.01B; next-quarter guide $1.225–1.275B",
      "OCS backlog above $400M and a multi-hundred-million-dollar CPO order for delivery in H1 2027",
      "NVIDIA strategic supply arrangements with Lumentum and Coherent total ~$4B, explicitly to secure laser supply",
      "Citi named it a preferred US comms-equipment stock on early NPO/CPO adoption and laser supply constraints",
    ],
    risk:
      "The story is well known. The stock has already attracted substantial attention, so a correct thesis can still be a poor investment if five years of perfect execution is priced in.",
    carryForward: true,
  },
  {
    symbol: "COHR",
    ticker: "COHR",
    name: "Coherent",
    theme: "optical",
    tier: "Bottleneck owner",
    exchange: "NYSE",
    currency: "USD",
    bottleneck: "InP lasers, transceivers, silicon photonics",
    threadRank: 2,
    provisionalWeight: 20,
    scores: { bottleneckExposure: 5, revenueSensitivity: 4, moat: 4, evidence: 5 },
    thesis:
      "The diversified version of Lumentum. Not betting on one architecture: works across silicon photonics, InP and VCSEL, and is scaling 6-inch indium-phosphide manufacturing.",
    evidence: [
      "Q4 FY26 revenue $2.05B, +34% YoY with significant margin expansion",
      "Demonstrated 1.6T, 3.2T and future 12.8T+ technologies at OFC 2026",
      "Ramping 6-inch InP production and high-power CW lasers for SiPh and CPO",
      "Included in NVIDIA's ~$4B optical supply arrangements",
    ],
    risk:
      "Broader exposure means more of the business is outside the bottleneck. Transceiver modules face more competition than the lasers inside them.",
    carryForward: true,
  },
  {
    symbol: "MRVL",
    ticker: "MRVL",
    name: "Marvell Technology",
    theme: "optical",
    tier: "Architecture owner",
    exchange: "NasdaqGS",
    currency: "USD",
    bottleneck: "Optical DSPs, switching, NPO/CPO silicon (TIAs, drivers)",
    threadRank: 3,
    provisionalWeight: 18,
    scores: { bottleneckExposure: 4, revenueSensitivity: 3, moat: 4, evidence: 4 },
    thesis:
      "Gets paid for the intelligence sitting around the optical connection rather than the light source itself. Scale-up networking moves from switching + NPO to switching + CPO, and Marvell sells into both.",
    evidence: [
      "Management: NPO creates another growth leg via TIAs and drivers; CPO coexists rather than replaces, with a much larger ramp in 2028–29",
      "Teralynx switching went from ~zero at acquisition to a $1B+ run-rate track",
      "Scale-up networking described as a greenfield opportunity",
    ],
    risk:
      "Optics is one of several growth vectors; custom silicon dominates the narrative. Optical content may not move the whole company the way it moves LITE or COHR.",
    carryForward: true,
  },
  {
    symbol: "ALAB",
    ticker: "ALAB",
    name: "Astera Labs",
    theme: "optical",
    tier: "Architecture owner",
    exchange: "NasdaqGS",
    currency: "USD",
    bottleneck: "Scale-up connectivity → NPO → CPO",
    threadRank: 4,
    provisionalWeight: 15,
    scores: { bottleneckExposure: 4, revenueSensitivity: 3, moat: 3, evidence: 3 },
    thesis:
      "The asymmetric candidate. Optical revenue only starts in 2027, but management says optics could lift content per XPU into multiple thousands of dollars against a TAM in the tens of billions.",
    evidence: [
      "Roadmap: optical components 2027 → initial NPO revenue H2 2027 → fuller NPO contribution 2028 → CPO",
      "Optical TAM described by management as tens of billions of dollars",
    ],
    risk:
      "Partly a future-architecture bet. If NPO/CPO timing slips 12–24 months the stock has the most to lose, and the valuation may already embed too much of that future growth.",
    carryForward: true,
  },
  {
    symbol: "FN",
    ticker: "FN",
    name: "Fabrinet",
    theme: "optical",
    tier: "Enabler",
    exchange: "NYSE",
    currency: "USD",
    bottleneck: "Optical manufacturing (contract)",
    threadRank: 5,
    provisionalWeight: 10,
    scores: { bottleneckExposure: 4, revenueSensitivity: 4, moat: 3, evidence: 4 },
    thesis:
      "The manufacturing arms dealer. Does not need to predict whether NPO or CPO wins; if LITE, COHR and others ship vastly more optics, somebody builds it.",
    evidence: [
      "Latest quarterly guide $1.375–1.425B revenue",
      "Data-center revenue ~$669M, +68% YoY, roughly 51% of quarterly revenue",
      "DCI alone above a $1B annualised run rate",
      "Named by NVIDIA as a silicon-photonics networking partner",
    ],
    risk:
      "Contract manufacturing has structurally thinner margins and heavy customer concentration. Less technological moat than the companies it builds for.",
    carryForward: true,
  },
  {
    symbol: "GLW",
    ticker: "GLW",
    name: "Corning",
    theme: "optical",
    tier: "Enabler",
    exchange: "NYSE",
    currency: "USD",
    bottleneck: "Optical fibre and physical connectivity",
    threadRank: 6,
    provisionalWeight: 10,
    scores: { bottleneckExposure: 3, revenueSensitivity: 3, moat: 4, evidence: 4 },
    thesis:
      "If AI factories consume dramatically more fibre, Corning sells the roads. Lower technological optionality than ALAB, but lower thesis risk.",
    evidence: [
      "Optical Communications sales +32% YoY to $2.07B; Enterprise Networks +65% with Gen-AI products growing faster",
      "Long-term hyperscaler agreements including Meta deal of up to $6B",
      "New multi-year, multi-billion-dollar Verizon agreement through 2032 that explicitly includes Gen-AI compute infrastructure",
    ],
    risk:
      "A large diversified materials company; optics is one segment. Fibre is a volume business, and bidirectional-fibre techniques could cut cabling needs by up to 50%.",
    carryForward: true,
  },
  {
    symbol: "AVGO",
    ticker: "AVGO",
    name: "Broadcom",
    theme: "optical",
    tier: "Diluted exposure",
    exchange: "NasdaqGS",
    currency: "USD",
    bottleneck: "Switching, custom AI silicon, silicon photonics",
    threadRank: 7,
    provisionalWeight: 5,
    scores: { bottleneckExposure: 2, revenueSensitivity: 1, moat: 5, evidence: 4 },
    thesis:
      "Extraordinary AI infrastructure company and a quality anchor, but a poor test of this specific thesis: if optics disappoints, Broadcom still wins.",
    evidence: [
      "Latest quarter $29.6B revenue, +86% YoY, $13.7B free cash flow",
      "Q4 guide approximately $34.8B",
      "Tomahawk 6 CPO switching in market",
    ],
    risk:
      "Great company is not the same as best expression of the thesis. Optical content is a rounding error against custom silicon and software.",
    carryForward: false,
  },

  // ─── Humanoid Bottleneck ──────────────────────────────────────────────
  {
    symbol: "MP",
    ticker: "MP",
    name: "MP Materials",
    theme: "humanoid",
    tier: "Bottleneck owner",
    exchange: "NYSE",
    currency: "USD",
    bottleneck: "NdFeB magnets / rare-earth supply chain",
    threadRank: 1,
    provisionalWeight: 22,
    scores: { bottleneckExposure: 5, revenueSensitivity: 5, moat: 5, evidence: 4 },
    thesis:
      "A humanoid is a bundle of electric actuators, and high-performance actuation relies on permanent magnets. MP is vertically integrated from extraction through refining to NdFeB magnet manufacturing, and names robotics as a target market.",
    evidence: [
      "Management estimate: at 30–40M humanoids per year, humanoids alone would consume today's entire global rare-earth magnet output",
      "Q2 2026 NdPr production +41% YoY, sales +127%; Magnetics segment now generating revenue and positive adjusted EBITDA",
      "Q1 2026: record NdPr production 917t (+63%) and sales 1,006t (+117%)",
      "July 2025 US government deal to strengthen domestic production",
    ],
    risk:
      "Tesla has demonstrated motor architectures that avoid rare earths entirely (Cybercab). The thesis is not \"every humanoid must use MP magnets\" but \"NdFeB demand outruns supply\". Commodity pricing exposure cuts both ways.",
    carryForward: true,
  },
  {
    symbol: "NOVT",
    ticker: "NOVT",
    name: "Novanta",
    theme: "humanoid",
    tier: "Bottleneck owner",
    exchange: "NasdaqGS",
    currency: "USD",
    bottleneck: "Precision motion control, encoders, servo drives, safety",
    threadRank: 2,
    provisionalWeight: 20,
    scores: { bottleneckExposure: 4, revenueSensitivity: 5, moat: 5, evidence: 4 },
    thesis:
      "The under-the-radar discovery of the screen. Not \"who makes the robot\" but \"who makes the robot move accurately\". Far less obvious than Tesla, NVIDIA or the robot OEMs.",
    evidence: [
      "More than one-third of the business already serves robotics/automation-related disruptive applications",
      "Explicit humanoid material: prototype-to-scalable-production, with precision motion, sensing, safety and reliability as critical subsystems",
      "Joined NVIDIA Halos AI Systems Inspection Lab (March 2026); Riverpoint acquisition (July 2026)",
    ],
    risk:
      "Small-cap precision-tech roll-up; medical and industrial end markets still dominate. Humanoid revenue is real but early, and a small company gets re-rated quickly once discovered.",
    carryForward: true,
  },
  {
    symbol: "6861.T",
    ticker: "6861 JP",
    name: "Keyence",
    theme: "humanoid",
    tier: "Quality infrastructure",
    exchange: "Tokyo",
    currency: "JPY",
    bottleneck: "Machine vision, sensors, precision measurement",
    threadRank: 3,
    provisionalWeight: 15,
    scores: { bottleneckExposure: 4, revenueSensitivity: 4, moat: 5, evidence: 3 },
    thesis:
      "Two demand layers: the robots themselves need perception, and the factories that manufacture robots need increasingly sophisticated inspection and automation.",
    evidence: [
      "Best-in-class industrial sensing and vision franchise with exceptional margins",
      "Named in KOID holdings and in the original supply-chain thesis",
    ],
    risk:
      "Has been recognised as an exceptional automation company for years. The question is whether humanoids add enough incremental economics to matter against an already premium valuation.",
    carryForward: true,
  },
  {
    symbol: "6324.T",
    ticker: "6324 JP",
    name: "Harmonic Drive Systems",
    theme: "humanoid",
    tier: "Bottleneck owner",
    exchange: "Tokyo",
    currency: "JPY",
    bottleneck: "Strain-wave precision reducers (joints)",
    threadRank: 4,
    provisionalWeight: 18,
    scores: { bottleneckExposure: 5, revenueSensitivity: 5, moat: 5, evidence: 4 },
    thesis:
      "Conceptually the purest humanoid thesis. Shoulder, elbow, wrist, hip, knee, ankle: a humanoid is a collection of controlled joints, and each needs a compact, low-backlash, high-ratio reducer.",
    evidence: [
      "Q1 FY2027 (Aug 2026): upward forecast revisions on strong demand and improved profitability",
      "Reclassified to the TSE Prime Market on 27 February 2026",
      "Morningstar: recovery intact but \"AI premium runs ahead of fundamentals\"",
    ],
    risk:
      "Exactly what happened with EV components: Chinese manufacturers (Leader Harmonic Drive and others) attack cost aggressively and can commoditise components that initially look scarce. Test pricing power, not just demand.",
    carryForward: true,
  },
  {
    symbol: "APH",
    ticker: "APH",
    name: "Amphenol",
    theme: "humanoid",
    tier: "Quality infrastructure",
    exchange: "NYSE",
    currency: "USD",
    bottleneck: "Connectors, power and signal interconnect, sensors",
    threadRank: 5,
    provisionalWeight: 15,
    scores: { bottleneckExposure: 3, revenueSensitivity: 3, moat: 5, evidence: 4 },
    thesis:
      "The least exciting story and one of the best businesses. Sits across both themes: AI data-centre connectivity and physical-AI connectivity. Does not need to know whether Tesla, Figure, Unitree or AgiBot wins.",
    evidence: [
      "Held by KOID at ~2.2%; appears in June top holdings",
      "RoboConn 2P5S hybrid power+signal connectors and robotics-specific interconnect lines marketed at humanoid summits",
    ],
    risk:
      "Humanoids will not move Amphenol's earnings the way they could move a smaller specialist. This is infrastructure exposure, not a bottleneck bet.",
    carryForward: true,
  },
  {
    symbol: "6594.T",
    ticker: "6594 JP",
    name: "Nidec",
    theme: "humanoid",
    tier: "Enabler",
    exchange: "Tokyo",
    currency: "JPY",
    bottleneck: "Motors, frameless motors, gear design for humanoids",
    threadRank: 6,
    provisionalWeight: 7,
    scores: { bottleneckExposure: 3, revenueSensitivity: 4, moat: 4, evidence: 3 },
    thesis:
      "More robots means vastly more motors. That is real, but motors are precisely the kind of market where enormous volume coexists with brutal price competition.",
    evidence: [
      "Dedicated humanoid programme: frameless motors (35–100mm), integrated actuation, new gear designs (EE Times, July 2026)",
      "Enhanced operating model and leadership appointments announced July 2026",
    ],
    risk:
      "TAM is not moat. Need to identify whether Nidec controls something genuinely difficult to substitute rather than merely benefiting from higher unit demand.",
    carryForward: false,
  },
  {
    symbol: "TDY",
    ticker: "TDY",
    name: "Teledyne Technologies",
    theme: "humanoid",
    tier: "Diluted exposure",
    exchange: "NYSE",
    currency: "USD",
    bottleneck: "Imaging, sensing, instrumentation",
    threadRank: 7,
    provisionalWeight: 3,
    scores: { bottleneckExposure: 2, revenueSensitivity: 2, moat: 5, evidence: 2 },
    thesis:
      "Excellent company whose sensing and imaging benefit from automation and physical AI, but humanoids are unlikely to matter to overall economics soon enough. Same reason AVGO ranked low in the optical screen.",
    evidence: [
      "Defence and space wins in 2026 (SDA Tranche 3 tracking layer, NATO anti-submarine autonomy) dominate the newsflow, not robotics",
    ],
    risk:
      "Diluted thesis. The discussion was inclined to remove it from the humanoid basket.",
    carryForward: false,
  },
];

/** Reference instruments fetched alongside the universe. */
export const BENCHMARKS = {
  koid: { symbol: "KOID", name: "KraneShares Global Humanoid Robotics & Physical AI ETF" },
  usdJpy: { symbol: "JPY=X", name: "USD/JPY" },
};

export const ALL_SYMBOLS = [
  ...UNIVERSE.map((s) => s.symbol),
  BENCHMARKS.koid.symbol,
  BENCHMARKS.usdJpy.symbol,
];

export function stocksForTheme(theme: ThemeId): Stock[] {
  return UNIVERSE.filter((s) => s.theme === theme).sort(
    (a, b) => a.threadRank - b.threadRank,
  );
}
