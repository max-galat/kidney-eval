import {
  DonorInput,
  RecipientInput,
  CandidateRecipient,
  CandidateMatchResult,
  PredictionResult,
  ShapValue,
  SimilarKidney,
  DeclineStats,
} from '@/types';

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_DONOR: DonorInput = {
  // KDPI factors
  donor_age: 65,
  donor_height_cm: 178,
  donor_weight_kg: 75,
  donor_ethnicity: 'White',
  donor_hypertension: true,
  donor_diabetes: false,
  donor_cause_of_death: 'CVA',
  donor_serum_creatinine: 1.2,
  donor_hcv: false,
  donor_dcd: true,
  // Additional factors — null by default (cleared when panel is collapsed)
  donor_biopsy_glomerulosclerosis: null,
  donor_pump_resistance: null,
  donor_pump_flow: null,
  donor_on_dialysis: false,
  cold_ischemia_hours: null,
  donor_bmi: null,
  donor_egfr: null,
  donor_terminal_creatinine: null,
};

export const DEFAULT_RECIPIENT: RecipientInput = {
  recipient_age: null,
  recipient_dialysis_months: null,
  recipient_bmi: null,
  recipient_diabetes: false,
  recipient_prior_transplant: false,
  patient_goal: 'balance',
};

export const DEFAULT_CANDIDATES: CandidateRecipient[] = [
  { label: '', recipient_age: null, recipient_dialysis_months: null, recipient_bmi: null, recipient_diabetes: false, recipient_prior_transplant: false, patient_goal: 'balance' },
  { label: '', recipient_age: null, recipient_dialysis_months: null, recipient_bmi: null, recipient_diabetes: false, recipient_prior_transplant: false, patient_goal: 'balance' },
];

// Fields that are cleared when the Additional Factors panel is collapsed
export const ADDITIONAL_FACTORS_CLEARED: Partial<DonorInput> = {
  donor_biopsy_glomerulosclerosis: null,
  donor_pump_resistance: null,
  donor_pump_flow: null,
  donor_on_dialysis: false,
  cold_ischemia_hours: null,
  donor_bmi: null,
  donor_egfr: null,
  donor_terminal_creatinine: null,
};

// ---------------------------------------------------------------------------
// Demo presets
// ---------------------------------------------------------------------------

/** Preset 1: Aligned case — model ≈ KDPI, good quality donor */
export const PRESET_ALIGNED_CASE: DonorInput = {
  donor_age: 45,
  donor_height_cm: 175,
  donor_weight_kg: 80, // 175 cm / 80 kg = 5'9" / 176 lbs
  donor_ethnicity: 'White',
  donor_hypertension: false,
  donor_diabetes: false,
  donor_cause_of_death: 'Trauma',
  donor_serum_creatinine: 0.9,
  donor_hcv: false,
  donor_dcd: false,
  donor_biopsy_glomerulosclerosis: 5,
  donor_pump_resistance: 0.12,
  donor_pump_flow: 145,
  donor_on_dialysis: false,
  cold_ischemia_hours: 14,
  donor_bmi: null,
  donor_egfr: null,
  donor_terminal_creatinine: null,
};

/** Preset 2: Kevin vs. James — compare mode with contrasting recipient profiles */
export const PRESET_KEVIN_JAMES_DONOR: DonorInput = {
  donor_age: 58,
  donor_height_cm: 178,
  donor_weight_kg: 82,
  donor_ethnicity: 'White',
  donor_hypertension: true,
  donor_diabetes: false,
  donor_cause_of_death: 'CVA',
  donor_serum_creatinine: 1.4,
  donor_hcv: false,
  donor_dcd: false,
  donor_biopsy_glomerulosclerosis: 8,
  donor_pump_resistance: 0.18,
  donor_pump_flow: 115,
  donor_on_dialysis: false,
  cold_ischemia_hours: 16,
  donor_bmi: null,
  donor_egfr: null,
  donor_terminal_creatinine: null,
};

export const PRESET_KEVIN_JAMES_CANDIDATES: CandidateRecipient[] = [
  {
    label: 'Kevin',
    recipient_age: 50,
    recipient_dialysis_months: 7,
    recipient_bmi: null,
    recipient_diabetes: true,
    recipient_prior_transplant: false,
    patient_goal: 'dialysis-asap',
  },
  {
    label: 'James',
    recipient_age: 30,
    recipient_dialysis_months: 14,
    recipient_bmi: null,
    recipient_diabetes: false,
    recipient_prior_transplant: false,
    patient_goal: 'longevity',
  },
];

/** Preset 1 recipient — Aligned Case single-patient demo */
export const PRESET_ALIGNED_CASE_RECIPIENT: RecipientInput = {
  recipient_age: 55,
  recipient_dialysis_months: 12,
  recipient_bmi: 28,
  recipient_diabetes: false,
  recipient_prior_transplant: false,
  patient_goal: 'balance',
};

/** Preset 3 recipient — "Model Says Don't Take It" demo */
export const PRESET_DONT_TAKE_IT_RECIPIENT: RecipientInput = {
  recipient_age: 58,
  recipient_dialysis_months: 18,
  recipient_bmi: 31,
  recipient_diabetes: true,
  recipient_prior_transplant: false,
  patient_goal: 'dialysis-asap',
};

