import { DonorInput, PredictionResult, ShapValue, SimilarKidney, DeclineStats } from '@/types';

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

function buildDynamicAnalysis(shapValues: ShapValue[], similarKidneys: SimilarKidney[]): string {
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

  return analysis || 'Insufficient data to generate analysis for this donor profile.';
}

const MOCK_SIMILAR_KIDNEYS: SimilarKidney[] = [
  { donor_age: 63, cause_of_death: 'CVA', dcd: true, on_dialysis: true, kdpi: 82, graft_status_1yr: 'Functioning', egfr_12mo: 48 },
  { donor_age: 67, cause_of_death: 'CVA', dcd: true, on_dialysis: false, kdpi: 88, graft_status_1yr: 'Functioning', egfr_12mo: 55 },
  { donor_age: 61, cause_of_death: 'CVA', dcd: true, on_dialysis: true, kdpi: 79, graft_status_1yr: 'Functioning', egfr_12mo: 51 },
  { donor_age: 66, cause_of_death: 'Anoxia', dcd: false, on_dialysis: true, kdpi: 84, graft_status_1yr: 'Functioning', egfr_12mo: 44 },
  { donor_age: 64, cause_of_death: 'CVA', dcd: true, on_dialysis: false, kdpi: 80, graft_status_1yr: 'Functioning', egfr_12mo: 59 },
  { donor_age: 68, cause_of_death: 'CVA', dcd: true, on_dialysis: true, kdpi: 91, graft_status_1yr: 'Functioning', egfr_12mo: 42 },
  { donor_age: 62, cause_of_death: 'Trauma', dcd: true, on_dialysis: false, kdpi: 76, graft_status_1yr: 'Functioning', egfr_12mo: 61 },
  { donor_age: 69, cause_of_death: 'CVA', dcd: true, on_dialysis: true, kdpi: 93, graft_status_1yr: 'Failed', egfr_12mo: null, failure_cause: 'Primary non-function' },
  { donor_age: 65, cause_of_death: 'CVA', dcd: false, on_dialysis: true, kdpi: 85, graft_status_1yr: 'Functioning', egfr_12mo: 47 },
  { donor_age: 60, cause_of_death: 'CVA', dcd: true, on_dialysis: false, kdpi: 74, graft_status_1yr: 'Functioning', egfr_12mo: 56 },
];

const MOCK_DECLINE_STATS: DeclineStats = {
  median_wait_months: 8,
  pct_better_within_6mo: 34,
  pct_still_waiting_12mo: 12,
  high_demand: false,
};

/**
 * Returns a mock prediction result based on the donor input.
 * In a real app this would call the backend ML model.
 */
export function getMockPrediction(donor: DonorInput): PredictionResult {
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
  const predicted = Math.round((baseSurvival + totalImpact) * 100) / 100;

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
  const confidence = hasAdditionalFactors(donor) ? 'enhanced' : 'basic';

  return {
    predicted_1yr_survival: predicted,
    kdpi_score: mockKdpi,
    kdpi_implied_risk: kdpiRisk,
    kdpi_implied_survival: kdpiToSurvival(mockKdpi),
    model_assessment: modelAssessment,
    prediction_confidence: confidence,
    divergence_explanation: buildDynamicAnalysis(sortedShap, MOCK_SIMILAR_KIDNEYS),
    shap_values: sortedShap,
    similar_kidneys: MOCK_SIMILAR_KIDNEYS,
    decline_stats: MOCK_DECLINE_STATS,
  };
}
