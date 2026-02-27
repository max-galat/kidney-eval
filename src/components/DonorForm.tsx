'use client';

import { DonorInput } from '@/types';

interface Props {
  donor: DonorInput;
  onChange: (donor: DonorInput) => void;
  onSubmit: () => void;
}

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

export default function DonorForm({ donor, onChange, onSubmit }: Props) {
  const set = <K extends keyof DonorInput>(key: K) => (val: DonorInput[K]) =>
    onChange({ ...donor, [key]: val });

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* KDPI Factors */}
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

      {/* Additional Factors */}
      <div className="border-t border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Additional Factors
          <span className="ml-2 text-xs font-normal text-emerald-600 normal-case">not in KDPI — our value-add</span>
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-6 py-5">
        <NumberField label="Biopsy Glomerulosclerosis" value={donor.donor_biopsy_glomerulosclerosis} unit="%" onChange={set('donor_biopsy_glomerulosclerosis')} />
        <NumberField label="Pump Resistance" value={donor.donor_pump_resistance} unit="mmHg/mL/min" onChange={set('donor_pump_resistance')} />
        <NumberField label="Pump Flow" value={donor.donor_pump_flow} unit="mL/min" onChange={set('donor_pump_flow')} />
        <NumberField label="Cold Ischemia Time" value={donor.cold_ischemia_hours} unit="hrs" onChange={set('cold_ischemia_hours') as (v: number | null) => void} />
        <NumberField label="Terminal Creatinine" value={donor.donor_terminal_creatinine} unit="mg/dL" onChange={set('donor_terminal_creatinine')} />
        <NumberField label="eGFR" value={donor.donor_egfr} unit="mL/min" onChange={set('donor_egfr')} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 pb-5">
        <Toggle label="Donor on Dialysis" value={donor.donor_on_dialysis} onChange={set('donor_on_dialysis')} />
      </div>

      {/* Submit */}
      <div className="px-6 pb-6">
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
