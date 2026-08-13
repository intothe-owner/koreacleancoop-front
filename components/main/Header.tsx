// src/app/components/main/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, UserCircle, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface MenuType {
  id: number;
  name: string;
  url: string;
  children?: MenuType[];
}

interface HeaderProps {
  menus: MenuType[];
  logoUrl?: string;
  siteName: string;
  hasSlider?: boolean;
  memberSettings?: any;
  themeMode?: string;
}

export default function Header({ menus, logoUrl, siteName, hasSlider = true, memberSettings, themeMode }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      setIsLoggedIn(true);
      try {
        setUserData(JSON.parse(userStr));
      } catch (e) { }
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserData(null);
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  const isSolid = !hasSlider || isScrolled || isMobileMenuOpen;

  // 상단바는 항상 검은색 고정
  const topBarClasses = "hidden md:flex w-full bg-[#111] dark:bg-black border-b border-white/10";
  const topBarTextClasses = "text-white/80 hover:text-white transition-colors drop-shadow-sm";

  // 메인 메뉴바는 스크롤에 따라 투명 -> 흰색으로 변경
  const mainBarClasses = `w-full transition-all duration-300 ${
    isSolid
      ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 dark:bg-slate-900/95 dark:border-slate-800"
      : "bg-transparent"
  }`;

  const textClasses = isSolid
    ? "text-slate-800 dark:text-slate-200 hover:text-indigo-600"
    : "text-white hover:text-indigo-300 drop-shadow-md";

  const authMode = memberSettings?.memberSystemMode || "ALL";

  return (
    <header className="fixed top-0 z-50 w-full flex flex-col">
      {/* 1단: 상단 유틸리티 메뉴 (항상 검정색 배경) */}
      <div className={topBarClasses}>
        <div className="mx-auto flex h-10 max-w-7xl items-center justify-end px-4 sm:px-6 w-full gap-5">
          
          {themeMode === "MENUAL" && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className={`p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors`}
              aria-label="테마 변경"
            >
              {mounted ? (
                resolvedTheme === "dark" ? <Sun size={15} /> : <Moon size={15} />
              ) : (
                <div className="w-4 h-4" />
              )}
            </button>
          )}

          <a href="/support" className={`text-[12px] font-medium whitespace-nowrap ${topBarTextClasses}`}>
            고객지원
          </a>
          <a href="/contact" className={`text-[12px] font-medium whitespace-nowrap ${topBarTextClasses}`}>
            제휴문의
          </a>

          {isLoggedIn ? (
            <div
              className="relative group h-full flex items-center cursor-pointer"
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <div className={`flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap py-2 ${topBarTextClasses}`}>
                <UserCircle size={15} />
                <span>{userData?.name}님</span>
                <ChevronDown size={12} className="opacity-70 group-hover:rotate-180 transition-transform" />
              </div>

              {/* 이름 마우스 호버 시 나오는 서브메뉴 */}
              {isUserMenuOpen && (
                <div className="absolute top-[35px] right-0 min-w-[140px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 animate-in fade-in slide-in-from-top-2">
                  {userData?.level >= 9 && (
                    <a
                      href="/admin/dashboard"
                      className="block px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                    >
                      관리자
                    </a>
                  )}
                  <a
                    href="/mypage"
                    className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors whitespace-nowrap"
                  >
                    정보수정
                  </a>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {authMode !== "NONE" && (
                <a href="/login" className={`text-[12px] font-medium whitespace-nowrap ${topBarTextClasses}`}>
                  로그인
                </a>
              )}
              {authMode === "ALL" && (
                <a href="/register" className={`text-[12px] font-medium whitespace-nowrap ${topBarTextClasses}`}>
                  회원가입
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2단: 로고 및 메인 메뉴 (스크롤 시 흰색 배경) */}
      <div className={mainBarClasses}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 w-full">

          {/* 로고 영역 */}
          <div className="w-auto flex items-center">
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-[150px] h-auto max-h-12 object-contain" />
              ) : (
                <span className={`text-xl font-extrabold transition-colors whitespace-nowrap ${isSolid ? "text-slate-900 dark:text-white" : "text-white drop-shadow-md"}`}>
                  {siteName}
                </span>
              )}
            </a>
          </div>

          {/* 메인 네비게이션 (오른쪽 정렬) */}
          <nav className="hidden md:flex flex-1 justify-end items-center gap-4 lg:gap-8 ml-8">
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="relative group"
                onMouseEnter={() => setOpenDropdownId(menu.id)}
                onMouseLeave={() => setOpenDropdownId(null)}
              >
                <a
                  href={menu.url || "#"}
                  className={`flex items-center gap-1 text-[16px] font-bold py-5 transition-colors whitespace-nowrap ${textClasses}`}
                >
                  {menu.name}
                  {menu.children && menu.children.length > 0 && (
                    <ChevronDown size={14} className="opacity-70 group-hover:rotate-180 transition-transform" />
                  )}
                </a>

                {menu.children && menu.children.length > 0 && openDropdownId === menu.id && (
                  <div className="absolute top-[60px] left-1/2 -translate-x-1/2 min-w-[160px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 animate-in fade-in slide-in-from-top-2">
                    {menu.children.map((child) => (
                      <a
                        key={child.id}
                        href={child.url || "#"}
                        className="block px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white transition-colors whitespace-nowrap"
                      >
                        {child.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 모바일 햄버거 버튼 영역 */}
          <div className="md:hidden flex items-center gap-2">
            {themeMode === "MENUAL" && (
              <button
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className={`p-2 rounded-full transition-colors ${isSolid ? "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" : "text-white hover:bg-black/20"}`}
                aria-label="테마 변경"
              >
                {mounted ? (
                  resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />
                ) : (
                  <div className="w-5 h-5" />
                )}
              </button>
            )}
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${isSolid ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100" : "text-white hover:bg-black/20"}`}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 전체 메뉴 오픈 시 나타나는 레이어 */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[104px] left-0 w-full bg-white dark:bg-slate-900 shadow-lg max-h-[calc(100vh-6.5rem)] overflow-y-auto flex flex-col">
          <nav className="flex flex-col py-2">
            {menus.map((menu) => (
              <div key={menu.id} className="border-b border-slate-100 dark:border-slate-800 last:border-none">
                <div className="flex items-center justify-between px-6 py-4">
                  <a
                    href={menu.url || "#"}
                    className="text-base font-bold text-slate-800 dark:text-slate-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {menu.name}
                  </a>
                  {menu.children && menu.children.length > 0 && (
                    <button
                      onClick={() => setOpenDropdownId(openDropdownId === menu.id ? null : menu.id)}
                      className="p-2 text-slate-400"
                    >
                      <ChevronDown size={20} className={`transition-transform ${openDropdownId === menu.id ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {menu.children && menu.children.length > 0 && openDropdownId === menu.id && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-3 flex flex-col gap-3">
                    {menu.children.map((child) => (
                      <a
                        key={child.id}
                        href={child.url || "#"}
                        className="text-sm font-medium text-slate-600 dark:text-slate-400 pl-4 border-l-2 border-indigo-200 dark:border-indigo-900"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {child.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* 모바일 하단 유틸리티 메뉴 */}
          {isLoggedIn ? (
            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/30 mt-auto">
              <div className="flex items-center gap-2 mb-2 px-2">
                <UserCircle size={24} className="text-indigo-600" />
                <span className="font-bold text-slate-800 dark:text-white text-lg">{userData?.name}님</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <a
                  href="/support"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition"
                >
                  고객지원
                </a>
                <a
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition"
                >
                  제휴문의
                </a>
              </div>

              {userData?.level >= 9 && (
                <a
                  href="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-extrabold text-white bg-emerald-500 rounded-xl shadow-sm hover:bg-emerald-600 transition"
                >
                  관리자 페이지
                </a>
              )}

              <a
                href="/mypage"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-3 text-center text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition"
              >
                정보수정
              </a>
              <button
                onClick={handleLogout}
                className="w-full py-3 text-center text-sm font-extrabold text-white bg-slate-800 rounded-xl shadow-sm hover:bg-slate-900 transition"
              >
                로그아웃
              </button>
            </div>
          ) : (
            authMode !== "NONE" && (
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/30 mt-auto">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <a
                    href="/support"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 text-center text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition"
                  >
                    고객지원
                  </a>
                  <a
                    href="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-2.5 text-center text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition"
                  >
                    제휴문의
                  </a>
                </div>

                <a
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center text-sm font-extrabold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition"
                >
                  로그인
                </a>
                {authMode === "ALL" && (
                  <a
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-full py-3 text-center text-sm font-extrabold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 transition"
                  >
                    회원가입
                  </a>
                )}
              </div>
            )
          )}
        </div>
      )}
    </header>
  );
}