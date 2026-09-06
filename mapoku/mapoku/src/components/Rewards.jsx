import { useCallback, useEffect, useState } from 'react';
import { fetchRewards, redeemReward } from '../api/rewards';

function TransitIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={`${className} text-[#346F4B]`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 7h8m-8 4h8m-9 4h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v7a2 2 0 002 2zm0 0l-1 3m11-3l1 3" />
    </svg>
  );
}

function CoinMark({ className = 'text-lg' }) {
  return <span className={className} aria-hidden>🪙</span>;
}

function SkeletonBlock({ className = '' }) {
  return <div className={`animate-pulse-soft rounded-2xl bg-[#E7EFE9]/80 ${className}`} />;
}

function Rewards({ onPointsChange }) {
  const [points, setPoints] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState('confirm');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState('');

  const applyPoints = useCallback((value) => {
    setPoints(value);
    if (typeof onPointsChange === 'function') onPointsChange(value);
  }, [onPointsChange]);

  const loadRewards = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await fetchRewards();
      applyPoints(data.points);
      setRewards(data.items);
    } catch (err) {
      setLoadError(err.message || 'Failed to load rewards.');
    } finally {
      setLoading(false);
    }
  }, [applyPoints]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  useEffect(() => {
    if (!selected) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selected]);

  const openModal = (reward) => {
    if (points < reward.cost) return;
    setSelected(reward);
    setStep('confirm');
    setCopied(false);
    setRedeemError('');
    setCode('');
  };

  const confirmRedeem = async () => {
    if (!selected || redeeming) return;
    setRedeeming(true);
    setRedeemError('');
    try {
      const result = await redeemReward(selected.id);
      if (typeof result.pointsBalance === 'number') {
        applyPoints(result.pointsBalance);
      } else {
        applyPoints(Math.max(0, points - selected.cost));
      }
      setCode(result.voucherCode || `MAPOKU-${String(selected.id).slice(0, 8).toUpperCase()}`);
      setStep('success');
    } catch (err) {
      setRedeemError(err.message || 'Redemption failed.');
    } finally {
      setRedeeming(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setStep('confirm');
    setCode('');
    setCopied(false);
    setRedeemError('');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:gap-8">
      <div className="animate-fade-up min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#346F4B] sm:text-xs">
          Your rewards
        </p>
        <h1 className="font-display mt-1 text-[1.65rem] font-bold leading-tight tracking-tight text-[#1E2B22] sm:text-4xl">
          Your points. Redeem for transit.
        </h1>
      </div>

      {loadError && (
        <div className="animate-fade-up rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-700">
          <p className="font-semibold">Could not load rewards</p>
          <p className="mt-1 break-words opacity-90">{loadError}</p>
          <button
            type="button"
            onClick={loadRewards}
            className="touch-target mt-2 inline-flex items-center text-xs font-bold text-[#346F4B] underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      <div className="animate-fade-up relative overflow-hidden rounded-2xl bg-[#1E2B22] p-5 text-white sm:rounded-[1.5rem] sm:p-8">
        <div className="surface-noise absolute inset-0 opacity-40" />
        <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-[#346F4B]/35 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
          <div className="min-w-0">
            <span className="text-xs font-medium tracking-wide text-white/65">Points balance</span>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-display text-4xl font-bold tracking-tight tabular-nums sm:text-6xl">
                {loading ? '—' : points}
              </span>
              <CoinMark className="mb-1.5 text-xl opacity-90 sm:mb-2 sm:text-2xl" />
            </div>
            <p className="mt-2 text-xs text-white/65 sm:text-sm">
              {loading ? 'Loading your balance…' : 'Spend points on partner transit credit'}
            </p>
          </div>

          <div className="w-full max-w-none rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10 backdrop-blur-sm sm:max-w-xs">
            <p className="text-sm font-semibold text-white">How redeem works</p>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Pick a reward you can afford, confirm, then show the voucher code to claim transit
              credit from partners.
            </p>
          </div>
        </div>
      </div>

      <section className="animate-fade-up-delay flex min-w-0 flex-col gap-3 sm:gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-[#1E2B22] sm:text-xl">
            Redeem for transit credit
          </h2>
          <p className="mt-0.5 text-sm text-[#1E2B22]/55">Tap a reward you can afford</p>
        </div>

        {loading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonBlock className="h-[5.5rem]" />
            <SkeletonBlock className="h-[5.5rem]" />
            <SkeletonBlock className="h-[5.5rem]" />
          </div>
        )}

        {!loading && rewards.length === 0 && !loadError && (
          <p className="rounded-2xl bg-[#F2F0E9] px-4 py-6 text-center text-sm text-[#1E2B22]/55">
            No rewards available right now.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rewards.map((r, index) => {
            const canRedeem = points >= r.cost;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => openModal(r)}
                disabled={!canRedeem}
                style={{ animationDelay: `${0.05 * index}s` }}
                className={`animate-fade-up-delay-2 group flex min-h-[4.5rem] items-center justify-between gap-3 rounded-2xl p-3.5 text-left ring-1 transition duration-200 ${
                  canRedeem
                    ? 'bg-white ring-[#1E2B22]/8 active:scale-[0.99] hover:ring-[#346F4B]/45 hover:shadow-[0_14px_30px_-18px_rgba(30,43,34,0.45)] sm:hover:-translate-y-0.5'
                    : 'cursor-not-allowed bg-[#F2F0E9]/70 opacity-70 ring-transparent'
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E7EFE9]">
                    <TransitIcon />
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#1E2B22]">{r.label}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#1E2B22]/50">
                      {r.partnerLabel || `${r.brand} · simulated partner`}
                    </span>
                  </div>
                </div>

                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-2.5 text-xs font-bold tabular-nums ${
                    canRedeem ? 'bg-[#346F4B] text-white' : 'bg-white/70 text-[#1E2B22]/35'
                  }`}
                >
                  {r.cost} <CoinMark className="text-sm" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selected && (
        <div
          className="animate-backdrop-in fixed inset-0 z-[1000] flex items-end justify-center bg-[#1E2B22]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onClick={closeModal}
        >
          <div
            className="animate-sheet-in sm:animate-modal-in safe-pb relative max-h-[92dvh] w-full max-w-lg overflow-y-auto overscroll-contain rounded-t-[1.5rem] bg-[#FBFAF7] p-5 shadow-[0_30px_60px_-20px_rgba(30,43,34,0.55)] ring-1 ring-[#1E2B22]/10 sm:max-h-[90dvh] sm:max-w-sm sm:rounded-[1.5rem] sm:p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#1E2B22]/15 sm:hidden" aria-hidden />
            <div className="absolute inset-x-0 top-0 hidden h-1 bg-gradient-to-r from-[#346F4B] via-[#4a8a61] to-[#1E2B22] sm:block" />

            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-[#F2F0E9] text-[#1E2B22]/70 transition hover:bg-[#E7EFE9] sm:right-4 sm:top-4 sm:h-8 sm:w-8"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {step === 'confirm' ? (
              <>
                <div className="flex flex-col items-center gap-3 pt-2 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E7EFE9]">
                    <TransitIcon className="h-7 w-7" />
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#1E2B22]">Redeem this reward?</h2>
                  <p className="px-2 text-sm text-[#1E2B22]/60">
                    <span className="font-semibold text-[#1E2B22]">{selected.label}</span>
                    <br />
                    {selected.partnerLabel || `${selected.brand} · simulated partner`}
                  </p>
                </div>

                <div className="my-5 space-y-2.5 rounded-2xl bg-white p-4 ring-1 ring-[#1E2B22]/6">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-[#1E2B22]/50">Cost</span>
                    <span className="font-bold tabular-nums text-[#1E2B22]">{selected.cost} 🪙</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-[#1E2B22]/50">Your balance</span>
                    <span className="font-bold tabular-nums text-[#1E2B22]">{points} 🪙</span>
                  </div>
                  <div className="border-t border-[#1E2B22]/8 pt-2.5">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="text-[#1E2B22]/50">Balance after</span>
                      <span className="font-bold tabular-nums text-[#346F4B]">{points - selected.cost} 🪙</span>
                    </div>
                  </div>
                </div>

                {redeemError && (
                  <p className="mb-3 break-words text-center text-sm text-red-600">{redeemError}</p>
                )}

                <button
                  type="button"
                  onClick={confirmRedeem}
                  disabled={redeeming}
                  className="min-h-12 w-full rounded-xl bg-[#346F4B] py-3.5 text-sm font-bold text-white transition hover:bg-[#2A593C] disabled:opacity-60"
                >
                  {redeeming ? 'Redeeming…' : 'Confirm redemption'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={redeeming}
                  className="mt-1 min-h-11 w-full py-3 text-sm font-medium text-[#1E2B22]/50 transition hover:text-[#1E2B22]"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3 pt-2 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-[#E7EFE9]">
                    <svg className="h-8 w-8 text-[#346F4B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="font-display text-xl font-bold text-[#1E2B22]">Redeemed!</h2>
                  <p className="px-2 text-sm text-[#1E2B22]/60">
                    Your <span className="font-semibold text-[#1E2B22]">{selected.label}</span> is ready.
                    Show this code to claim it.
                  </p>
                </div>

                <div className="my-5 flex flex-col items-stretch gap-3 rounded-2xl border-2 border-dashed border-[#346F4B]/50 bg-white px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                  <span className="break-all text-center font-mono text-sm font-bold tracking-wider text-[#1E2B22] sm:text-left sm:text-base">
                    {code}
                  </span>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="min-h-11 shrink-0 rounded-full bg-[#E7EFE9] px-4 py-2 text-xs font-bold text-[#346F4B] transition hover:bg-[#dce8df]"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-12 w-full rounded-xl bg-[#346F4B] py-3.5 text-sm font-bold text-white transition hover:bg-[#2A593C]"
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Rewards;
