"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  Wind, 
  Bug, 
  Shield, 
  ChevronRight,
  ChevronLeft,
  SearchX
} from "lucide-react";

// 서비스 타입 매핑 (아이콘, 한글명, 색상)
const SERVICE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  BUILDING: { label: "건물위생관리", icon: <Building2 size={18} />, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
  AIRCON: { label: "냉난방기종합세척", icon: <Wind size={18} />, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40" },
  PEST: { label: "소독방역", icon: <Bug size={18} />, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" },
  PUBLIC: { label: "공공시설청소", icon: <Shield size={18} />, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/40" },
};

// 진행 상태 매핑 (라벨, 스타일)
const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  MATCHING: { label: "매칭중/대기", style: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  PROPOSED: { label: "견적제안됨", style: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  MATCHED: { label: "시공업체확정", style: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" },
  COMPLETED: { label: "시공완료", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  CANCELED: { label: "취소됨", style: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

export default function CategoryQuoteList() {
  const params = useParams();
  const router = useRouter();
  // 동적 라우팅 파라미터 (BUILDING, AIRCON, PEST, PUBLIC)
  const category = (params.category as string)?.toUpperCase(); 

  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 리스트 및 페이징 상태
  const [quotes, setQuotes] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userStr);
    setUserData(parsedUser);
    
    // 유효한 카테고리인지 체크
    if (!SERVICE_INFO[category]) {
      alert("잘못된 접근입니다.");
      router.push("/mypage");
      return;
    }

    fetchQuotes(parsedUser.level, page);
  }, [category, page, router]);

  // 💡 [API 연동 영역] 실제 API 통신 로직
  const fetchQuotes = async (userLevel: number, currentPage: number) => {
    setIsLoading(true);
    try {
      // TODO: 실제 백엔드 API 구현 후 아래 주석 해제
      /*
      const token = localStorage.getItem("token");
      
      // 권한별 API 엔드포인트 분기 (예시)
      // 업체(2이상) -> 나에게 매칭된 목록 (/api/quotes/matched)
      // 고객(1) -> 내가 쓴 목록 (/api/quotes/my)
      const endpoint = userLevel >= 2 ? '/api/quotes/matched' : '/api/quotes/my';
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}?serviceType=${category}&page=${currentPage}&limit=10`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if(data.success) {
        setQuotes(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.total);
      }
      */

      // [테스트용 임시 로직] 더미 데이터 세팅
      setTimeout(() => {
        // 더미 데이터 10개 생성
        const dummyData = Array.from({ length: 10 }).map((_, idx) => ({
          id: 1000 - ((currentPage - 1) * 10 + idx),
          serviceType: category,
          address: `부산광역시 해운대구 센텀${idx + 1}로 100`,
          status: ["MATCHING", "PROPOSED", "MATCHED", "COMPLETED"][Math.floor(Math.random() * 4)],
          createdAt: `2026-11-0${Math.floor(Math.random() * 9 + 1)}`,
          customerName: "홍길동",
        }));

        setQuotes(dummyData);
        setTotalPages(5); // 임시 총 5페이지
        setTotalCount(48); // 임시 총 48건
        setIsLoading(false);
      }, 400);

    } catch (error) {
      console.error("데이터 로딩 실패", error);
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const svcInfo = SERVICE_INFO[category] || SERVICE_INFO["BUILDING"];
  const isPartner = userData?.level >= 2;

  return (
    <div className="flex flex-col h-full">
      {/* 1. 페이지 헤더 영역 */}
      <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-xl ${svcInfo.color}`}>
            {svcInfo.icon}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {svcInfo.label}
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm ml-12">
          {isPartner 
            ? `업체에 매칭 접수된 ${svcInfo.label} 건수: 총 ${totalCount}건` 
            : `고객님이 요청하신 ${svcInfo.label} 건수: 총 ${totalCount}건`}
        </p>
      </div>

      {/* 2. 리스트(테이블) 영역 */}
      <div className="flex-1 p-6 md:p-8">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
              목록을 불러오는 중입니다...
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-400 gap-3">
              <SearchX size={48} className="opacity-50" />
              <p className="text-sm font-medium">해당 카테고리의 견적 내역이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-20">NO</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {isPartner ? "고객명/현장주소" : "현장 주소"}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">진행 상태</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">요청일자</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">상세보기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {quotes.map((quote) => {
                    const status = STATUS_BADGE[quote.status] || { label: "대기", style: "bg-slate-100 text-slate-600" };
                    return (
                      <tr key={quote.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-400">
                          {quote.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            {/* 파트너(업체)일 경우 고객명 표시 */}
                            {isPartner && (
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                                {quote.customerName} 고객님
                              </span>
                            )}
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[300px]">
                              {quote.address}
                            </span>
                          </div>
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
                          {/* 💡 상세 페이지 이동 링크 */}
                          <Link 
                            href={`/mypage/${category}/${quote.id}`}
                            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <ChevronRight size={20} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 3. 페이징 영역 */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                  page === i + 1 
                    ? "bg-indigo-600 text-white" 
                    : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}