/** Preset 3: "Model Says Don't Take It" — KDPI looks decent but pump/biopsy are terrible */
export const PRESET_DONT_TAKE_IT: DonorInput = {
  donor_age: 42,
  donor_height_cm: 178, // 178 cm / 82 kg = 5'10" / 181 lbs
  donor_weight_kg: 82,
  donor_ethnicity: 'White',
  donor_hypertension: false,
  donor_diabetes: false,
  donor_cause_of_death: 'Other',
  donor_serum_creatinine: 2.8,
  donor_hcv: false,
  donor_dcd: true,
  donor_biopsy_glomerulosclerosis: 22,
  donor_pump_resistance: 0.40,
  donor_pump_flow: 60,
  donor_on_dialysis: true,
  cold_ischemia_hours: 28,
  donor_bmi: null,
  donor_egfr: null,
  donor_terminal_creatinine: null,
};

// ---------------------------------------------------------------------------
// SRTR KDPI → 1yr graft survival lookup
// ---------------------------------------------------------------------------

const KDPI_SURVIVAL_TABLE: [number, number][] = [
  [0, 0.97], [10, 0.965], [20, 0.96], [30, 0.95], [40, 0.93],
  [50, 0.91], [60, 0.89], [70, 0.86], [80, 0.83], [85, 0.81],
  [90, 0.78], [95, 0.74], [100, 0.70],
];

function kdpiToSurvival(kdpi: number): number {
  const clamped = Math.max(0, Math.min(100, kdpi));
  for (let i = 1; i < KDPI_SURVIVAL_TABLE.length; i++) {
    const [k1, s1] = KDPI_SURVIVAL_TABLE[i - 1];
    const [k2, s2] = KDPI_SURVIVAL_TABLE[i];
    if (clamped <= k2) {
      const t = (clamped - k1) / (k2 - k1);
      return Math.round((s1 + t * (s2 - s1)) * 100) / 100;
    }
  }
  return 0.70;
}

// ---------------------------------------------------------------------------
// Non-Use Risk (Change 1)
// ---------------------------------------------------------------------------

const NON_USE_ANCHORS: [number, number][] = [
  [20, 5], [50, 18], [70, 30], [85, 48], [95, 68],
];

function interpolateNonUseRate(kdpi: number): number {
  const clamped = Math.max(0, Math.min(100, kdpi));
  if (clamped <= NON_USE_ANCHORS[0][0]) return NON_USE_ANCHORS[0][1];
  for (let i = 1; i < NON_USE_ANCHORS.length; i++) {
    const [k1, r1] = NON_USE_ANCHORS[i - 1];
    const [k2, r2] = NON_USE_ANCHORS[i];
    if (clamped <= k2) {
      const t = (clamped - k1) / (k2 - k1);
      return r1 + t * (r2 - r1);
    }
  }
  return 68;
}

export function getNonUseRisk(
  kdpi: number,
  dcd: boolean,
  donorAge: number,
): { rate: number; label: string; color: 'green' | 'yellow' | 'orange' | 'red' } {
  let rate = interpolateNonUseRate(kdpi);
  if (dcd) rate += 8;
  if (donorAge > 60) rate += 5;
  rate = Math.min(80, Math.round(rate));

  let label: string;
  let color: 'green' | 'yellow' | 'orange' | 'red';
  if (kdpi < 40) {
    label = `Low non-use risk: ~${rate}%`;
    color = 'green';
  } else if (kdpi < 70) {
    label = `Moderate non-use risk: ~${rate}%`;
    color = 'yellow';
  } else if (kdpi < 85) {
    label = `High non-use risk: ~${rate}%`;
    color = 'orange';
  } else {
    label = `Very high non-use risk: ~${rate}%`;
    color = 'red';
  }
  return { rate, label, color };
}

// ---------------------------------------------------------------------------
// Center Acceptance Context (Change 4)
// ---------------------------------------------------------------------------

export function getCenterAcceptanceData(
  kdpi: number,
  dcd: boolean,
): { nationalRate: number; highVolumeRate: number; priorDeclines: number; kdpiLabel: string } {
  let nationalRate: number;
  let highVolumeRate: number;
  let declineLow: number;
  let declineHigh: number;
  let kdpiLabel: string;

  if (kdpi < 40) {
    nationalRate = 85; highVolumeRate = 90; declineLow = 0; declineHigh = 1; kdpiLabel = '< 40';
  } else if (kdpi < 70) {
    nationalRate = 65; highVolumeRate = 72; declineLow = 2; declineHigh = 3; kdpiLabel = '40–70';
  } else if (kdpi < 85) {
    nationalRate = 38; highVolumeRate = 52; declineLow = 4; declineHigh = 8; kdpiLabel = '70–85';
  } else {
    nationalRate = 22; highVolumeRate = 35; declineLow = 8; declineHigh = 15; kdpiLabel = '85+';
  }

  if (dcd) {
    nationalRate = Math.max(0, nationalRate - 10);
    highVolumeRate = Math.max(0, highVolumeRate - 10);
    declineLow += 3;
    declineHigh += 3;
  }

  // Deterministic value within range based on KDPI
  const range = declineHigh - declineLow;
  const priorDeclines = declineLow + (range > 0 ? kdpi % (range + 1) : 0);
  return { nationalRate, highVolumeRate, priorDeclines, kdpiLabel };
}

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32)
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function donorSeed(donor: DonorInput): number {
  const codMap: Record<string, number> = { CVA: 1, Trauma: 2, Anoxia: 3, Other: 4 };
  return (
    donor.donor_age * 1000 +
    (codMap[donor.donor_cause_of_death] ?? 0) * 100 +
    (donor.donor_dcd ? 50 : 0) +
    (donor.donor_on_dialysis ? 25 : 0) +
    (donor.donor_hypertension ? 10 : 0) +
    (donor.donor_diabetes ? 5 : 0) +
    Math.round(donor.donor_serum_creatinine * 10)
  );
}

