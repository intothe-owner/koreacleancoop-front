// src/app/(mypage)/mypage/layout.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Building2, 
  Wind, 
  Bug, 
  Shield, 
  LayoutDashboard, 
  UserCircle,
  LogOut
} from "lucide-react";

// 💡 좌측 사이드바 메뉴 정의
const MYPAGE_MENUS = [
  { id: "ALL", name: "전체 견적 요약", path: "/mypage", icon: <LayoutDashboard size={20} /> },
  { id: "BUILDING", name: "건물위생관리", path: "/mypage/BUILDING", icon: <Building2 size={20} /> },
  { id: "AIRCON", name: "냉난방기종합세척", path: "/mypage/AIRCON", icon: <Wind size={20} /> },
  { id: "PEST", name: "소독방역", path: "/mypage/PEST", icon: <Bug size={20} /> },
  { id: "PUBLIC", name: "공공시설청소", path: "/mypage/PUBLIC", icon: <Shield size={20} /> },
];

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // 클라이언트 렌더링(Hydration) 완료 후 로컬스토리지에서 유저 정보 로드
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      alert("로그인이 필요한 서비스입니다.");
      router.push("/login");
      return;
    }

    try {
      setUserData(JSON.parse(userStr));
    } catch (e) {
      console.error("유저 정보 파싱 오류");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  // 마운트 전에는 깜빡임 방지를 위해 빈 화면(또는 로딩바) 반환
  if (!mounted) return <div className="min-h-screen bg-slate-50 dark:bg-slate-900" />;

  // 💡 레벨에 따른 권한 분기 (1: 일반 고객, 2 이상: 파트너 업체)
  const isPartner = userData?.level >= 2;
  const userBadgeName = isPartner ? "파트너 업체" : "일반 고객";
  const userTitle = isPartner ? "매칭된 견적 관리" : "나의 견적 내역";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col md:flex-row gap-8">
        
        {/* ======================================= */}
        {/* 좌측 사이드바 (프로필 + 메뉴) */}
        {/* ======================================= */}
        <aside className="w-full md:w-72 flex-shrink-0 flex flex-col gap-6">
          
          {/* 1. 프로필 카드 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center">
                <UserCircle size={32} />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                  {userData?.name}님
                </h3>
                {/* 레벨에 따라 뱃지 색상 변경 */}
                <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-md mt-1 ${
                  isPartner 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' 
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {userBadgeName}
                </span>
              </div>
            </div>
            
            {/* 업체일 경우 기업명이나 추가 정보 표시 */}
            {isPartner && userData?.companyName && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                <span className="font-bold">소속:</span> {userData.companyName}
              </div>
            )}

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <LogOut size={16} /> 로그아웃
            </button>
          </div>

          {/* 2. 네비게이션 메뉴 */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
            <h4 className="px-4 mb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
              {userTitle}
            </h4>
            <nav className="flex flex-col gap-1">
              {MYPAGE_MENUS.map((menu) => {
                // 현재 URL 경로와 메뉴 path 비교하여 활성화 상태(active) 결정
                const isActive = pathname === menu.path || (menu.path !== '/mypage' && pathname.startsWith(menu.path));
                
                return (
                  <Link 
                    key={menu.id} 
                    href={menu.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      isActive 
                        ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300" 
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <span className={isActive ? "text-indigo-600 dark:text-indigo-400" : "opacity-70"}>
                      {menu.icon}
                    </span>
                    {menu.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* ======================================= */}
        {/* 우측 메인 콘텐츠 영역 (목록, 상세 화면이 렌더링될 곳) */}
        {/* ======================================= */}
        <main className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 min-h-[600px]">
          {children}
        </main>
        
      </div>
    </div>
  );
}