// src/app/(admin)/admin/qualifications/[id]/results/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search, Download, Award, Users, AlertCircle, FileSpreadsheet, PowerOff, Lock } from "lucide-react";
import * as XLSX from "xlsx";
import { io, Socket } from "socket.io-client";

interface ExamSession {
  id: number;
  centerName: string;
  studentName: string;
  score: number;
  isPassed: boolean;
  isSubmitted: boolean;
  createdAt: string;
}

interface ExamStats {
  totalParticipants: number;
  passedParticipants: number;
  passRate: number;
}

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id;

  const [loading, setLoading] = useState(true);
  const [examStatus, setExamStatus] = useState<string>(""); // 💡 시험 상태 추가
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [stats, setStats] = useState<ExamStats>({ totalParticipants: 0, passedParticipants: 0, passRate: 0 });
  
  const [filter, setFilter] = useState("all"); 
  const [keyword, setKeyword] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const socketRef = useRef<Socket | null>(null);

  const fetchResults = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const token = localStorage.getItem("token");
      
      // 1. 시험 상태 조회 (종료 여부 확인용)
      const examRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const examData = await examRes.json();
      if (examData.ok) {
        setExamStatus(examData.data.exam.status);
      }

      // 2. 응시자 결과 목록 조회
      const queryParams = new URLSearchParams();
      if (filter !== "all") queryParams.append("isPassed", filter);
      if (keyword) queryParams.append("keyword", keyword);
      queryParams.append("pageSize", "1000"); 

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}/sessions?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.ok) {
        setSessions(data.data);
        setStats(data.stats);
      } else {
        if (!isSilent) alert(data.message || "데이터를 불러오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("결과 조회 에러:", error);
    } finally {
      setLoading(false);
    }
  }, [examId, filter, keyword]);

  useEffect(() => {
    fetchResults();

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    socketRef.current = io(backendUrl, { transports: ['websocket'] });

    socketRef.current.on('student_submitted', (data: any) => {
      if (data.examId === Number(examId)) fetchResults(true);
    });

    socketRef.current.on('new_student', (data: any) => {
      if (data.examId === Number(examId)) fetchResults(true);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [fetchResults, examId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  // 💡 시험 종료 처리 함수
  const handleCloseExam = async () => {
    if (!confirm("시험을 강제로 종료하시겠습니까?\n종료 후에는 더 이상 수강생이 접속하거나 답안을 제출할 수 없습니다.")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}/close`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.ok) {
        alert("시험이 완전히 종료되었습니다.");
        setExamStatus("CLOSED");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("서버 통신 중 오류가 발생했습니다.");
    }
  };

  const handleExportExcel = () => {
    if (sessions.length === 0) return alert("다운로드할 데이터가 없습니다.");
    if (!confirm("현재 조회된 명단을 엑셀로 다운로드 하시겠습니까?")) return;

    const excelData = sessions.map((session, index) => ({
      '순번': index + 1,
      '센터명': session.centerName,
      '수강생 이름': session.studentName,
      '제출 여부': session.isSubmitted ? '제출 완료' : '미제출(진행중)',
      '최종 점수': session.isSubmitted ? `${session.score}점` : '-',
      '합격 여부': !session.isSubmitted ? '판독 불가' : (session.isPassed ? '합격' : '불합격'),
      '접속 일시': new Date(session.createdAt).toLocaleString('ko-KR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "합격자 현황");

    worksheet["!cols"] = [
      { wpx: 50 }, { wpx: 150 }, { wpx: 120 }, { wpx: 100 }, { wpx: 80 }, { wpx: 80 }, { wpx: 180 }
    ];

    XLSX.writeFile(workbook, `에어컨세척자격증_${examId}회차_결과현황.xlsx`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 상단 헤더 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/admin/qualifications/${examId}`} className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              시험 결과 및 합격자 현황판
              {examStatus === 'CLOSED' && (
                <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Lock size={12} /> 마감됨
                </span>
              )}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">실시간으로 응시자들의 점수와 합격 여부가 업데이트됩니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 💡 시험 종료 버튼 (이미 종료되었으면 숨김) */}
          {examStatus !== 'CLOSED' && (
            <button 
              onClick={handleCloseExam}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm"
            >
              <PowerOff size={18} />
              시험 완전 종료
            </button>
          )}

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-sm"
          >
            <FileSpreadsheet size={18} />
            엑셀(Excel) 다운로드
          </button>
        </div>
      </div>

      {/* 요약 통계 대시보드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-5 transition-all">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Users size={28} />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">최종 제출 / 총 응시자</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-800">{stats.totalParticipants}</h3>
              <span className="text-slate-500 font-medium">명</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-5 transition-all">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <Award size={28} />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">합격자 수</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-green-600">{stats.passedParticipants}</h3>
              <span className="text-slate-500 font-medium">명</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-5 transition-all">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <div>
            <p className="text-slate-500 font-medium text-sm mb-1">전체 합격률</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-indigo-600">{stats.passRate}</h3>
              <span className="text-slate-500 font-medium">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          {['all', 'true', 'false'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                filter === f 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f === 'all' ? '전체 보기' : f === 'true' ? '합격자만' : '불합격자만'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="센터명 또는 이름 검색"
            className="flex-1 md:w-64 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* 결과 표 영역 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">NO</th>
                <th className="px-6 py-4">센터명</th>
                <th className="px-6 py-4">수강생 이름</th>
                <th className="px-6 py-4">진행 상태</th>
                <th className="px-6 py-4 text-center">점수</th>
                <th className="px-6 py-4 text-center">결과</th>
                <th className="px-6 py-4">접속 시간</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    결과 데이터를 불러오는 중입니다...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    조회된 응시 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                sessions.map((session, index) => (
                  <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 font-bold text-slate-700">{session.centerName}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{session.studentName}</td>
                    
                    <td className="px-6 py-4">
                      {session.isSubmitted ? (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold transition-all">제출 완료</span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded font-bold animate-pulse">시험 진행중</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {session.isSubmitted ? (
                        <span className={`text-lg font-black ${session.isPassed ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {session.score}점
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {!session.isSubmitted ? (
                        <span className="text-slate-300">-</span>
                      ) : session.isPassed ? (
                        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 font-black rounded-full text-sm border border-green-200">
                          합격
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 bg-red-50 text-red-600 font-bold rounded-full text-sm border border-red-100">
                          불합격
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(session.createdAt).toLocaleString('ko-KR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}