'use client';

import { DonorInput, RecipientInput, CandidateRecipient } from '@/types';

// ---------------------------------------------------------------------------
// Field primitives
// ---------------------------------------------------------------------------

function NumberField({
  label,
  value,
  unit,
  onChange,
}: {
  label: string;
  value: number | null;
  unit?: string;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
        />
        {unit && <span className="text-xs text-gray-400 whitespace-nowrap">{unit}</span>}
      </div>
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
    <label className="flex items-center justify-between gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
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
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Controlled collapsible section
// ---------------------------------------------------------------------------

function CollapsibleSection({
  title,
  subtitle,
  open,
  onToggle,
  headerExtra,
  children,
}: {
  title: string;
  subtitle: string;
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
            <span className="ml-2 text-xs font-normal text-emerald-600 normal-case">{subtitle}</span>
          </h2>
          {headerExtra}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="ml-4 shrink-0 cursor-pointer hover:bg-gray-100 rounded p-1 transition-colors"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {open && children}
    </>
  );
}

// ---------------------------------------------------------------------------
// Recipient fields (reused for single and per-candidate)
// ---------------------------------------------------------------------------

function RecipientFields({
  value,
  onChange,
  compact = false,
}: {
  value: RecipientInput;
  onChange: (v: RecipientInput) => void;
  compact?: boolean;
}) {
  const set = <K extends keyof RecipientInput>(key: K) => (val: RecipientInput[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className={compact ? 'space-y-3' : ''}>
      <div className={`grid grid-cols-2 ${compact ? 'md:grid-cols-3' : 'md:grid-cols-3'} gap-3`}>
        <NumberField label="Age" value={value.recipient_age} unit="yrs" onChange={set('recipient_age')} />
        <NumberField label="Time on Dialysis" value={value.recipient_dialysis_months} unit="mo" onChange={set('recipient_dialysis_months')} />
        <NumberField label="BMI" value={value.recipient_bmi} onChange={set('recipient_bmi')} />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <Toggle label="Diabetes" value={value.recipient_diabetes} onChange={(v) => onChange({ ...value, recipient_diabetes: v })} />
        <Toggle label="Prior Transplant" value={value.recipient_prior_transplant} onChange={(v) => onChange({ ...value, recipient_prior_transplant: v })} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare candidates UI
// ---------------------------------------------------------------------------

function CandidatesUI({
  candidates,
  onChange,
}: {
  candidates: CandidateRecipient[];
  onChange: (c: CandidateRecipient[]) => void;
}) {
  const update = (i: number, patch: Partial<CandidateRecipient>) =>
    onChange(candidates.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const remove = (i: number) => {
    if (candidates.length <= 2) return;
    onChange(candidates.filter((_, idx) => idx !== i));
  };

  const add = () => {
    if (candidates.length >= 8) return;
    onChange([...candidates, {
      label: '',
      recipient_age: null,
      recipient_dialysis_months: null,
      recipient_bmi: null,
      recipient_diabetes: false,
      recipient_prior_transplant: false,
    }]);
  };

  return (
    <div className="px-6 py-5 space-y-5">
      {candidates.map((c, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Candidate {i + 1}
            </span>
            {candidates.length > 2 && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-500 transition-colors text-sm font-medium"
                aria-label="Remove candidate"
              >
                ✕
              </button>
            )}
          </div>

          {/* HIPAA: label field — display only, never stored/transmitted */}
          <div className="mb-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Name / Label</span>
              <input
                type="text"
                value={c.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="For your reference only — not stored or transmitted"
                autoComplete="off"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-gray-300"
              />
            </label>
          </div>

          <RecipientFields
            value={c}
            onChange={(v) => update(i, v)}
            compact
          />
        </div>
      ))}

      {candidates.length < 8 && (
        <button
          type="button"
          onClick={add}
          className="w-full rounded-lg border-2 border-dashed border-gray-200 py-3 text-sm font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + Add Candidate
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mode tab toggle
// ---------------------------------------------------------------------------

function ModeToggle({
  mode,
  onChange,
}: {
  mode: 'single' | 'compare';
  onChange: (m: 'single' | 'compare') => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-gray-200 bg-gray-100 p-0.5 text-xs font-medium">
      {(['single', 'compare'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={`px-3 py-1 rounded transition-colors ${
            mode === m
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {m === 'single' ? 'Single Patient' : 'Compare Candidates'}
        </button>
      ))}
    </div>
  );
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
}: Props) {
  const set = <K extends keyof DonorInput>(key: K) => (val: DonorInput[K]) =>
    onChange({ ...donor, [key]: val });

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Section 1: KDPI Factors */}
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Donor Information
          <span className="ml-2 text-xs font-normal text-gray-400 normal-case">(KDPI factors)</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-6 py-5">
        <NumberField label="Age" value={donor.donor_age} unit="yrs" onChange={set('donor_age') as (v: number | null) => void} />
        <NumberField label="Height" value={donor.donor_height_cm} unit="cm" onChange={set('donor_height_cm') as (v: number | null) => void} />
        <NumberField label="Weight" value={donor.donor_weight_kg} unit="kg" onChange={set('donor_weight_kg') as (v: number | null) => void} />
        <SelectField label="Ethnicity" value={donor.donor_ethnicity} options={['White', 'Black', 'Hispanic', 'Asian', 'Other']} onChange={set('donor_ethnicity')} />
        <SelectField label="Cause of Death" value={donor.donor_cause_of_death} options={['CVA', 'Trauma', 'Anoxia', 'Other']} onChange={(v) => set('donor_cause_of_death')(v as DonorInput['donor_cause_of_death'])} />
        <NumberField label="Serum Creatinine" value={donor.donor_serum_creatinine} unit="mg/dL" onChange={set('donor_serum_creatinine') as (v: number | null) => void} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-5">
        <Toggle label="Hypertension" value={donor.donor_hypertension} onChange={set('donor_hypertension')} />
        <Toggle label="Diabetes" value={donor.donor_diabetes} onChange={set('donor_diabetes')} />
        <Toggle label="HCV+" value={donor.donor_hcv} onChange={set('donor_hcv')} />
        <Toggle label="DCD" value={donor.donor_dcd} onChange={set('donor_dcd')} />
      </div>

      {/* Section 2: Additional Factors — controlled, fields clear on collapse */}
      <CollapsibleSection
        title="Additional Factors"
        subtitle="optional — improves prediction accuracy"
        open={additionalOpen}
        onToggle={onAdditionalToggle}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-6 py-5">
          <NumberField label="Biopsy Glomerulosclerosis" value={donor.donor_biopsy_glomerulosclerosis} unit="%" onChange={set('donor_biopsy_glomerulosclerosis')} />
          <NumberField label="Pump Resistance" value={donor.donor_pump_resistance} unit="mmHg/mL/min" onChange={set('donor_pump_resistance')} />
          <NumberField label="Pump Flow" value={donor.donor_pump_flow} unit="mL/min" onChange={set('donor_pump_flow')} />
          <NumberField label="Cold Ischemia Time" value={donor.cold_ischemia_hours} unit="hrs" onChange={set('cold_ischemia_hours')} />
          <NumberField label="Terminal Creatinine" value={donor.donor_terminal_creatinine} unit="mg/dL" onChange={set('donor_terminal_creatinine')} />
          <NumberField label="eGFR" value={donor.donor_egfr} unit="mL/min" onChange={set('donor_egfr')} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-5">
          <Toggle label="Donor on Dialysis" value={donor.donor_on_dialysis} onChange={set('donor_on_dialysis')} />
        </div>
      </CollapsibleSection>

      {/* Section 3: Recipient Information — controlled, fields clear on collapse */}
      <CollapsibleSection
        title="Recipient Information"
        subtitle="optional — personalizes prediction"
        open={recipientOpen}
        onToggle={onRecipientToggle}
        headerExtra={
          <ModeToggle mode={recipientMode} onChange={onRecipientModeChange} />
        }
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
          onClick={onSubmit}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer"
        >
          Evaluate Kidney
        </button>
      </div>
    </div>
  );
}
