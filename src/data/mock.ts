import { DonorInput, PredictionResult } from '@/types';

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

/**
 * Returns a mock prediction result based on the donor input.
 * In a real app this would call the backend ML model.
 */
export function getMockPrediction(donor: DonorInput): PredictionResult {
  // Hardcoded mock — no real calculation
  const baseSurvival = 0.92;

  const shapValues = [
    { feature: 'donor_age', label: 'Donor Age', value: donor.donor_age, impact: donor.donor_age > 60 ? -0.04 : 0.02 },
    { feature: 'donor_on_dialysis', label: 'Donor on Dialysis', value: donor.donor_on_dialysis, impact: donor.donor_on_dialysis ? -0.03 : 0 },
    { feature: 'donor_pump_flow', label: 'Pump Flow', value: donor.donor_pump_flow ?? 'N/A', impact: (donor.donor_pump_flow ?? 0) > 100 ? 0.02 : -0.01 },
    { feature: 'donor_biopsy_glomerulosclerosis', label: 'Glomerulosclerosis', value: `${donor.donor_biopsy_glomerulosclerosis ?? 'N/A'}%`, impact: (donor.donor_biopsy_glomerulosclerosis ?? 0) < 15 ? 0.01 : -0.03 },
    { feature: 'cold_ischemia_hours', label: 'Cold Ischemia Time', value: `${donor.cold_ischemia_hours}h`, impact: donor.cold_ischemia_hours > 20 ? -0.02 : -0.01 },
    { feature: 'donor_hypertension', label: 'Hypertension History', value: donor.donor_hypertension, impact: donor.donor_hypertension ? -0.015 : 0 },
    { feature: 'donor_dcd', label: 'DCD Status', value: donor.donor_dcd, impact: donor.donor_dcd ? -0.01 : 0 },
    { feature: 'donor_serum_creatinine', label: 'Serum Creatinine', value: `${donor.donor_serum_creatinine} mg/dL`, impact: donor.donor_serum_creatinine > 1.5 ? -0.02 : 0.005 },
  ];

  const totalImpact = shapValues.reduce((sum, s) => sum + s.impact, 0);
  const predicted = Math.round((baseSurvival + totalImpact) * 100) / 100;

  // Mock KDPI — higher age + DCD + dialysis = high KDPI
  const mockKdpi = Math.min(99, Math.max(1, Math.round(
    40 + (donor.donor_age - 30) * 0.8
    + (donor.donor_hypertension ? 8 : 0)
    + (donor.donor_diabetes ? 10 : 0)
    + (donor.donor_dcd ? 10 : 0)
    + (donor.donor_hcv ? 15 : 0)
    + (donor.donor_serum_creatinine > 1.5 ? 5 : 0)
  )));

  const kdpiRisk = mockKdpi < 50 ? 'low' : mockKdpi < 80 ? 'moderate' : 'high';
  const modelAssessment = predicted > 0.9 ? 'excellent' : predicted > 0.8 ? 'acceptable' : predicted > 0.7 ? 'marginal' : 'poor';

  const diverges = kdpiRisk === 'high' && (modelAssessment === 'acceptable' || modelAssessment === 'excellent');
  const divergenceExplanation = diverges
    ? 'KDPI penalizes donor age and DCD status heavily, but pump parameters and biopsy findings indicate healthy tissue with good perfusion characteristics.'
    : kdpiRisk === 'low' && modelAssessment === 'poor'
      ? 'Despite a favorable KDPI, additional factors like high glomerulosclerosis or poor pump parameters suggest elevated risk.'
      : 'Our model and KDPI are in general agreement for this donor profile.';

  return {
    predicted_1yr_survival: predicted,
    kdpi_score: mockKdpi,
    kdpi_implied_risk: kdpiRisk,
    model_assessment: modelAssessment,
    divergence_explanation: divergenceExplanation,
    shap_values: shapValues.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)),
    similar_kidneys: MOCK_SIMILAR_KIDNEYS,
  };
}

const MOCK_SIMILAR_KIDNEYS = [
  { donor_age: 63, cause_of_death: 'CVA', dcd: true, on_dialysis: true, kdpi: 82, graft_status_1yr: 'Functioning' as const, egfr_12mo: 48 },
  { donor_age: 67, cause_of_death: 'CVA', dcd: true, on_dialysis: false, kdpi: 88, graft_status_1yr: 'Functioning' as const, egfr_12mo: 55 },
  { donor_age: 61, cause_of_death: 'CVA', dcd: true, on_dialysis: true, kdpi: 79, graft_status_1yr: 'Functioning' as const, egfr_12mo: 51 },
  { donor_age: 66, cause_of_death: 'Anoxia', dcd: false, on_dialysis: true, kdpi: 84, graft_status_1yr: 'Functioning' as const, egfr_12mo: 44 },
  { donor_age: 64, cause_of_death: 'CVA', dcd: true, on_dialysis: false, kdpi: 80, graft_status_1yr: 'Functioning' as const, egfr_12mo: 59 },
  { donor_age: 68, cause_of_death: 'CVA', dcd: true, on_dialysis: true, kdpi: 91, graft_status_1yr: 'Functioning' as const, egfr_12mo: 42 },
  { donor_age: 62, cause_of_death: 'Trauma', dcd: true, on_dialysis: false, kdpi: 76, graft_status_1yr: 'Functioning' as const, egfr_12mo: 61 },
  { donor_age: 69, cause_of_death: 'CVA', dcd: true, on_dialysis: true, kdpi: 93, graft_status_1yr: 'Failed' as const, egfr_12mo: null, failure_cause: 'Primary non-function' },
  { donor_age: 65, cause_of_death: 'CVA', dcd: false, on_dialysis: true, kdpi: 85, graft_status_1yr: 'Functioning' as const, egfr_12mo: 47 },
  { donor_age: 60, cause_of_death: 'CVA', dcd: true, on_dialysis: false, kdpi: 74, graft_status_1yr: 'Functioning' as const, egfr_12mo: 56 },
];
