"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

// 인증·인허가 데이터 패칭 함수
const fetchCertifications = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/certifications`);
  const json = await res.json();
  if (!json.success) throw new Error("인증서 데이터를 불러오는데 실패했습니다.");
  return json.data.filter((cert: any) => cert.isActive);
};

export default function CertificationList() {
  const { data: certs, isLoading } = useQuery({
    queryKey: ['certifications'],
    queryFn: fetchCertifications,
  });

  // 모달 상태 관리
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // 💡 돋보기(Loupe) 기능 상태 관리
  const [isLoupeMode, setIsLoupeMode] = useState(false);
  const [loupe, setLoupe] = useState({ show: false, x: 0, y: 0, bgX: 0, bgY: 0, bgW: 0, bgH: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // 돋보기 설정값
  const LOUPE_SIZE = 240; // 돋보기 원형 크기 (px)
  const ZOOM_LEVEL = 2.5; // 확대 비율

  // 마우스 이동 시 돋보기 위치 및 배경이미지 좌표 계산
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLoupeMode || !imgRef.current) return;
    
    // 이미지의 화면상 실제 위치와 크기 구하기
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    
    // 이미지 내에서의 마우스 좌표
    const x = e.clientX - left;
    const y = e.clientY - top;

    // 배경 이미지를 얼마나 키울 것인가
    const bgW = width * ZOOM_LEVEL;
    const bgH = height * ZOOM_LEVEL;

    // 마우스 포인터가 돋보기의 정중앙에 오도록 배경 이미지 이동
    const bgX = -((x * ZOOM_LEVEL) - LOUPE_SIZE / 2);
    const bgY = -((y * ZOOM_LEVEL) - LOUPE_SIZE / 2);

    setLoupe({ show: true, x, y, bgX, bgY, bgW, bgH });
  };

  const closeModal = () => {
    setSelectedImage(null);
    setIsLoupeMode(false); // 창 닫을 때 돋보기 모드 해제
    setLoupe((prev) => ({ ...prev, show: false }));
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-500">인증서 정보를 불러오는 중입니다...</div>;
  }

  if (!certs || certs.length === 0) {
    return <div className="py-20 text-center text-slate-500">등록된 인증·인허가 정보가 없습니다.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* 1. 인증서 목록 (리스트) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
        {certs.map((cert: any) => (
          <div key={cert.id} className="flex flex-col items-center group">
            
            {/* 액자(Frame) 영역 - 리스트에서는 돋보기 아이콘 제거, 클릭만 가능 */}
            <div 
              className="relative w-full aspect-[3/4] bg-white border border-slate-200 p-2 shadow-sm cursor-pointer overflow-hidden transition-transform duration-300 group-hover:-translate-y-2"
              onClick={() => setSelectedImage(cert.imageUrl)}
            >
              <img 
                src={cert.imageUrl} 
                alt={cert.title} 
                className="w-full h-full object-contain" 
              />
            </div>

            {/* 하단 거치대 느낌 */}
            <div className="w-[105%] h-3 bg-gradient-to-b from-slate-200 to-slate-300 shadow-md rounded-b-md mb-6"></div>

            <h3 className="text-lg font-bold text-slate-800 text-center">
              {cert.title}
            </h3>
          </div>
        ))}
      </div>

      {/* 2. 이미지 확대 및 돋보기(Loupe) 모달 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          {/* 우측 상단 버튼 영역 (닫기 + 돋보기 토글) */}
          <div className="absolute top-6 right-6 flex flex-col gap-4">
            <button 
              onClick={(e) => { e.stopPropagation(); closeModal(); }}
              className="text-white/60 hover:text-white transition-colors"
              title="닫기"
            >
              <X size={40} />
            </button>
            
            {/* 💡 요청하신 빨간 테두리 위치의 돋보기 토글 버튼 */}
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsLoupeMode(!isLoupeMode); 
              }}
              className={`p-2.5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center shadow-lg ${
                isLoupeMode 
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-400 scale-110' 
                  : 'border-white/40 text-white/60 hover:text-white hover:border-white'
              }`}
              title="돋보기 모드 켜기/끄기"
            >
              <Search size={28} />
            </button>
          </div>
          
          {/* 이미지 표시 영역 */}
          <div 
            className="relative bg-white p-4 rounded shadow-2xl inline-block"
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록
          >
            {/* 돋보기 모드가 켜져 있을 때는 cursor-none으로 마우스를 숨기고 동그라미만 보이게 함 */}
            <div
              className={`relative overflow-hidden ${isLoupeMode ? 'cursor-none' : 'cursor-default'}`}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => isLoupeMode && setLoupe(prev => ({ ...prev, show: true }))}
              onMouseLeave={() => setLoupe(prev => ({ ...prev, show: false }))}
            >
              <img 
                ref={imgRef}
                src={selectedImage} 
                alt="확대된 인증서" 
                className="max-h-[85vh] w-auto object-contain block pointer-events-none" 
              />
              
              {/* 💡 마우스를 따라다니는 동그라미 돋보기 (Loupe) */}
              {isLoupeMode && loupe.show && (
                <div 
                  className="absolute rounded-full border-[3px] border-white shadow-[0_0_15px_rgba(0,0,0,0.5)] pointer-events-none z-50 bg-white"
                  style={{
                    width: `${LOUPE_SIZE}px`,
                    height: `${LOUPE_SIZE}px`,
                    left: `${loupe.x - LOUPE_SIZE / 2}px`,
                    top: `${loupe.y - LOUPE_SIZE / 2}px`,
                    backgroundImage: `url(${selectedImage})`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${loupe.bgW}px ${loupe.bgH}px`,
                    backgroundPosition: `${loupe.bgX}px ${loupe.bgY}px`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}