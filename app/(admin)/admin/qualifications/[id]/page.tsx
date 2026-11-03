"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MonitorPlay, Upload, FileSpreadsheet, ListChecks, Plus, X } from "lucide-react";

interface Exam {
  id: number;
  year: number;
  sessionNumber: number;
  status: string;
  questionCount: number;
}

interface Question {
  id: number;
  content: string;
  options: string[];
  correctAnswer: string;
}

export default function QualificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // 엑셀 업로드 상태
  const [file, setFile] = useState<File | null>(null);
  const [isOverwrite, setIsOverwrite] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // 💡 개별 문제 등록 모달 상태
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [manualForm, setManualForm] = useState({
    content: "",
    options: ["", "", "", ""],
    correctAnswerIndex: 0, // 기본 정답은 1번 보기
  });

  // 데이터 불러오기 (시험 정보 및 등록된 문제 목록)
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      
      if (data.ok) {
        setExam(data.data.exam);
        setQuestions(data.data.questions || []);
      } else {
        alert("데이터를 불러오는데 실패했습니다.");
        router.push("/admin/qualifications");
      }
    } catch (error) {
      console.error("상세 정보 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      fetchData();
    }
  }, [examId]);

  // 엑셀 파일 업로드 처리
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("엑셀 파일을 선택해 주세요.");
    if (!confirm("문제를 업로드 하시겠습니까?")) return;

    try {
      setIsUploading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("overwrite", String(isOverwrite));

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.ok) {
        alert(`성공적으로 업로드 되었습니다. (저장됨: ${data.saved}건)`);
        setFile(null);
        const fileInput = document.getElementById("excel-upload") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
        
        fetchData();
      } else {
        alert(data.message || "업로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("엑셀 업로드 에러:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 💡 개별 문제 등록 처리
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 유효성 검사
    if (!manualForm.content.trim()) return alert("문제 내용을 입력해 주세요.");
    const validOptions = manualForm.options.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) return alert("보기를 최소 2개 이상 입력해 주세요.");
    if (!manualForm.options[manualForm.correctAnswerIndex].trim()) {
      return alert("정답으로 체크된 보기가 비어있습니다.");
    }

    try {
      setIsSubmittingManual(true);
      const token = localStorage.getItem("token");
      
      const payload = {
        content: manualForm.content,
        options: validOptions,
        correctAnswer: manualForm.options[manualForm.correctAnswerIndex]
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok) {
        alert("문제가 등록되었습니다.");
        setIsManualModalOpen(false);
        // 폼 초기화
        setManualForm({ content: "", options: ["", "", "", ""], correctAnswerIndex: 0 });
        fetchData(); // 목록 새로고침
      } else {
        alert(data.message || "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("개별 문제 등록 에러:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSubmittingManual(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-slate-500">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 상단 헤더 및 뒤로가기 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/qualifications" className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {exam?.year}년 {exam?.sessionNumber}회차 자격증 시험
            </h1>
            <p className="text-slate-500 mt-1 text-sm">시험 문제를 세팅하고 대기실을 오픈하세요.</p>
          </div>
        </div>

        {exam?.status === 'STARTED' || exam?.status === 'CLOSED' ? (
          <Link
            href={`/admin/qualifications/${examId}/results`}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
          >
            <MonitorPlay size={20} />
            시험 결과 보기
          </Link>
        ) : (
          <Link
            href={`/admin/qualifications/${examId}/room`}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
          >
            <MonitorPlay size={20} />
            대기실 입장 및 시험 시작
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. 엑셀 업로드 폼 (좌측) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <FileSpreadsheet size={20} className="text-green-600" />
              문제 엑셀 업로드
            </h2>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">엑셀 파일 (.xlsx)</label>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 border border-slate-200 rounded-lg p-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="overwrite"
                  checked={isOverwrite}
                  onChange={(e) => setIsOverwrite(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="overwrite" className="text-sm text-slate-600">
                  기존 등록된 문제 전체 삭제 후 덮어쓰기
                </label>
              </div>

              <button
                type="submit"
                disabled={!file || isUploading}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white px-4 py-2.5 rounded-lg font-medium transition-colors"
              >
                <Upload size={18} />
                {isUploading ? "업로드 중..." : "엑셀 데이터 저장"}
              </button>
            </form>
            
            <div className="mt-4 p-4 bg-slate-50 rounded-lg text-xs text-slate-500 leading-relaxed">
              * 엑셀 첫 번째 줄(헤더)에 <strong>'문제내용', '보기1', '보기2'...'정답'</strong> 이라는 단어가 포함되어 있어야 시스템이 자동으로 인식합니다.
            </div>
          </div>
        </div>

        {/* 2. 등록된 문제 목록 (우측) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ListChecks size={20} className="text-indigo-600" />
                등록된 문제 목록
              </h2>
              
              <div className="flex items-center gap-3">
                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                  총 {questions.length}문제
                </span>
                {/* 💡 개별 문제 등록 버튼 */}
                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={16} />
                  개별 등록
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-0 max-h-[600px]">
              {questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <FileSpreadsheet size={48} className="mb-3 opacity-20" />
                  <p>등록된 문제가 없습니다.</p>
                  <p className="text-sm">좌측에서 업로드하거나 개별 등록해 주세요.</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {questions.map((q, idx) => (
                    <li key={q.id} className="p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 bg-slate-800 text-white w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold mt-0.5">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-base leading-relaxed break-keep">
                            {q.content}
                          </h4>
                          
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options && q.options.map((opt, optIdx) => (
                              <div 
                                key={optIdx} 
                                className={`px-3 py-2 rounded border text-sm flex gap-2
                                  ${String(q.correctAnswer).trim() === String(opt).trim() 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold' 
                                    : 'bg-white border-slate-200 text-slate-600'}`
                                }
                              >
                                <span className="text-slate-400 font-medium">{optIdx + 1}.</span> {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 💡 개별 문제 등록 모달 */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <h3 className="text-lg font-bold text-slate-800">개별 문제 등록</h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">문제 내용</label>
                <textarea
                  required
                  rows={3}
                  value={manualForm.content}
                  onChange={(e) => setManualForm({ ...manualForm, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                  placeholder="문제 내용을 입력하세요."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">보기 및 정답 체크</label>
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {manualForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={manualForm.correctAnswerIndex === idx}
                        onChange={() => setManualForm({ ...manualForm, correctAnswerIndex: idx })}
                        className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        title="이 보기를 정답으로 설정"
                      />
                      <span className="text-slate-500 font-bold w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...manualForm.options];
                          newOptions[idx] = e.target.value;
                          setManualForm({ ...manualForm, options: newOptions });
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg border outline-none transition-all ${
                          manualForm.correctAnswerIndex === idx 
                            ? 'border-indigo-400 bg-white ring-1 ring-indigo-400' 
                            : 'border-slate-300 focus:border-indigo-500'
                        }`}
                        placeholder={`보기 ${idx + 1} 내용`}
                      />
                    </div>
                  ))}
                  <p className="text-xs text-slate-500 mt-2 ml-8">
                    * 정답인 보기의 좌측 라디오 버튼을 체크해 주세요. 최소 2개의 보기가 필요합니다.
                  </p>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsManualModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-white transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={isSubmittingManual}
                className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors disabled:bg-slate-400"
              >
                {isSubmittingManual ? "등록 중..." : "문제 등록하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}