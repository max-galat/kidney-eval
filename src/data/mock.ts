import { DonorInput, RecipientInput, PredictionResult, ShapValue, SimilarKidney, DeclineStats } from '@/types';

export const DEFAULT_DONOR: DonorInput = {
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
  donor_biopsy_glomerulosclerosis: 8,
  donor_pump_resistance: 0.15,
  donor_pump_flow: 120,
  donor_on_dialysis: true,
  cold_ischemia_hours: 18,
  donor_bmi: 23.7,
  donor_egfr: 58,
  donor_terminal_creatinine: 1.4,
};

export const DEFAULT_RECIPIENT: RecipientInput = {
  recipient_age: null,
  recipient_dialysis_months: null,
  recipient_bmi: null,
  recipient_diabetes: false,
  recipient_prior_transplant: false,
};

// SRTR approximate KDPI-to-1yr-graft-survival lookup (interpolated)
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

// Seeded PRNG (mulberry32) — same donor inputs always produce the same table
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

const CAUSES_OF_DEATH = ['CVA', 'Anoxia', 'Trauma', 'Other'] as const;
const FAILURE_CAUSES = ['Primary non-function', 'Rejection', 'Delayed graft function'] as const;

function generateSimilarKidneys(donor: DonorInput, rand: () => number): SimilarKidney[] {
  return Array.from({ length: 10 }, () => {
    const ageOffset = Math.round((rand() - 0.5) * 10); // ±5yr
    const age = Math.max(18, Math.min(90, donor.donor_age + ageOffset));
    const cod = rand() < 0.6 ? donor.donor_cause_of_death : CAUSES_OF_DEATH[Math.floor(rand() * 4)];
    const dcd = rand() < 0.7 ? donor.donor_dcd : rand() < 0.5;
    const on_dialysis = rand() < 0.7 ? donor.donor_on_dialysis : rand() < 0.5;

    const kdpi = Math.min(99, Math.max(1, Math.round(
      40 + (age - 30) * 0.8 + (dcd ? 10 : 0) + (on_dialysis ? 5 : 0) + rand() * 10 - 5,
    )));

    // Quality score drives functioning probability
    const qualityScore = 95 - (age > 60 ? (age - 60) * 0.5 : 0) - (dcd ? 5 : 0) - (on_dialysis ? 3 : 0);
    const graft_status_1yr: 'Functioning' | 'Failed' = rand() * 100 < qualityScore ? 'Functioning' : 'Failed';

    const egfr_12mo = graft_status_1yr === 'Functioning'
      ? Math.max(20, Math.round(65 - (age - 30) * 0.3 + (rand() - 0.5) * 20))
      : null;

    const failure_cause = graft_status_1yr === 'Failed'
      ? FAILURE_CAUSES[Math.floor(rand() * 3)]
      : undefined;

    return { donor_age: age, cause_of_death: cod, dcd, on_dialysis, kdpi, graft_status_1yr, egfr_12mo, failure_cause };
  });
}

function generateDeclineStats(predicted: number, rand: () => number): DeclineStats {
  if (predicted > 0.90) {
    return { median_wait_months: 0, pct_better_within_6mo: 0, pct_still_waiting_12mo: 0, high_demand: true };
  }
  if (predicted > 0.80) {
    return {
      median_wait_months: Math.round(8 + rand() * 6),      // 8–14 months
      pct_better_within_6mo: Math.round(25 + rand() * 10), // 25–35%
      pct_still_waiting_12mo: Math.round(10 + rand() * 10), // 10–20%
      high_demand: false,
    };
  }
  if (predicted > 0.70) {
    return {
      median_wait_months: Math.round(4 + rand() * 2),       // 4–6 months (abundant supply)
      pct_better_within_6mo: Math.round(15 + rand() * 10),  // 15–25%
      pct_still_waiting_12mo: Math.round(5 + rand() * 10),  // 5–15%
      high_demand: false,
    };
  }
  return {
    median_wait_months: Math.round(3 + rand() * 2),          // 3–5 months
    pct_better_within_6mo: Math.round(10 + rand() * 10),     // 10–20%
    pct_still_waiting_12mo: Math.round(3 + rand() * 7),      // 3–10%
    high_demand: false,
  };
}

