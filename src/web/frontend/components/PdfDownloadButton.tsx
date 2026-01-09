import type React from "react";
import { useState } from "react";

interface PdfDownloadButtonProps {
  period: "daily" | "weekly";
  date?: Date;
}

export default function PdfDownloadButton({ period, date }: PdfDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        period,
        ...(date && { date: date.toISOString() }),
      });

      const response = await fetch(`/api/report/pdf?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "PDF 다운로드에 실패했습니다.");
      }

      // PDF 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `namu-trending-report-${period}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF 다운로드에 실패했습니다.");
      console.error("PDF download error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`
          flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
          transition-all duration-200 ease-out
          ${
            isDownloading
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-linear-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25"
          }
        `}>
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {isDownloading ? "PDF 생성 중..." : `${period === "daily" ? "일간" : "주간"} 리포트 다운로드`}
      </button>

      {error && (
        <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}
    </div>
  );
}
