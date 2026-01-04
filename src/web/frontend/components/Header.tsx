import dayjs from "dayjs";

interface HeaderProps {
  lastUpdated: string | null;
}

export default function Header({ lastUpdated }: HeaderProps) {
  const formatDate = (dateStr: string) => dayjs(dateStr).format("YYYY.MM.DD HH:mm:ss");
  const formatDateShort = (dateStr: string) => dayjs(dateStr).format("MM.DD HH:mm");

  return (
    <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* 로고/아이콘 */}
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              {/* 라이브 인디케이터 */}
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                나무위키 실시간 검색어
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 hidden xs:block">
                실시간 트렌딩 키워드와 검색 사유를 확인하세요
              </p>
            </div>
          </div>

          {/* 업데이트 시간 */}
          {lastUpdated && (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 self-start sm:self-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-400 text-xs sm:text-sm">
                <span className="hidden sm:inline">마지막 업데이트: </span>
                <span className="text-slate-300 mono hidden sm:inline">{formatDate(lastUpdated)}</span>
                <span className="text-slate-300 mono sm:hidden">{formatDateShort(lastUpdated)}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
