"use client";

import { useState, useEffect } from "react";

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 기본 배율 100% (16px)
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    // Tailwind의 기준이 되는 최상위 html 태그의 폰트 사이즈를 동적으로 변경
    document.documentElement.style.fontSize = `${(zoomLevel / 100) * 16}px`;

    // 수강생 화면을 벗어나면 다시 원래 크기(16px)로 원상복구
    return () => {
      document.documentElement.style.fontSize = "16px";
    };
  }, [zoomLevel]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160)); // 최대 160%
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70));  // 최소 70%

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* 💡 화면 하단으로 이동된 확대/축소 플로팅 컨트롤러 */}
      <div className="fixed bottom-8 right-6 z-[9999] flex items-center gap-1 bg-white px-3 py-2 rounded-full shadow-2xl border border-slate-200">
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 70}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors text-slate-700 font-bold"
          aria-label="화면 축소"
        >
          <span className="text-sm">가-</span>
        </button>
        
        <div className="w-[1px] h-5 bg-slate-300 mx-1"></div>
        <div className="w-14 text-center text-sm font-black text-slate-500">
          {zoomLevel}%
        </div>
        <div className="w-[1px] h-5 bg-slate-300 mx-1"></div>
        
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 160}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors text-slate-700 font-black"
          aria-label="화면 확대"
        >
          <span className="text-lg">가+</span>
        </button>
      </div>

      {children}
    </div>
  );
}