function hasAdditionalFactors(donor: DonorInput): boolean {
  return [
    donor.donor_biopsy_glomerulosclerosis,
    donor.donor_pump_resistance,
    donor.donor_pump_flow,
    donor.donor_bmi,
    donor.donor_egfr,
    donor.donor_terminal_creatinine,
  ].some((v) => v !== null);
}

function hasRecipientFactors(recipient: RecipientInput | null | undefined): boolean {
  if (!recipient) return false;
  return (
    recipient.recipient_age !== null ||
    recipient.recipient_dialysis_months !== null ||
    recipient.recipient_bmi !== null ||
    recipient.recipient_diabetes ||
    recipient.recipient_prior_transplant
  );
}

function applyRecipientAdjustment(
  predicted: number,
  recipient: RecipientInput | null | undefined,
): { adjusted: number; note: string } {
  if (!hasRecipientFactors(recipient)) return { adjusted: predicted, note: '' };

  let delta = 0;
  const notes: string[] = [];

  if (recipient!.recipient_age !== null) {
    if (recipient!.recipient_age > 65) {
      delta += 0.03;
      notes.push(`Recipient age (${recipient!.recipient_age}) is advanced — can tolerate a marginal kidney`);
    } else if (recipient!.recipient_age < 40) {
      delta -= 0.02;
      notes.push(`Young recipient (age ${recipient!.recipient_age}) requires long-term graft longevity`);
    }
  }

  if (recipient!.recipient_dialysis_months !== null && recipient!.recipient_dialysis_months > 60) {
    delta += 0.02;
    notes.push(`${recipient!.recipient_dialysis_months} months on dialysis — accepting any viable kidney is strongly recommended`);
  }

  if (recipient!.recipient_diabetes) {
    delta -= 0.02;
    notes.push('Recipient diabetes increases rejection risk');
  }

  if (recipient!.recipient_prior_transplant) {
    delta -= 0.02;
    notes.push('Prior transplant increases sensitization risk');
  }

  if (recipient!.recipient_bmi !== null && recipient!.recipient_bmi > 35) {
    delta -= 0.01;
    notes.push(`Recipient BMI (${recipient!.recipient_bmi}) is elevated`);
  }

  const adjusted = Math.round(Math.max(0.01, Math.min(0.99, predicted + delta)) * 100) / 100;
  return { adjusted, note: notes.join('. ') + '.' };
}

function buildDynamicAnalysis(
  shapValues: ShapValue[],
  similarKidneys: SimilarKidney[],
  recipientNote = '',
): string {
  const negatives = shapValues.filter((s) => s.impact < 0).sort((a, b) => a.impact - b.impact);
  const positives = shapValues.filter((s) => s.impact > 0).sort((a, b) => b.impact - a.impact);

  const functioning = similarKidneys.filter((k) => k.graft_status_1yr === 'Functioning').length;
  const egfrs = similarKidneys.map((k) => k.egfr_12mo).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const medianEgfr = egfrs.length > 0 ? egfrs[Math.floor(egfrs.length / 2)] : null;
  const totalImpact = Math.abs(negatives.reduce((sum, s) => sum + s.impact, 0));

  const neg1 = negatives[0]?.label ?? '';
  const neg2 = negatives[1]?.label ?? '';
  const pos1 = positives[0]?.label ?? '';
  const pos2 = positives[1]?.label ?? '';

  let analysis = '';

  if (neg1 && neg2) {
    analysis += `${neg1} and ${neg2} are the primary risk factors, reducing predicted survival by ${Math.round(totalImpact * 100)}%.`;
  } else if (neg1) {
    analysis += `${neg1} is the primary risk factor, reducing predicted survival by ${Math.round(totalImpact * 100)}%.`;
  }

  if (pos1 && pos2) {
    analysis += ` However, ${pos1} and ${pos2} suggest viable tissue with favorable characteristics.`;
  } else if (pos1) {
    analysis += ` However, ${pos1} suggests favorable characteristics.`;
  }

  if (medianEgfr !== null) {
    analysis += ` ${functioning} of ${similarKidneys.length} similar historical kidneys were functioning at 1 year with median eGFR of ${medianEgfr}.`;
  }

  if (recipientNote) {
    analysis += ` Recipient context: ${recipientNote}`;
  }

  return analysis || 'Insufficient data to generate analysis for this donor profile.';
}

