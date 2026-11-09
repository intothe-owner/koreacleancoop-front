"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, RefreshCw, AlertCircle, Building2, Wind, Bug, Shield, CheckCircle2
} from "lucide-react";
import dayjs from "dayjs";

const SERVICE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  BUILDING: { label: "건물위생관리", icon: <Building2 size={16} />, color: "text-blue-600 bg-blue-50" },
  AIRCON: { label: "냉난방기세척", icon: <Wind size={16} />, color: "text-cyan-600 bg-cyan-50" },
  PEST: { label: "소독방역", icon: <Bug size={16} />, color: "text-emerald-600 bg-emerald-50" },
  PUBLIC: { label: "공공시설청소", icon: <Shield size={16} />, color: "text-purple-600 bg-purple-50" },
};

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  MATCHING: { label: "매칭중(대기)", style: "bg-amber-100 text-amber-700" },
  PROPOSED: { label: "견적제안됨", style: "bg-blue-100 text-blue-700" },
  MATCHED: { label: "업체확정", style: "bg-indigo-100 text-indigo-700" },
  COMPLETED: { label: "시공완료", style: "bg-emerald-100 text-emerald-700" },
  CANCELED: { label: "취소됨", style: "bg-red-100 text-red-700" },
};

export default function AdminQuoteDetail() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quoteDetail, setQuoteDetail] = useState<any>(null);
  
  const [newStatus, setNewStatus] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchQuoteDetail();
  }, [quoteId]);

  const fetchQuoteDetail = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes/${quoteId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setQuoteDetail(data.data);
        setNewStatus(data.data.status);
      } else {
        alert("상세 정보를 불러오지 못했습니다.");
        router.back();
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || newStatus === quoteDetail.status) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      // 💡 Admin 전용 상태변경 API 연결 (다음 단계에서 백엔드 구현 예정)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/quotes/${quoteDetail.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (data.success) {
        alert("상태가 성공적으로 변경되었습니다.");
        setQuoteDetail({ ...quoteDetail, status: newStatus });
      } else {
        alert(data.message || "상태 변경 실패");
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRematch = async () => {
    if (!confirm(`현재 [${quoteDetail.currentMatchStage}단계] 반경 내에 있습니다.\n반경을 넓혀서 새로운 5곳의 업체를 랜덤 매칭하시겠습니까?`)) return;
    
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("token");
      
      if (quoteDetail.status === "CANCELED") {
         await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/quotes/${quoteDetail.id}/status`, {
           method: "PATCH",
           headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
           body: JSON.stringify({ status: "MATCHING" })
         });
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes/${quoteDetail.id}/expand-match`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        alert(`[${data.stage}단계] 확장 완료!\n총 ${data.matchedCount}곳의 업체가 추가 매칭되었습니다.`);
        fetchQuoteDetail(); // 매칭된 목록 새로고침
      } else {
        alert(data.message || "더 이상 확장하여 매칭할 업체가 없습니다.");
      }
    } catch (error) {
      alert("매칭 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) return null;
  if (isLoading || !quoteDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
        상세 정보를 불러오는 중입니다...
      </div>
    );
  }

  const currentStatus = STATUS_BADGE[quoteDetail.status] || STATUS_BADGE["MATCHING"];
  const currentSvc = SERVICE_INFO[quoteDetail.serviceType] || SERVICE_INFO["BUILDING"];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* 🌟 헤더 영역 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">견적번호 #{quoteDetail.id}</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${currentSvc.color}`}>
                {currentSvc.label}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${currentStatus.style}`}>
                {currentStatus.label}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">관리자 견적 상세 및 관리</h1>
          </div>
        </div>
        <div className="text-right text-sm font-medium text-slate-500">
          요청일시: {dayjs(quoteDetail.createdAt).format("YYYY-MM-DD HH:mm")}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* 🌟 좌측: 견적 정보 */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">고객 정보 및 현장</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">고객명 (담당자)</div>
                <div className="text-sm font-bold text-slate-800">{quoteDetail.customerName}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">연락처</div>
                <div className="text-sm font-bold text-slate-800">{quoteDetail.customerPhone}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-bold text-slate-400 mb-1">작업 현장 주소</div>
                <div className="text-sm font-bold text-slate-800">{quoteDetail.address} {quoteDetail.addressDetail}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 mb-1">희망 시공일자</div>
                <div className="text-sm font-bold text-slate-800">
                  {quoteDetail.preferredDate ? dayjs(quoteDetail.preferredDate).format("YYYY-MM-DD") : "미지정 (협의)"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">매칭된 업체 현황 (현재 {quoteDetail.currentMatchStage}단계)</h3>
            {quoteDetail.matches?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quoteDetail.matches.map((m: any) => (
                  <div key={m.member?.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                    <div className="font-extrabold text-slate-800">{m.member?.companyName || "업체명 미상"}</div>
                    <div className="text-sm text-slate-600 font-medium">담당자: {m.member?.name}</div>
                    <div className="text-sm text-slate-600 font-medium flex items-center gap-1.5">
                      연락처: {m.member?.phone || m.member?.mobile || "미등록"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 font-medium border border-slate-100">
                아직 매칭된 조합원(업체)이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* 🌟 우측: 관리자 액션 패널 */}
        <div className="w-full xl:w-[400px] flex-shrink-0 flex flex-col gap-6">
          <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 shadow-sm p-6 md:p-8 sticky top-24">
            <h3 className="text-base font-extrabold text-indigo-900 mb-6 flex items-center gap-2">
              <CheckCircle2 size={20} className="text-indigo-600" /> 관리자 상태 제어
            </h3>
            
            <div className="flex flex-col gap-6">
              
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500">진행 상태 강제 변경</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-3 border border-indigo-200 rounded-xl text-sm font-bold text-slate-700 outline-none bg-white focus:border-indigo-500 transition-colors"
                >
                  <option value="MATCHING">매칭중(대기)</option>
                  <option value="PROPOSED">견적제안됨</option>
                  <option value="MATCHED">업체확정</option>
                  <option value="COMPLETED">시공완료</option>
                  <option value="CANCELED">취소됨</option>
                </select>
                <button 
                  onClick={handleStatusChange}
                  disabled={isProcessing || newStatus === quoteDetail.status}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-bold transition-colors mt-1"
                >
                  상태 저장하기
                </button>
              </div>

              <hr className="border-indigo-100" />

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <AlertCircle size={16} /> 반경 확장 매칭
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  현재 매칭된 업체가 없거나 고객이 취소한 경우, 거리를 한 단계 더 넓혀서 무작위 5곳의 업체를 추가 매칭합니다.
                </p>
                <button 
                  onClick={handleRematch}
                  disabled={isProcessing || (quoteDetail.status !== "MATCHING" && quoteDetail.status !== "CANCELED")}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm mt-1"
                >
                  <RefreshCw size={16} className={isProcessing ? "animate-spin" : ""} />
                  {quoteDetail.status === "CANCELED" ? "취소 해제 및 새로운 업체 매칭" : "다음 반경으로 확장 매칭"}
                </button>
                {(quoteDetail.status !== "MATCHING" && quoteDetail.status !== "CANCELED") && (
                  <p className="text-[11px] text-red-500 text-center mt-1">
                    * '매칭중' 이나 '취소됨' 상태일 때만 재매칭이 가능합니다.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}