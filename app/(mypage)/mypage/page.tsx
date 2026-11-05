"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Star, 
  ChevronRight, 
  Building2, 
  Wind, 
  Bug, 
  Shield 
} from "lucide-react";

// 서비스 타입에 따른 아이콘 및 라벨 매핑
const SERVICE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  BUILDING: { label: "건물위생관리", icon: <Building2 size={16} />, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
  AIRCON: { label: "냉난방기세척", icon: <Wind size={16} />, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40" },
  PEST: { label: "소독방역", icon: <Bug size={16} />, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" },
  PUBLIC: { label: "공공시설청소", icon: <Shield size={16} />, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/40" },
};

// 상태값 배지 스타일 매핑
const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  MATCHING: { label: "매칭중/대기", style: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  PROPOSED: { label: "견적제안됨", style: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  MATCHED: { label: "시공업체확정", style: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" },
  COMPLETED: { label: "시공완료", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
};

export default function MyPageDashboard() {
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 대시보드 통계 및 최근 리스트 상태
  const [stats, setStats] = useState({ total: 0, pending: 0, matched: 0, completed: 0 });
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUserData(parsedUser);
      fetchDashboardData(parsedUser.level);
    }
  }, []);

  // 💡 실제 API 통신으로 교체될 부분 (현재는 테스트용 더미 데이터 세팅)
  const fetchDashboardData = async (userLevel: number) => {
    setIsLoading(true);
    try {
      // TODO: 실제 백엔드 API 구현 후 아래 주석 해제 및 적용
      /*
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if(data.success) { ... }
      */

      // [테스트용 임시 로직] 0.5초 대기 후 권한별 더미 데이터 주입
      setTimeout(() => {
        const isPartner = userLevel >= 2;
        
        // 통계 더미 데이터
        setStats(
          isPartner 
            ? { total: 12, pending: 3, matched: 5, completed: 4 } // 업체용 통계
            : { total: 4, pending: 1, matched: 1, completed: 2 }  // 고객용 통계
        );

        // 최근 리스트 더미 데이터
        setRecentQuotes([
          { id: 104, serviceType: "BUILDING", address: "부산 해운대구 센텀중앙로", status: "MATCHING", createdAt: "2026-11-05" },
          { id: 103, serviceType: "AIRCON", address: "부산 수영구 광안해변로", status: "PROPOSED", createdAt: "2026-11-02" },
          { id: 102, serviceType: "PEST", address: "부산 부산진구 서면로", status: "MATCHED", createdAt: "2026-10-28" },
          { id: 101, serviceType: "PUBLIC", address: "부산 동래구 온천장로", status: "COMPLETED", createdAt: "2026-10-15" },
        ]);
        
        setIsLoading(false);
      }, 500);

    } catch (error) {
      console.error("대시보드 데이터 로딩 실패", error);
      setIsLoading(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        데이터를 불러오는 중입니다...
      </div>
    );
  }

  const isPartner = userData?.level >= 2;

  // 권한별 표시할 요약 카드 설정
  const statCards = isPartner ? [
    { label: "신규 매칭 요청", value: stats.pending, icon: <Clock size={24} />, bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-600" },
    { label: "제안/진행 중", value: stats.matched, icon: <ClipboardList size={24} />, bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-600" },
    { label: "시공 완료", value: stats.completed, icon: <CheckCircle2 size={24} />, bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600" },
    { label: "나의 평점", value: "4.8", icon: <Star size={24} />, bg: "bg-purple-50 dark:bg-purple-900/20", color: "text-purple-600" },
  ] : [
    { label: "내가 한 총 견적", value: stats.total, icon: <ClipboardList size={24} />, bg: "bg-indigo-50 dark:bg-indigo-900/20", color: "text-indigo-600" },
    { label: "매칭 대기중", value: stats.pending, icon: <Clock size={24} />, bg: "bg-amber-50 dark:bg-amber-900/20", color: "text-amber-600" },
    { label: "시공 예정", value: stats.matched, icon: <CheckCircle2 size={24} />, bg: "bg-blue-50 dark:bg-blue-900/20", color: "text-blue-600" },
    { label: "시공 완료", value: stats.completed, icon: <Star size={24} />, bg: "bg-emerald-50 dark:bg-emerald-900/20", color: "text-emerald-600" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">
          {isPartner ? "매칭 요약 대시보드" : "나의 견적 요약"}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          {isPartner 
            ? "고객님들이 요청한 매칭 내역과 진행 상태를 한눈에 확인하세요."
            : "요청하신 견적의 매칭 상태와 진행 내역을 확인하실 수 있습니다."}
        </p>
      </div>

      {/* 1. 통계 요약 카드 영역 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
                {card.value}
              </span>
              <span className="text-sm font-medium text-slate-400 mb-1">건</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. 최근 내역 리스트 영역 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">
            {isPartner ? "최근 수신된 매칭 요청" : "최근 요청한 견적 내역"}
          </h2>
          <span className="text-xs font-medium text-slate-400">
            최근 4건 표시
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
          {/* 테이블 (모바일 스크롤 지원) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">NO</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">서비스 분류</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">현장 주소</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">진행 상태</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">요청일자</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">상세보기</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {recentQuotes.length > 0 ? (
                  recentQuotes.map((quote, idx) => {
                    const svc = SERVICE_INFO[quote.serviceType] || { label: "기타", icon: null, color: "text-slate-600 bg-slate-100" };
                    const status = STATUS_BADGE[quote.status] || { label: "대기", style: "bg-slate-100 text-slate-600" };
                    
                    return (
                      <tr key={quote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">
                          {quote.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${svc.color}`}>
                            {svc.icon} {svc.label}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                          {quote.address}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${status.style}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-slate-500">
                          {quote.createdAt}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link 
                            href={`/mypage/${quote.serviceType}/${quote.id}`}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <ChevronRight size={20} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
                      최근 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}