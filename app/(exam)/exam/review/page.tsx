"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Download } from "lucide-react";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";

// 💡 메인 컴포넌트 (Suspense 내부에서 렌더링됨)
function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("sessionId");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      alert("잘못된 접근입니다.");
      router.back();
      return;
    }

    const fetchReview = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/session/${sessionId}/review`);
        const json = await res.json();
        if (json.ok) {
          setData(json.data);
        } else {
          alert(json.message);
          router.back();
        }
      } catch (error) {
        alert("데이터를 불러오지 못했습니다.");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchReview();
  }, [sessionId, router]);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;

    try {
      setIsDownloading(true);
      
      const dataUrl = await toJpeg(printRef.current, {
        cacheBust: true,
        backgroundColor: "#f8fafc",
        pixelRatio: 1.5, // 해상도 최적화
        quality: 0.6,    // 용량 압축 (1/10 수준)
        filter: (node) => {
          if (node.hasAttribute && node.hasAttribute("data-html2canvas-ignore")) return false;
          return true;
        },
      });

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(dataUrl, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`자격증_정답지_${data.session.studentName}.pdf`);
      
    } catch (error) {
      console.error("PDF 생성 에러:", error);
      alert("PDF 다운로드 중 오류가 발생했습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex justify-center items-center"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;
  if (!data) return null;

  const { session, questions, savedAnswers } = data;

  const answerMap: { [key: number]: { submittedAnswer: string; isCorrect: boolean } } = {};
  savedAnswers.forEach((ans: any) => {
    answerMap[ans.questionId] = { submittedAnswer: ans.submittedAnswer, isCorrect: ans.isCorrect };
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-10" ref={printRef}>
      <div className="bg-white px-5 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button data-html2canvas-ignore="true" onClick={() => router.back()} className="p-2 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full text-slate-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">상세 정답지 확인</h1>
            <p className="text-xs text-slate-500">{session.centerName} {session.studentName} 님 ({session.score}점)</p>
          </div>
        </div>

        <button
          data-html2canvas-ignore="true"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-2 rounded-lg font-bold text-sm hover:bg-indigo-100 transition-colors"
        >
          {isDownloading ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
          <span className="hidden sm:inline">PDF 다운로드</span>
        </button>
      </div>

      <div className="p-5 space-y-6 max-w-4xl mx-auto">
        {questions.map((q: any, idx: number) => {
          const userAns = answerMap[q.id];
          const isCorrect = userAns?.isCorrect;

          return (
            <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 break-inside-avoid">
              <div className="flex gap-3 mb-4">
                {isCorrect ? <CheckCircle2 className="text-emerald-500 flex-shrink-0" size={28} /> : <XCircle className="text-rose-500 flex-shrink-0" size={28} />}
                <h3 className="text-lg font-bold text-slate-800 break-keep leading-relaxed">
                  {idx + 1}. {q.content}
                </h3>
              </div>

              <div className="space-y-2 mt-4 pl-10">
                {q.options.map((opt: string, optIdx: number) => {
                  const isMyAnswer = userAns?.submittedAnswer === opt;
                  const isActualAnswer = q.correctAnswer === opt;

                  let boxClass = "border-slate-100 bg-slate-50 text-slate-500"; 
                  if (isActualAnswer) boxClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-sm"; 
                  else if (isMyAnswer && !isActualAnswer) boxClass = "border-rose-400 bg-rose-50 text-rose-700 line-through opacity-80"; 

                  return (
                    <div key={optIdx} className={`p-4 rounded-xl border-2 ${boxClass} flex items-center gap-2`}>
                      <span>{opt}</span>
                      {isMyAnswer && <span className="ml-auto text-xs font-black bg-white px-2 py-1 rounded shadow-sm border border-slate-200">내 선택</span>}
                      {isActualAnswer && <span className="ml-auto text-xs font-black bg-emerald-500 text-white px-2 py-1 rounded shadow-sm">정답</span>}
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

// 💡 Next.js 빌드 에러 방지용 Suspense 래퍼
export default function ExamReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-500" size={40} /></div>}>
      <ReviewContent />
    </Suspense>
  );
}