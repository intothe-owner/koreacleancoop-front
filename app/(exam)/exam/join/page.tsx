"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Building2, LogIn, ClipboardList, Loader2, PlayCircle } from "lucide-react";

export default function ExamJoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 ?token=... 값 추출
  const token = searchParams.get("token");

  const [centerName, setCenterName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  // 기존 진행 중인 세션 유무
  const [hasExistingSession, setHasExistingSession] = useState(false);

  useEffect(() => {
    // 1. 토큰 확인
    if (!token) {
      alert("유효하지 않은 접근입니다. QR 코드를 다시 스캔해 주세요.");
      return;
    }

    // 2. 기존 진행 중인 세션(이어풀기)이 있는지 확인
    const savedSessionId = localStorage.getItem("sessionId");
    if (savedSessionId) {
      setHasExistingSession(true);
    }
    setCheckingSession(false);
  }, [token]);

  // 💡 입장하기 (신규 진입)
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerName.trim() || !studentName.trim()) {
      return alert("센터명과 이름을 모두 입력해 주세요.");
    }

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: token, centerName, studentName }),
      });

      const data = await res.json();

      if (data.ok) {
        // 백엔드에서 발급한 세션 ID를 기기에 저장 (이어풀기 용도)
        localStorage.setItem("sessionId", data.data.sessionId.toString());
        localStorage.setItem("examId", data.data.examId.toString());

        // 시험 상태에 따라 대기실 또는 바로 시험 화면으로 이동
        if (data.data.examStatus === 'STARTED') {
          router.push("/exam/play"); // 이미 시작된 경우 바로 풀기 화면으로
        } else {
          router.push("/exam/waiting"); // 시작 전인 경우 대기실로
        }
      } else {
        alert(data.message || "입장에 실패했습니다.");
        setLoading(false);
      }
    } catch (error) {
      console.error("입장 에러:", error);
      alert("서버와 통신 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  // 💡 이어풀기 (기존 세션 사용)
  const handleResume = () => {
    // 플레이 화면으로 넘기면, 해당 화면에서 API로 현재 진행 상황을 긁어옴
    router.push("/exam/play");
  };

  // 💡 기존 세션 삭제하고 새로 입장하기
  const handleResetSession = () => {
    if (confirm("기존 시험 기록이 모두 초기화됩니다. 처음부터 다시 입장하시겠습니까?")) {
      localStorage.removeItem("sessionId");
      localStorage.removeItem("examId");
      setHasExistingSession(false);
    }
  };

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        
        <div className="p-8 text-center border-b border-slate-100">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={32} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">에어컨 세척 자격증</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">인적사항을 입력하고 시험에 입장해 주세요.</p>
        </div>

        {/* 💡 기존 진행 중이던 세션이 있는 경우 (이어풀기 UI) */}
        {hasExistingSession ? (
          <div className="p-8 space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-center">
              <h3 className="font-bold text-amber-800 text-lg mb-2">진행 중인 시험이 있습니다!</h3>
              <p className="text-amber-700 text-sm mb-4 leading-relaxed">
                이전에 접속하여 풀고 있던 시험 기록이 발견되었습니다. 이어서 진행하시겠습니까?
              </p>
              <button 
                onClick={handleResume}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 mb-2 shadow-lg shadow-indigo-600/20"
              >
                <PlayCircle size={20} /> 이어서 풀기
              </button>
              <button 
                onClick={handleResetSession}
                className="w-full text-slate-500 font-medium py-3 text-sm underline underline-offset-4"
              >
                아니요, 처음부터 다시 입력할게요.
              </button>
            </div>
          </div>
        ) : (
          /* 💡 신규 입장 폼 */
          <form onSubmit={handleJoin} className="p-8 space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Building2 size={18} className="text-indigo-500" />
                센터(소속)명
              </label>
              <input
                type="text"
                required
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                placeholder="예: 서울 강남센터"
                className="w-full px-5 py-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg font-medium"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <User size={18} className="text-indigo-500" />
                수강생 이름
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="실명을 입력해 주세요"
                className="w-full px-5 py-4 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-lg font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <><LogIn size={20} /> 입장하기</>
              )}
            </button>
          </form>
        )}
      </div>
      
      <p className="mt-8 text-slate-400 text-xs text-center">
        * 본 시험 시스템은 스마트폰 세로 모드에 최적화되어 있습니다.
      </p>
    </div>
  );
}