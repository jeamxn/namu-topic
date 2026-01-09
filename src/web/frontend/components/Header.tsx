import dayjs from "dayjs";
import { useState } from "react";
import PdfDownloadButton from "./PdfDownloadButton";

interface HeaderProps {
  lastUpdated: string | null;
}

export default function Header({ lastUpdated }: HeaderProps) {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const formatDate = (dateStr: string) => dayjs(dateStr).format("YYYY.MM.DD HH:mm:ss");
  const formatDateShort = (dateStr: string) => dayjs(dateStr).format("MM.DD HH:mm");

  return (
    <header className="border-b border-slate-800/50 backdrop-blur-sm bg-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* 로고/아이콘 */}
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
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
              <h1 className="text-lg sm:text-2xl font-bold bg-linear-to-r from-white to-slate-300 bg-clip-text text-transparent">
                나무위키 실시간 검색어
              </h1>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 hidden xs:block">
                실시간 트렌딩 키워드와 검색 사유를 확인하세요
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* PDF 다운로드 버튼 */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all text-slate-300 hover:text-white text-xs sm:text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="hidden sm:inline">PDF 리포트</span>
              </button>

              {/* 다운로드 메뉴 */}
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-3 space-y-2">
                  <div className="text-xs text-slate-400 mb-2 pb-2 border-b border-slate-700">
                    리포트 기간 선택
                  </div>
                  <PdfDownloadButton period="daily" />
                  <PdfDownloadButton period="weekly" />
                  <button
                    onClick={() => setShowDownloadMenu(false)}
                    className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 mt-2">
                    닫기
                  </button>
                </div>
              )}
            </div>

            {/* 업데이트 시간 */}
            {lastUpdated && (
              <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
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
      </div>
    </header>
  );
}
