"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export default function AdminAnswerOverridePage() {
  const params = useParams();
  const router = useRouter();
  
  // URL 경로에서 파라미터 추출 (/admin/qualifications/[id]/session/[sessionId])
  const examId = params.id; 
  const sessionId = params.sessionId;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 데이터 로드
  const fetchReview = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/qualifications/session/${sessionId}/review`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
      } else {
        alert(json.message);
        router.back();
      }
    } catch (error) {
      alert("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) fetchReview();
  }, [sessionId]);

  // 💡 관리자 답안 강제 변경 핸들러
  const handleOverrideAnswer = async (questionId: number, newAnswer: string, currentAnswer: string) => {
    if (newAnswer === currentAnswer) return; // 이미 체크된 답이면 무시
    
    if (!confirm(`수강생의 답안을 강제로 변경하시겠습니까?\n선택 시 즉시 재채점되어 결과에 반영됩니다.`)) return;

    try {
      setIsUpdating(true);
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/qualifications/session/${sessionId}/admin-override`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ questionId, submittedAnswer: newAnswer })
      });
      
      const json = await res.json();
      if (json.ok) {
        alert("성공적으로 변경 및 재채점되었습니다.");
        fetchReview(); // 변경된 점수 및 표기를 위해 화면 새로고침
      } else {
        alert(json.message);
      }
    } catch (error) {
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || !data) return <div className="min-h-screen bg-slate-50 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  const { session, questions, savedAnswers } = data;
  const answerMap: { [key: number]: { submittedAnswer: string; isCorrect: boolean } } = {};
  savedAnswers.forEach((ans: any) => { answerMap[ans.questionId] = { submittedAnswer: ans.submittedAnswer, isCorrect: ans.isCorrect }; });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-white px-6 py-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
        {/* 💡 뒤로가기 누르면 이전 페이지(해당 시험 회차의 현황판)로 정확히 이동 */}
        <button onClick={() => router.push(`/admin/qualifications/${examId}/results`)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-black text-slate-800 text-xl flex items-center gap-2">
            관리자 답안 수정 및 재채점 모드
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            <span className="font-bold text-indigo-600">{session.centerName} {session.studentName}</span> 님의 시험지입니다. 보기를 클릭하여 학생의 답을 수정할 수 있습니다.
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs font-bold text-slate-400 mb-1">현재 점수</div>
          <div className="text-3xl font-black text-slate-800">{session.score}<span className="text-lg">점</span></div>
          {session.isPassed ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">합격</span> : <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-bold">불합격</span>}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-700 text-sm font-medium">
        <AlertCircle size={20} className="flex-shrink-0" />
        <p>주의: 보기를 클릭하면 즉시 해당 학생의 답안으로 덮어씌워지며 점수가 재계산됩니다.</p>
      </div>

      <div className="space-y-6">
        {questions.map((q: any, idx: number) => {
          const userAns = answerMap[q.id];
          const isCorrect = userAns?.isCorrect;
          const currentStudentAnswer = userAns?.submittedAnswer || "";

          return (
            <div key={q.id} className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${isUpdating ? 'opacity-50 pointer-events-none' : 'border-slate-200'}`}>
              <div className="flex gap-3 mb-5">
                {isCorrect ? <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={28} /> : <XCircle className="text-rose-500 flex-shrink-0" size={28} />}
                <h3 className="text-lg font-bold text-slate-800 break-keep leading-relaxed">
                  {idx + 1}. {q.content}
                </h3>
              </div>

              <div className="space-y-2 mt-4 pl-10">
                {q.options.map((opt: string, optIdx: number) => {
                  const isMyAnswer = currentStudentAnswer === opt;
                  const isActualAnswer = q.correctAnswer === opt;

                  let boxClass = "border-slate-100 bg-slate-50 text-slate-500 hover:border-indigo-300 cursor-pointer";
                  if (isActualAnswer) boxClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-sm cursor-pointer";
                  else if (isMyAnswer && !isActualAnswer) boxClass = "border-rose-400 bg-rose-50 text-rose-700 opacity-80 cursor-pointer";

                  return (
                    <div 
                      key={optIdx} 
                      onClick={() => handleOverrideAnswer(q.id, opt, currentStudentAnswer)}
                      className={`p-4 rounded-xl border-2 ${boxClass} flex items-center gap-2 transition-all`}
                    >
                      <span>{opt}</span>
                      {isMyAnswer && <span className="ml-auto text-xs font-black bg-slate-800 text-white px-2 py-1 rounded shadow-sm">학생 선택</span>}
                      {isActualAnswer && <span className={`ml-auto text-xs font-black px-2 py-1 rounded shadow-sm ${isMyAnswer ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>정답</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}