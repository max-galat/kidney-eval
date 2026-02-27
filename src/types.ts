export interface DonorInput {
  // KDPI factors
  donor_age: number;
  donor_height_cm: number;
  donor_weight_kg: number;
  donor_ethnicity: string;
  donor_hypertension: boolean;
  donor_diabetes: boolean;
  donor_cause_of_death: 'CVA' | 'Trauma' | 'Anoxia' | 'Other';
  donor_serum_creatinine: number;
  donor_hcv: boolean;
  donor_dcd: boolean;

  // Additional factors (not in KDPI)
  donor_biopsy_glomerulosclerosis: number | null;
  donor_pump_resistance: number | null;
  donor_pump_flow: number | null;
  donor_on_dialysis: boolean;
  cold_ischemia_hours: number;
  donor_bmi: number | null;
  donor_egfr: number | null;
  donor_terminal_creatinine: number | null;
}

export interface ShapValue {
  feature: string;
  label: string;
  value: string | number | boolean;
  impact: number;
}

export interface SimilarKidney {
  donor_age: number;
  cause_of_death: string;
  dcd: boolean;
  on_dialysis: boolean;
  kdpi: number;
  graft_status_1yr: 'Functioning' | 'Failed';
  egfr_12mo: number | null;
  failure_cause?: string;
}

export interface DeclineStats {
  median_wait_months: number;
  pct_better_within_6mo: number;
  pct_still_waiting_12mo: number;
  high_demand: boolean;
}

export interface PredictionResult {
  predicted_1yr_survival: number;
  kdpi_score: number;
  kdpi_implied_risk: 'low' | 'moderate' | 'high';
  kdpi_implied_survival: number;
  model_assessment: 'excellent' | 'acceptable' | 'marginal' | 'poor';
  prediction_confidence: 'enhanced' | 'basic';
  divergence_explanation: string;
  shap_values: ShapValue[];
  similar_kidneys: SimilarKidney[];
  decline_stats: DeclineStats;
}
