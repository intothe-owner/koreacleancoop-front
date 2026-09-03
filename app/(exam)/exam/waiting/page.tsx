"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock, Smartphone, AlertCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";

export default function ExamWaitingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const sessionId = localStorage.getItem("sessionId");
    const examId = localStorage.getItem("examId");

    if (!sessionId || !examId) {
      alert("입장 정보가 없습니다. QR 코드를 다시 스캔해 주세요.");
      router.replace("/exam/join");
      return;
    }

    // 1. 현재 시험 상태 확인 (새로고침 시 이미 시작되었는지 체크)
    const checkCurrentStatus = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/qualifications/session/${sessionId}/play-data`);
        const data = await res.json();
        
        if (data.ok) {
          setStudentName(data.data.session.studentName);
          
          if (data.data.examStatus === 'STARTED') {
            // 이미 시험이 시작된 상태라면 바로 플레이 화면으로 넘김
            router.replace("/exam/play");
            return;
          }
          if (data.data.session.isSubmitted) {
            router.replace("/exam/result");
            return;
          }
          setLoading(false);
        } else {
          // 세션 정보를 찾을 수 없는 경우
          localStorage.removeItem("sessionId");
          localStorage.removeItem("examId");
          alert("세션이 유효하지 않습니다. 다시 입장해 주세요.");
          router.replace("/exam/join");
        }
      } catch (error) {
        console.error("상태 확인 에러:", error);
        setLoading(false);
      }
    };

    checkCurrentStatus();

    // 2. Socket.io 실시간 연결 (시험 시작 감지)
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    socketRef.current = io(backendUrl, {
      transports: ['websocket'], // 빠른 연결을 위해 웹소켓 전용 설정
    });

    socketRef.current.on('exam_started', (data: any) => {
      // 내 시험 회차가 시작된 것이 맞는지 확인
      if (data.examId === Number(examId)) {
        // 💡 관리자가 시작 버튼을 누르면 자동으로 시험 화면으로 이동!
        router.replace("/exam/play");
      }
    });

    // 컴포넌트 언마운트 시 소켓 해제
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
        <p className="text-slate-500 font-bold">입장 정보를 확인하고 있습니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative text-center pb-8">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
        
        <div className="p-8 pb-4">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-20"></div>
            <Clock size={36} className="text-indigo-600" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-2">시험 대기 중입니다</h2>
          
          <p className="text-slate-500 font-medium bg-slate-50 inline-block px-4 py-2 rounded-full mb-6">
            <span className="text-indigo-600 font-bold">{studentName}</span> 님, 입장이 완료되었습니다.
          </p>
          
          <h3 className="text-lg font-bold text-slate-700 leading-relaxed break-keep mb-6">
            관리자가 시험을 시작하면<br/>
            화면이 자동으로 전환됩니다.
          </h3>
        </div>

        {/* 안내사항 박스 */}
        <div className="mx-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left flex gap-3">
          <AlertCircle size={24} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-amber-700 text-sm font-medium leading-relaxed">
            <p className="font-bold mb-1">주의사항</p>
            <ul className="list-disc pl-4 space-y-1 text-amber-600/90">
              <li>화면을 끄거나 앱을 종료하지 마세요.</li>
              <li>스마트폰의 배터리를 확인해 주세요.</li>
              <li>화면이 전환되면 바로 문제를 풀어주세요.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold">
          <Smartphone size={16} /> 화면을 켠 상태로 대기해 주세요
        </div>
      </div>
      
    </div>
  );
}