// ---------------------------------------------------------------------------
// Dynamic similar kidneys
// ---------------------------------------------------------------------------

const CAUSES_OF_DEATH = ['CVA', 'Anoxia', 'Trauma', 'Other'] as const;
const FAILURE_CAUSES = ['Primary non-function', 'Rejection', 'Delayed graft function'] as const;

function generateSimilarKidneys(
  donor: DonorInput,
  rand: () => number,
  candidateAge?: number | null,
): SimilarKidney[] {
  const baseRecipientAge = candidateAge ?? 50;
  return Array.from({ length: 10 }, () => {
    const ageOffset = Math.round((rand() - 0.5) * 10);
    const age = Math.max(18, Math.min(90, donor.donor_age + ageOffset));
    const cod = rand() < 0.6 ? donor.donor_cause_of_death : CAUSES_OF_DEATH[Math.floor(rand() * 4)];
    const dcd = rand() < 0.7 ? donor.donor_dcd : rand() < 0.5;
    const on_dialysis = rand() < 0.7 ? donor.donor_on_dialysis : rand() < 0.5;

    const kdpi = Math.min(99, Math.max(1, Math.round(
      40 + (age - 30) * 0.8 + (dcd ? 10 : 0) + (on_dialysis ? 5 : 0) + rand() * 10 - 5,
    )));

    const qualityScore = 95 - (age > 60 ? (age - 60) * 0.5 : 0) - (dcd ? 5 : 0) - (on_dialysis ? 3 : 0);
    const graft_status_1yr: 'Functioning' | 'Failed' = rand() * 100 < qualityScore ? 'Functioning' : 'Failed';

    const egfr_12mo = graft_status_1yr === 'Functioning'
      ? Math.max(20, Math.round(65 - (age - 30) * 0.3 + (rand() - 0.5) * 20))
      : null;

    const failure_cause = graft_status_1yr === 'Failed'
      ? FAILURE_CAUSES[Math.floor(rand() * 3)]
      : undefined;

    // Recipient age: candidate age ± randomInt(-10, +15), clamped 25–75
    const recipientOffset = Math.round((rand() - 0.3) * 25);
    const recipient_age = Math.max(25, Math.min(75, baseRecipientAge + recipientOffset));

    return { donor_age: age, cause_of_death: cod, dcd, on_dialysis, kdpi, graft_status_1yr, egfr_12mo, failure_cause, recipient_age };
  });
}

// ---------------------------------------------------------------------------
// Personalized decline stats lookup (Change 3)
// ---------------------------------------------------------------------------

interface PersonalizedDeclineRow {
  medianWait: number;
  pctBetter6mo: number;
  pctWaiting12mo: number;
  annualMortality: number;
}

function getPersonalizedDeclineRow(recipient: RecipientInput): PersonalizedDeclineRow {
  const age = recipient.recipient_age ?? 50;
  const dialysis = recipient.recipient_dialysis_months ?? 0;
  const diabetes = recipient.recipient_diabetes;
  const priorTx = recipient.recipient_prior_transplant;

  // Prior transplant overrides (highest priority)
  if (priorTx) {
    if (age < 50) return { medianWait: 22, pctBetter6mo: 8, pctWaiting12mo: 50, annualMortality: 10 };
    if (age < 65) return { medianWait: 22, pctBetter6mo: 8, pctWaiting12mo: 50, annualMortality: 10 };
    return { medianWait: 28, pctBetter6mo: 5, pctWaiting12mo: 60, annualMortality: 14 };
  }

  if (age < 35) {
    if (diabetes) return { medianWait: 10, pctBetter6mo: 22, pctWaiting12mo: 22, annualMortality: 3 };
    return { medianWait: 8, pctBetter6mo: 30, pctWaiting12mo: 15, annualMortality: 2 };
  }
  if (age < 50) {
    if (diabetes) return { medianWait: 14, pctBetter6mo: 15, pctWaiting12mo: 32, annualMortality: 5 };
    if (dialysis < 12) return { medianWait: 9, pctBetter6mo: 25, pctWaiting12mo: 18, annualMortality: 3 };
    return { medianWait: 12, pctBetter6mo: 18, pctWaiting12mo: 28, annualMortality: 4 };
  }
  if (age < 65) {
    if (diabetes) return { medianWait: 18, pctBetter6mo: 10, pctWaiting12mo: 42, annualMortality: 9 };
    if (dialysis < 12) return { medianWait: 11, pctBetter6mo: 20, pctWaiting12mo: 25, annualMortality: 5 };
    return { medianWait: 15, pctBetter6mo: 12, pctWaiting12mo: 35, annualMortality: 7 };
  }
  // age >= 65
  if (diabetes) return { medianWait: 24, pctBetter6mo: 6, pctWaiting12mo: 55, annualMortality: 12 };
  return { medianWait: 16, pctBetter6mo: 10, pctWaiting12mo: 40, annualMortality: 8 };
}

// ---------------------------------------------------------------------------
// Dynamic decline stats
// ---------------------------------------------------------------------------

