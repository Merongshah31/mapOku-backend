function Header({ points, signedIn, onSignOut }) {
  const badge =
    typeof points === 'number' && !Number.isNaN(points) ? points : '—';

  return (
    <header className="safe-pt sticky top-0 z-50 border-b border-[#346F4B]/10 bg-[#FBFAF7]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2.5 sm:px-6 sm:py-3">
        <div className="group flex min-h-11 min-w-0 max-w-[46%] items-center gap-2 text-left sm:max-w-none sm:gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#1E2B22] text-sm font-bold text-[#E7EFE9] shadow-sm sm:h-9 sm:w-9">
            mO
          </span>
          <span className="min-w-0">
            <span className="font-display block truncate text-lg font-bold tracking-tight text-[#1E2B22] sm:text-2xl">
              mapOku
            </span>
            <span className="hidden text-[11px] font-medium tracking-wide text-[#346F4B]/80 sm:block">
              rewards
            </span>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div
            className="relative flex min-h-11 items-center gap-1.5 rounded-full bg-[#E7EFE9] px-3 py-2 text-[#1E2B22] ring-1 ring-[#346F4B]/15 sm:min-h-9 sm:px-2.5 sm:py-1.5"
            aria-label="Rewards points"
          >
            <span aria-hidden className="text-base leading-none">🪙</span>
            <span className="min-w-[1.25rem] text-center text-xs font-bold tabular-nums">
              {badge}
            </span>
          </div>

          {signedIn && (
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-11 rounded-full bg-[#1E2B22] px-3.5 text-xs font-semibold text-white transition hover:bg-[#2A593C] sm:min-h-9 sm:px-4"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
