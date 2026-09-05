"use client";

import { useEffect, useState, useRef } from "react";
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

    const [answers, setAnswers] = useState<{ [key: number]: string }>({});
    const [isSaving, setIsSaving] = useState(false);

    // 💡 [4번 기능] 이벤트 리스너 안에서 최신 상태를 참조하기 위한 Ref
    const answersRef = useRef(answers);
    const sessionIdRef = useRef<string | null>(null);

    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        const localSessionId = localStorage.getItem("sessionId");
        if (!localSessionId) {
            alert("세션 정보가 없습니다. 다시 입장해 주세요.");
            router.replace("/exam/join");
            return;
        }
        setSessionId(localSessionId);
        sessionIdRef.current = localSessionId;
        fetchPlayData(localSessionId);

        // 💡 [4번 기능] 뒤로가기 방지용 빈 히스토리 스택 추가
        window.history.pushState(null, "", window.location.href);

        // 💡 [4번 기능] 강제 제출 함수 (화면 이탈 시 호출됨)
        const forceSubmitExam = () => {
            const sid = sessionIdRef.current;
            const currentAnswers = answersRef.current;
            const currentToken = localStorage.getItem("currentToken");

            if (!sid) return;

            // 1. 기기에 영구 낙인 찍기 (재응시 불가)
            if (currentToken) {
                localStorage.setItem(`submitted_token_${currentToken}`, "true");
            }

            // 2. 현재까지 푼 답안 배열로 변환
            const answersArray = Object.keys(currentAnswers).map(qId => ({
                questionId: Number(qId),
                submittedAnswer: currentAnswers[Number(qId)]
            }));

            // 3. 브라우저가 꺼지더라도 서버로 요청을 끝까지 보내는 옵션 (keepalive: true)
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/session/${sid}/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ answers: answersArray }),
                keepalive: true 
            }).catch(e => console.error("강제 제출 에러:", e));
        };

        // 💡 [4번 기능] 뒤로가기 감지 이벤트
        const handlePopState = () => {
            alert("뒤로가기가 감지되었습니다. 부정행위 방지를 위해 시험이 강제로 종료 및 제출됩니다.");
            forceSubmitExam();
            window.location.replace("/exam/result");
        };

        // 💡 [4번 기능] 화면 전환(앱 내리기, 브라우저 끄기 등) 감지 이벤트
        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                forceSubmitExam();
                // alert는 hidden 상태에서 씹힐 수 있으므로 동작만 수행
            }
        };

        // 이벤트 리스너 등록
        window.addEventListener("popstate", handlePopState);
        window.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    const fetchPlayData = async (sid: string) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/session/${sid}/play-data`);
            const data = await res.json();

            if (data.ok) {
                if (data.data.session.isSubmitted) {
                    router.replace("/exam/result");
                    return;
                }

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

                const restoredAnswers: { [key: number]: string } = {};
                let lastAnsweredIndex = 0;

                data.data.savedAnswers.forEach((ans: any) => {
                    restoredAnswers[ans.questionId] = ans.submittedAnswer;
                });
                setAnswers(restoredAnswers);

                for (let i = 0; i < data.data.questions.length; i++) {
                    if (!restoredAnswers[data.data.questions[i].id]) {
                        lastAnsweredIndex = i;
                        break;
                    }
                }
                setCurrentIndex(lastAnsweredIndex);

            } else {
                alert(data.message || "세션 정보가 유효하지 않습니다.");
                localStorage.removeItem("sessionId");
                localStorage.removeItem("examId");
                router.replace("/exam/join");
            }
        } catch (error) {
            alert("데이터를 불러오지 못했습니다.");
            localStorage.removeItem("sessionId");
            localStorage.removeItem("examId");
            router.replace("/exam/join");
        } finally {
            setLoading(false);
        }
    };

    const currentQuestion = questions[currentIndex];
    const isLastQuestion = currentIndex === questions.length - 1;

    const handleSelectOption = (optionText: string) => {
        if (!currentQuestion) return;
        setAnswers({ ...answers, [currentQuestion.id]: optionText });
    };

    const handlePrev = () => {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    };

    const handleNext = async () => {
        if (!currentQuestion) return;
        const selectedAnswer = answers[currentQuestion.id];
        if (!selectedAnswer) return alert("답안을 선택해 주세요.");

        try {
            setIsSaving(true);
            await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/session/${sessionId}/answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId: currentQuestion.id, submittedAnswer: selectedAnswer })
            });
            if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
        } catch (error) {
            console.error("중간 저장 에러:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        const selectedAnswer = answers[currentQuestion.id];
        if (!selectedAnswer) return alert("마지막 문제의 답안을 선택해 주세요.");

        const unanswered = questions.filter(q => !answers[q.id]);
        if (unanswered.length > 0) {
            if (!confirm(`아직 풀지 않은 문제가 ${unanswered.length}개 있습니다. 그래도 제출하시겠습니까?`)) return;
        } else {
            if (!confirm("답안을 최종 제출하시겠습니까? 제출 후에는 수정할 수 없습니다.")) return;
        }

        try {
            setIsSaving(true);
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
                const currentToken = localStorage.getItem("currentToken");
                if (currentToken) {
                    localStorage.setItem(`submitted_token_${currentToken}`, "true");
                }
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
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={50} /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <div className="bg-white px-6 py-5 shadow-sm flex items-center justify-between sticky top-0 z-10">
                <div className="text-base font-bold text-slate-500">
                    <span className="text-indigo-600 text-2xl">{currentIndex + 1}</span> / {questions.length}
                </div>
                <div className="flex-1 mx-5 bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    />
                </div>
                <div className="text-sm font-bold text-slate-400">자격증 시험</div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
                    <h2 className="text-2xl md:text-3xl font-black text-slate-800 leading-relaxed break-keep">
                        <span className="text-indigo-600 mr-3">Q{currentIndex + 1}.</span>
                        {currentQuestion.content}
                    </h2>
                </div>

                <div className="space-y-4">
                    {currentQuestion.options.map((option, idx) => {
                        const isSelected = answers[currentQuestion.id] === option;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelectOption(option)}
                                className={`w-full text-left p-5 md:p-6 rounded-2xl border-2 transition-all flex items-center gap-4
                  ${isSelected
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                                    }`}
                            >
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                  ${isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300'}`}>
                                    {isSelected && <CheckCircle2 size={20} />}
                                </div>
                                <span className={`text-lg md:text-xl leading-snug break-keep ${isSelected ? 'font-black' : 'font-bold'}`}>
                                    {option}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white border-t border-slate-200 p-5 flex gap-4 pb-10">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0 || isSaving}
                    className="flex-1 py-5 text-lg bg-slate-100 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-1 disabled:opacity-50"
                >
                    <ChevronLeft size={24} /> 이전
                </button>

                {isLastQuestion ? (
                    <button
                        onClick={handleSubmit}
                        disabled={isSaving}
                        className="flex-[2] py-5 text-xl bg-rose-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={28} /> : "최종 제출하기"}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={isSaving}
                        className="flex-[2] py-5 text-xl bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="animate-spin" size={28} /> : <>다음 <ChevronRight size={24} /></>}
                    </button>
                )}
            </div>
        </div>
    );
}