function generateDeclineStats(
  predicted: number,
  rand: () => number,
  recipient?: RecipientInput | null,
): DeclineStats {
  // Use personalized lookup when recipient data is available
  if (recipient && hasRecipientFactors(recipient)) {
    const row = getPersonalizedDeclineRow(recipient);
    return {
      median_wait_months: row.medianWait,
      pct_better_within_6mo: row.pctBetter6mo,
      pct_still_waiting_12mo: row.pctWaiting12mo,
      high_demand: false,
      acceptance_rate: null,
      annual_waitlist_mortality: row.annualMortality,
      is_population_average_mortality: false,
    };
  }

  // No recipient — always show population-average annual mortality (5%)
  // The high-demand card is removed (Fix 5); show wait stats for all quality tiers
  if (predicted > 0.80) {
    return {
      median_wait_months: Math.round(8 + rand() * 6),
      pct_better_within_6mo: Math.round(25 + rand() * 10),
      pct_still_waiting_12mo: Math.round(10 + rand() * 10),
      high_demand: false,
      acceptance_rate: null,
      annual_waitlist_mortality: 5,
      is_population_average_mortality: true,
    };
  }
  if (predicted > 0.70) {
    return {
      median_wait_months: Math.round(4 + rand() * 2),
      pct_better_within_6mo: Math.round(15 + rand() * 10),
      pct_still_waiting_12mo: Math.round(5 + rand() * 10),
      high_demand: false,
      acceptance_rate: null,
      annual_waitlist_mortality: 5,
      is_population_average_mortality: true,
    };
  }
  return {
    median_wait_months: Math.round(3 + rand() * 2),
    pct_better_within_6mo: Math.round(10 + rand() * 10),
    pct_still_waiting_12mo: Math.round(3 + rand() * 7),
    high_demand: false,
    acceptance_rate: null,
    annual_waitlist_mortality: 5,
    is_population_average_mortality: true,
  };
}

// ---------------------------------------------------------------------------
// Recipient adjustment
// ---------------------------------------------------------------------------

function hasAdditionalFactors(donor: DonorInput): boolean {
  return (
    donor.donor_biopsy_glomerulosclerosis !== null ||
    donor.donor_pump_resistance !== null ||
    donor.donor_pump_flow !== null ||
    donor.donor_bmi !== null ||
    donor.donor_egfr !== null ||
    donor.donor_terminal_creatinine !== null ||
    donor.cold_ischemia_hours !== null ||
    donor.donor_on_dialysis
  );
}

export function hasRecipientFactors(recipient: RecipientInput | null | undefined): boolean {
  if (!recipient) return false;
  return (
    recipient.recipient_age !== null ||
    recipient.recipient_dialysis_months !== null ||
    recipient.recipient_bmi !== null ||
    recipient.recipient_diabetes ||
    recipient.recipient_prior_transplant
  );
}

function applyRecipientAdjustment(predicted: number, recipient: RecipientInput | null | undefined): number {
  if (!hasRecipientFactors(recipient)) return predicted;
  const r = recipient!;
  let delta = 0;
  if (r.recipient_age !== null) {
    if (r.recipient_age > 65) delta += 0.03;
    else if (r.recipient_age >= 45 && r.recipient_age <= 60) delta -= 0.01; // middle-aged suboptimal
    else if (r.recipient_age < 40 && !r.recipient_diabetes) delta += 0.01; // young non-diabetic is positive
    else if (r.recipient_age < 40 && r.recipient_diabetes) delta -= 0.01; // young + diabetes
  }
  if (r.recipient_dialysis_months !== null && r.recipient_dialysis_months > 60) delta += 0.02;
  if (r.recipient_diabetes) delta -= 0.02;
  if (r.recipient_prior_transplant) delta -= 0.02;
  if (r.recipient_bmi !== null && r.recipient_bmi > 35) delta -= 0.01;
  return Math.round(Math.max(0.01, Math.min(0.99, predicted + delta)) * 100) / 100;
}

// ---------------------------------------------------------------------------
// 4-part analysis text builder
// ---------------------------------------------------------------------------

// Features not in KDPI — used for Part 2 divergence explanation
const NON_KDPI_FEATURES = new Set([
  'donor_biopsy_glomerulosclerosis',
  'donor_pump_resistance',
  'donor_pump_flow',
  'donor_on_dialysis',
  'cold_ischemia_hours',
  'donor_egfr',
  'donor_terminal_creatinine',
  'donor_bmi',
]);

