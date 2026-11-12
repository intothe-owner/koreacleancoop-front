// src/app/(admin)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings, Users, UserCheck, Menu as MenuIcon,
  FileText, MessageSquare, LogOut, UserCircle, Loader2, Megaphone,
  BarChart2, Building2, ChevronDown, Award, Users2, TrendingUp, HeartHandshake,
  ClipboardList, CheckCircle2, BookOpen, Calendar, ClipboardCheck
} from "lucide-react";
import TokenChecker from "@/components/TokenChecker";
import { usePathname } from "next/navigation";
import Script from "next/script";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminInfo, setAdminInfo] = useState({ id: 0, name: "", level: 0 });

  // 💡 메인 카테고리 아코디언 상태
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isContentOpen, setIsContentOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // 💡 서브 아코디언 상태
  const [isCoopOpen, setIsCoopOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isEduOpen, setIsEduOpen] = useState(false); // 🌟 교육관리 아코디언 상태 추가

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      alert("관리자 페이지입니다. 먼저 로그인해 주세요.");
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.level < 9) {
        alert("관리자 페이지에 접근할 권한이 없습니다.");
        window.location.href = "/";
        return;
      }
      setAdminInfo({ id: user.id || user.userId, name: user.name, level: user.level });
      setIsAuthorized(true);
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }, [pathname]);

  // 현재 경로에 따라 자동으로 아코디언 열어주기
  useEffect(() => {
    // 1. 환경 설정 카테고리 체크
    if (pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/members/settings")) {
      setIsSettingsOpen(true);
    }

    // 2. 통계 카테고리 체크
    if (pathname.startsWith("/admin/statistics")) {
      setIsStatsOpen(true);
    }

    // 3. 컨텐츠 관리 카테고리 및 하위 카테고리 체크
    const contentPaths = [
      "/admin/quotes", "/admin/member", "/admin/qualifications", 
      "/admin/certification", "/admin/coopmembers", "/admin/customers", 
      "/admin/social-contributions", "/admin/menus", "/admin/pages", 
      "/admin/boards", "/admin/popup", "/admin/edu"
    ];
    
    if (contentPaths.some(path => pathname.startsWith(path))) {
      setIsContentOpen(true);
    }

    // 서브 아코디언 (협동조합)
    if (
      pathname.startsWith("/admin/certification") ||
      pathname.startsWith("/admin/coopmembers") ||
      pathname.startsWith("/admin/customers") ||
      pathname.startsWith("/admin/social-contributions")
    ) {
      setIsCoopOpen(true);
    }
    
    // 서브 아코디언 (견적/매칭)
    if (pathname.startsWith("/admin/quotes")) {
      setIsQuoteOpen(true);
    }

    // 🌟 서브 아코디언 (교육 관리)
    if (pathname.startsWith("/admin/edu")) {
      setIsEduOpen(true);
    }
  }, [pathname]);

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4 text-indigo-600">
          <Loader2 className="animate-spin" size={40} />
          <p className="font-bold text-slate-600">관리자 권한을 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  const getLevelName = (level: number) => level === 10 ? "최고관리자" : "관리자";

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">

      <TokenChecker />
      <aside className="w-64 bg-slate-900 flex flex-col h-full flex-shrink-0 shadow-2xl z-20">
        <div className="h-16 flex items-center justify-center bg-slate-950 border-b border-slate-800 shadow-sm flex-shrink-0">
          <Link href="/admin/dashboard" className="text-xl font-black text-white tracking-widest hover:text-indigo-400 transition-colors">
            CMS ADMIN
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          
          {/* ===================== 1. 환경 설정 ===================== */}
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="w-full flex items-center justify-between px-3 py-2 mt-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <span>환경 설정</span>
            <ChevronDown size={14} className={`transform transition-transform duration-200 ${isSettingsOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isSettingsOpen && (
            <div className="space-y-1 mb-6">
              <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
                <Settings size={18} />
                <span className="font-medium text-sm">사이트 설정</span>
              </Link>
              <Link href="/admin/members/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
                <Users size={18} />
                <span className="font-medium text-sm">회원 설정</span>
              </Link>
            </div>
          )}

          <div className="my-4 border-t border-slate-800" />

          {/* ===================== 2. 컨텐츠 관리 ===================== */}
          <button
            onClick={() => setIsContentOpen(!isContentOpen)}
            className="w-full flex items-center justify-between px-3 py-2 mt-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <span>컨텐츠 관리</span>
            <ChevronDown size={14} className={`transform transition-transform duration-200 ${isContentOpen ? 'rotate-180' : ''}`} />
          </button>

          {isContentOpen && (
            <div className="space-y-1 mb-6">
              {/* 견적 및 매칭 관리 서브 아코디언 */}
              <div>
                <button
                  onClick={() => setIsQuoteOpen(!isQuoteOpen)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList size={18} />
                    <span className="font-medium text-sm">견적 및 매칭 관리</span>
                  </div>
                  <ChevronDown size={16} className={`transform transition-transform duration-200 ${isQuoteOpen ? 'rotate-180' : ''}`} />
                </button>

                {isQuoteOpen && (
                  <div className="pl-4 py-1 space-y-1 mt-1 border-l-2 border-indigo-600 ml-4">
                    <Link
                      href="/admin/quotes"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${pathname.startsWith('/admin/quotes') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      <CheckCircle2 size={14} />
                      <span>전체 견적 문의 관리</span>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/admin/member" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
                <UserCheck size={18} />
                <span className="font-medium text-sm">회원 관리</span>
              </Link>
              
              {adminInfo.id === 2 && (
                <Link
                  href="/admin/qualifications"
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${pathname.startsWith('/admin/qualifications')
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-indigo-600 hover:text-white'
                    }`}
                >
                  <ClipboardList size={18} />
                  <span className="font-medium text-sm">에어컨세척자격증</span>
                </Link>
              )}

              {/* 협동조합 관리 서브 아코디언 */}
              <div>
                <button
                  onClick={() => setIsCoopOpen(!isCoopOpen)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={18} />
                    <span className="font-medium text-sm">협동조합 관리</span>
                  </div>
                  <ChevronDown size={16} className={`transform transition-transform duration-200 ${isCoopOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCoopOpen && (
                  <div className="pl-4 py-1 space-y-1 mt-1 border-l-2 border-indigo-600 ml-4">
                    <Link
                      href="/admin/certification"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${pathname === '/admin/certification' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      <Award size={14} />
                      <span>인증·인허가</span>
                    </Link>
                    <Link
                      href="/admin/coopmembers"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${pathname === '/admin/coopmembers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      <Users2 size={14} />
                      <span>조합원현황</span>
                    </Link>
                    <Link
                      href="/admin/customers"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${pathname === '/admin/customers' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      <TrendingUp size={14} />
                      <span>주요실적/고객현황</span>
                    </Link>
                    <Link
                      href="/admin/social-contributions"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${pathname.startsWith('/admin/social-contributions') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      <HeartHandshake size={14} />
                      <span>사회적공헌활동</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* 🌟 교육관리 서브 아코디언 메뉴 */}
              <div>
                <button
                  onClick={() => setIsEduOpen(!isEduOpen)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={18} />
                    <span className="font-medium text-sm">교육 관리</span>
                  </div>
                  <ChevronDown size={16} className={`transform transition-transform duration-200 ${isEduOpen ? 'rotate-180' : ''}`} />
                </button>

                {isEduOpen && (
                  <div className="pl-4 py-1 space-y-1 mt-1 border-l-2 border-indigo-600 ml-4">
                    <Link
                      href="/admin/edu/schedule"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${pathname.startsWith('/admin/edu/schedule') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      <Calendar size={14} />
                      <span>교육일정관리</span>
                    </Link>
                    <Link
                      href="/admin/edu/applications"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${pathname.startsWith('/admin/edu/applications') ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                      <ClipboardCheck size={14} />
                      <span>교육신청관리</span>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/admin/menus" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
                <MenuIcon size={18} />
                <span className="font-medium text-sm">메뉴 관리</span>
              </Link>
              <Link href="/admin/pages" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
                <FileText size={18} />
                <span className="font-medium text-sm">페이지 관리</span>
              </Link>
              <Link href="/admin/boards" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
                <MessageSquare size={18} />
                <span className="font-medium text-sm">게시판 관리</span>
              </Link>
              <Link href="/admin/popup" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
                <Megaphone size={18} />
                <span className="font-medium text-sm">팝업 관리</span>
              </Link>
            </div>
          )}

          <div className="my-4 border-t border-slate-800" />

          {/* ===================== 3. 통계 및 부가기능 ===================== */}
          <button
            onClick={() => setIsStatsOpen(!isStatsOpen)}
            className="w-full flex items-center justify-between px-3 py-2 mt-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors"
          >
            <span>통계 및 부가기능</span>
            <ChevronDown size={14} className={`transform transition-transform duration-200 ${isStatsOpen ? 'rotate-180' : ''}`} />
          </button>

          {isStatsOpen && (
            <div className="space-y-1 mb-6">
              <Link href="/admin/statistics" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
                <BarChart2 size={18} />
                <span className="font-medium text-sm">방문자 통계</span>
              </Link>
            </div>
          )}
          
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm flex-shrink-0 z-10">
          <div className="text-slate-500 font-medium">관리자 대시보드</div>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <UserCircle size={20} className="text-indigo-600" />
              <span className="text-sm font-bold text-slate-700">
                {adminInfo.name} ({getLevelName(adminInfo.level)})
              </span>
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-red-500 transition-colors">
              <LogOut size={16} /> 로그아웃
            </button>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}