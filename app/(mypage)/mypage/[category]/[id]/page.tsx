"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, MapPin, Calendar, Phone, User, 
  CheckCircle2, MessageSquare, Star, Send, Camera, Upload, FileText, Download
} from "lucide-react";
import dayjs from "dayjs";

const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  MATCHING: { label: "매칭중/대기", style: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  PROPOSED: { label: "견적제안됨", style: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  MATCHED: { label: "시공업체확정", style: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" },
  COMPLETED: { label: "시공완료", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  CANCELED: { label: "취소됨", style: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

const DETAIL_LABELS: Record<string, string> = {
  BuildingType: "건물/공간 유형",
  buildingType: "건물/공간 유형",
  AreaSize: "평수(면적)",
  areaSize: "평수(면적)",
  CleaningCycle: "요청 주기",
  cleaningCycle: "요청 주기",
  SpecialNeeds: "특이사항/추가요청",
  specialNeeds: "특이사항/추가요청",
  acType: "에어컨 종류",
  acCount: "에어컨 수량",
  ceilingHeight: "현장 층고",
};

export default function QuoteDetail() {
  const params = useParams();
  const router = useRouter();
  const category = (params.category as string)?.toUpperCase();
  const quoteId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [quoteDetail, setQuoteDetail] = useState<any>(null);
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [replyText, setReplyText] = useState("");

  const [reportForm, setReportForm] = useState({
    workDate: dayjs().format("YYYY-MM-DD"),
  });
  const [reportImages, setReportImages] = useState({
    entrance: null as File | null,
    before: null as File | null,
    during: null as File | null,
    after: null as File | null,
  });
  const [imagePreviews, setImagePreviews] = useState({
    entrance: "", before: "", during: "", after: ""
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }
    setUserData(JSON.parse(userStr));
    fetchQuoteDetail();
  }, [category, quoteId, router]);

  const fetchQuoteDetail = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes/${quoteId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if(data.success) {
        const raw = data.data;
        const formattedData = {
          ...raw,
          matchedPartners: raw.matches?.map((m: any) => ({
             id: m.member?.id,
             companyName: m.member?.companyName || m.member?.name || "업체명 미상",
             phone: m.member?.phone || m.member?.mobile || "연락처 미등록"
          })) || [],
          review: raw.reviewContent ? {
             rating: raw.reviewRating,
             content: raw.reviewContent,
             reply: raw.reviewReply
          } : null
        };
        setQuoteDetail(formattedData);
        setNewStatus(formattedData.status);
      } else {
        alert("데이터를 찾을 수 없습니다.");
        router.back();
      }
    } catch (error) {
      console.error("상세 로딩 실패", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isPartner = userData?.level >= 2;

  const getMyCompanyName = () => {
    if (userData?.companyName) return userData.companyName;
    if (quoteDetail?.matchedPartners?.length > 0) {
      const me = quoteDetail.matchedPartners.find((p: any) => p.id === userData?.id);
      if (me?.companyName) return me.companyName;
    }
    return userData?.name || "업체명 미상";
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === quoteDetail.status) return;
    setIsUpdatingStatus(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/mypage/quotes/${quoteId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if(data.success) {
        setQuoteDetail({ ...quoteDetail, status: newStatus });
        alert("상태가 성공적으로 변경되었습니다.");
      } else {
        alert(data.message || "상태 변경 실패");
      }
    } catch(e) {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const submitReviewAction = async (payload: any) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/mypage/quotes/${quoteId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(data.success) {
        alert("등록되었습니다.");
        fetchQuoteDetail();
      } else {
        alert(data.message || "등록 실패");
      }
    } catch(e) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  const handleReviewSubmit = () => {
    if (!reviewText.trim()) return alert("리뷰 내용을 입력해주세요.");
    submitReviewAction({ rating, content: reviewText });
  };

  const handleReplySubmit = () => {
    if (!replyText.trim()) return alert("답글 내용을 입력해주세요.");
    submitReviewAction({ reply: replyText });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: keyof typeof reportImages) => {
    const file = e.target.files?.[0];
    if (file) {
      setReportImages(prev => ({ ...prev, [type]: file }));
      setImagePreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportImages.entrance || !reportImages.before || !reportImages.during || !reportImages.after) {
      return alert("4장의 사진(입구/작업전/작업중/작업후)을 모두 첨부해 주세요.");
    }
    
    setIsSubmittingReport(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("workDate", reportForm.workDate);
      formData.append("entranceImg", reportImages.entrance);
      formData.append("beforeImg", reportImages.before);
      formData.append("duringImg", reportImages.during);
      formData.append("afterImg", reportImages.after);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reports/${quoteId}`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      
      if(data.success) {
        alert("작업 보고서가 성공적으로 전송 및 저장되었습니다.");
        fetchQuoteDetail(); 
      } else {
        alert(data.message || "보고서 저장 실패");
      }
    } catch (error) {
      alert("보고서 저장 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reports/${quoteId}/pdf`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.message || "PDF 생성에 실패했습니다. 보고서가 먼저 작성되었는지 확인해주세요.");
      }
    } catch (error) {
      alert("서버 오류로 PDF를 가져오지 못했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (!mounted) return null;
  if (isLoading || !quoteDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
        상세 정보를 불러오는 중입니다...
      </div>
    );
  }

  const currentStatus = STATUS_BADGE[quoteDetail.status] || STATUS_BADGE["MATCHING"];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden">
      
      {/* --- 상단 헤더 영역 --- */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">견적번호 #{quoteDetail.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${currentStatus.style}`}>
                {currentStatus.label}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{category} 견적 상세내역</h1>
          </div>
        </div>
        <div className="text-right text-sm font-medium text-slate-500 flex flex-col md:items-end gap-2">
          <span>요청일시: {dayjs(quoteDetail.createdAt).format("YYYY-MM-DD HH:mm")}</span>
          
          {quoteDetail.status === "COMPLETED" && (
            <button 
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-extrabold transition-colors disabled:opacity-50"
            >
              {isDownloading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div> : <Download size={14} />}
              보고서 PDF 다운로드
            </button>
          )}
        </div>
      </div>

      {/* --- 본문 레이아웃 --- */}
      <div className="p-6 md:p-8 flex flex-col gap-8">
        
        {/* 🌟 1단: 고객 정보(좌) + 액션 패널(우) */}
        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* 고객 및 현장 정보 (가변 영역) */}
          <div className="flex-1">
            <div className="h-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">고객 및 현장 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div className="flex gap-3 items-start">
                  <User size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">고객/기관명</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{quoteDetail.customerName} {isPartner && "고객님"}</div>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Phone size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">연락처</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{quoteDetail.customerPhone}</div>
                  </div>
                </div>
                <div className="flex gap-3 items-start md:col-span-2">
                  <MapPin size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">작업 현장 주소</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {quoteDetail.address} {quoteDetail.addressDetail}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 items-start md:col-span-2">
                  <Calendar size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-400 mb-1">희망 시공일자</div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {quoteDetail.preferredDate ? dayjs(quoteDetail.preferredDate).format("YYYY-MM-DD") : "미지정 (협의)"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 액션 패널 (고정폭 96) */}
          <div className="w-full xl:w-96 flex-shrink-0 flex flex-col gap-6">
            
            {isPartner && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} /> 진행 상태 관리
                </h3>
                <div className="flex flex-col gap-3">
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-3 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value="MATCHING">매칭중/대기</option>
                    <option value="PROPOSED">견적 제안됨 (입찰)</option>
                    <option value="MATCHED">시공 업체 확정</option>
                    <option value="COMPLETED">시공 완료</option>
                    <option value="CANCELED">취소됨</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus || newStatus === quoteDetail.status}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 text-white text-sm font-extrabold transition-colors"
                  >
                    {isUpdatingStatus ? "변경 중..." : "상태 변경 저장"}
                  </button>
                </div>
              </div>
            )}

            {!isPartner && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4">매칭된 파트너 업체</h3>
                {quoteDetail.matchedPartners?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {quoteDetail.matchedPartners.map((p: any) => (
                      <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="font-bold text-sm text-slate-800 dark:text-white mb-1">{p.companyName}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><Phone size={12} /> {p.phone}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">아직 매칭된 업체가 없습니다.</p>
                )}
              </div>
            )}

            {/* 리뷰 패널 */}
            {quoteDetail.status === "COMPLETED" && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-6 shadow-sm">
                {quoteDetail.review ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">고객 리뷰</h3>
                        <div className="flex text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={14} fill={i < quoteDetail.review.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                        {quoteDetail.review.content}
                      </div>
                    </div>
                    
                    {quoteDetail.review.reply ? (
                      <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">파트너 답글</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl">
                          {quoteDetail.review.reply}
                        </div>
                      </div>
                    ) : (
                      isPartner && (
                        <div className="mt-2">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="고객님의 리뷰에 감사 답글을 남겨주세요."
                            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 resize-none h-24 mb-2"
                          />
                          <button onClick={handleReplySubmit} className="w-full py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white text-sm font-bold transition-colors">
                            답글 등록
                          </button>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  !isPartner && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                        <MessageSquare size={16} /> 시공 리뷰 작성
                      </h3>
                      <p className="text-xs text-slate-500 mb-2">시공이 완료되었습니다. 만족도를 평가해주세요!</p>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setRating(star)} className="text-amber-400 focus:outline-none hover:scale-110 transition-transform">
                            <Star size={24} fill={star <= rating ? "currentColor" : "none"} strokeWidth={1.5} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="서비스 만족도를 상세히 적어주세요."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-emerald-500 resize-none h-28"
                      />
                      <button onClick={handleReviewSubmit} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold transition-colors">
                        <Send size={16} /> 리뷰 등록하기
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* 🌟 2단: 요청 상세 내용 (가로 100%) */}
        <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">요청 상세 내용</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-12">
            {Object.entries(quoteDetail.details || {}).map(([key, value]) => {
              if (key === 'inquiry') return null; 
              return (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 border-b border-slate-50 dark:border-slate-700/50 pb-3">
                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400 w-40 capitalize shrink-0">{DETAIL_LABELS[key] || key}</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">{String(value)}</span>
                </div>
              );
            })}
          </div>
          {quoteDetail.details?.inquiry && (
            <div className="mt-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
              <strong className="block text-xs text-slate-500 mb-3 font-bold uppercase">기타 요청사항</strong>
              <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {quoteDetail.details.inquiry}
              </div>
            </div>
          )}
        </div>

        {/* 🌟 3단: 조합원 보고서 작성 폼 (가로 100%) */}
        {isPartner && quoteDetail.status !== "COMPLETED" && (
          <div className="w-full bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-8 border-b border-slate-100 dark:border-slate-700 pb-4">
              <FileText className="text-emerald-500" size={24} />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">작업 보고서 작성 및 시공 완료</h3>
            </div>
            
            <form onSubmit={handleReportSubmit} className="flex flex-col gap-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400">고객명/연락처</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{quoteDetail.customerName} / {quoteDetail.customerPhone}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400">현장 주소</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{quoteDetail.address} {quoteDetail.addressDetail}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-slate-400">담당 업체명 (조합원)</span>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{getMyCompanyName()}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="workDate" className="text-xs font-bold text-slate-400">작업일 (실제 시공일)</label>
                  <input 
                    type="date" 
                    id="workDate"
                    required
                    value={reportForm.workDate}
                    onChange={(e) => setReportForm({...reportForm, workDate: e.target.value})}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-medium outline-none focus:border-emerald-500 w-full dark:text-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-800 dark:text-white mb-2">사진 첨부 <span className="text-red-500">*</span></h4>
                <p className="text-sm text-slate-500 mb-6">각 단계에 맞는 현장 사진을 1장씩 필수로 등록해주세요.</p>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { key: "entrance", label: "입구 사진" },
                    { key: "before", label: "작업 전" },
                    { key: "during", label: "작업 중" },
                    { key: "after", label: "작업 후" }
                  ].map((item) => (
                    <div key={item.key} className="flex flex-col gap-3">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center bg-slate-100 dark:bg-slate-800 py-2 rounded-lg">
                        {item.label}
                      </label>
                      <label className="relative flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer overflow-hidden transition-all group hover:border-emerald-400">
                        {imagePreviews[item.key as keyof typeof imagePreviews] ? (
                          <>
                            <img src={imagePreviews[item.key as keyof typeof imagePreviews]} alt={item.label} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-white text-sm font-bold bg-black/50 px-4 py-2 rounded-lg">사진 변경</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-emerald-500 transition-colors">
                            <Camera size={32} />
                            <span className="text-sm font-bold">여기를 눌러 첨부</span>
                          </div>
                        )}
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageChange(e, item.key as keyof typeof reportImages)}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col items-end">
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-base font-extrabold flex items-center justify-center gap-3 transition-colors shadow-sm hover:shadow-md"
                >
                  {isSubmittingReport ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : <Upload size={20} />}
                  사진 전송 및 시공 완료 처리
                </button>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-3">
                  * 보고서를 제출하면 상태가 즉시 '시공 완료'로 변경되며 1장짜리 PDF가 생성됩니다.
                </p>
              </div>
              
            </form>
          </div>
        )}
      </div>
    </div>
  );
}