function buildDynamicAnalysis(
  shapValues: ShapValue[],
  similarKidneys: SimilarKidney[],
  predicted: number,
  kdpiSurvival: number,
  recipient?: RecipientInput | null,
): string {
  const predPct = Math.round(predicted * 100);
  const sortedNeg = shapValues.filter((s) => s.impact < 0).sort((a, b) => a.impact - b.impact);
  const sortedPos = shapValues.filter((s) => s.impact > 0).sort((a, b) => b.impact - a.impact);
  const totalNegPct = Math.round(Math.abs(sortedNeg.reduce((sum, s) => sum + s.impact, 0)) * 100);

  const n0 = sortedNeg[0]?.label ?? 'risk factors';
  const n1 = sortedNeg[1]?.label ?? 'additional factors';
  const n2 = sortedNeg[2]?.label ?? 'other concerns';
  const p0 = sortedPos[0]?.label ?? 'favorable characteristics';
  const p1 = sortedPos[1]?.label ?? 'overall profile';

  // Part 1 — Donor quality assessment
  let part1: string;
  if (predPct >= 90) {
    part1 = `This is a strong donor profile. ${p0} and ${p1} are the primary drivers of the favorable prediction.`;
  } else if (predPct >= 80) {
    part1 = `${n0} and ${n1} are the primary risk factors, reducing predicted survival by ${totalNegPct}%. However, ${p0} and ${p1} suggest viable tissue that KDPI undervalues.`;
  } else if (predPct >= 70) {
    part1 = `This is a marginal donor. ${n0}, ${n1}, and ${n2} compound to reduce predicted survival by ${totalNegPct}%. ${p0} provides some offset, but overall donor quality is below average.`;
  } else {
    part1 = `This is a high-risk donor. Multiple factors — ${n0}, ${n1}, ${n2} — significantly reduce predicted survival. Proceed with caution.`;
  }

  // Part 2 — KDPI divergence
  const diffPct = Math.round((predicted - kdpiSurvival) * 100);
  const nonKdpiPos = shapValues.filter((s) => NON_KDPI_FEATURES.has(s.feature) && s.impact > 0).sort((a, b) => b.impact - a.impact);
  const nonKdpiNeg = shapValues.filter((s) => NON_KDPI_FEATURES.has(s.feature) && s.impact < 0).sort((a, b) => a.impact - b.impact);

  let part2: string;
  if (diffPct > 5 && nonKdpiPos.length > 0) {
    const f0 = nonKdpiPos[0].label;
    const f1 = nonKdpiPos[1]?.label;
    part2 = f1
      ? `Our model estimates ${diffPct}% higher survival than KDPI suggests, primarily because KDPI does not account for ${f0} and ${f1}.`
      : `Our model estimates ${diffPct}% higher survival than KDPI suggests, primarily because KDPI does not account for ${f0}.`;
  } else if (diffPct > 5) {
    const f0 = nonKdpiNeg[0]?.label ?? 'additional risk factors';
    part2 = `Our model estimates ${diffPct}% higher survival than KDPI suggests, despite ${f0} — KDPI may overestimate risk for this donor profile.`;
  } else if (diffPct < -3) {
    const hasPumpIssues = nonKdpiNeg.some((s) => s.feature === 'donor_pump_flow' || s.feature === 'donor_pump_resistance');
    const hasBiopsyIssues = nonKdpiNeg.some((s) => s.feature === 'donor_biopsy_glomerulosclerosis');
    const features = nonKdpiNeg.slice(0, 2).map((s) => s.label);
    if (features.length >= 2) {
      part2 = `Our model estimates ${Math.abs(diffPct)}% lower survival than KDPI suggests, driven by ${features[0]} and ${features[1]} which KDPI does not penalize.`;
    } else {
      const f0 = features[0] ?? 'factors KDPI does not penalize';
      part2 = `Our model estimates ${Math.abs(diffPct)}% lower survival than KDPI suggests, driven by ${f0} which KDPI does not penalize.`;
    }
    if (hasPumpIssues && hasBiopsyIssues) {
      part2 += ' While KDPI suggests an above-average kidney, pump perfusion parameters and biopsy findings indicate significant tissue compromise not captured by KDPI. Consider cautiously.';
    }
  } else {
    part2 = 'Our model and KDPI are broadly aligned on this donor.';
  }

  // Part 3 — Historical context
  const nFunctioning = similarKidneys.filter((k) => k.graft_status_1yr === 'Functioning').length;
  const nFailures = similarKidneys.length - nFunctioning;
  const egfrs = similarKidneys.map((k) => k.egfr_12mo).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const medianEgfr = egfrs.length > 0 ? egfrs[Math.floor(egfrs.length / 2)] : null;

  let part3 = `Of ${nFunctioning}/${similarKidneys.length} similar historical kidneys, ${nFunctioning} were functioning at 1 year${medianEgfr !== null ? ` with median eGFR of ${medianEgfr}` : ''}.`;

  if (nFailures > 2) {
    const failed = similarKidneys.filter((k) => k.graft_status_1yr === 'Failed');
    const avgAge = failed.reduce((sum, k) => sum + k.donor_age, 0) / failed.length;
    const dcdCount = failed.filter((k) => k.dcd).length;
    let failChar: string;
    if (dcdCount > failed.length * 0.5 && avgAge > 62) {
      failChar = 'DCD status combined with prolonged cold ischemia';
    } else if (avgAge > 65) {
      failChar = 'older donor age';
    } else if (dcdCount > failed.length * 0.5) {
      failChar = 'DCD status';
    } else {
      failChar = 'diabetes history combined with older donor age';
    }
    part3 += ` The ${nFailures} failures in this cohort were primarily associated with ${failChar}.`;
  }

  // Part 4 — Recipient context (only when filled)
  let part4 = '';
  if (recipient && hasRecipientFactors(recipient) && recipient.recipient_age !== null) {
    const recAge = recipient.recipient_age;
    const dialysis = recipient.recipient_dialysis_months;
    const dialysisClause = dialysis !== null && dialysis > 0 ? ` with ${dialysis} months on dialysis` : '';
    const diabetesNote = recipient.recipient_diabetes
      ? ' Diabetes modestly reduces expected graft survival but does not offset the transplant benefit for this donor quality.'
      : '';

    if (recAge >= 65 && predPct >= 80) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this donor-recipient pairing is well-matched. Older recipients have demonstrated good tolerance for higher-KDPI kidneys, and the expected graft lifespan aligns with recipient life expectancy.${diabetesNote}`;
    } else if (recAge >= 65 && predPct < 80) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this is an age-appropriate but marginal pairing. The kidney may provide functional years, but post-transplant monitoring should be intensive.${diabetesNote}`;
    } else if (recAge >= 50 && recAge < 65 && predPct >= 85) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this kidney offers a favorable survival-to-wait tradeoff based on age matching and accumulated dialysis exposure.${diabetesNote}`;
    } else if (recAge >= 50 && recAge < 65) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this is a reasonable pairing. Consider the patient's time to next offer and waitlist trajectory when making the final decision.${diabetesNote}`;
    } else if (recAge < 50 && predPct >= 85) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this kidney should perform well in the medium term. However, younger recipients typically need longer graft longevity — monitor for early signs of chronic allograft nephropathy.${diabetesNote}`;
    } else if (recAge < 50) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this kidney may underperform relative to what this patient could receive with additional wait time. Consider the patient's time-to-next-offer and waitlist trajectory.${diabetesNote}`;
    }
  }

  // Part 5 — Patient goal modifier
  let part5 = '';
  if (recipient && hasRecipientFactors(recipient)) {
    if (recipient.patient_goal === 'dialysis-asap' && predPct > 75) {
      part5 = "Given this patient's goal of minimizing dialysis time, the survival benefit of this kidney likely outweighs the cost of waiting for a marginally better offer.";
    } else if (recipient.patient_goal === 'longevity' && predPct < 82) {
      part5 = "This patient is optimizing for long-term graft function. Consider whether waiting for a lower-KDPI kidney aligns with their timeline.";
    }
  }

  return [part1, part2, part3, part4, part5].filter(Boolean).join(' ');
}

