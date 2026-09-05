"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Smartphone, Users, Loader2, CheckCircle2, Lock, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { io, Socket } from "socket.io-client";

export default function ProjectorScreenPage() {
  const params = useParams();
  const examId = params.id;

  const [roomStatus, setRoomStatus] = useState("LOADING"); // LOADING, READY, QR_OPEN, STARTED
  const [qrJoinUrl, setQrJoinUrl] = useState("");
  const [studentCount, setStudentCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. 초기 상태 조회
    const fetchExamInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/${examId}`, {
          headers: { 
            Authorization: `Bearer ${token}` // 💡 헤더에 토큰 세팅!
          }
        });
        const data = await res.json();

        if (data.ok) {
          const status = data.data.exam.status;
          setRoomStatus(status);
          
          if (status === 'QR_OPEN' && data.data.exam.qrToken) {
            setQrJoinUrl(`${window.location.origin}/exam/join?token=${data.data.exam.qrToken}`);
          }
        }
      } catch (error) {
        console.error("시험 정보 로드 에러:", error);
      }
    };
    fetchExamInfo();

    // 2. 소켓 연결 (실시간 이벤트 감지)
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    socketRef.current = io(backendUrl);

    // 💡 관리자가 조종석에서 "QR 오픈" 버튼을 누른 순간 감지!
    socketRef.current.on('qr_opened', (data: any) => {
      if (data.examId === Number(examId)) {
        setQrJoinUrl(`${window.location.origin}/exam/join?token=${data.qrToken}`);
        setRoomStatus("QR_OPEN"); // 화면을 QR코드로 즉시 전환
      }
    });

    // 새 수강생 입장 카운트
    socketRef.current.on('new_student', (data: any) => {
      if (data.examId === Number(examId)) setStudentCount((prev) => prev + 1);
    });

    // 시험 시작 감지
    socketRef.current.on('exam_started', (data: any) => {
      if (data.examId === Number(examId)) setRoomStatus("STARTED");
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [examId]);

  // 💡 [추가] 클립보드 주소 복사 핸들러
  const handleCopyUrl = async () => {
    if (!qrJoinUrl) return;
    try {
      await navigator.clipboard.writeText(qrJoinUrl);
      alert("접속 주소가 복사되었습니다!\n원하시는 곳에 붙여넣기(Ctrl+V) 해주세요.");
    } catch (err) {
      alert("주소 복사를 지원하지 않는 브라우저입니다. 주소를 직접 드래그해서 복사해주세요.");
    }
  };

  if (roomStatus === "LOADING") {
    return <div className="min-h-screen bg-slate-900 flex justify-center items-center"><Loader2 className="animate-spin text-white" size={40} /></div>;
  }

  // 💡 1. 대기 상태 (관리자가 아직 버튼 안 누름)
  if (roomStatus === "READY") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Lock size={80} className="text-slate-600 mb-8" />
        <h1 className="text-5xl font-black mb-6 text-slate-300">시험 대기실이 준비 중입니다.</h1>
        <p className="text-2xl text-slate-500">관리자가 입장을 허용할 때까지 잠시만 기다려 주세요.</p>
      </div>
    );
  }

  // 💡 3. 시험 시작됨
  if (roomStatus === "STARTED") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
        <CheckCircle2 size={100} className="text-green-400 mb-8 animate-bounce" />
        <h1 className="text-6xl font-black mb-6">시험이 시작되었습니다!</h1>
        <p className="text-3xl text-slate-300">스마트폰 화면의 안내에 따라 문제를 풀어주세요.</p>
      </div>
    );
  }

  // 💡 2. QR 오픈 상태 (관리자가 버튼 누름)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-4">에어컨 세척 자격증 시험</h1>
        <p className="text-2xl text-slate-600 flex justify-center gap-3"><Smartphone size={32} className="text-indigo-600" /> 스마트폰 카메라로 스캔하여 입장하세요.</p>
      </div>
      
      <div className="p-8 bg-white border-[8px] border-slate-100 rounded-[3rem] shadow-2xl mb-8 transform scale-110">
        <QRCodeSVG value={qrJoinUrl} size={400} level="H" includeMargin={false} />
      </div>

      {/* 💡 [추가] 주소 복사하기 영역 */}
      <div 
        onClick={handleCopyUrl}
        className="flex items-center gap-4 bg-white border border-slate-200 shadow-sm px-6 py-3 rounded-full mb-12 cursor-pointer hover:bg-slate-50 transition-all hover:border-indigo-300 group"
      >
        <span className="text-slate-500 font-medium text-lg max-w-md truncate">{qrJoinUrl}</span>
        <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm whitespace-nowrap group-hover:bg-indigo-100 transition-colors">
          <Copy size={18} /> 주소 복사
        </div>
      </div>

      <div className="bg-slate-900 text-white px-8 py-5 rounded-full flex items-center gap-4 shadow-xl">
        <Users size={32} className="text-indigo-400" />
        <span className="text-2xl font-bold">현재 입장 인원 :</span>
        <span className="text-4xl font-black text-indigo-400 w-16 text-center">{studentCount}</span>
        <span className="text-2xl font-bold">명</span>
      </div>
    </div>
  );
}