// src/components/main/CertificationList.tsx (또는 같은 파일 하단에 선언)
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

// 인증·인허가 데이터 패칭 함수
const fetchCertifications = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/certifications`);
  const json = await res.json();
  if (!json.success) throw new Error("인증서 데이터를 불러오는데 실패했습니다.");
  // 노출 상태(isActive)가 true인 것만 필터링
  return json.data.filter((cert: any) => cert.isActive);
};

export default function CertificationList() {
  const { data: certs, isLoading } = useQuery({
    queryKey: ['certifications'],
    queryFn: fetchCertifications,
  });

  // 모달(확대) 상태 관리
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (isLoading) {
    return <div className="py-20 text-center text-slate-500">인증서 정보를 불러오는 중입니다...</div>;
  }

  if (!certs || certs.length === 0) {
    return <div className="py-20 text-center text-slate-500">등록된 인증·인허가 정보가 없습니다.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12">
        {certs.map((cert: any) => (
          <div key={cert.id} className="flex flex-col items-center group">
            
            {/* 액자(Frame) 영역 */}
            <div 
              className="relative w-full aspect-[3/4] bg-white border border-slate-200 p-2 shadow-sm cursor-pointer overflow-hidden transition-transform duration-300 group-hover:-translate-y-2"
              onClick={() => setSelectedImage(cert.imageUrl)}
            >
              <img 
                src={cert.imageUrl} 
                alt={cert.title} 
                className="w-full h-full object-contain" 
              />
              
              {/* 호버 시 나타나는 돋보기 오버레이 */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-white/20 p-4 rounded-full text-white">
                  <Search size={36} />
                </div>
              </div>
            </div>

            {/* 참조 이미지(image_895339.jpg)의 하단 거치대 느낌 구현 */}
            <div className="w-[105%] h-3 bg-gradient-to-b from-slate-200 to-slate-300 shadow-md rounded-b-md mb-6"></div>

            {/* 인증서 제목 */}
            <h3 className="text-lg font-bold text-slate-800 text-center">
              {cert.title}
            </h3>
          </div>
        ))}
      </div>

      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X size={40} />
          </button>
          
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white p-4 rounded shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록 이벤트 전파 방지
          >
            <img 
              src={selectedImage} 
              alt="확대된 인증서" 
              className="max-h-[85vh] w-auto object-contain" 
            />
          </div>
        </div>
      )}
    </div>
  );
}