// ---------------------------------------------------------------------------
// Candidate matching — scoring and ranking
// ---------------------------------------------------------------------------

function buildCandidateRecommendationText(params: {
  ageAlignmentDelta: number;
  waitUrgencyDelta: number;
  dialysis: number;
  predPct: number;
  diabetes: boolean;
  priorTransplant: boolean;
}): string {
  const { ageAlignmentDelta, waitUrgencyDelta, dialysis, predPct, diabetes, priorTransplant } = params;
  const ageBonus = Math.max(0, ageAlignmentDelta);
  const agePenalty = Math.min(0, ageAlignmentDelta);
  const urgencyBonus = Math.max(0, waitUrgencyDelta);

  if (ageBonus >= 5 && urgencyBonus >= 5) {
    return 'Strong match — age-appropriate donor for this recipient. Long dialysis time increases transplant benefit.';
  }
  if (ageBonus >= 5 && urgencyBonus < 3) {
    return 'Good age match, but patient has a short wait time. Consider whether this patient could receive a similar offer soon.';
  }
  if (agePenalty <= -5 && predPct >= 85) {
    return "Kidney will likely function well short-term but may underperform for this recipient's expected lifespan. Younger recipients benefit from waiting for a better-quality donor unless wait time is excessive.";
  }
  if (agePenalty <= -5 && predPct < 85) {
    return 'Poor donor-recipient age match combined with marginal donor quality. This patient should wait for a better-suited organ.';
  }
  if (diabetes && predPct >= 80) {
    const clause = dialysis > 24 ? "patient's wait time favors accepting" : 'monitor glucose management closely post-transplant';
    return `Acceptable match — diabetes adds post-transplant management complexity, but ${clause}.`;
  }
  if (priorTransplant) {
    const clause = predPct >= 85
      ? 'Donor quality is sufficient to justify the additional risk.'
      : 'Consider whether donor quality justifies re-transplant risk.';
    return `Re-transplant carries higher immunological risk. ${clause}`;
  }
  if (urgencyBonus >= 5) {
    return 'Long wait time increases urgency. Any functioning transplant significantly improves outcomes versus continued dialysis for this patient.';
  }
  if (dialysis < 12 && predPct < 85) {
    return "This patient has time to wait for a younger donor. Short dialysis duration means less urgency. Consider preserving this patient's position for a better-matched organ.";
  }
  const quality = predPct >= 80 ? 'acceptable' : 'marginal';
  return `Moderate match. Predicted survival is ${quality} for this recipient profile.`;
}

function buildStarJustification(params: {
  stars: number;
  ageAlignmentDelta: number;
  agegap: number;
  dialysis: number;
  recipientAge: number | null;
  diabetes: boolean;
  predPct: number;
}): string {
  const { stars, ageAlignmentDelta, agegap, dialysis, recipientAge, diabetes, predPct } = params;

  if (stars === 5 && ageAlignmentDelta > 0 && dialysis > 0) {
    return `Excellent match — donor age aligns well with recipient life expectancy, and ${dialysis} months on dialysis adds urgency to transplant promptly.`;
  }
  if (stars === 5 && ageAlignmentDelta > 0) {
    return 'Excellent match — strong age alignment and high predicted survival make this a compelling transplant opportunity.';
  }
  if (stars === 5) {
    return 'Excellent match — strong alignment across survival, age matching, and dialysis benefit.';
  }
  if (stars === 4 && recipientAge !== null && recipientAge < 45 && agegap > 20) {
    return "Strong match — but this recipient's younger age means a lower-KDPI kidney could provide longer graft life. Waiting carries low risk for this profile.";
  }
  if (stars === 4) {
    return 'Strong match — donor age and recipient dialysis exposure suggest high net benefit.';
  }
  if (stars === 3) {
    return "Moderate match — consider whether waiting for a better-matched kidney is feasible given this patient's waitlist position.";
  }
  if (stars === 2) {
    return 'Weak match — predicted graft lifespan may underserve this recipient\'s life expectancy.';
  }
  return 'Poor match — significant concerns about graft quality relative to this recipient\'s needs.';
}

