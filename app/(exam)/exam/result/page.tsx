"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Award, XCircle, Home, ClipboardCheck } from "lucide-react";

export default function ExamResultPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState<any>(null);

  useEffect(() => {
    const localSessionId = localStorage.getItem("sessionId");
    if (!localSessionId) {
      alert("조회할 결과 정보가 없습니다.");
      router.replace("/exam/join");
      return;
    }

    const fetchResult = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/qualifications/session/${localSessionId}/play-data`);
        const data = await res.json();

        if (data.ok) {
          if (!data.data.session.isSubmitted) {
            alert("아직 제출이 완료되지 않았습니다.");
            router.replace("/exam/play");
            return;
          }
          setResultData(data.data.session);
        } else {
          // 💡 [수정됨] 세션을 찾을 수 없을 때 초기화 및 튕겨내기
          alert(data.message || "결과 정보를 찾을 수 없습니다.");
          localStorage.removeItem("sessionId");
          localStorage.removeItem("examId");
          router.replace("/exam/join");
        }
      } catch (error) {
        console.error("결과 조회 에러:", error);
        alert("통신 오류가 발생했습니다.");
        localStorage.removeItem("sessionId");
        localStorage.removeItem("examId");
        router.replace("/exam/join");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [router]);

  const handleGoHome = () => {
    // 세션 클리어 후 첫 화면으로
    localStorage.removeItem("sessionId");
    localStorage.removeItem("examId");
    router.replace("/");
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;
  }

  if (!resultData) return null;

  const { isPassed, score, studentName, centerName } = resultData;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* 상단 띠 */}
        <div className={`h-3 w-full ${isPassed ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
        
        <div className="p-8 text-center">
          
          <div className="flex justify-center mb-6">
            {isPassed ? (
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center relative animate-in zoom-in duration-500">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                <Award size={48} className="text-emerald-600" />
              </div>
            ) : (
              <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center animate-in zoom-in duration-500">
                <XCircle size={48} className="text-rose-600" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-2">
            {isPassed ? "합격을 축하합니다!" : "아쉽게도 불합격입니다."}
          </h2>
          <p className="text-slate-500 font-medium mb-8">
            {centerName} <span className="text-slate-800 font-bold">{studentName}</span> 님의 시험 결과
          </p>

          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8">
            <p className="text-sm font-bold text-slate-500 mb-1">최종 획득 점수</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className={`text-5xl font-black tracking-tighter ${isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                {score}
              </span>
              <span className="text-xl font-bold text-slate-400">점</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoHome}
              className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-slate-900 transition-colors"
            >
              <Home size={20} /> 처음으로 돌아가기
            </button>
          </div>
          
        </div>
      </div>
      
      <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-sm font-medium">
        <ClipboardCheck size={16} /> 에어컨 세척 자격증 검정 시스템
      </div>
    </div>
  );
}