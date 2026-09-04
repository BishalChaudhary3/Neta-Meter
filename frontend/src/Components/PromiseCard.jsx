import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, MapPin, Share2, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';
import { toJpeg } from 'html-to-image';

const PromiseCard = ({ politician, onShare, onReport }) => {
  const cardRef = useRef(null);
  const rate = politician.neta_score ?? politician.fulfillment_rate ?? 0;
  const breakdown = politician.score_breakdown || {};

  const tone = getTone(rate);

  const handleShare = async () => {
    if (!cardRef.current || !onShare) return;

    try {
      const dataUrl = await toJpeg(cardRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#111827',
      });
      await onShare(dataUrl, politician.name);
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-gray-900 via-slate-900 to-black shadow-2xl shadow-black/30"
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${tone.bar}`} />
      <div className="p-5">
        <div className="flex gap-4">
          <img
            src={politician.image_url}
            alt={politician.name}
            className="h-20 w-20 rounded-full border-4 border-white/10 object-cover"
            onError={(event) => {
              event.currentTarget.src = 'https://via.placeholder.com/120x120?text=MP';
            }}
          />
          <div className="min-w-0 flex-1">
            <div className={`mb-2 inline-flex rounded-md px-2 py-1 text-[11px] font-black uppercase ${tone.badge}`}>
              {tone.label}
            </div>
            <h3 className="truncate text-xl font-black text-white">{politician.name}</h3>
            <p className="text-sm text-gray-400">{politician.party}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              {politician.constituency}, {politician.state}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[120px_1fr] gap-4">
          <div className="rounded-lg border border-white/10 bg-black/30 p-4 text-center">
            <div className={`text-5xl font-black ${tone.text}`}>{rate}</div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">Neta Score</div>
          </div>
          <div className="space-y-3">
            <Meter label="Promises" value={breakdown.promise_delivery ?? politician.fulfillment_rate} />
            <Meter label="Progress" value={breakdown.citizen_progress ?? 0} />
            <Meter label="Condition" value={breakdown.area_condition ?? 0} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center">
          <MiniStat icon={CheckCircle} label="Kept" value={politician.promises_kept} tone="text-emerald-300" />
          <MiniStat icon={Clock} label="Running" value={politician.promises_in_progress} tone="text-yellow-300" />
          <MiniStat icon={XCircle} label="Broken" value={politician.promises_broken} tone="text-red-300" />
        </div>

        <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
            <span>Citizen proof</span>
            <span className="flex items-center gap-1 text-emerald-300">
              <ShieldCheck className="h-3 w-3" />
              {politician.verified_reports_count}/{politician.reports_count}
            </span>
          </div>
          {politician.recent_reports?.length ? (
            <div className="space-y-2">
              {politician.recent_reports.slice(0, 2).map((report) => (
                <div key={report.id} className="rounded-md bg-black/25 p-2 text-xs text-gray-300">
                  <div className="font-bold capitalize text-white">
                    {report.category} | {report.area}
                  </div>
                  <div className="mt-1 line-clamp-2">{report.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No citizen reports yet. Upload the first ground update.</p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-300 py-2 text-sm font-black text-black transition hover:bg-cyan-200"
          >
            <Share2 className="h-4 w-4" />
            Share Card
          </button>
          <button
            onClick={() => onReport?.(politician.id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-bold text-white transition hover:bg-white/15"
          >
            <UploadCloud className="h-4 w-4" />
            Report
          </button>
        </div>
      </div>
    </motion.article>
  );
};

function Meter({ label, value }) {
  const score = Math.round(value || 0);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{score}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value, tone }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <Icon className={`mx-auto h-4 w-4 ${tone}`} />
      <div className={`mt-1 text-lg font-black ${tone}`}>{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  );
}

function getTone(rate) {
  if (rate >= 75) {
    return {
      label: 'Public favorite',
      badge: 'bg-emerald-300 text-black',
      text: 'text-emerald-300',
      bar: 'bg-emerald-300',
    };
  }
  if (rate >= 55) {
    return {
      label: 'In the fight',
      badge: 'bg-yellow-300 text-black',
      text: 'text-yellow-300',
      bar: 'bg-yellow-300',
    };
  }
  return {
    label: 'Pressure rising',
    badge: 'bg-red-400 text-black',
    text: 'text-red-300',
    bar: 'bg-red-400',
  };
}

export default PromiseCard;
