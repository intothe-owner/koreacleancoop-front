"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  RefreshCw, Eye, Building2, Wind, Bug, Shield, ChevronLeft, ChevronRight 
} from "lucide-react";
import dayjs from "dayjs";

const SERVICE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  BUILDING: { label: "건물위생", icon: <Building2 size={16} />, color: "text-blue-600 bg-blue-50" },
  AIRCON: { label: "냉난방기", icon: <Wind size={16} />, color: "text-cyan-600 bg-cyan-50" },
  PEST: { label: "소독방역", icon: <Bug size={16} />, color: "text-emerald-600 bg-emerald-50" },
  PUBLIC: { label: "공공시설", icon: <Shield size={16} />, color: "text-purple-600 bg-purple-50" },
};

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  MATCHING: { label: "매칭중(대기)", style: "bg-amber-100 text-amber-700" },
  PROPOSED: { label: "견적제안됨", style: "bg-blue-100 text-blue-700" },
  MATCHED: { label: "업체확정", style: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "시공완료", style: "bg-emerald-100 text-emerald-700" },
  CANCELED: { label: "취소됨", style: "bg-red-100 text-red-700" },
};

export default function AdminQuoteList() {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  
  const [filterStatus, setFilterStatus] = useState("");
  const [filterService, setFilterService] = useState("");

  useEffect(() => {
    setMounted(true);
    fetchQuotes(1);
  }, [filterStatus, filterService]);

  const fetchQuotes = async (page: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      let url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes?page=${page}&limit=12`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterService) url += `&serviceType=${filterService}`;

      const res = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setQuotes(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("데이터 로딩 실패", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">견적 문의 관리</h1>
          <p className="text-slate-500 text-sm mt-1">고객의 견적 요청 목록을 확인하고 관리합니다.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filterService} 
            onChange={(e) => setFilterService(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">전체 서비스</option>
            <option value="BUILDING">건물위생관리</option>
            <option value="AIRCON">냉난방기세척</option>
            <option value="PEST">소독방역</option>
            <option value="PUBLIC">공공시설청소</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 bg-white"
          >
            <option value="">전체 상태</option>
            <option value="MATCHING">매칭중(대기)</option>
            <option value="PROPOSED">견적제안됨</option>
            <option value="MATCHED">업체확정</option>
            <option value="COMPLETED">시공완료</option>
            <option value="CANCELED">취소됨</option>
          </select>
          
          <button onClick={() => fetchQuotes(1)} className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors shadow-sm">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-20">NO</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">분류</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">고객명/연락처</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">현장 주소</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">매칭단계</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">진행 상태</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                    <p>데이터를 불러오는 중입니다...</p>
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">검색된 견적 내역이 없습니다.</td>
                </tr>
              ) : (
                quotes.map((quote) => {
                  const svc = SERVICE_INFO[quote.serviceType] || { label: "기타", color: "bg-slate-100" };
                  const status = STATUS_BADGE[quote.status] || { label: "대기", style: "bg-slate-100" };
                  
                  return (
                    <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-400">{quote.id}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${svc.color}`}>{svc.label}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-800">{quote.customerName}</div>
                        <div className="text-xs text-slate-500">{quote.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 truncate max-w-[200px]">{quote.address}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 rounded-md text-xs font-bold text-slate-600">
                          {quote.currentMatchStage}단계
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${status.style}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {/* 🌟 팝업 대신 상세 페이지로 이동하도록 Link 컴포넌트 적용 */}
                        <Link 
                          href={`/admin/quotes/${quote.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <Eye size={14} /> 상세 보기
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-100">
            <button 
              onClick={() => fetchQuotes(Math.max(1, pagination.page - 1))}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-bold text-slate-700 px-4">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button 
              onClick={() => fetchQuotes(Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}