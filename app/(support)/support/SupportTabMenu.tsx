// src/app/(main)/boards/[id]/SupportTabMenu.tsx (경로는 편하신 곳에)
"use client"; // 💡 여기만 클라이언트 컴포넌트로 선언

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SUPPORT_TABS } from '@/lib/supportMenus'; // 기존 탭 데이터 임포트

export default function SupportTabMenu() {
  const pathname = usePathname();

  return (
    <div className="w-full bg-white border-b border-slate-200 mt-6 pb-2">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap gap-2 justify-center">
        {SUPPORT_TABS.map((tab, index) => {
          // 💡 usePathname을 사용해 현재 URL 확인
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
  );
}