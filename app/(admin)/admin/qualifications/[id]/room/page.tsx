// src/app/(admin)/admin/qualifications/[id]/room/page.tsx (전체 덮어쓰기)
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play, Users, Smartphone, Loader2, Settings, ExternalLink, QrCode, MonitorPlay } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface Student {
  sessionId: number;
  centerName: string;
  studentName: string;
}

export default function ExamWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id;

  const [loading, setLoading] = useState(true);
  const [examStatus, setExamStatus] = useState("READY"); // 시험 상태 관리
  const [students, setStudents] = useState<Student[]>([]);
  const [questionCount, setQuestionCount] = useState(30);
  const [isStarting, setIsStarting] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. 현재 시험 상태만 조회 (자동 오픈 안 함)
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.ok) setExamStatus(data.data.exam.status);
      } catch (error) {
        console.error("상태 조회 에러:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();

    // 2. 소켓 연결 (수강생 입장 감지)
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    socketRef.current = io(backendUrl, {
      transports: ['websocket'], // 💡 여기 추가
    });
    socketRef.current.on('new_student', (data: any) => {
      if (data.examId === Number(examId)) setStudents(prev => [...prev, data]);
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [examId]);

  // 💡 수동으로 QR 오픈 API 호출
  const handleOpenQr = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}/qr-open`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.ok) {
        setExamStatus("QR_OPEN");
        alert("QR 대기실이 오픈되었습니다. 프로젝터 화면에 QR코드가 노출됩니다.");
      }
    } catch (error) {
      alert("오픈 실패");
    }
  };

  const handleStartExam = async () => {
    if (!confirm("시험을 시작하시겠습니까?")) return;
    try {
      setIsStarting(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}/start`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionCount })
      });
      const data = await res.json();
      if (data.ok) router.push(`/admin/qualifications/${examId}/results`);
      else { alert(data.message); setIsStarting(false); }
    } catch (error) { setIsStarting(false); }
  };

  const openProjectorScreen = () => {
    window.open(`/qualifications/${examId}`, '_blank', 'width=1280,height=800,fullscreen=yes');
  };

  if (loading) return <div className="p-10 text-center">조회 중...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-100px)] flex flex-col">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/admin/qualifications/${examId}`} className="p-2 bg-white rounded-full border">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div><h1 className="text-2xl font-bold">시험 통제 조종석</h1></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <div className="flex flex-col gap-6">
          
          {/* 💡 프로젝터 띄우기 버튼 */}
          <div className="bg-white border rounded-2xl p-6 flex flex-col gap-3">
            <h2 className="font-bold flex items-center gap-2"><MonitorPlay /> 1단계: 화면 세팅</h2>
            <button onClick={openProjectorScreen} className="bg-slate-800 text-white font-bold py-3 rounded-xl flex justify-center gap-2">
              <ExternalLink size={20} /> 프로젝터용 화면(새창) 열기
            </button>
          </div>

          {/* 💡 QR 오픈 및 시작 컨트롤 */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-bold flex items-center gap-2"><QrCode /> 2단계: 통제</h2>
            
            {examStatus === "READY" ? (
              <button onClick={handleOpenQr} className="bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg">
                수강생 입장 허용 (QR코드 띄우기)
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-indigo-200 text-sm">
                  현재 프로젝터에 QR코드가 노출 중입니다.
                </div>
                <div className="flex gap-2 items-center">
                  <input type="number" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))} className="w-24 px-3 py-2 border rounded-lg" />
                  <span>문제 출제</span>
                </div>
                <button onClick={handleStartExam} disabled={isStarting} className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl">
                  {isStarting ? "시작 중..." : "시험 시작하기"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 접속자 명단 (기존과 동일하므로 코드 축약) */}
        <div className="bg-white rounded-2xl border flex flex-col min-h-0">
          <div className="p-5 border-b bg-slate-50 font-bold">입장 완료 수강생: {students.length}명</div>
          <div className="flex-1 overflow-y-auto p-2">
            {students.map((s, i) => (
              <div key={s.sessionId} className="p-3 border-b">{i+1}. {s.centerName} - {s.studentName}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}