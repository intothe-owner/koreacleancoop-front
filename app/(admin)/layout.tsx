// src/app/(admin)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Settings, Users, UserCheck, Menu as MenuIcon, 
  FileText, MessageSquare, LogOut, UserCircle, Loader2, Megaphone,
  BarChart2, Building2, ChevronDown, Award, Users2, TrendingUp, HeartHandshake
} from "lucide-react";
import TokenChecker from "@/components/TokenChecker";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname(); 
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminInfo, setAdminInfo] = useState({ name: "", level: 0 });

  // 💡 '협동조합' 아코디언 메뉴 열림/닫힘 상태 관리
  const [isCoopOpen, setIsCoopOpen] = useState(false);

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
      setAdminInfo({ name: user.name, level: user.level });
      setIsAuthorized(true);
    } catch (e) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  }, [pathname]);

  // 현재 경로가 협동조합 하위 메뉴 중 하나라면 자동으로 아코디언을 열어줌
  useEffect(() => {
    if (pathname.startsWith("/admin/certification")) {
      setIsCoopOpen(true);
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

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">환경 설정</p>
          
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
            <Settings size={18} />
            <span className="font-medium text-sm">사이트 설정</span>
          </Link>
          <Link href="/admin/members/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
            <Users size={18} />
            <span className="font-medium text-sm">회원 설정</span>
          </Link>

          <div className="my-6 border-t border-slate-800" />

          <p className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">컨텐츠 관리</p>
          
          <Link href="/admin/member" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
            <UserCheck size={18} />
            <span className="font-medium text-sm">회원 관리</span>
          </Link>

          {/* 💡 [신규] 협동조합 관리 아코디언 메뉴 */}
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

            {/* 아코디언 펼쳐졌을 때 나오는 서브메뉴 목록 */}
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
                  href="#" 
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <Users2 size={14} />
                  <span>조합원현황</span>
                </Link>
                <Link 
                  href="#" 
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <TrendingUp size={14} />
                  <span>주요실적/고객현황</span>
                </Link>
                <Link 
                  href="#" 
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <HeartHandshake size={14} />
                  <span>사회적공헌활동</span>
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

          <div className="my-6 border-t border-slate-800" />

          <p className="px-3 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">통계 및 부가기능</p>
          <Link href="/admin/statistics" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-300 hover:bg-indigo-600 hover:text-white transition-all">
            <BarChart2 size={18} />
            <span className="font-medium text-sm">방문자 통계</span>
          </Link>
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