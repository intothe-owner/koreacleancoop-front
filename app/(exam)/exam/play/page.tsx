"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

interface Question {
    id: number;
    content: string;
    options: string[];
}

export default function ExamPlayPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);

    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // 사용자가 체크한 답안들 상태 관리: { questionId: "선택한보기텍스트" }
    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const localSessionId = localStorage.getItem("sessionId");
        if (!localSessionId) {
            alert("세션 정보가 없습니다. 다시 입장해 주세요.");
            router.replace("/exam/join");
            return;
        }
        setSessionId(localSessionId);
        fetchPlayData(localSessionId);
    }, []);

    const fetchPlayData = async (sid: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/session/${sid}/play-data`);
      const data = await res.json();

      if (data.ok) {
        // 이미 제출된 시험이면 결과창으로 강제 이동
        if (data.data.session.isSubmitted) {
          router.replace("/exam/result");
          return;
        }

        // 시험이 아직 시작되지 않았다면 대기 안내 (또는 조인으로 이동)
        if (data.data.examStatus !== 'STARTED') {
          alert("아직 시험이 시작되지 않았습니다.");
          router.replace("/exam/join");
          return;
        }

        if (!data.data.questions || data.data.questions.length === 0) {
          alert("배정된 문제가 없습니다. 관리자에게 문의해 주세요.");
          localStorage.removeItem("sessionId");
          router.replace("/exam/join");
          return;
        }

        setQuestions(data.data.questions);
        
        // 서버에 저장되어 있던 기존 답안 복원
        const restoredAnswers: { [key: number]: string } = {};
        let lastAnsweredIndex = 0;

        data.data.savedAnswers.forEach((ans: any) => {
          restoredAnswers[ans.questionId] = ans.submittedAnswer;
        });
        setAnswers(restoredAnswers);

        // 안 푼 문제 중 가장 첫 번째 문제로 인덱스 이동 (이어풀기 최적화)
        for (let i = 0; i < data.data.questions.length; i++) {
          if (!restoredAnswers[data.data.questions[i].id]) {
            lastAnsweredIndex = i;
            break;
          }
        }
        setCurrentIndex(lastAnsweredIndex);

      } else {
        // 💡 [수정됨] 세션 조회 실패 시 스토리지 비우고 join으로 강제 이동
        alert(data.message || "세션 정보가 유효하지 않습니다.");
        localStorage.removeItem("sessionId");
        localStorage.removeItem("examId");
        router.replace("/exam/join");
      }
    } catch (error) {
      alert("데이터를 불러오지 못했습니다.");
      // 💡 네트워크 오류 등 치명적 오류 시에도 초기화 후 튕겨내기
      localStorage.removeItem("sessionId");
      localStorage.removeItem("examId");
      router.replace("/exam/join");
    } finally {
      setLoading(false);
    }
  };

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    // 보기 선택 핸들러
    const handleSelectOption = (optionText: string) => {
        if (!currentQuestion) return;
        setAnswers({ ...answers, [currentQuestion.id]: optionText });
    };

    // [이전] 버튼 핸들러
    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    // [다음] 버튼 핸들러 (서버에 중간 저장)
    const handleNext = async () => {
        if (!currentQuestion) return;
        const selectedAnswer = answers[currentQuestion.id];
        if (!selectedAnswer) return alert("답안을 선택해 주세요.");

        try {
            setIsSaving(true);
            // 백엔드에 1문항 임시 저장
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/session/${sessionId}/answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: currentQuestion.id, submittedAnswer: selectedAnswer })
            });
            // 다음 문제로 이동
            if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
        } catch (error) {
            console.error("중간 저장 에러:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // [최종 제출] 핸들러
    const handleSubmit = async () => {
        const selectedAnswer = answers[currentQuestion.id];
        if (!selectedAnswer) return alert("마지막 문제의 답안을 선택해 주세요.");

        // 전체 문항 중 안 푼 문제가 있는지 검사
        const unanswered = questions.filter(q => !answers[q.id]);
        if (unanswered.length > 0) {
            if (!confirm(`아직 풀지 않은 문제가 ${unanswered.length}개 있습니다. 그래도 제출하시겠습니까?`)) return;
        } else {
            if (!confirm("답안을 최종 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.")) return;
        }

        try {
            setIsSaving(true);
            // 서버 요구 규격에 맞춰 전체 답안 배열 만들기
            const answersArray = Object.keys(answers).map(qId => ({
                questionId: Number(qId),
                submittedAnswer: answers[Number(qId)]
            }));

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/session/${sessionId}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: answersArray })
            });

            const data = await res.json();
            if (data.ok) {
                // 제출 성공 시 결과 화면으로 이동
                router.replace("/exam/result");
            } else {
                alert(data.message || "제출에 실패했습니다.");
            }
        } catch (error) {
            alert("제출 중 서버 오류가 발생했습니다.");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading || !currentQuestion) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* 상단 진행률 바 */}
            <div className="bg-white px-5 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="text-sm font-bold text-slate-500">
                    <span className="text-indigo-600 text-lg">{currentIndex + 1}</span> / {questions.length}
                </div>
                <div className="flex-1 mx-4 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
                <div className="text-xs font-bold text-slate-400">자격증 시험</div>
            </div>

            {/* 문제 영역 */}
            <div className="flex-1 p-5 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
                    <h2 className="text-xl font-bold text-slate-800 leading-relaxed break-keep">
                        <span className="text-indigo-600 mr-2">Q{currentIndex + 1}.</span>
                        {currentQuestion.content}
                    </h2>
                </div>

                {/* 보기 영역 */}
                <div className="space-y-3">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = answers[currentQuestion.id] === option;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelectOption(option)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3
                  ${isSelected
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                  ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'}`}>
                                    {isSelected && <CheckCircle2 size={16} />}
                                </div>
                                <span className={`text-base font-medium leading-snug break-keep ${isSelected ? 'font-bold' : ''}`}>
                                    {option}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 하단 네비게이션 */}
            <div className="bg-white border-t border-slate-200 p-4 flex gap-3 pb-8">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0 || isSaving}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-xl flex items-center justify-center gap-1 disabled:opacity-50"
                >
                    <ChevronLeft size={20} /> 이전
                </button>

                {isLastQuestion ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex-[2] py-4 bg-rose-600 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : "최종 제출하기"}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={isSaving}
                        className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={20} /> : <>다음 <ChevronRight size={20} /></>}
                    </button>
                )}
            </div>
        </div>
    );
}