/**
 * Returns a mock prediction result based on donor and optional recipient inputs.
 * Uses a seeded PRNG so identical inputs always produce identical results.
 */
export function getMockPrediction(donor: DonorInput, recipient?: RecipientInput | null): PredictionResult {
  const rand = mulberry32(donorSeed(donor));

  const baseSurvival = 0.92;

  const shapValues: ShapValue[] = [
    { feature: 'donor_age', label: `Age (${donor.donor_age})`, value: donor.donor_age, impact: donor.donor_age > 60 ? -0.04 : 0.02 },
    { feature: 'donor_on_dialysis', label: 'On Dialysis', value: donor.donor_on_dialysis, impact: donor.donor_on_dialysis ? -0.03 : 0 },
    { feature: 'donor_pump_flow', label: `Pump Flow (${donor.donor_pump_flow ?? 'N/A'})`, value: donor.donor_pump_flow ?? 'N/A', impact: (donor.donor_pump_flow ?? 0) > 100 ? 0.02 : -0.01 },
    { feature: 'donor_biopsy_glomerulosclerosis', label: `Biopsy GS (${donor.donor_biopsy_glomerulosclerosis ?? 'N/A'}%)`, value: `${donor.donor_biopsy_glomerulosclerosis ?? 'N/A'}%`, impact: (donor.donor_biopsy_glomerulosclerosis ?? 0) < 15 ? 0.01 : -0.03 },
    { feature: 'cold_ischemia_hours', label: `Cold Ischemia (${donor.cold_ischemia_hours}h)`, value: `${donor.cold_ischemia_hours}h`, impact: donor.cold_ischemia_hours > 20 ? -0.02 : -0.01 },
    { feature: 'donor_hypertension', label: 'HTN History', value: donor.donor_hypertension, impact: donor.donor_hypertension ? -0.015 : 0 },
    { feature: 'donor_dcd', label: 'DCD Status', value: donor.donor_dcd, impact: donor.donor_dcd ? -0.01 : 0 },
    { feature: 'donor_serum_creatinine', label: `Creatinine (${donor.donor_serum_creatinine})`, value: `${donor.donor_serum_creatinine} mg/dL`, impact: donor.donor_serum_creatinine > 1.5 ? -0.02 : 0.005 },
  ];

  const sortedShap = shapValues.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const totalImpact = shapValues.reduce((sum, s) => sum + s.impact, 0);
  const basePredicted = Math.round((baseSurvival + totalImpact) * 100) / 100;

  const similarKidneys = generateSimilarKidneys(donor, rand);
  const { adjusted: predicted, note: recipientNote } = applyRecipientAdjustment(basePredicted, recipient);
  const declineStats = generateDeclineStats(predicted, rand);

  const mockKdpi = Math.min(99, Math.max(1, Math.round(
    40 + (donor.donor_age - 30) * 0.8
    + (donor.donor_hypertension ? 8 : 0)
    + (donor.donor_diabetes ? 10 : 0)
    + (donor.donor_dcd ? 10 : 0)
    + (donor.donor_hcv ? 15 : 0)
    + (donor.donor_serum_creatinine > 1.5 ? 5 : 0)
  )));

  const kdpiRisk: 'low' | 'moderate' | 'high' = mockKdpi < 50 ? 'low' : mockKdpi < 80 ? 'moderate' : 'high';
  const modelAssessment: 'excellent' | 'acceptable' | 'marginal' | 'poor' =
    predicted > 0.9 ? 'excellent' : predicted > 0.8 ? 'acceptable' : predicted > 0.7 ? 'marginal' : 'poor';

  const confidence: 'basic' | 'enhanced' | 'personalized' =
    hasRecipientFactors(recipient) ? 'personalized' : hasAdditionalFactors(donor) ? 'enhanced' : 'basic';

  return {
    predicted_1yr_survival: predicted,
    kdpi_score: mockKdpi,
    kdpi_implied_risk: kdpiRisk,
    kdpi_implied_survival: kdpiToSurvival(mockKdpi),
    model_assessment: modelAssessment,
    prediction_confidence: confidence,
    divergence_explanation: buildDynamicAnalysis(sortedShap, similarKidneys, recipientNote),
    shap_values: sortedShap,
    similar_kidneys: similarKidneys,
    decline_stats: declineStats,
  };
}
