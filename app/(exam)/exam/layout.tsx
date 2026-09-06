"use client";

import { useState, useEffect, useRef } from "react";
import { GripVertical } from "lucide-react"; // 💡 드래그 손잡이 아이콘 추가

export default function ExamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 기본 배율 100% (16px)
  const [zoomLevel, setZoomLevel] = useState(100);

  // 💡 드래그 관련 상태 (x, y 좌표)
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // 드래그 시작 시점의 마우스/터치 위치와 요소의 기존 위치를 기억할 Ref
  const dragInfo = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    document.documentElement.style.fontSize = `${(zoomLevel / 100) * 16}px`;
    return () => {
      document.documentElement.style.fontSize = "16px";
    };
  }, [zoomLevel]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70));

  // 💡 마우스/터치 누를 때 (드래그 시작)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 포인터가 손잡이를 벗어나도 드래그가 끊기지 않도록 캡처
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragInfo.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  // 💡 마우스/터치 움직일 때 (이동)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    setPosition({
      x: dragInfo.current.initialX + dx,
      y: dragInfo.current.initialY + dy,
    });
  };

  // 💡 마우스/터치 뗄 때 (드래그 종료)
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="relative min-h-screen bg-slate-50">
      
      {/* 화면 확대/축소 플로팅 컨트롤러 */}
      <div 
        className={`fixed z-[9999] flex items-center gap-1 bg-white px-3 py-2 rounded-full border border-slate-200 transition-all ${isDragging ? 'shadow-indigo-500/20 shadow-2xl scale-105' : 'shadow-2xl'}`}
        style={{ 
          bottom: "2rem", 
          right: "1.5rem",
          transform: `translate(${position.x}px, ${position.y}px)`,
          // 드래그 중에는 CSS 애니메이션을 꺼서 마우스(손가락)를 즉각적으로 따라가게 함
          transition: isDragging ? "none" : "transform 0.1s ease-out, box-shadow 0.2s, transform 0.2s", 
        }}
      >
        
        {/* 💡 드래그 손잡이 영역 (모바일 스크롤 방지를 위해 touch-none 적용) */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="cursor-grab active:cursor-grabbing p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 touch-none flex items-center justify-center"
          aria-label="위치 이동"
        >
          <GripVertical size={20} />
        </div>

        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 70}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-30 transition-colors text-slate-700 font-bold"
          aria-label="화면 축소"
        >
          <span className="text-sm">가-</span>
        </button>
        
        <div className="w-[1px] h-5 bg-slate-300 mx-1"></div>
        <div className="w-14 text-center text-sm font-black text-slate-500 select-none">
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