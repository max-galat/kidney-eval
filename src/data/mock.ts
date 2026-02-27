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
};

export const DEFAULT_CANDIDATES: CandidateRecipient[] = [
  { label: '', recipient_age: null, recipient_dialysis_months: null, recipient_bmi: null, recipient_diabetes: false, recipient_prior_transplant: false },
  { label: '', recipient_age: null, recipient_dialysis_months: null, recipient_bmi: null, recipient_diabetes: false, recipient_prior_transplant: false },
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

function generateSimilarKidneys(donor: DonorInput, rand: () => number): SimilarKidney[] {
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

    return { donor_age: age, cause_of_death: cod, dcd, on_dialysis, kdpi, graft_status_1yr, egfr_12mo, failure_cause };
  });
}

// ---------------------------------------------------------------------------
// Dynamic decline stats
// ---------------------------------------------------------------------------

function generateDeclineStats(predicted: number, rand: () => number): DeclineStats {
  if (predicted > 0.90) {
    const acceptance_rate = Math.min(97, Math.round(75 + (predicted - 0.90) * 180));
    return { median_wait_months: 0, pct_better_within_6mo: 0, pct_still_waiting_12mo: 0, high_demand: true, acceptance_rate };
  }
  if (predicted > 0.80) {
    return {
      median_wait_months: Math.round(8 + rand() * 6),
      pct_better_within_6mo: Math.round(25 + rand() * 10),
      pct_still_waiting_12mo: Math.round(10 + rand() * 10),
      high_demand: false,
      acceptance_rate: null,
    };
  }
  if (predicted > 0.70) {
    return {
      median_wait_months: Math.round(4 + rand() * 2),
      pct_better_within_6mo: Math.round(15 + rand() * 10),
      pct_still_waiting_12mo: Math.round(5 + rand() * 10),
      high_demand: false,
      acceptance_rate: null,
    };
  }
  return {
    median_wait_months: Math.round(3 + rand() * 2),
    pct_better_within_6mo: Math.round(10 + rand() * 10),
    pct_still_waiting_12mo: Math.round(3 + rand() * 7),
    high_demand: false,
    acceptance_rate: null,
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
    else if (r.recipient_age < 40) delta -= 0.02;
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
  if (diffPct > 5) {
    const f0 = nonKdpiPos[0]?.label ?? 'pump perfusion characteristics';
    const f1 = nonKdpiPos[1]?.label ?? 'biopsy findings';
    part2 = `Our model estimates ${diffPct}% higher survival than KDPI suggests, primarily because KDPI does not account for ${f0} and ${f1}.`;
  } else if (diffPct < -3) {
    const f0 = nonKdpiNeg[0]?.label ?? 'factors KDPI does not penalize';
    part2 = `Our model estimates ${Math.abs(diffPct)}% lower survival than KDPI suggests, driven by ${f0} which KDPI does not penalize.`;
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

    if (recAge >= 65 && predPct >= 80) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this donor-recipient pairing is well-matched. Older recipients have demonstrated good tolerance for higher-KDPI kidneys, and the expected graft lifespan aligns with recipient life expectancy.`;
    } else if (recAge >= 65 && predPct < 80) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this is an age-appropriate but marginal pairing. The kidney may provide functional years, but post-transplant monitoring should be intensive.`;
    } else if (recAge < 50 && predPct >= 85) {
      part4 = `For a ${recAge}-year-old recipient, this kidney should perform well in the medium term. However, younger recipients typically need longer graft longevity — monitor for early signs of chronic allograft nephropathy.`;
    } else if (recAge < 50 && predPct < 85) {
      part4 = `For a ${recAge}-year-old recipient${dialysisClause}, this kidney may underperform relative to what this patient could receive with additional wait time. Consider the patient's time-to-next-offer and waitlist trajectory.`;
    }
  }

  return [part1, part2, part3, part4].filter(Boolean).join(' ');
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

export function rankCandidates(donor: DonorInput, candidates: CandidateRecipient[]): CandidateMatchResult[] {
  return candidates
    .map((candidate) => {
      const prediction = getMockPrediction(donor, candidate);
      const predPct = Math.round(prediction.predicted_1yr_survival * 100);

      // Age alignment
      let ageAlignmentDelta = 0;
      if (candidate.recipient_age !== null) {
        const gap = Math.abs(donor.donor_age - candidate.recipient_age);
        if (gap <= 5) ageAlignmentDelta += 8;
        else if (gap <= 10) ageAlignmentDelta += 5;
        if (gap > 20) ageAlignmentDelta -= 5;
        if (gap > 30) ageAlignmentDelta -= 5;
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

      const match_score = predPct + ageAlignmentDelta + waitUrgencyDelta + comorbidityDelta;
      const stars = match_score >= 90 ? 5 : match_score >= 82 ? 4 : match_score >= 74 ? 3 : match_score >= 66 ? 2 : 1;

      const recommendation_text = buildCandidateRecommendationText({
        ageAlignmentDelta,
        waitUrgencyDelta,
        dialysis,
        predPct,
        diabetes: candidate.recipient_diabetes,
        priorTransplant: candidate.recipient_prior_transplant,
      });

      return { candidate, prediction, match_score, stars, recommendation_text };
    })
    .sort((a, b) => b.match_score - a.match_score);
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
    { feature: 'donor_pump_flow', label: `Pump Flow (${donor.donor_pump_flow ?? 'N/A'} mL/min)`, value: donor.donor_pump_flow ?? 'N/A', impact: (donor.donor_pump_flow ?? 0) > 100 ? 0.02 : (donor.donor_pump_flow !== null ? -0.01 : 0) },
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

  const similarKidneys = generateSimilarKidneys(donor, rand);
  const predicted = applyRecipientAdjustment(basePredicted, recipient);
  const declineStats = generateDeclineStats(predicted, rand);

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

  return {
    predicted_1yr_survival: predicted,
    kdpi_score: mockKdpi,
    kdpi_implied_risk: kdpiRisk,
    kdpi_implied_survival: kdpiSurvival,
    model_assessment: modelAssessment,
    prediction_confidence: confidence,
    divergence_explanation: buildDynamicAnalysis(sortedShap, similarKidneys, predicted, kdpiSurvival, recipient),
    shap_values: sortedShap,
    similar_kidneys: similarKidneys,
    decline_stats: declineStats,
  };
}
