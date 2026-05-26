import dayjs from "dayjs";

interface HeaderProps {
  lastUpdated: string | null;
}

export default function Header({ lastUpdated }: HeaderProps) {
  const formatDate = (dateStr: string) => dayjs(dateStr).format("YYYY.MM.DD HH:mm:ss");
  const formatDateShort = (dateStr: string) => dayjs(dateStr).format("MM.DD HH:mm");

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            {/* 로고 */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-semibold text-zinc-100 tracking-tight">
                나무위키 실시간 검색어
              </h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5 hidden xs:block">
                실시간 트렌딩 키워드와 검색 사유를 확인하세요
              </p>
            </div>
          </div>

          {/* 업데이트 시간 */}
          {lastUpdated && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-500 text-xs sm:text-sm">
                <span className="hidden sm:inline">업데이트 </span>
                <span className="text-zinc-300 mono hidden sm:inline">{formatDate(lastUpdated)}</span>
                <span className="text-zinc-300 mono sm:hidden">{formatDateShort(lastUpdated)}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
