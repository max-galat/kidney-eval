import { getCenterAcceptanceData } from '@/data/mock';

function ProgressBar({ pct, color }: { pct: number; color: 'blue' | 'teal' }) {
  const fill = color === 'blue' ? 'bg-blue-500' : 'bg-teal-500';
  return (
    <div className="h-2 w-full rounded-full bg-gray-100">
      <div className={`h-2 rounded-full ${fill} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

interface Props {
  kdpi: number;
  dcd: boolean;
}

export default function CenterAcceptanceCard({ kdpi, dcd }: Props) {
  const { nationalRate, highVolumeRate, priorDeclines, kdpiLabel } = getCenterAcceptanceData(kdpi, dcd);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          How centers like yours respond to similar kidneys
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Based on SRTR acceptance data for KDPI {kdpiLabel} kidneys{dcd ? ' (DCD adjusted)' : ''}
        </p>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">National acceptance rate</span>
            <span className="text-sm font-semibold text-gray-800">{nationalRate}%</span>
          </div>
          <ProgressBar pct={nationalRate} color="blue" />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">High-volume centers (300+ tx/yr)</span>
            <span className="text-sm font-semibold text-gray-800">{highVolumeRate}%</span>
          </div>
          <ProgressBar pct={highVolumeRate} color="teal" />
        </div>

        <div className={`rounded-md px-4 py-2.5 text-xs border ${priorDeclines >= 5 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
          This kidney has been declined by an estimated{' '}
          <span className="font-semibold">{priorDeclines}</span>{' '}
          {priorDeclines === 1 ? 'center' : 'centers'} before reaching you.
        </div>
      </div>
    </div>
  );
}
