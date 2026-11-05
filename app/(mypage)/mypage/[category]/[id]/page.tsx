"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Phone, 
  User, 
  CheckCircle2,
  MessageSquare,
  Star,
  Send
} from "lucide-react";

// 진행 상태 매핑 (라벨, 스타일)
const STATUS_BADGE: Record<string, { label: string; style: string }> = {
  MATCHING: { label: "매칭중/대기", style: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" },
  PROPOSED: { label: "견적제안됨", style: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" },
  MATCHED: { label: "시공업체확정", style: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400" },
  COMPLETED: { label: "시공완료", style: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" },
  CANCELED: { label: "취소됨", style: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" },
};

export default function QuoteDetail() {
  const params = useParams();
  const router = useRouter();
  const category = (params.category as string)?.toUpperCase();
  const quoteId = params.id as string;

  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 데이터 상태
  const [quoteDetail, setQuoteDetail] = useState<any>(null);
  
  // 업체용 상태 변경 폼
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 고객용 리뷰 폼
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  
  // 업체용 리뷰 답글 폼
  const [replyText, setReplyText] = useState("");

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
    fetchQuoteDetail(parsedUser.level);
  }, [category, quoteId, router]);

  // 💡 [API 연동 영역] 상세 데이터 호출
  const fetchQuoteDetail = async (userLevel: number) => {
    setIsLoading(true);
    try {
      // TODO: 실제 백엔드 API 구현 후 교체
      // const token = localStorage.getItem("token");
      // const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/quotes/${quoteId}`, { headers: ... });
      
      // [테스트용 임시 로직]
      setTimeout(() => {
        setQuoteDetail({
          id: quoteId,
          serviceType: category,
          customerName: "홍길동",
          customerPhone: "010-1234-5678",
          address: "부산광역시 해운대구 센텀중앙로 100",
          addressDetail: "센텀빌딩 10층 1004호",
          preferredDate: "2026-11-20",
          status: "COMPLETED", // 테스트를 위해 시공완료 상태로 세팅
          createdAt: "2026-11-05 14:30",
          details: {
            buildingType: "상가/매장",
            cleaningCycle: "1회성 대청소",
            areaSize: "50평",
            inquiry: "바닥 왁스 코팅 꼼꼼하게 부탁드립니다. 주말 작업 희망합니다."
          },
          matchedPartners: [
            { id: 1, companyName: "클린마스터 부산점", phone: "051-000-0000", status: "MATCHED" }
          ],
          // 리뷰가 이미 작성된 경우 (테스트)
          review: null, 
          // { rating: 5, content: "너무 깨끗하게 잘 해주셨습니다!", createdAt: "2026-11-21", reply: null }
        });
        setNewStatus("COMPLETED"); // 현재 상태 세팅
        setIsLoading(false);
      }, 500);

    } catch (error) {
      console.error("상세 로딩 실패", error);
      setIsLoading(false);
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

  const isPartner = userData?.level >= 2;
  const currentStatus = STATUS_BADGE[quoteDetail.status] || STATUS_BADGE["MATCHING"];

  // 업체 -> 상태 변경 처리
  const handleStatusUpdate = () => {
    if (!newStatus || newStatus === quoteDetail.status) return;
    setIsUpdatingStatus(true);
    setTimeout(() => {
      setQuoteDetail({ ...quoteDetail, status: newStatus });
      setIsUpdatingStatus(false);
      alert("상태가 성공적으로 변경되었습니다.");
    }, 500);
  };

  // 고객 -> 리뷰 작성 처리
  const handleReviewSubmit = () => {
    if (!reviewText.trim()) return alert("리뷰 내용을 입력해주세요.");
    setTimeout(() => {
      setQuoteDetail({
        ...quoteDetail,
        review: { rating, content: reviewText, createdAt: "방금 전", reply: null }
      });
      alert("리뷰가 등록되었습니다.");
    }, 300);
  };

  // 업체 -> 리뷰 답글 작성 처리
  const handleReplySubmit = () => {
    if (!replyText.trim()) return alert("답글 내용을 입력해주세요.");
    setTimeout(() => {
      setQuoteDetail({
        ...quoteDetail,
        review: { ...quoteDetail.review, reply: replyText }
      });
      alert("답글이 등록되었습니다.");
    }, 300);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden">
      
      {/* 1. 상단 헤더 (뒤로가기 + 상태) */}
      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">견적번호 #{quoteDetail.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${currentStatus.style}`}>
                {currentStatus.label}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {category} 견적 상세내역
            </h1>
          </div>
        </div>
        <div className="text-right text-sm font-medium text-slate-500">
          요청일시: {quoteDetail.createdAt}
        </div>
      </div>

      <div className="p-6 md:p-8 flex flex-col xl:flex-row gap-8">
        
        {/* ================================================== */}
        {/* 좌측 패널: 견적 상세 정보 */}
        {/* ================================================== */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              고객 및 현장 정보
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
              <div className="flex gap-3 items-start">
                <User size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">고객/기관명</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {/* 고객은 본인 이름, 업체는 고객 이름 노출 */}
                    {quoteDetail.customerName} {isPartner && "고객님"}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Phone size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">연락처</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {quoteDetail.customerPhone}
                  </div>
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
              <div className="flex gap-3 items-start">
                <Calendar size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">희망 시공일자</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {quoteDetail.preferredDate || "미지정 (협의)"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-3">
              요청 상세 내용
            </h3>
            <div className="flex flex-col gap-4">
              {Object.entries(quoteDetail.details || {}).map(([key, value]) => {
                if (key === 'inquiry') return null; // 기타 문의사항은 맨 아래에 별도 표시
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

        {/* ================================================== */}
        {/* 우측 패널: 액션 영역 (상태변경 / 리뷰 / 매칭업체) */}
        {/* ================================================== */}
        <div className="w-full xl:w-96 flex-shrink-0 flex flex-col gap-6">
          
          {/* 🌟 파트너(업체) 전용: 상태 변경 패널 */}
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

          {/* 🌟 일반 고객 전용: 매칭된 업체 리스트 */}
          {!isPartner && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white mb-4">
                매칭된 파트너 업체
              </h3>
              {quoteDetail.matchedPartners?.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {quoteDetail.matchedPartners.map((p: any) => (
                    <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="font-bold text-sm text-slate-800 dark:text-white mb-1">{p.companyName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Phone size={12} /> {p.phone}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">아직 매칭된 업체가 없습니다.</p>
              )}
            </div>
          )}

          {/* 🌟 공통 리뷰 패널 */}
          {quoteDetail.status === "COMPLETED" && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 p-6 shadow-sm">
              
              {/* 리뷰가 이미 작성된 경우 */}
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
                  
                  {/* 업체 답글이 있는 경우 */}
                  {quoteDetail.review.reply ? (
                    <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">파트너 답글</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300 bg-indigo-50/50 dark:bg-indigo-900/10 p-3 rounded-xl">
                        {quoteDetail.review.reply}
                      </div>
                    </div>
                  ) : (
                    /* 업체 답글이 없고 파트너가 보고 있을 때 -> 답글 작성 폼 */
                    isPartner && (
                      <div className="mt-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="고객님의 리뷰에 감사 답글을 남겨주세요."
                          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:border-indigo-500 resize-none h-24 mb-2"
                        />
                        <button
                          onClick={handleReplySubmit}
                          className="w-full py-2.5 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-sm font-bold transition-colors"
                        >
                          답글 등록
                        </button>
                      </div>
                    )
                  )}
                </div>
              ) : (
                /* 리뷰가 없고 고객이 보고 있을 때 -> 리뷰 작성 폼 */
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
                    <button
                      onClick={handleReviewSubmit}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold transition-colors"
                    >
                      <Send size={16} /> 리뷰 등록하기
                    </button>
                  </div>
                )
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}