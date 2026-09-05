import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import {
  Activity,
  Bell,
  Camera,
  FastForward,
  Flame,
  Languages,
  Search,
  ShieldCheck,
  Swords,
  TrendingUp,
  Trophy,
  UploadCloud,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import PromiseCard from './Components/PromiseCard';
import { battleAudio } from './battleAudio';
import { LanguageProvider, useLanguage } from './LanguageContext';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8001';

const categories = [
  'roads',
  'water',
  'electricity',
  'jobs',
  'healthcare',
  'education',
  'safety',
  'sanitation',
  'other',
];

const statusValues = ['improved', 'unchanged', 'worsened'];

const viewPaths = {
  dashboard: '/',
  leaderboard: '/leaderboard',
  battle: '/battle',
};

function viewFromPath(pathname) {
  if (pathname === '/battle') return 'battle';
  if (pathname === '/leaderboard') return 'leaderboard';
  return 'dashboard';
}

async function api(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong');
  }

  return data;
}

function AppContent() {
  const { t, translatePolitician } = useLanguage();
  const [view, setView] = useState(() => viewFromPath(window.location.pathname));
  const [politicians, setPoliticians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formPoliticianId, setFormPoliticianId] = useState('');

  const loadPoliticians = async () => {
    try {
      const data = await api('/api/politicians');
      setPoliticians(data.politicians);
    } catch (error) {
      toast.error(`Backend unavailable: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPoliticians();
  }, []);

  useEffect(() => {
    const handlePopState = () => setView(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextView) => {
    setView(nextView);
    window.history.pushState({}, '', viewPaths[nextView]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = async (dataUrl, name) => {
    const blob = await fetch(dataUrl).then((response) => response.blob());
    const file = new File([blob], `${name.replace(/\s+/g, '-').toLowerCase()}-neta-card.jpg`, {
      type: 'image/jpeg',
    });
    const shareData = {
      title: t('shareCardTitle', { name }),
      text: t('shareCardText', { name }),
      files: [file],
    };

    if (navigator.canShare?.(shareData)) {
      await navigator.share(shareData);
      toast.success(t('shareSheetOpened'));
      return;
    }

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = file.name;
    link.click();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text)}`, '_blank');
    toast.success(t('shareCardDownloaded'));
  };

  const filteredPoliticians = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return politicians;
    return politicians.filter((politician) => {
      const tp = translatePolitician(politician);
      return [
        politician.name,
        politician.party,
        politician.constituency,
        politician.state,
        tp.name,
        tp.party,
        tp.constituency,
        tp.state,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [politicians, search, translatePolitician]);

  const openReportForm = (politicianId) => {
    navigate('dashboard');
    setFormPoliticianId(String(politicianId));
    setTimeout(() => document.getElementById('report-form')?.scrollIntoView({ behavior: 'smooth' }), 80);
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-white">
      <AppNav view={view} navigate={navigate} />
      {view === 'dashboard' && (
        <Dashboard
          loading={loading}
          politicians={politicians}
          filteredPoliticians={filteredPoliticians}
          search={search}
          setSearch={setSearch}
          selectedPoliticianId={formPoliticianId}
          setSelectedPoliticianId={setFormPoliticianId}
          onReportCreated={loadPoliticians}
          onShare={handleShare}
          onReport={openReportForm}
          onOpenBattle={() => navigate('battle')}
        />
      )}
      {view === 'leaderboard' && <Leaderboard politicians={politicians} loading={loading} />}
      {view === 'battle' && <NetaBattle politicians={politicians} />}
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppNav({ view, navigate }) {
  const { lang, setLang, t } = useLanguage();

  const items = [
    { id: 'dashboard', label: t('navCitizenMeter'), icon: Activity },
    { id: 'leaderboard', label: t('navLeaderboard'), icon: TrendingUp },
    { id: 'battle', label: t('navBattle'), icon: Swords },
  ];

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <button onClick={() => navigate('dashboard')} className="text-left">
          <div className="text-2xl font-black tracking-wide">
            {lang === 'hi' ? 'नेता-मीटर' : 'Neta-Meter'}
          </div>
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            {t('brandTagline')}
          </div>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {items.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-cyan-300 bg-cyan-300 text-black shadow-lg shadow-cyan-500/20'
                      : 'border-white/10 bg-white/5 text-gray-200 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Language Toggle Control */}
          <div
            className="flex items-center rounded-lg border border-white/15 bg-white/5 p-1 backdrop-blur-sm"
            role="group"
            aria-label={t('language')}
          >
            <Languages className="ml-1.5 mr-1 h-4 w-4 text-cyan-300" />
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                lang === 'en'
                  ? 'bg-cyan-300 text-black font-extrabold shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
              aria-pressed={lang === 'en'}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                lang === 'hi'
                  ? 'bg-cyan-300 text-black font-extrabold shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
              aria-pressed={lang === 'hi'}
            >
              हिंदी
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function Dashboard({
  loading,
  politicians,
  filteredPoliticians,
  search,
  setSearch,
  selectedPoliticianId,
  setSelectedPoliticianId,
  onReportCreated,
  onShare,
  onReport,
  onOpenBattle,
}) {
  const { t } = useLanguage();
  const totalReports = politicians.reduce((total, politician) => total + politician.reports_count, 0);
  const verifiedReports = politicians.reduce(
    (total, politician) => total + politician.verified_reports_count,
    0
  );
  const averageScore = politicians.length
    ? Math.round(
        politicians.reduce((total, politician) => total + politician.neta_score, 0) / politicians.length
      )
    : 0;

  return (
    <>
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#0e749033,transparent_32%),linear-gradient(135deg,#111827,#030712)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-3 py-2 text-sm font-semibold text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              {t('evidenceBanner')}
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
              {t('heroTitle')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-gray-300">
              {t('heroSubtitle')}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onOpenBattle}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-5 py-3 font-black text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400"
              >
                <Swords className="h-5 w-5" />
                {t('btnOpenBattle')}
              </button>
              <button
                onClick={() => document.getElementById('report-form')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
              >
                <UploadCloud className="h-5 w-5" />
                {t('btnUploadReport')}
              </button>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-3">
              <StatTile label={t('statAvgScore')} value={averageScore} suffix="/100" />
              <StatTile label={t('statReports')} value={totalReports} />
              <StatTile label={t('statVerified')} value={verifiedReports} />
            </div>
          </div>
          <CitizenReportForm
            politicians={politicians}
            selectedPoliticianId={selectedPoliticianId}
            setSelectedPoliticianId={setSelectedPoliticianId}
            onReportCreated={onReportCreated}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black">{t('cardsTitle')}</h2>
            <p className="text-sm text-gray-400">{t('cardsSubtitle')}</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-white outline-none transition focus:border-cyan-300"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredPoliticians.map((politician) => (
              <PromiseCard
                key={politician.id}
                politician={politician}
                onShare={onShare}
                onReport={onReport}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function StatTile({ label, value, suffix = '' }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="text-3xl font-black text-cyan-200">
        {value}
        {suffix}
      </div>
      <div className="text-xs uppercase tracking-[0.18em] text-gray-400">{label}</div>
    </div>
  );
}

function CitizenReportForm({ politicians, selectedPoliticianId, setSelectedPoliticianId, onReportCreated }) {
  const { t, translatePolitician, translateCategory, translateStatus } = useLanguage();
  const [form, setForm] = useState({
    politician_id: '',
    area: '',
    category: 'roads',
    status: 'improved',
    progress_percent: 55,
    condition_score: 6,
    description: '',
    evidence_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedPoliticianId) {
      setForm((current) => ({ ...current, politician_id: selectedPoliticianId }));
    }
  }, [selectedPoliticianId]);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'politician_id') setSelectedPoliticianId(value);
  };

  const submitReport = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        politician_id: Number(form.politician_id),
        progress_percent: Number(form.progress_percent),
        condition_score: Number(form.condition_score),
      };
      if (!payload.evidence_url) delete payload.evidence_url;
      await api('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      toast.success(t('reportSuccess'));
      setForm((current) => ({
        ...current,
        area: '',
        progress_percent: 55,
        condition_score: 6,
        description: '',
        evidence_url: '',
      }));
      onReportCreated();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      id="report-form"
      onSubmit={submitReport}
      className="rounded-lg border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300 text-black">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-black">{t('formTitle')}</h2>
          <p className="text-sm text-gray-400">{t('formSubtitle')}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-semibold text-gray-200">
          {t('labelNeta')}
          <select
            required
            value={form.politician_id}
            onChange={(event) => update('politician_id', event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#111827] p-3 text-white"
          >
            <option value="">{t('chooseLeader')}</option>
            {politicians.map((politician) => {
              const tp = translatePolitician(politician);
              return (
                <option key={politician.id} value={politician.id}>
                  {tp.name}
                </option>
              );
            })}
          </select>
        </label>
        <label className="text-sm font-semibold text-gray-200">
          {t('labelArea')}
          <input
            required
            value={form.area}
            onChange={(event) => update('area', event.target.value)}
            placeholder={t('placeholderArea')}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#111827] p-3 text-white"
          />
        </label>
        <label className="text-sm font-semibold text-gray-200">
          {t('labelCategory')}
          <select
            value={form.category}
            onChange={(event) => update('category', event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#111827] p-3 text-white capitalize"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {translateCategory(category)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-semibold text-gray-200">
          {t('labelStatus')}
          <select
            value={form.status}
            onChange={(event) => update('status', event.target.value)}
            className="mt-1 w-full rounded-lg border border-white/10 bg-[#111827] p-3 text-white"
          >
            {statusValues.map((val) => (
              <option key={val} value={val}>
                {translateStatus(val)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block text-sm font-semibold text-gray-200">
        {t('labelProgress')}: {form.progress_percent}%
        <input
          type="range"
          min="0"
          max="100"
          value={form.progress_percent}
          onChange={(event) => update('progress_percent', event.target.value)}
          className="mt-2 w-full accent-cyan-300"
        />
      </label>
      <label className="mt-4 block text-sm font-semibold text-gray-200">
        {t('labelAreaCondition')}: {form.condition_score}/10
        <input
          type="range"
          min="1"
          max="10"
          value={form.condition_score}
          onChange={(event) => update('condition_score', event.target.value)}
          className="mt-2 w-full accent-emerald-300"
        />
      </label>
      <label className="mt-4 block text-sm font-semibold text-gray-200">
        {t('labelWhatChanged')}
        <textarea
          required
          minLength={20}
          value={form.description}
          onChange={(event) => update('description', event.target.value)}
          placeholder={t('placeholderWhatChanged')}
          className="mt-1 min-h-24 w-full rounded-lg border border-white/10 bg-[#111827] p-3 text-white"
        />
      </label>
      <label className="mt-4 block text-sm font-semibold text-gray-200">
        {t('labelEvidenceUrl')}
        <div className="mt-1 flex gap-2">
          <input
            type="url"
            value={form.evidence_url}
            onChange={(event) => update('evidence_url', event.target.value)}
            placeholder={t('placeholderEvidenceUrl')}
            className="w-full rounded-lg border border-white/10 bg-[#111827] p-3 text-white"
          />
          <div className="grid w-12 place-items-center rounded-lg border border-white/10 bg-white/5">
            <Camera className="h-5 w-5 text-gray-300" />
          </div>
        </div>
      </label>
      <button
        disabled={submitting}
        className="mt-5 w-full rounded-lg bg-cyan-300 px-5 py-3 font-black text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t('btnUploading') : t('btnUpdateMeter')}
      </button>
    </form>
  );
}

function Leaderboard({ politicians, loading }) {
  const { t, translatePolitician } = useLanguage();
  const ranked = [...politicians].sort((a, b) => b.neta_score - a.neta_score);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-4xl font-black">{t('leaderboardTitle')}</h1>
      <p className="mt-2 text-gray-400">{t('leaderboardSubtitle')}</p>
      <div className="mt-7 space-y-3">
        {loading && <div className="rounded-lg border border-white/10 bg-white/5 p-5">{t('loadingScores')}</div>}
        {ranked.map((politician, index) => {
          const tp = translatePolitician(politician);
          return (
            <div
              key={politician.id}
              className="grid gap-4 rounded-lg border border-white/10 bg-white/5 p-4 md:grid-cols-[64px_1fr_180px] md:items-center"
            >
              <div className="text-3xl font-black text-gray-500">#{index + 1}</div>
              <div className="flex min-w-0 items-center gap-4">
                <img src={politician.image_url} alt={tp.name} className="h-14 w-14 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-lg font-black">{tp.name}</div>
                  <div className="text-sm text-gray-400">
                    {tp.party} | {tp.constituency}
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right">
                <div className="text-3xl font-black text-emerald-300">{politician.neta_score}/100</div>
                <div className="text-xs text-gray-500">
                  {politician.verified_reports_count}/{politician.reports_count} {t('reportsVerified')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function NetaBattle({ politicians }) {
  const { t, translatePolitician } = useLanguage();
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [battle, setBattle] = useState(null);
  const [activeRound, setActiveRound] = useState(-1);
  const [roundStage, setRoundStage] = useState('idle'); // 'idle' | 'intro' | 'clashing' | 'resolved'
  const [revealedRounds, setRevealedRounds] = useState(new Set());
  const [scoresRevealedRounds, setScoresRevealedRounds] = useState(new Set());
  const [fighting, setFighting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState('normal'); // 'relaxed' | 'normal' | 'fast'
  const [showWinnerCard, setShowWinnerCard] = useState(false);

  const timersRef = useRef([]);

  const clearAllTimers = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearAllTimers();
  }, []);

  const speedConfigs = {
    relaxed: {
      introDelay: 900,
      clashDelay: 1100,
      resolveDelay: 1500,
      stepDuration: 3500,
      label: t('pacingDramatic'),
    },
    normal: {
      introDelay: 600,
      clashDelay: 700,
      resolveDelay: 1200,
      stepDuration: 2500,
      label: t('pacingNormal'),
    },
    fast: {
      introDelay: 350,
      clashDelay: 400,
      resolveDelay: 650,
      stepDuration: 1400,
      label: t('pacingFast'),
    },
  };

  const toggleMute = () => {
    const nextMuted = battleAudio.toggleMute();
    setIsMuted(nextMuted);
    toast(nextMuted ? t('soundMutedToast') : t('soundEnabledToast'), {
      icon: nextMuted ? '🔇' : '🔔',
    });
  };

  const testBell = () => {
    battleAudio.playBoxingBell();
    toast.success(t('testSoundToast'), { icon: '🔔' });
  };

  const startBattle = async () => {
    if (!a || !b || a === b) {
      toast.error(t('chooseDiffNetasToast'));
      return;
    }

    clearAllTimers();
    setFighting(true);
    setShowWinnerCard(false);
    setActiveRound(-1);
    setRoundStage('idle');
    setRevealedRounds(new Set());
    setScoresRevealedRounds(new Set());

    try {
      // Ring opening gong immediately on click
      battleAudio.playBoxingBell();

      const data = await api(`/api/battle?ids=${a},${b}`);
      setBattle(data);

      const cfg = speedConfigs[speed];
      const startDelay = speed === 'fast' ? 700 : 1200;

      data.rounds.forEach((_, roundIndex) => {
        const roundStartTime = startDelay + roundIndex * cfg.stepDuration;

        // Stage 1: Round Intro (Bell strikes, round opens)
        const t1 = setTimeout(() => {
          setActiveRound(roundIndex);
          setRoundStage('intro');
          setRevealedRounds((prev) => new Set([...prev, roundIndex]));
          battleAudio.playRoundBell(roundIndex + 1);
        }, roundStartTime);

        // Stage 2: Clash / Hit (Punch impact sound, bars clash & animate)
        const t2 = setTimeout(() => {
          setRoundStage('clashing');
          battleAudio.playPunchImpact();
        }, roundStartTime + cfg.introDelay);

        // Stage 3: Resolve & Crown round winner (Chime, scores lock, commentary appears)
        const t3 = setTimeout(() => {
          setRoundStage('resolved');
          setScoresRevealedRounds((prev) => new Set([...prev, roundIndex]));
          battleAudio.playRoundWinnerChime();
        }, roundStartTime + cfg.introDelay + cfg.clashDelay);

        timersRef.current.push(t1, t2, t3);
      });

      // Final Victory Celebration
      const totalBattleTime = startDelay + data.rounds.length * cfg.stepDuration + 400;
      const finalTimer = setTimeout(() => {
        setFighting(false);
        setRoundStage('resolved');
        setShowWinnerCard(true);
        battleAudio.playVictoryFanfare();
      }, totalBattleTime);

      timersRef.current.push(finalTimer);
    } catch (error) {
      clearAllTimers();
      setFighting(false);
      toast.error(error.message);
    }
  };

  const skipBattle = () => {
    if (!battle) return;
    clearAllTimers();

    const allIndexes = new Set(battle.rounds.map((_, i) => i));
    setRevealedRounds(allIndexes);
    setScoresRevealedRounds(allIndexes);
    setActiveRound(battle.rounds.length - 1);
    setRoundStage('resolved');
    setShowWinnerCard(true);
    setFighting(false);
    battleAudio.playVictoryFanfare();
    toast.success(t('battleResolvedToast'));
  };

  const activeRoundData = battle?.rounds?.[activeRound];
  const activeWinnerId = scoresRevealedRounds.has(activeRound) ? activeRoundData?.winner_id : null;

  const winnerPolitician = battle?.winner_id
    ? translatePolitician(
        battle.winner_id === battle.politician_a?.id ? battle.politician_a : battle.politician_b
      )
    : null;

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[radial-gradient(circle_at_top,#b91c1c33,transparent_28%),linear-gradient(180deg,#111827,#050505)] px-4 py-8 md:px-6 md:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-xs md:text-sm font-bold text-red-200">
              <Bell className="h-4 w-4 text-red-400 animate-pulse" />
              <span>{t('battleAudioBanner')}</span>
            </div>
            <h1 className="text-3xl font-black md:text-5xl lg:text-6xl text-white tracking-tight">
              {t('battleTitle')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm md:text-base text-gray-300">
              {t('battleSubtitle')}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {/* Audio & Speed Controls Bar */}
            <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-bold text-gray-300">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5">
                <span className="text-gray-400">{t('pacingLabel')}</span>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  disabled={fighting}
                  className="bg-transparent text-white font-bold outline-none cursor-pointer"
                >
                  <option value="relaxed" className="bg-[#111827]">
                    {t('pacingDramatic')}
                  </option>
                  <option value="normal" className="bg-[#111827]">
                    {t('pacingNormal')}
                  </option>
                  <option value="fast" className="bg-[#111827]">
                    {t('pacingFast')}
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={testBell}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition"
                title={t('testSound')}
              >
                <Bell className="h-3.5 w-3.5 text-yellow-400" />
                <span>{t('testSound')}</span>
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition ${
                  isMuted
                    ? 'border-red-500/40 bg-red-500/20 text-red-300'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
                title={isMuted ? t('soundMuted') : t('soundOn')}
              >
                {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-cyan-400" />}
                <span>{isMuted ? t('soundMuted') : t('soundOn')}</span>
              </button>
            </div>

            {/* Selection & Fight Trigger */}
            <div className="grid w-full gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <BattleSelect
                value={a}
                onChange={setA}
                politicians={politicians}
                label={t('cornerABlue')}
                disabled={fighting}
              />
              <BattleSelect
                value={b}
                onChange={setB}
                politicians={politicians}
                label={t('cornerBRed')}
                disabled={fighting}
              />
              <div className="flex items-end gap-2">
                <button
                  onClick={startBattle}
                  disabled={fighting}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-black text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 active:scale-95 disabled:opacity-60"
                >
                  <Swords className="h-5 w-5" />
                  <span>{fighting ? t('inBattle') : t('ringBell')}</span>
                </button>
                {fighting && (
                  <button
                    onClick={skipBattle}
                    className="flex items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 py-3 text-white hover:bg-white/20 transition"
                    title={t('skipBattle')}
                  >
                    <FastForward className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* The Arena Ring */}
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 p-4 md:p-6 shadow-2xl backdrop-blur-sm">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-red-600/40 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 bg-gradient-to-b from-transparent via-red-600/40 to-transparent" />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_1.3fr_1fr]">
            {/* Fighter A Corner */}
            <FighterPanel
              fighter={battle?.politician_a}
              corner="blue"
              isChampion={showWinnerCard && battle?.winner_id === battle?.politician_a?.id}
              activeRoundWinner={activeWinnerId === battle?.politician_a?.id}
            />

            {/* Center Match & Round Arena */}
            <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#111827]/95 p-4 md:p-5 shadow-inner">
              <div>
                <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Swords className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs font-black uppercase tracking-[0.25em] text-yellow-200">
                      {t('matchScorecard')}
                    </span>
                  </div>
                  {fighting && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 border border-red-500/40 px-2.5 py-0.5 text-xs font-bold text-red-300 animate-pulse">
                      <Zap className="h-3 w-3 text-yellow-400" />
                      {t('roundXof5', { round: activeRound + 1 })}
                    </span>
                  )}
                  {showWinnerCard && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 px-2.5 py-0.5 text-xs font-bold text-yellow-300">
                      <Trophy className="h-3 w-3" />
                      {t('showdownFinalized')}
                    </span>
                  )}
                </div>

                {!battle && (
                  <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-white/15 p-6 text-center text-gray-400">
                    <div>
                      <Swords className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                      <p className="font-bold text-gray-300">{t('arenaPrompt')}</p>
                      <p className="mt-1 text-xs text-gray-500">{t('arenaPromptSub')}</p>
                    </div>
                  </div>
                )}

                {battle && (
                  <div className="space-y-3">
                    {battle.rounds.map((round, index) => (
                      <BattleRoundCard
                        key={round.name}
                        round={round}
                        roundIndex={index}
                        active={index === activeRound}
                        revealed={revealedRounds.has(index)}
                        scoresRevealed={scoresRevealedRounds.has(index)}
                        stage={roundStage}
                        politicianA={battle.politician_a}
                        politicianB={battle.politician_b}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Match Winner Announcement Card */}
              {showWinnerCard && battle && (
                <div className="mt-5 overflow-hidden rounded-xl border-2 border-yellow-400 bg-gradient-to-r from-yellow-500/20 via-amber-400/25 to-yellow-500/20 p-5 text-center text-white shadow-2xl shadow-yellow-500/30">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-black shadow-lg">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <div className="text-xs font-black uppercase tracking-[0.3em] text-yellow-300">
                    {t('matchChampion')}
                  </div>
                  <div className="mt-1 text-3xl font-black tracking-tight text-white md:text-4xl drop-shadow">
                    {winnerPolitician ? winnerPolitician.name : battle.winner}
                  </div>
                  <div className="mt-1 text-sm font-extrabold text-yellow-200">
                    {t('finalNetaScore', { score: battle.final_score })}
                  </div>
                  <p className="mt-2 text-xs text-gray-300">
                    {battle.winner_id
                      ? t('victoryDesc', {
                          winner: winnerPolitician ? winnerPolitician.name : battle.winner,
                        })
                      : t('drawDesc')}
                  </p>
                </div>
              )}
            </div>

            {/* Fighter B Corner */}
            <FighterPanel
              fighter={battle?.politician_b}
              corner="red"
              isChampion={showWinnerCard && battle?.winner_id === battle?.politician_b?.id}
              activeRoundWinner={activeWinnerId === battle?.politician_b?.id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function BattleSelect({ value, onChange, politicians, label, disabled }) {
  const { t, translatePolitician } = useLanguage();
  return (
    <label className="text-xs md:text-sm font-bold text-gray-200">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="mt-1 w-full rounded-lg border border-white/10 bg-[#111827] p-2.5 md:p-3 text-white disabled:opacity-60 focus:border-red-500 outline-none"
      >
        <option value="">{t('chooseNeta')}</option>
        {politicians.map((politician) => {
          const tp = translatePolitician(politician);
          return (
            <option key={politician.id} value={politician.id}>
              {tp.name} ({tp.party})
            </option>
          );
        })}
      </select>
    </label>
  );
}

function FighterPanel({ fighter, corner, isChampion, activeRoundWinner }) {
  const { t, translatePolitician } = useLanguage();
  const isBlue = corner === 'blue';
  const color = isBlue
    ? 'from-cyan-500/20 via-blue-950/40 to-black/70'
    : 'from-rose-500/20 via-red-950/40 to-black/70';

  const borderColor = isChampion
    ? 'border-yellow-400 shadow-2xl shadow-yellow-500/40 ring-2 ring-yellow-400'
    : activeRoundWinner
    ? 'border-emerald-400 shadow-xl shadow-emerald-500/30 ring-1 ring-emerald-400/60'
    : 'border-white/10';

  const tp = fighter ? translatePolitician(fighter) : null;
  const cornerLabel = isBlue ? t('blueCorner') : t('redCorner');

  return (
    <div
      className={`relative min-h-96 rounded-xl border bg-gradient-to-b ${color} ${borderColor} p-5 text-center shadow-xl transition-all duration-500`}
    >
      {isChampion && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-yellow-400 px-3.5 py-1 text-xs font-black text-black shadow-lg">
          <Trophy className="h-3.5 w-3.5" />
          <span>{t('championBadge')}</span>
        </div>
      )}

      {tp ? (
        <>
          <div className="relative mx-auto mt-2 h-32 w-32 md:h-36 md:w-36">
            <img
              src={tp.image_url}
              alt={tp.name}
              className={`h-full w-full rounded-full border-4 object-cover shadow-2xl transition-transform duration-300 ${
                isChampion ? 'border-yellow-400 scale-105' : 'border-white/20'
              }`}
            />
            <span
              className={`absolute bottom-0 right-0 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase text-white shadow ${
                isBlue ? 'bg-cyan-600' : 'bg-red-600'
              }`}
            >
              {cornerLabel}
            </span>
          </div>

          <h2 className="mt-4 text-xl md:text-2xl font-black text-white">{tp.name}</h2>
          <p className="text-xs md:text-sm font-semibold text-gray-300">
            {tp.party} <span className="text-gray-500">|</span> {tp.constituency}
          </p>

          <div className="mt-5 rounded-lg border border-white/5 bg-black/40 py-3">
            <div className="text-4xl md:text-5xl font-black text-white">{tp.neta_score}</div>
            <p className="mt-1 text-[11px] uppercase tracking-[0.25em] text-gray-400">{t('netaScore')}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <MiniStat label={t('statReports')} value={tp.reports_count} />
            <MiniStat label={t('statVerified')} value={tp.verified_reports_count} />
          </div>
        </>
      ) : (
        <div className="grid h-full min-h-80 place-items-center font-bold text-gray-500">
          {t('waitingCorner', { corner: cornerLabel })}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/35 p-2.5">
      <div className="text-lg md:text-xl font-black text-white">{value}</div>
      <div className="text-[11px] text-gray-400 font-semibold">{label}</div>
    </div>
  );
}

function BattleRoundCard({
  round,
  roundIndex,
  active,
  revealed,
  scoresRevealed,
  stage,
  politicianA,
  politicianB,
}) {
  const { t, translatePolitician, translateRoundName, translateRoundMetric, getCommentary } = useLanguage();

  const tpA = translatePolitician(politicianA);
  const tpB = translatePolitician(politicianB);

  const winner =
    round.winner_id === politicianA.id
      ? tpA.name
      : round.winner_id === politicianB.id
      ? tpB.name
      : t('battleDraw');

  const isWinnerA = scoresRevealed && round.winner_id === politicianA.id;
  const isWinnerB = scoresRevealed && round.winner_id === politicianB.id;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border p-3.5 transition-all duration-500 ${
        active
          ? 'scale-[1.01] border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-500/20 ring-1 ring-yellow-400/40'
          : revealed
          ? 'border-white/15 bg-white/5'
          : 'border-white/5 bg-white/[0.02] opacity-35'
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-[11px] font-black uppercase tracking-wider ${
              active
                ? 'bg-yellow-400 text-black animate-pulse'
                : revealed
                ? 'bg-white/10 text-gray-300'
                : 'bg-white/5 text-gray-500'
            }`}
          >
            {translateRoundName(round.name)}
          </span>
          <span className="text-sm font-bold text-white">{translateRoundMetric(round.metric)}</span>
        </div>

        <div className="text-right">
          {scoresRevealed ? (
            <span
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-black ${
                round.winner_id
                  ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                  : 'bg-gray-700/50 text-gray-300 border border-gray-600/30'
              }`}
            >
              {round.winner_id && <Trophy className="h-3 w-3 text-yellow-400" />}
              {winner}
            </span>
          ) : active ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-300 animate-pulse">
              <Flame className="h-3.5 w-3.5 text-red-500 animate-bounce" />
              {stage === 'intro' ? t('battleReady') : t('battleClashing')}
            </span>
          ) : (
            <span className="text-xs font-semibold text-gray-500">{t('battleUpcoming')}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 text-sm">
        <ScoreBar
          value={round.politician_a_score}
          align="right"
          revealed={scoresRevealed || (active && stage === 'clashing')}
          isWinner={isWinnerA}
          corner="blue"
        />
        <div className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-black text-gray-400">
          VS
        </div>
        <ScoreBar
          value={round.politician_b_score}
          align="left"
          revealed={scoresRevealed || (active && stage === 'clashing')}
          isWinner={isWinnerB}
          corner="red"
        />
      </div>

      {scoresRevealed && round.commentary && (
        <p className="mt-2.5 rounded border border-white/5 bg-black/40 px-2.5 py-1.5 text-xs text-gray-300">
          {getCommentary(round.commentary)}
        </p>
      )}
    </div>
  );
}

function ScoreBar({ value, align = 'left', revealed, isWinner, corner }) {
  const barColor = isWinner
    ? 'bg-gradient-to-r from-yellow-400 to-amber-300 shadow-sm shadow-yellow-400/50'
    : corner === 'blue'
    ? 'bg-gradient-to-r from-cyan-400 to-blue-500'
    : 'bg-gradient-to-r from-rose-400 to-red-500';

  return (
    <div className={`flex items-center gap-2 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: revealed ? `${value}%` : '0%' }}
        />
      </div>
      <span
        className={`w-10 font-mono font-black text-xs md:text-sm ${
          isWinner ? 'text-yellow-300' : 'text-gray-200'
        }`}
      >
        {revealed ? value : '--'}
      </span>
    </div>
  );
}

export default App;
