"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Users, FileText, MessageSquare, Settings, 
  Activity, ArrowRight, ShieldCheck, Calculator, Clock
} from "lucide-react";
interface Quote {
  _id: string;
  clientName: string;
  company: string;
  service: string;
  status: string;
  createdAt: string;
}
interface DashboardData {
  totalMembers: number;
  quoteRequests: number;
  newPosts: number;
  dailyVisitors: number;
  recentQuotes: Quote[];
}
export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("관리자");
  
  // 백엔드 연동을 위한 상태 (견적문의 데이터 위주로 개편)
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalMembers: 0,
    quoteRequests: 0,
    newPosts: 0,
    dailyVisitors: 0,
    recentQuotes: [] // 이제 TypeScript가 이 배열이 Quote[] 타입임을 알게 됩니다.
  });

  useEffect(() => {
    // 1. 관리자 정보 로드
    const userStr = localStorage.getItem("user");
    let token = "";
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setAdminName(user.name);
        token = user.token || "";
      } catch (e) {
        console.error("유저 정보 파싱 오류:", e);
      }
    }

    // 2. 백엔드 통계 및 최근 견적 데이터 Fetch
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        
        const headers = {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        };

        // 실제 API 엔드포인트는 백엔드 라우터 설정에 맞춰 수정해야 합니다.
        // 임시로 오류 발생 시 더미 데이터를 반환하도록 구성했습니다.
        const [membersRes, quotesRes, postsRes, visitorsRes, recentQuotesRes] = await Promise.all([
          fetch(`${baseUrl}/api/members/count`, { headers }).catch(() => ({ json: () => ({ count: 1248 }) })),
          fetch(`${baseUrl}/api/quotes/count`, { headers }).catch(() => ({ json: () => ({ count: 45 }) })),
          fetch(`${baseUrl}/api/boards/posts/count`, { headers }).catch(() => ({ json: () => ({ count: 156 }) })),
          fetch(`${baseUrl}/api/visitors/today`, { headers }).catch(() => ({ json: () => ({ count: 892 }) })),
          fetch(`${baseUrl}/api/quotes/recent`, { headers }).catch(() => ({ 
            json: () => ({ 
              data: [
                { _id: '1', clientName: '홍길동', company: '(주)테스트', service: '웹사이트 리뉴얼', status: '대기중', createdAt: '2026-11-17T10:30:00' },
                { _id: '2', clientName: '김철수', company: '개인', service: '쇼핑몰 구축', status: '답변완료', createdAt: '2026-11-16T14:20:00' },
                { _id: '3', clientName: '이영희', company: '스타트업', service: '앱 개발', status: '진행중', createdAt: '2026-11-15T09:15:00' }
              ] 
            }) 
          }))
        ]);

        const membersData = await membersRes.json();
        const quotesData = await quotesRes.json();
        const postsData = await postsRes.json();
        const visitorsData = await visitorsRes.json();
        const recentQuotesData = await recentQuotesRes.json();

        setDashboardData({
          totalMembers: membersData.count || 0,
          quoteRequests: quotesData.count || 0,
          newPosts: postsData.count || 0,
          dailyVisitors: visitorsData.count || 0,
          recentQuotes: recentQuotesData.data || []
        });
      } catch (error) {
        console.error("대시보드 데이터 연동 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 동적 통계 데이터 매핑
  const stats = [
    { title: "총 회원 수", value: dashboardData.totalMembers.toLocaleString(), desc: "전월 대비 +12%", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "총 견적문의", value: dashboardData.quoteRequests.toLocaleString(), desc: "최근 7일간 +5건", icon: Calculator, color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "신규 게시글", value: dashboardData.newPosts.toLocaleString(), desc: "어제 대비 +8%", icon: MessageSquare, color: "text-amber-600", bg: "bg-amber-100" },
    { title: "일일 방문자", value: dashboardData.dailyVisitors.toLocaleString(), desc: "전일 대비 +24%", icon: Activity, color: "text-indigo-600", bg: "bg-indigo-100" },
  ];

  // 빠른 실행 링크
  const quickLinks = [
    { title: "사이트 설정", desc: "기본 정보 및 테마 변경", href: "/admin/settings", icon: Settings },
    { title: "견적 관리", desc: "견적 요청 확인 및 답변", href: "/admin/quotes", icon: FileText },
    { title: "회원 관리", desc: "가입자 목록 및 권한 설정", href: "/admin/member", icon: ShieldCheck },
  ];

  // 날짜 포맷 함수
  const formatDate = (dateString:any) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* 1. 환영 메시지 배너 */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">환영합니다, {adminName}님! 👋</h1>
          <p className="text-indigo-200 font-medium leading-relaxed">
            오늘도 CMS 시스템이 안정적으로 운영되고 있습니다.<br className="hidden sm:block" /> 
            접수된 새로운 견적문의를 확인하고 관리를 시작해 보세요.
          </p>
        </div>
        <div className="relative z-10 flex gap-3 w-full md:w-auto">
          <Link href="/" target="_blank" className="flex-1 md:flex-none text-center px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold transition-colors">
            내 사이트 보기
          </Link>
          <Link href="/admin/quotes" className="flex-1 md:flex-none text-center px-6 py-3 bg-indigo-500 hover:bg-indigo-400 rounded-xl font-bold shadow-lg transition-colors">
            견적문의 확인
          </Link>
        </div>
        
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      {/* 2. 요약 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <Icon size={24} className={stat.color} />
                </div>
              </div>
              <h3 className="text-slate-500 font-bold text-sm mb-1">{stat.title}</h3>
              <div className="flex items-end justify-between">
                {isLoading ? (
                  <div className="h-9 w-20 bg-slate-200 animate-pulse rounded"></div>
                ) : (
                  <span className="text-3xl font-black text-slate-800">{stat.value}</span>
                )}
                <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-md">
                  {stat.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. 빠른 실행 및 최근 견적문의 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* 빠른 실행 */}
        <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-800">빠른 실행</h3>
          </div>
          <div className="p-3">
            {quickLinks.map((link, idx) => {
              const LinkIcon = link.icon;
              return (
                <Link 
                  key={idx} 
                  href={link.href}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                      <LinkIcon size={20} className="text-slate-500 group-hover:text-indigo-600 transition-colors" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{link.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* 최근 견적문의 목록 */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">최근 견적문의</h3>
            <Link href="/admin/quotes" className="text-sm text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1">
              전체보기 <ArrowRight size={14} />
            </Link>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {isLoading ? (
               <div className="flex-1 flex justify-center items-center">
                 <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
               </div>
            ) : dashboardData.recentQuotes.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <FileText size={32} className="text-slate-300" />
                </div>
                <h2 className="text-lg font-bold text-slate-700 mb-1">최근 접수된 견적문의가 없습니다.</h2>
                <p className="text-slate-500 text-sm">새로운 견적 요청이 들어오면 이곳에 표시됩니다.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {dashboardData.recentQuotes.map((quote) => (
                  <li key={quote._id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors flex justify-between items-center group cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800">{quote.company || quote.clientName}</h4>
                          <span className="text-sm text-slate-500">{quote.service}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Clock size={12} />
                          <span>{formatDate(quote.createdAt)}</span>
                          <span className="mx-1">·</span>
                          <span>담당자: {quote.clientName}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 상태 뱃지 */}
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap
                        ${quote.status === '대기중' ? 'bg-amber-100 text-amber-700' : 
                          quote.status === '진행중' ? 'bg-blue-100 text-blue-700' : 
                          'bg-slate-100 text-slate-600'}`}>
                        {quote.status}
                      </span>
                      <ArrowRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all hidden sm:block" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}