export function rankCandidates(donor: DonorInput, candidates: CandidateRecipient[]): CandidateMatchResult[] {
  return candidates
    .map((candidate) => {
      const prediction = getMockPrediction(donor, candidate);
      const predPct = Math.round(prediction.predicted_1yr_survival * 100);

      // Age alignment
      let ageAlignmentDelta = 0;
      const agegap = candidate.recipient_age !== null ? Math.abs(donor.donor_age - candidate.recipient_age) : 0;
      if (candidate.recipient_age !== null) {
        if (agegap <= 5) ageAlignmentDelta += 8;
        else if (agegap <= 10) ageAlignmentDelta += 5;
        if (agegap > 20) ageAlignmentDelta -= 7; // larger penalty for mismatched donor-recipient age
        if (agegap > 30) ageAlignmentDelta -= 5;
      }

      // Wait time urgency
      const dialysis = candidate.recipient_dialysis_months ?? 0;
      let waitUrgencyDelta = 0;
      if (dialysis === 0) waitUrgencyDelta -= 2;
      else if (dialysis < 6) waitUrgencyDelta -= 3;
      if (dialysis > 48) waitUrgencyDelta += 5;
      if (dialysis > 60) waitUrgencyDelta += 3;

      // Comorbidity penalties
      let comorbidityDelta = 0;
      if (candidate.recipient_diabetes) comorbidityDelta -= 3;
      if (candidate.recipient_prior_transplant) comorbidityDelta -= 4;
      if (candidate.recipient_bmi !== null && candidate.recipient_bmi > 35) comorbidityDelta -= 2;

      // Patient goal adjustment (Change 2) — ±4 pts ≈ ±0.5 star tiers
      let goalAdjust = 0;
      if (candidate.patient_goal === 'dialysis-asap' && predPct > 75) goalAdjust = 4;
      if (candidate.patient_goal === 'longevity' && predPct < 80) goalAdjust = -4;

      const match_score = predPct + ageAlignmentDelta + waitUrgencyDelta + comorbidityDelta + goalAdjust;
      const stars = match_score >= 90 ? 5 : match_score >= 82 ? 4 : match_score >= 74 ? 3 : match_score >= 66 ? 2 : 1;

      const recommendation_text = buildCandidateRecommendationText({
        ageAlignmentDelta,
        waitUrgencyDelta,
        dialysis,
        predPct,
        diabetes: candidate.recipient_diabetes,
        priorTransplant: candidate.recipient_prior_transplant,
      });

      // Per-candidate star justification (Fix 18)
      const star_justification = buildStarJustification({
        stars,
        ageAlignmentDelta,
        agegap,
        dialysis,
        recipientAge: candidate.recipient_age,
        diabetes: candidate.recipient_diabetes,
        predPct,
      });

      return { candidate, prediction, match_score, stars, recommendation_text, star_justification };
    })
    .sort((a, b) => b.match_score - a.match_score);
}

// ---------------------------------------------------------------------------
// Recipient SHAP entries (mirrors applyRecipientAdjustment deltas exactly)
// ---------------------------------------------------------------------------

function buildRecipientShapEntries(recipient: RecipientInput | null | undefined): ShapValue[] {
  if (!hasRecipientFactors(recipient)) return [];
  const r = recipient!;
  const entries: ShapValue[] = [];
  if (r.recipient_age !== null) {
    if (r.recipient_age > 65)
      entries.push({ feature: 'recipient_age', label: `Recipient Age (${r.recipient_age})`, value: r.recipient_age, impact: 0.03 });
    else if (r.recipient_age >= 45 && r.recipient_age <= 60)
      entries.push({ feature: 'recipient_age', label: `Recipient Age (${r.recipient_age})`, value: r.recipient_age, impact: -0.01 });
    else if (r.recipient_age < 40 && !r.recipient_diabetes)
      entries.push({ feature: 'recipient_age', label: `Recipient Age (${r.recipient_age})`, value: r.recipient_age, impact: 0.01 });
    else if (r.recipient_age < 40 && r.recipient_diabetes)
      entries.push({ feature: 'recipient_age', label: `Recipient Age (${r.recipient_age})`, value: r.recipient_age, impact: -0.01 });
  }
  if (r.recipient_dialysis_months !== null && r.recipient_dialysis_months > 60)
    entries.push({ feature: 'recipient_dialysis_months', label: `Dialysis Duration (${r.recipient_dialysis_months}mo)`, value: r.recipient_dialysis_months, impact: 0.02 });
  if (r.recipient_diabetes)
    entries.push({ feature: 'recipient_diabetes', label: 'Recipient Diabetes', value: true, impact: -0.02 });
  if (r.recipient_prior_transplant)
    entries.push({ feature: 'recipient_prior_transplant', label: 'Prior Transplant', value: true, impact: -0.02 });
  if (r.recipient_bmi !== null && r.recipient_bmi > 35)
    entries.push({ feature: 'recipient_bmi', label: `Recipient BMI (${r.recipient_bmi})`, value: r.recipient_bmi, impact: -0.01 });
  return entries;
}

// ---------------------------------------------------------------------------
// Core prediction function
// ---------------------------------------------------------------------------

