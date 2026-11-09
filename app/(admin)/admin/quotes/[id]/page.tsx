"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, RefreshCw, AlertCircle, Building2, Wind, Bug, Shield, CheckCircle2, UserPlus, X, MapPin
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

  // 🌟 수동 매칭용 상태 추가
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [nearbyPartners, setNearbyPartners] = useState<any[]>([]);
  const [isFetchingNearby, setIsFetchingNearby] = useState(false);

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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/quotes/${quoteDetail.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        alert("상태가 성공적으로 변경되었습니다.");
        setQuoteDetail({ ...quoteDetail, status: newStatus });
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRematch = async () => {
    if (!confirm(`반경을 넓혀서 새로운 5곳의 업체를 랜덤 매칭하시겠습니까?`)) return;
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
        alert(`확장 완료! 총 ${data.matchedCount}곳의 업체가 추가 매칭되었습니다.`);
        fetchQuoteDetail();
      } else {
        alert(data.message || "더 이상 확장하여 매칭할 업체가 없습니다.");
      }
    } catch (error) {
      alert("매칭 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // 🌟 [신규] 근처 조합원 수동 검색 모달 열기
  const openNearbyModal = async () => {
    setIsNearbyModalOpen(true);
    setIsFetchingNearby(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes/${quoteId}/nearby`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNearbyPartners(data.data);
      }
    } catch (error) {
      alert("근처 조합원 목록을 불러오지 못했습니다.");
    } finally {
      setIsFetchingNearby(false);
    }
  };

  // 🌟 [신규] 수동 할당(매칭) 실행
  const handleManualAssign = async (memberId: number, distance: number) => {
    if (!confirm("이 조합원에게 해당 견적을 수동으로 배정하시겠습니까?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes/${quoteId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ memberId, distance })
      });
      const data = await res.json();
      if (data.success) {
        alert("업체가 성공적으로 배정되었습니다.");
        setIsNearbyModalOpen(false);
        fetchQuoteDetail(); // 매칭 내역 새로고침
      } else {
        alert(data.message || "수동 배정에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
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
      
      {/* 헤더 영역 */}
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
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* 좌측: 견적 정보 및 매칭 업체 현황 (기존 코드와 동일) */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">고객 정보 및 현장</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div><div className="text-xs font-bold text-slate-400 mb-1">고객명</div><div className="text-sm font-bold text-slate-800">{quoteDetail.customerName}</div></div>
              <div><div className="text-xs font-bold text-slate-400 mb-1">연락처</div><div className="text-sm font-bold text-slate-800">{quoteDetail.customerPhone}</div></div>
              <div className="md:col-span-2"><div className="text-xs font-bold text-slate-400 mb-1">작업 현장 주소</div><div className="text-sm font-bold text-slate-800">{quoteDetail.address} {quoteDetail.addressDetail}</div></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">현재 매칭된 업체 현황</h3>
            {quoteDetail.matches?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quoteDetail.matches.map((m: any) => (
                  <div key={m.member?.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                    <div className="font-extrabold text-slate-800">{m.member?.companyName || "업체명 미상"}</div>
                    <div className="text-sm text-slate-600 font-medium">담당자: {m.member?.name}</div>
                    <div className="text-sm text-slate-600 font-medium">연락처: {m.member?.phone || m.member?.mobile}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 font-medium border border-slate-100">
                매칭된 조합원(업체)이 없습니다.
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
                  className="w-full p-3 border border-indigo-200 rounded-xl text-sm font-bold text-slate-700 outline-none bg-white focus:border-indigo-500"
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
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-bold mt-1"
                >
                  상태 저장하기
                </button>
              </div>

              <hr className="border-indigo-100" />

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <AlertCircle size={16} /> 매칭 강제 조작
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  대기/취소 상태인 경우, 직접 업체를 콕 집어 매칭하거나 반경을 넓혀 랜덤 매칭할 수 있습니다.
                </p>
                
                {/* 🌟 수동 매칭 버튼 */}
                <button 
                  onClick={openNearbyModal}
                  disabled={quoteDetail.status !== "MATCHING" && quoteDetail.status !== "CANCELED"}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors mt-1"
                >
                  <UserPlus size={16} /> 근처 조합원 검색 및 수동 할당
                </button>
                
                {/* 🌟 자동 확장 매칭 버튼 */}
                <button 
                  onClick={handleRematch}
                  disabled={isProcessing || (quoteDetail.status !== "MATCHING" && quoteDetail.status !== "CANCELED")}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw size={16} className={isProcessing ? "animate-spin" : ""} />
                  {quoteDetail.status === "CANCELED" ? "취소 해제 및 새로운 자동 매칭" : "다음 반경으로 확장하여 자동 매칭"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 [신규] 근처 조합원 수동 매칭 모달 */}
      {isNearbyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <MapPin size={20} className="text-indigo-600" /> 현장 근처 조합원 리스트
                </h2>
                <p className="text-xs text-slate-500 mt-1">거리(km) 순으로 정렬되어 있습니다. 할당할 업체를 선택하세요.</p>
              </div>
              <button onClick={() => setIsNearbyModalOpen(false)} className="text-slate-400 hover:text-slate-700 p-2">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-white">
              {isFetchingNearby ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
                  조합원 목록을 찾고 있습니다...
                </div>
              ) : nearbyPartners.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {nearbyPartners.map((partner) => (
                    <div key={partner.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors bg-slate-50 hover:bg-indigo-50/30">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-extrabold text-slate-800 text-base">{partner.companyName || "업체명 없음"}</span>
                          <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full">{partner.name}</span>
                        </div>
                        <div className="text-sm font-medium text-slate-600 flex items-center gap-2">
                          <span>{partner.phone || partner.mobile}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span className="text-indigo-600 font-bold">{(partner.distanceInMeters / 1000).toFixed(1)} km</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleManualAssign(partner.id, partner.distanceInMeters)}
                        className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm"
                      >
                        배정하기
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 font-medium">
                  할당 가능한 근처 업체가 없습니다.<br/><span className="text-xs">(이미 매칭된 업체는 표시되지 않습니다.)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}