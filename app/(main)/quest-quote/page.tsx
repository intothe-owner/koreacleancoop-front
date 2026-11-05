"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  User, 
  Phone, 
  Lock, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Building2, 
  Wind, 
  Bug, 
  Shield 
} from "lucide-react";

// 서비스 타입 매핑
const SERVICE_INFO: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  BUILDING: { label: "건물위생관리", icon: <Building2 size={18} />, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/40" },
  AIRCON: { label: "냉난방기종합세척", icon: <Wind size={18} />, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/40" },
  PEST: { label: "소독방역", icon: <Bug size={18} />, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40" },
  PUBLIC: { label: "공공시설청소", icon: <Shield size={18} />, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/40" },
};

// 진행 상태 매핑
const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  MATCHING: { label: "매칭중/대기", style: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  PROPOSED: { label: "견적제안됨", style: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  MATCHED: { label: "시공업체확정", style: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" },
  COMPLETED: { label: "시공완료", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  CANCELED: { label: "취소됨", style: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

export default function GuestQuotePage() {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    password: ""
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [quoteDetail, setQuoteDetail] = useState<any>(null); // 조회 결과 데이터

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMsg(""); // 입력 시 에러 메시지 초기화
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerPhone || !formData.password) {
      setErrorMsg("모든 항목을 입력해 주세요.");
      return;
    }

    setIsSearching(true);
    setErrorMsg("");

    try {
      // 💡 [API 연동 영역] 비회원 견적 조회 API 호출
      // const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes/guest-search`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      // const data = await res.json();
      
      // [테스트용 임시 로직]
      setTimeout(() => {
        // 임시 방어 로직 (테스트용 비밀번호 1234)
        if (formData.password === "1234") {
          setQuoteDetail({
            id: 2026,
            serviceType: "AIRCON",
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            address: "부산광역시 해운대구 수영강변대로 140",
            addressDetail: "부산문화콘텐츠콤플렉스",
            preferredDate: "2026-11-25",
            status: "PROPOSED", 
            createdAt: "2026-11-05 10:00",
            details: {
              buildingType: "상가/매장",
              acType: "시스템 에어컨(천장형)",
              acCount: "3대",
              ceilingHeight: "일반 층고(3m 이하)",
              inquiry: "최대한 빠른 일정으로 부탁드립니다."
            },
            matchedPartners: [
              { id: 1, companyName: "클린마스터 부산점", phone: "051-000-0000" },
              { id: 2, companyName: "에어컨청소달인", phone: "010-9999-8888" }
            ]
          });
        } else {
          setErrorMsg("입력하신 정보와 일치하는 견적 내역이 없거나 비밀번호가 틀렸습니다. (테스트용 비번: 1234)");
        }
        setIsSearching(false);
      }, 600);

    } catch (error) {
      console.error("조회 실패:", error);
      setErrorMsg("서버와 통신 중 오류가 발생했습니다.");
      setIsSearching(false);
    }
  };

  // 결과 화면의 상태와 서비스 타입
  const currentStatus = quoteDetail ? (STATUS_BADGE[quoteDetail.status] || STATUS_BADGE["MATCHING"]) : null;
  const currentSvc = quoteDetail ? (SERVICE_INFO[quoteDetail.serviceType] || SERVICE_INFO["BUILDING"]) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-32 pb-20 px-4 flex flex-col items-center">
      
      {/* 검색 결과가 없을 때 (조회 폼 화면) */}
      {!quoteDetail && (
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-3">비회원 견적 조회</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              견적 신청 시 입력하신 고객 정보와 <br /> 조회용 비밀번호를 입력해 주세요.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
            <form onSubmit={handleSearch} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">고객명 (또는 기관명)</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="신청 시 입력한 이름"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">연락처</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="010-0000-0000"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors dark:text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">조회용 비밀번호</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="신청 시 입력한 비밀번호"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-colors dark:text-white"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/30 p-3 rounded-lg text-center">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    조회 중...
                  </>
                ) : (
                  <>
                    <Search size={18} /> 내 견적 조회하기
                  </>
                )}
              </button>

            </form>
          </div>
          
          <div className="mt-6 text-center text-sm font-medium text-slate-500">
            회원이신가요? <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-1">로그인하기</Link>
          </div>
        </div>
      )}

      {/* 검색 결과가 있을 때 (상세 화면) */}
      {quoteDetail && (
        <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          
          {/* 상단 헤더 */}
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setQuoteDetail(null)}
                className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold flex items-center gap-1 ${currentSvc?.color}`}>
                    {currentSvc?.icon} {currentSvc?.label}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${currentStatus?.style}`}>
                    {currentStatus?.label}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  나의 견적 상세내역
                </h1>
              </div>
            </div>
            <div className="text-left md:text-right text-sm font-medium text-slate-500">
              견적번호: #{quoteDetail.id} <br />
              <span className="text-xs text-slate-400">요청일시: {quoteDetail.createdAt}</span>
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col xl:flex-row gap-8">
            
            {/* 좌측 패널: 견적 상세 정보 */}
            <div className="flex-1 flex flex-col gap-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                  고객 및 현장 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div className="flex gap-3 items-start">
                    <User size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-1">고객/기관명</div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{quoteDetail.customerName}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Phone size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-1">연락처</div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{quoteDetail.customerPhone}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start md:col-span-2">
                    <MapPin size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-1">작업 현장 주소</div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {quoteDetail.address} {quoteDetail.addressDetail}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Calendar size={18} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-400 mb-1">희망 시공일자</div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {quoteDetail.preferredDate || "미지정 (협의)"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
                  요청 상세 내용
                </h3>
                <div className="flex flex-col gap-4">
                  {Object.entries(quoteDetail.details || {}).map(([key, value]) => {
                    if (key === 'inquiry') return null;
                    return (
                      <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                        <span className="text-sm font-bold text-slate-400 w-32 capitalize">{key}</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{String(value)}</span>
                      </div>
                    );
                  })}
                  {quoteDetail.details?.inquiry && (
                    <div className="mt-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      <strong className="block text-xs text-slate-400 mb-2 font-bold uppercase">기타 요청사항</strong>
                      {quoteDetail.details.inquiry}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 우측 패널: 매칭된 업체 리스트 */}
            <div className="w-full xl:w-80 flex-shrink-0">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm sticky top-24">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4">
                  제안/매칭된 파트너 업체
                </h3>
                {quoteDetail.matchedPartners?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {quoteDetail.matchedPartners.map((p: any) => (
                      <div key={p.id} className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                        <div className="font-bold text-sm text-slate-800 dark:text-white mb-1.5">{p.companyName}</div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <Phone size={14} className="text-emerald-500" /> {p.phone}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm font-bold text-slate-500">아직 매칭된 업체가 없습니다.</p>
                    <p className="text-xs text-slate-400 mt-1">조금만 더 기다려 주세요.</p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    * 비회원은 조회를 통해 매칭 내역 확인만 가능하며, 상세 협의 및 상태 변경 등은 업체의 안내 전화를 기다려주시기 바랍니다.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}