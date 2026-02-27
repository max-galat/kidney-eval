import { SimilarKidney } from '@/types';

function Badge({ label, variant }: { label: string; variant: 'green' | 'red' }) {
  const cls = variant === 'green'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : 'bg-red-50 text-red-700 border-red-200';
  return <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${cls}`}>{label}</span>;
}

function useSummaryStats(kidneys: SimilarKidney[]) {
  const functioning = kidneys.filter((k) => k.graft_status_1yr === 'Functioning').length;
  const egfrs = kidneys
    .map((k) => k.egfr_12mo)
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);
  const median = egfrs.length > 0 ? egfrs[Math.floor(egfrs.length / 2)] : null;
  return { functioning, total: kidneys.length, median, failures: kidneys.length - functioning };
}

export function SimilarKidneysSummary({ kidneys }: { kidneys: SimilarKidney[] }) {
  const { functioning, total, median, failures } = useSummaryStats(kidneys);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Similar Historical Kidneys
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {total} most similar donors by feature distance and their actual outcomes
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 px-6 py-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{functioning}/{total}</p>
          <p className="text-xs text-gray-500">Functioning at 1yr</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{median ?? '—'}</p>
          <p className="text-xs text-gray-500">Median eGFR (12mo)</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{failures}</p>
          <p className="text-xs text-gray-500">Graft Failures</p>
        </div>
      </div>
    </div>
  );
}

export function SimilarKidneysTable({ kidneys }: { kidneys: SimilarKidney[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Similar Kidneys — Detail
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">
              <th className="px-6 py-3">Age</th>
              <th className="px-3 py-3">COD</th>
              <th className="px-3 py-3">DCD</th>
              <th className="px-3 py-3">Dialysis</th>
              <th className="px-3 py-3 sticky right-12 bg-white">1yr Status</th>
              <th className="px-3 py-3 sticky right-0 bg-white">eGFR</th>
            </tr>
          </thead>
          <tbody>
            {kidneys.map((k, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-6 py-2.5 font-medium">{k.donor_age}</td>
                <td className="px-3 py-2.5">{k.cause_of_death}</td>
                <td className="px-3 py-2.5">{k.dcd ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2.5">{k.on_dialysis ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2.5 sticky right-12 bg-white">
                  <Badge
                    label={k.graft_status_1yr}
                    variant={k.graft_status_1yr === 'Functioning' ? 'green' : 'red'}
                  />
                </td>
                <td className="px-3 py-2.5 font-mono sticky right-0 bg-white">{k.egfr_12mo ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Keep default export for backwards compat
export default function SimilarKidneys({ kidneys }: { kidneys: SimilarKidney[] }) {
  return (
    <div className="space-y-6">
      <SimilarKidneysSummary kidneys={kidneys} />
      <SimilarKidneysTable kidneys={kidneys} />
    </div>
  );
}