export function getMockPrediction(donor: DonorInput, recipient?: RecipientInput | null): PredictionResult {
  const rand = mulberry32(donorSeed(donor));

  const baseSurvival = 0.92;

  const shapEntries: ShapValue[] = [
    { feature: 'donor_age', label: `Age (${donor.donor_age})`, value: donor.donor_age, impact: donor.donor_age > 60 ? -0.04 : 0.02 },
    { feature: 'donor_on_dialysis', label: 'Donor Dialysis', value: donor.donor_on_dialysis, impact: donor.donor_on_dialysis ? -0.03 : 0 },
    {
      feature: 'donor_pump_flow',
      label: `Pump Flow (${donor.donor_pump_flow ?? 'N/A'} mL/min)`,
      value: donor.donor_pump_flow ?? 'N/A',
      impact: donor.donor_pump_flow !== null
        ? (donor.donor_pump_flow > 100 ? 0.02 : donor.donor_pump_flow < 80 ? -0.03 : -0.01)
        : 0,
    },
    ...(donor.donor_pump_resistance !== null ? [{
      feature: 'donor_pump_resistance',
      label: `Pump Resistance (${donor.donor_pump_resistance} mmHg/mL/min)`,
      value: `${donor.donor_pump_resistance} mmHg/mL/min`,
      impact: donor.donor_pump_resistance > 0.30 ? -0.04 : donor.donor_pump_resistance > 0.20 ? -0.02 : -0.01,
    }] : []),
    { feature: 'donor_biopsy_glomerulosclerosis', label: `Biopsy GS (${donor.donor_biopsy_glomerulosclerosis ?? 'N/A'}%)`, value: `${donor.donor_biopsy_glomerulosclerosis ?? 'N/A'}%`, impact: donor.donor_biopsy_glomerulosclerosis !== null ? ((donor.donor_biopsy_glomerulosclerosis < 15) ? 0.01 : -0.03) : 0 },
    ...(donor.cold_ischemia_hours !== null ? [{
      feature: 'cold_ischemia_hours', label: `Cold Ischemia (${donor.cold_ischemia_hours}h)`, value: `${donor.cold_ischemia_hours}h`, impact: donor.cold_ischemia_hours > 20 ? -0.02 : -0.01,
    }] : []),
    { feature: 'donor_hypertension', label: 'HTN History', value: donor.donor_hypertension, impact: donor.donor_hypertension ? -0.015 : 0 },
    { feature: 'donor_dcd', label: 'DCD Status', value: donor.donor_dcd, impact: donor.donor_dcd ? -0.01 : 0 },
    { feature: 'donor_serum_creatinine', label: `Creatinine (${donor.donor_serum_creatinine} mg/dL)`, value: `${donor.donor_serum_creatinine} mg/dL`, impact: donor.donor_serum_creatinine > 1.5 ? -0.02 : 0.005 },
  ];

  // Filter zero-impact entries (they add no info to SHAP chart)
  const shapValues = shapEntries.filter((s) => s.impact !== 0);
  const sortedShap = shapValues.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const totalImpact = sortedShap.reduce((sum, s) => sum + s.impact, 0);
  const basePredicted = Math.round((baseSurvival + totalImpact) * 100) / 100;

  const candidateAge = recipient?.recipient_age ?? null;
  const similarKidneys = generateSimilarKidneys(donor, rand, candidateAge);
  const predicted = applyRecipientAdjustment(basePredicted, recipient);
  const declineStats = generateDeclineStats(predicted, rand, recipient);

  // Combine donor + recipient SHAP so waterfall bars sum to finalPrediction.
  // Analysis text uses only donor SHAP (sortedShap) to keep Parts 1–3 donor-focused.
  const recipientShap = buildRecipientShapEntries(recipient);
  const allShapValues = [...sortedShap, ...recipientShap].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const mockKdpi = Math.min(99, Math.max(1, Math.round(
    40 + (donor.donor_age - 30) * 0.8
    + (donor.donor_hypertension ? 8 : 0)
    + (donor.donor_diabetes ? 10 : 0)
    + (donor.donor_dcd ? 10 : 0)
    + (donor.donor_hcv ? 15 : 0)
    + (donor.donor_serum_creatinine > 1.5 ? 5 : 0)
  )));

  const kdpiSurvival = kdpiToSurvival(mockKdpi);
  const kdpiRisk: 'low' | 'moderate' | 'high' = mockKdpi < 50 ? 'low' : mockKdpi < 80 ? 'moderate' : 'high';
  const modelAssessment: 'excellent' | 'acceptable' | 'marginal' | 'poor' =
    predicted > 0.9 ? 'excellent' : predicted > 0.8 ? 'acceptable' : predicted > 0.7 ? 'marginal' : 'poor';

  const confidence: 'basic' | 'enhanced' | 'personalized' =
    hasRecipientFactors(recipient) ? 'personalized' : hasAdditionalFactors(donor) ? 'enhanced' : 'basic';

  // Confidence intervals (Change 8) — computed at end to preserve rand sequence
  const modelCiExtra = Math.floor(rand() * 3); // 0, 1, or 2
  const kdpiCiExtra = Math.floor(rand() * 3);
  const isExtreme = mockKdpi > 90 || mockKdpi < 20;
  const model_ci = isExtreme ? 6 : 3 + modelCiExtra;
  const kdpi_ci = 5 + kdpiCiExtra;

  return {
    predicted_1yr_survival: predicted,
    kdpi_score: mockKdpi,
    kdpi_implied_risk: kdpiRisk,
    kdpi_implied_survival: kdpiSurvival,
    model_assessment: modelAssessment,
    prediction_confidence: confidence,
    divergence_explanation: buildDynamicAnalysis(sortedShap, similarKidneys, predicted, kdpiSurvival, recipient),
    shap_values: allShapValues,
    similar_kidneys: similarKidneys,
    decline_stats: declineStats,
    model_ci,
    kdpi_ci,
    donor_dcd: donor.donor_dcd,
    donor_age: donor.donor_age,
  };
}
