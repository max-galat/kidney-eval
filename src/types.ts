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

  // Expanded demographics
  donor_sex: 'male' | 'female' | null;
  donor_hba1c: number | null;
  donor_cigarette_use: 'none' | 'light' | 'heavy' | null;
  donor_cigarette_ongoing: boolean;
  donor_alcohol_use: 'none' | 'light' | 'heavy' | null;
  donor_urine_output: 'normal' | 'reduced' | 'none' | null;
  donor_ird: boolean;

  // Organ assessment
  donor_kidney_size_left: number | null;
  donor_kidney_size_right: number | null;
  donor_anatomy_notes: string;
  donor_imaging: 'normal' | 'abnormal' | 'not-available' | null;

  // Additional factors (not in KDPI) — null when the panel is collapsed
  donor_biopsy_glomerulosclerosis: number | null;
  donor_pump_resistance: number | null;
  donor_pump_flow: number | null;
  donor_on_dialysis: boolean;
  cold_ischemia_hours: number | null;
  donor_bmi: number | null;
  donor_egfr: number | null;
  donor_terminal_creatinine: number | null;

  // Creatinine trend
  donor_admission_creatinine: number | null;
  donor_peak_creatinine: number | null;

  // Ischemia & logistics
  warm_ischemic_time_min: number | null;
  hemodynamic_stability: 'stable' | 'gradual-decline' | 'prolonged-hypotension' | 'unknown' | null;
  additional_transport_hours: number | null;
  time_to_or_hours: number | null;
  second_pump_hours: number | null;

  // Photo placeholder
  kidney_photo: null;
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
  recipient_age: number;
}

export interface DeclineStats {
  median_wait_months: number;
  pct_better_within_6mo: number;
  pct_still_waiting_12mo: number;
  high_demand: boolean;
  acceptance_rate: number | null; // set for high-demand kidneys
  annual_waitlist_mortality: number | null;
  is_population_average_mortality?: boolean; // true when using 5% population default (no recipient entered)
}

export interface PredictionResult {
  predicted_1yr_survival: number;
  kdpi_score: number;
  kdpi_implied_risk: 'low' | 'moderate' | 'high';
  kdpi_implied_survival: number;
  model_assessment: 'excellent' | 'acceptable' | 'marginal' | 'poor';
  prediction_confidence: 'basic' | 'enhanced' | 'personalized';
  divergence_explanation: string;
  shap_values: ShapValue[];
  similar_kidneys: SimilarKidney[];
  decline_stats: DeclineStats;
  model_ci: number;
  kdpi_ci: number;
  donor_dcd: boolean;
  donor_age: number;

  // PNF & creatinine predictions
  pnf_risk: number;
  pnf_ci: number;
  creatinine_6mo: number;
  creatinine_12mo: number;
  creatinine_range: number;
  creatinine_trend_label: string | null;

  // Logistics
  projected_total_cit: number | null;
  effective_cit: number | null;
  logistics_risk_text: string | null;
  uses_projected_cit: boolean;
}

export interface RecipientInput {
  recipient_age: number | null;
  recipient_dialysis_months: number | null;
  recipient_bmi: number | null;
  recipient_diabetes: boolean;
  recipient_prior_transplant: boolean;
  patient_goal: 'dialysis-asap' | 'longevity' | 'balance';
}

/** Extends RecipientInput with a display-only label for the compare mode.
 *  HIPAA: label is never persisted, logged, or transmitted. In-memory only. */
export interface CandidateRecipient extends RecipientInput {
  label: string;
}

export interface CandidateMatchResult {
  candidate: CandidateRecipient;
  prediction: PredictionResult;
  match_score: number;
  stars: number; // 1-5
  recommendation_text: string;
  star_justification: string; // per-candidate context explaining the star rating
}
