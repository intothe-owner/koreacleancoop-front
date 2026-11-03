"use client"; // 💡 클라이언트 컴포넌트 선언

import { usePathname } from "next/navigation";
import Link from "next/link"; // Next.js에서는 a 태그 대신 Link 사용 권장
import { SUPPORT_TABS } from "@/lib/supportMenus";



export default function SupportPage({ children }: { children?: React.ReactNode }) {
  const pathname = usePathname(); // 현재 경로를 가져와서 어떤 탭이 활성화되었는지 확인

  return (
    <div className="w-full flex flex-col">
      {/* 1. 헤더 영역 (배경 이미지) */}
      <div 
        className="relative w-full h-[400px] flex items-center justify-center bg-cover bg-center" 
        style={{ backgroundImage: `url(/images/support.png)` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mt-30">
          고객 지원
        </h1>
      </div>

      {/* 2. 탭 메뉴 영역 (기존 TabMenu 컴포넌트의 디자인 동일 적용) */}
      <div className="w-full bg-white border-b border-slate-200 mt-6 pb-2">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap gap-2 justify-center">
          {SUPPORT_TABS.map((tab, index) => {
            // 💡 현재 URL과 탭의 URL이 일치하거나, 메인(/support)으로 접속 시 첫 번째 탭 활성화
            const isActive = pathname === tab.url || (pathname === '/support' && index === 0);

            return (
              <Link
                key={tab.name}
                href={tab.url}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. 본문 영역 */}
      <div className="w-full mt-8">
        {/* Next.js App Router의 Layout을 사용 중이라면 {children}으로 렌더링되도록 하거나, 
            단일 페이지 안에서 State로 전환한다면 여기에 본문 컴포넌트를 넣으면 됩니다. */}
        {children}
      </div>
    </div>
  );
}