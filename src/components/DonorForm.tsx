'use client';

import { useState, useEffect } from 'react';
import { DonorInput, RecipientInput, CandidateRecipient } from '@/types';
import VoiceInput from './VoiceInput';
import KidneyPhotoUpload from './KidneyPhotoUpload';

// ---------------------------------------------------------------------------
// Unit conversions (metric <-> imperial)
// ---------------------------------------------------------------------------

function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54;
  const ft = Math.floor(totalInches / 12);
  let inches = Math.round(totalInches % 12);
  if (inches === 12) return { ft: ft + 1, inches: 0 };
  return { ft, inches };
}

function ftInToCm(ft: number, inches: number): number {
  return Math.round((ft * 12 + inches) * 2.54);
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.205);
}

function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.205) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Field primitives
// ---------------------------------------------------------------------------

function NumberField({
  label,
  value,
  unit,
  onChange,
  error,
}: {
  label: string;
  value: number | null;
  unit?: string;
  onChange: (v: number | null) => void;
  error?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className={`w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[44px] focus:ring-1 outline-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }`}
        />
        {unit && <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>}
      </div>
      {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 min-h-[44px]">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${value ? 'bg-blue-600' : 'bg-gray-200'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[] | string[];
  onChange: (v: string) => void;
}) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[44px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      >
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function NullableSelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (v: string | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[44px] focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      >
        <option value="">--</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// Imperial height field
// ---------------------------------------------------------------------------

function HeightImperialField({
  ft,
  inches,
  onFtChange,
  onInChange,
  error,
}: {
  ft: number | null;
  inches: number | null;
  onFtChange: (v: number | null) => void;
  onInChange: (v: number | null) => void;
  error?: string;
}) {
  const inputCls = `w-full rounded-md border bg-white px-3 py-2 text-sm min-h-[44px] focus:ring-1 outline-none ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  }`;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Height</span>
      <div className="flex items-center gap-1">
        <input type="number" value={ft ?? ''} onChange={(e) => onFtChange(e.target.value === '' ? null : Number(e.target.value))} placeholder="ft" className={inputCls} />
        <span className="text-xs text-gray-400 whitespace-nowrap">ft</span>
        <input type="number" value={inches ?? ''} onChange={(e) => onInChange(e.target.value === '' ? null : Number(e.target.value))} placeholder="in" className={inputCls} />
        <span className="text-xs text-gray-400 whitespace-nowrap">in</span>
      </div>
      {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Unit system toggle
// ---------------------------------------------------------------------------

function UnitSystemToggle({ mode, onSwitch }: { mode: 'metric' | 'imperial'; onSwitch: (m: 'metric' | 'imperial') => void }) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-gray-100 p-0.5 text-xs font-medium shrink-0">
      {(['metric', 'imperial'] as const).map((m) => (
        <button key={m} type="button" onClick={() => onSwitch(m)} className={`px-2.5 py-1 rounded transition-colors ${mode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          {m === 'metric' ? 'kg / cm' : 'lbs / ft'}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible section with populated badge
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  subtitle,
  badge,
  open,
  onToggle,
  headerExtra,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  headerExtra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="border-t border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
            {title}
            {subtitle && <span className="ml-2 text-xs font-normal text-emerald-600 normal-case">{subtitle}</span>}
            {badge && <span className="ml-2 text-xs font-normal text-gray-400 normal-case">{badge}</span>}
          </h2>
          {headerExtra}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="ml-4 shrink-0 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {open && children}
    </>
  );
}

// ---------------------------------------------------------------------------
// Recipient fields
// ---------------------------------------------------------------------------

const PATIENT_GOALS = [
  { value: 'dialysis-asap', label: 'Get off dialysis as soon as possible' },
  { value: 'longevity', label: 'Maximize graft longevity' },
  { value: 'balance', label: 'Balance both' },
] as const;

function RecipientFields({ value, onChange, compact = false }: { value: RecipientInput; onChange: (v: RecipientInput) => void; compact?: boolean }) {
  const set = <K extends keyof RecipientInput>(key: K) => (val: RecipientInput[K]) => onChange({ ...value, [key]: val });

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <NumberField label="Age" value={value.recipient_age} unit="yrs" onChange={set('recipient_age')} />
        <NumberField label="Time on Dialysis" value={value.recipient_dialysis_months} unit="mo" onChange={set('recipient_dialysis_months')} />
        <NumberField label="BMI" value={value.recipient_bmi} onChange={set('recipient_bmi')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Toggle label="Diabetes" value={value.recipient_diabetes} onChange={(v) => onChange({ ...value, recipient_diabetes: v })} />
        <Toggle label="Prior Transplant" value={value.recipient_prior_transplant} onChange={(v) => onChange({ ...value, recipient_prior_transplant: v })} />
      </div>
      <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Patient&apos;s Transplant Goal</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PATIENT_GOALS.map((g) => (
            <label
              key={g.value}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 min-h-[44px] cursor-pointer transition-colors text-xs ${
                value.patient_goal === g.value ? 'border-blue-400 bg-blue-50 text-blue-800 font-medium' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <input type="radio" name={`patient-goal-${compact ? 'compact' : 'full'}`} value={g.value} checked={value.patient_goal === g.value} onChange={() => onChange({ ...value, patient_goal: g.value })} className="sr-only" />
              <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${value.patient_goal === g.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`} />
              {g.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare candidates UI
// ---------------------------------------------------------------------------

function CandidatesUI({ candidates, onChange }: { candidates: CandidateRecipient[]; onChange: (c: CandidateRecipient[]) => void }) {
  const update = (i: number, patch: Partial<CandidateRecipient>) => onChange(candidates.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i: number) => { if (candidates.length <= 2) return; onChange(candidates.filter((_, idx) => idx !== i)); };
  const add = () => {
    if (candidates.length >= 8) return;
    onChange([...candidates, { label: '', recipient_age: null, recipient_dialysis_months: null, recipient_bmi: null, recipient_diabetes: false, recipient_prior_transplant: false, patient_goal: 'balance' as const }]);
  };

  return (
    <div className="px-6 py-5 space-y-5">
      {candidates.map((c, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidate {i + 1}</span>
            {candidates.length > 2 && (
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors text-sm font-medium" aria-label="Remove candidate">✕</button>
            )}
          </div>
          <div className="mb-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name / Label</span>
              <input type="text" value={c.label} onChange={(e) => update(i, { label: e.target.value })} placeholder="For your reference only — not stored or transmitted" autoComplete="off" className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-gray-300" />
            </label>
          </div>
          <RecipientFields value={c} onChange={(v) => update(i, v)} compact />
        </div>
      ))}
      {candidates.length < 8 && (
        <button type="button" onClick={add} className="w-full rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors">+ Add Candidate</button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mode tab toggle
// ---------------------------------------------------------------------------

function ModeToggle({ mode, onChange }: { mode: 'single' | 'compare'; onChange: (m: 'single' | 'compare') => void }) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-gray-100 p-0.5 text-xs font-medium">
      {(['single', 'compare'] as const).map((m) => (
        <button key={m} type="button" onClick={() => onChange(m)} className={`px-3 py-1 rounded transition-colors ${mode === m ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          {m === 'single' ? 'Single Patient' : 'Compare Candidates'}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section populated count helper
// ---------------------------------------------------------------------------

function countPopulated(values: (string | number | boolean | null | undefined)[]): number {
  return values.filter((v) => v !== null && v !== undefined && v !== '' && v !== false).length;
}

// ---------------------------------------------------------------------------
// DonorForm
// ---------------------------------------------------------------------------

interface Props {
  donor: DonorInput;
  onChange: (donor: DonorInput) => void;
  additionalOpen: boolean;
  onAdditionalToggle: () => void;
  recipient: RecipientInput;
  onRecipientChange: (r: RecipientInput) => void;
  recipientOpen: boolean;
  onRecipientToggle: () => void;
  recipientMode: 'single' | 'compare';
  onRecipientModeChange: (m: 'single' | 'compare') => void;
  candidates: CandidateRecipient[];
  onCandidatesChange: (c: CandidateRecipient[]) => void;
  onSubmit: () => void;
  // Section open state (new collapsible sections)
  sectionOpen: Record<string, boolean>;
  onSectionToggle: (section: string) => void;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function validateAge(v: number | null): string {
  if (v === null || (v as unknown) === '') return 'Age is required';
  if (!Number.isInteger(v) || v < 0 || v > 90) return 'Age must be a whole number 0-90';
  return '';
}
function validatePositive(v: number | null, label: string): string {
  if (v === null || (v as unknown) === '') return `${label} is required`;
  if (v <= 0) return `${label} must be a positive number`;
  return '';
}
function validateImperialHeight(ft: number | null, inches: number | null): string {
  if (ft === null) return 'Height (ft) is required';
  if (!Number.isInteger(ft) || ft < 0 || ft > 7) return 'Feet must be 0-7';
  if (inches === null) return 'Height (in) is required';
  if (!Number.isInteger(inches) || inches < 0 || inches > 11) return 'Inches must be 0-11';
  return '';
}

export default function DonorForm({
  donor,
  onChange,
  additionalOpen,
  onAdditionalToggle,
  recipient,
  onRecipientChange,
  recipientOpen,
  onRecipientToggle,
  recipientMode,
  onRecipientModeChange,
  candidates,
  onCandidatesChange,
  onSubmit,
  sectionOpen,
  onSectionToggle,
}: Props) {
  const set = <K extends keyof DonorInput>(key: K) => (val: DonorInput[K]) =>
    onChange({ ...donor, [key]: val });

  // Imperial/Metric unit state
  const [unitMode, setUnitMode] = useState<'metric' | 'imperial'>('metric');
  const [heightFt, setHeightFt] = useState<number | null>(null);
  const [heightIn, setHeightIn] = useState<number | null>(null);
  const [weightLbs, setWeightLbs] = useState<number | null>(null);

  useEffect(() => {
    if (unitMode === 'imperial') {
      const hCm = donor.donor_height_cm as unknown as number | null;
      const wKg = donor.donor_weight_kg as unknown as number | null;
      if (hCm && hCm > 0) {
        const { ft, inches } = cmToFtIn(hCm);
        setHeightFt(ft);
        setHeightIn(inches);
      } else { setHeightFt(null); setHeightIn(null); }
      if (wKg && wKg > 0) { setWeightLbs(kgToLbs(wKg)); }
      else { setWeightLbs(null); }
    }
  }, [donor.donor_height_cm, donor.donor_weight_kg, unitMode]);

  const handleSwitchUnit = (mode: 'metric' | 'imperial') => { setUnitMode(mode); };
  const handleImperialFt = (ft: number | null) => { setHeightFt(ft); if (ft !== null) onChange({ ...donor, donor_height_cm: ftInToCm(ft, heightIn ?? 0) as unknown as number }); };
  const handleImperialIn = (inches: number | null) => { setHeightIn(inches); if (inches !== null) onChange({ ...donor, donor_height_cm: ftInToCm(heightFt ?? 0, inches) as unknown as number }); };
  const handleImperialWeight = (lbs: number | null) => { setWeightLbs(lbs); if (lbs !== null) onChange({ ...donor, donor_weight_kg: lbsToKg(lbs) as unknown as number }); };

  // Voice input handler
  const handleVoiceFill = (fields: Partial<DonorInput>) => {
    onChange({ ...donor, ...fields });
  };

  // Validation
  const errors = {
    donor_age: validateAge(donor.donor_age as unknown as number | null),
    donor_height: unitMode === 'metric'
      ? validatePositive(donor.donor_height_cm as unknown as number | null, 'Height')
      : validateImperialHeight(heightFt, heightIn),
    donor_weight: unitMode === 'metric'
      ? validatePositive(donor.donor_weight_kg as unknown as number | null, 'Weight')
      : validatePositive(weightLbs, 'Weight'),
    donor_serum_creatinine: validatePositive(donor.donor_serum_creatinine as unknown as number | null, 'Serum Creatinine'),
  };
  const isValid = Object.values(errors).every((e) => e === '');

  // Section populated badges
  const medHistCount = countPopulated([
    donor.donor_hypertension, donor.donor_diabetes, donor.donor_hba1c,
    donor.donor_cigarette_use, donor.donor_alcohol_use, donor.donor_hcv,
  ]);
  const kidneyFnCount = countPopulated([
    donor.donor_serum_creatinine, donor.donor_admission_creatinine,
    donor.donor_peak_creatinine, donor.donor_egfr, donor.donor_urine_output,
    donor.donor_on_dialysis,
  ]);
  const organCount = countPopulated([
    donor.donor_biopsy_glomerulosclerosis, donor.donor_pump_resistance,
    donor.donor_pump_flow, donor.donor_kidney_size_left,
    donor.donor_kidney_size_right, donor.donor_anatomy_notes,
    donor.donor_imaging,
  ]);
  const ischemiaCount = countPopulated([
    donor.cold_ischemia_hours, donor.donor_dcd, donor.warm_ischemic_time_min,
    donor.hemodynamic_stability, donor.additional_transport_hours,
    donor.time_to_or_hours, donor.second_pump_hours,
  ]);
  const riskFlagCount = countPopulated([donor.donor_ird, donor.donor_dcd]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* Voice Input — always visible at top */}
      <div className="px-6 pt-5 pb-2">
        <VoiceInput onParsedFields={handleVoiceFill} />
      </div>

      {/* Section 1: Demographics — always open */}
      <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Demographics
        </h2>
        <UnitSystemToggle mode={unitMode} onSwitch={handleSwitchUnit} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-6 py-5">
        <NumberField label="Age" value={donor.donor_age as unknown as number | null} unit="yrs" onChange={set('donor_age') as (v: number | null) => void} error={errors.donor_age} />
        <NullableSelectField label="Sex" value={donor.donor_sex} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} onChange={(v) => set('donor_sex')(v as DonorInput['donor_sex'])} />
        {unitMode === 'metric' ? (
          <NumberField label="Height" value={donor.donor_height_cm as unknown as number | null} unit="cm" onChange={set('donor_height_cm') as (v: number | null) => void} error={errors.donor_height} />
        ) : (
          <HeightImperialField ft={heightFt} inches={heightIn} onFtChange={handleImperialFt} onInChange={handleImperialIn} error={errors.donor_height} />
        )}
        {unitMode === 'metric' ? (
          <NumberField label="Weight" value={donor.donor_weight_kg as unknown as number | null} unit="kg" onChange={set('donor_weight_kg') as (v: number | null) => void} error={errors.donor_weight} />
        ) : (
          <NumberField label="Weight" value={weightLbs} unit="lbs" onChange={handleImperialWeight} error={errors.donor_weight} />
        )}
        <SelectField label="Ethnicity" value={donor.donor_ethnicity} options={['White', 'Black', 'Hispanic', 'Asian', 'Other']} onChange={set('donor_ethnicity')} />
        <SelectField label="Cause of Death" value={donor.donor_cause_of_death} options={['CVA', 'Trauma', 'Anoxia', 'Other']} onChange={(v) => set('donor_cause_of_death')(v as DonorInput['donor_cause_of_death'])} />
      </div>

      {/* Section 2: Medical History — open by default */}
      <CollapsibleSection
        title="Medical History"
        badge={medHistCount > 0 ? `(${medHistCount}/7)` : undefined}
        open={sectionOpen.medicalHistory !== false}
        onToggle={() => onSectionToggle('medicalHistory')}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-6 py-5">
          <NullableSelectField
            label="Hypertension"
            value={donor.donor_hypertension ? 'yes' : 'no'}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
            onChange={(v) => set('donor_hypertension')(v === 'yes')}
          />
          <NullableSelectField
            label="Diabetes"
            value={donor.donor_diabetes ? 'yes' : 'no'}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
            onChange={(v) => set('donor_diabetes')(v === 'yes')}
          />
          <NumberField label="HbA1c" value={donor.donor_hba1c} unit="%" onChange={set('donor_hba1c')} />
          <NullableSelectField
            label="Cigarette Use"
            value={donor.donor_cigarette_use}
            options={[{ value: 'none', label: 'None' }, { value: 'light', label: 'Light' }, { value: 'heavy', label: 'Heavy' }]}
            onChange={(v) => set('donor_cigarette_use')(v as DonorInput['donor_cigarette_use'])}
          />
          <NullableSelectField
            label="Alcohol Use"
            value={donor.donor_alcohol_use}
            options={[{ value: 'none', label: 'None' }, { value: 'light', label: 'Light' }, { value: 'heavy', label: 'Heavy' }]}
            onChange={(v) => set('donor_alcohol_use')(v as DonorInput['donor_alcohol_use'])}
          />
          <Toggle label="HCV+" value={donor.donor_hcv} onChange={set('donor_hcv')} />
        </div>
      </CollapsibleSection>

      {/* Section 3: Kidney Function — collapsed */}
      <CollapsibleSection
        title="Kidney Function"
        badge={kidneyFnCount > 0 ? `(${kidneyFnCount}/6)` : undefined}
        open={sectionOpen.kidneyFunction === true}
        onToggle={() => onSectionToggle('kidneyFunction')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-6 py-5">
          <NumberField label="Serum Creatinine (terminal)" value={donor.donor_serum_creatinine as unknown as number | null} unit="mg/dL" onChange={set('donor_serum_creatinine') as (v: number | null) => void} error={errors.donor_serum_creatinine} />
          <NumberField label="Admission Creatinine" value={donor.donor_admission_creatinine} unit="mg/dL" onChange={set('donor_admission_creatinine')} />
          <NumberField label="Peak Creatinine" value={donor.donor_peak_creatinine} unit="mg/dL" onChange={set('donor_peak_creatinine')} />
          <NumberField label="eGFR" value={donor.donor_egfr} unit="mL/min/1.73m2" onChange={set('donor_egfr')} />
          <NullableSelectField
            label="Urine Output"
            value={donor.donor_urine_output}
            options={[{ value: 'normal', label: 'Normal' }, { value: 'reduced', label: 'Reduced' }, { value: 'none', label: 'None' }]}
            onChange={(v) => set('donor_urine_output')(v as DonorInput['donor_urine_output'])}
          />
          <Toggle label="Donor on Dialysis" value={donor.donor_on_dialysis} onChange={set('donor_on_dialysis')} />
        </div>
        {/* Creatinine trend indicator */}
        {donor.donor_admission_creatinine !== null && donor.donor_peak_creatinine !== null && (
          <div className="px-6 pb-5">
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
              <p className="text-xs text-gray-500 font-medium mb-1">Creatinine Trend</p>
              <div className="flex items-center gap-3 text-sm">
                <span className="font-mono">{donor.donor_admission_creatinine}</span>
                <span className="text-gray-300">&rarr;</span>
                <span className="font-mono font-semibold text-red-600">{donor.donor_peak_creatinine}</span>
                <span className="text-gray-300">&rarr;</span>
                <span className="font-mono">{donor.donor_serum_creatinine}</span>
                <span className="text-xs text-gray-400 ml-1">(admit &rarr; peak &rarr; terminal)</span>
              </div>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Section 4: Organ Assessment — collapsed */}
      <CollapsibleSection
        title="Organ Assessment"
        badge={organCount > 0 ? `(${organCount}/7)` : undefined}
        open={sectionOpen.organAssessment === true}
        onToggle={() => onSectionToggle('organAssessment')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-6 py-5">
          <NumberField label="Biopsy GS %" value={donor.donor_biopsy_glomerulosclerosis} unit="%" onChange={set('donor_biopsy_glomerulosclerosis')} />
          <NumberField label="Pump Resist." value={donor.donor_pump_resistance} unit="mmHg/mL/min" onChange={set('donor_pump_resistance')} />
          <NumberField label="Pump Flow" value={donor.donor_pump_flow} unit="mL/min" onChange={set('donor_pump_flow')} />
          <NumberField label="Kidney Size (L)" value={donor.donor_kidney_size_left} unit="cm" onChange={set('donor_kidney_size_left')} />
          <NumberField label="Kidney Size (R)" value={donor.donor_kidney_size_right} unit="cm" onChange={set('donor_kidney_size_right')} />
          <NullableSelectField
            label="Imaging"
            value={donor.donor_imaging}
            options={[{ value: 'normal', label: 'Normal' }, { value: 'abnormal', label: 'Abnormal' }, { value: 'not-available', label: 'Not Available' }]}
            onChange={(v) => set('donor_imaging')(v as DonorInput['donor_imaging'])}
          />
        </div>
        <div className="px-6 pb-5 space-y-4">
          <TextAreaField label="Anatomy Notes" value={donor.donor_anatomy_notes} onChange={set('donor_anatomy_notes')} />
          <KidneyPhotoUpload />
        </div>
      </CollapsibleSection>

      {/* Section 5: Ischemia & Logistics — collapsed */}
      <CollapsibleSection
        title="Ischemia & Logistics"
        badge={ischemiaCount > 0 ? `(${ischemiaCount}/7)` : undefined}
        open={sectionOpen.ischemiaLogistics === true}
        onToggle={() => onSectionToggle('ischemiaLogistics')}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-6 py-5">
          <NumberField label="Cold Ischemia Time" value={donor.cold_ischemia_hours} unit="hrs" onChange={set('cold_ischemia_hours')} />
          <Toggle label="DCD" value={donor.donor_dcd} onChange={set('donor_dcd')} />

          {/* WIT fields — only visible when DCD */}
          {donor.donor_dcd && (
            <>
              <NumberField label="Warm Ischemia Time" value={donor.warm_ischemic_time_min} unit="min" onChange={set('warm_ischemic_time_min')} />
              <NullableSelectField
                label="Hemodynamic Stability"
                value={donor.hemodynamic_stability}
                options={[
                  { value: 'stable', label: 'Stable' },
                  { value: 'gradual-decline', label: 'Gradual Decline' },
                  { value: 'prolonged-hypotension', label: 'Prolonged Hypotension' },
                  { value: 'unknown', label: 'Unknown' },
                ]}
                onChange={(v) => set('hemodynamic_stability')(v as DonorInput['hemodynamic_stability'])}
              />
            </>
          )}
        </div>

        {/* Transport Calculator */}
        <div className="px-6 pb-5">
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 space-y-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Transport Calculator</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <NumberField label="Additional Transport" value={donor.additional_transport_hours} unit="hrs" onChange={set('additional_transport_hours')} />
              <NumberField label="Time to OR" value={donor.time_to_or_hours} unit="hrs" onChange={set('time_to_or_hours')} />
              <NumberField label="Second Pump" value={donor.second_pump_hours} unit="hrs" onChange={set('second_pump_hours')} />
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 6: Risk Flags — collapsed */}
      <CollapsibleSection
        title="Risk Flags"
        badge={riskFlagCount > 0 ? `(${riskFlagCount}/2)` : undefined}
        open={sectionOpen.riskFlags === true}
        onToggle={() => onSectionToggle('riskFlags')}
      >
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <Toggle label="IRD (Increased Risk Donor)" value={donor.donor_ird} onChange={set('donor_ird')} />
          <Toggle label="DCD" value={donor.donor_dcd} onChange={set('donor_dcd')} />
        </div>
      </CollapsibleSection>

      {/* Section 7: Recipient Information */}
      <CollapsibleSection
        title="Recipient Information"
        subtitle="optional — personalizes prediction"
        open={recipientOpen}
        onToggle={onRecipientToggle}
        headerExtra={<ModeToggle mode={recipientMode} onChange={onRecipientModeChange} />}
      >
        {recipientMode === 'single' ? (
          <div className="px-6 py-5">
            <RecipientFields value={recipient} onChange={onRecipientChange} />
          </div>
        ) : (
          <CandidatesUI candidates={candidates} onChange={onCandidatesChange} />
        )}
      </CollapsibleSection>

      {/* Submit */}
      <div className="px-6 py-6">
        <button
          onClick={isValid ? onSubmit : undefined}
          disabled={!isValid}
          className={`w-full rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
            isValid ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Evaluate Kidney
        </button>
        {!isValid && (
          <p className="text-xs text-gray-400 text-center mt-2">Fill in all required donor fields above to continue</p>
        )}
      </div>
    </div>
  );
}
