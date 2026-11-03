// src/app/(admin)/admin/qualifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Settings, Calendar, Hash, FileQuestion } from "lucide-react";

interface Exam {
  id: number;
  year: number;
  sessionNumber: number;
  status: 'READY' | 'QR_OPEN' | 'STARTED' | 'CLOSED';
  questionCount: number;
  passingScore: number;
  createdAt: string;
}

export default function QualificationsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExam, setNewExam] = useState({
    year: new Date().getFullYear(),
    sessionNumber: 1,
    questionCount: 30,
  });

  // 목록 불러오기
  const fetchExams = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.ok) {
        setExams(data.data);
      }
    } catch (error) {
      console.error("시험 목록 로드 에러:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  // 신규 시험 생성
  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("새로운 시험 회차를 생성하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newExam),
      });

      const data = await res.json();
      if (data.ok) {
        alert("시험이 성공적으로 생성되었습니다.");
        setIsModalOpen(false);
        fetchExams(); // 목록 새로고침
      } else {
        alert(data.message || "생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("시험 생성 에러:", error);
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  // 상태 배지(Badge) 색상 함수
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">대기 중</span>;
      case 'QR_OPEN': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-600">QR 대기실 오픈</span>;
      case 'STARTED': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600">시험 진행 중</span>;
      case 'CLOSED': return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-600">종료됨</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">에어컨세척자격증 시험 관리</h1>
          <p className="text-slate-500 mt-1">자격증 시험 회차를 생성하고 관리할 수 있습니다.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          신규 시험 생성
        </button>
      </div>

      {/* 목록 테이블 영역 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-semibold">NO</th>
                <th className="px-6 py-4 font-semibold">시험명 (년도/회차)</th>
                <th className="px-6 py-4 font-semibold">진행 상태</th>
                <th className="px-6 py-4 font-semibold">출제 문항 수</th>
                <th className="px-6 py-4 font-semibold">합격 기준</th>
                <th className="px-6 py-4 font-semibold">등록일</th>
                <th className="px-6 py-4 font-semibold text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : exams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    등록된 시험이 없습니다.
                  </td>
                </tr>
              ) : (
                exams.map((exam, index) => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{exam.id}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {exam.year}년 {exam.sessionNumber}회차 자격증 시험
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(exam.status)}</td>
                    <td className="px-6 py-4 text-slate-600">{exam.questionCount}문제</td>
                    <td className="px-6 py-4 text-slate-600">{exam.passingScore}점 이상</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(exam.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/admin/qualifications/${exam.id}`}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium transition-colors"
                      >
                        <Settings size={16} /> 상세/관리
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 신규 시험 생성 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">신규 시험 회차 생성</h3>
            </div>
            <form onSubmit={handleCreateExam} className="p-6 space-y-5">
              
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
                  <Calendar size={16} className="text-slate-400" />
                  시험 년도
                </label>
                <input
                  type="number"
                  required
                  value={newExam.year}
                  onChange={(e) => setNewExam({ ...newExam, year: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
                  <Hash size={16} className="text-slate-400" />
                  시험 회차
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newExam.sessionNumber}
                  onChange={(e) => setNewExam({ ...newExam, sessionNumber: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-1.5">
                  <FileQuestion size={16} className="text-slate-400" />
                  출제 문항 수 (기본값)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="100"
                  value={newExam.questionCount}
                  onChange={(e) => setNewExam({ ...newExam, questionCount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="예: 30"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  * 추후 시험 대기실에서 시작할 때 이 숫자를 변경할 수 있습니다.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                >
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}