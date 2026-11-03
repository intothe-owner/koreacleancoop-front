"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, X } from "lucide-react";
import { KOREA_REGIONS } from "@/lib/regions";

declare global {
  interface Window {
    kakao: any;
    daum: any;
  }
}

interface Props {
  initialData?: any;
  isEdit?: boolean;
}

export default function CoopMemberForm({ initialData, isEdit = false }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // 💡 우편번호 모달 열림/닫힘 상태 관리
  const [isPostcodeOpen, setIsPostcodeOpen] = useState(false);
  const postcodeRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    contact: "",
    homepageUrl: "",
    address: "",
    addressDetail: "",
    latitude: "",
    longitude: "",
    regionSido: "",
    regionSigungu: "",
    isActive: true,
    logoUrl: ""
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  // 💡 다음 우편번호 모달 열기 및 스크립트 로드
  const handleOpenPostcode = () => {
    const initEmbed = () => {
      setIsPostcodeOpen(true);
      
      // DOM이 렌더링된 이후에 우편번호 엘리먼트 주입
      setTimeout(() => {
        if (postcodeRef.current && window.daum && window.daum.Postcode) {
          new window.daum.Postcode({
            oncomplete: function(data: any) {
              const fullAddress = data.address;
              
              setFormData(prev => ({
                ...prev,
                address: fullAddress,
                regionSido: data.sido,
                regionSigungu: data.sigungu
              }));

              // 카카오 Geocoder로 좌표 변환
              if (window.kakao && window.kakao.maps.services) {
                const geocoder = new window.kakao.maps.services.Geocoder();
                geocoder.addressSearch(fullAddress, function(result: any, status: any) {
                  if (status === window.kakao.maps.services.Status.OK) {
                    setFormData(prev => ({
                      ...prev,
                      longitude: result[0].x,
                      latitude: result[0].y
                    }));
                  }
                });
              }

              // 주소 선택 완료 시 모달 닫기
              setIsPostcodeOpen(false);
            },
            width: '100%',
            height: '100%'
          }).embed(postcodeRef.current);
        }
      }, 100);
    };

    // 카카오 지도 + 다음 우편번호 스크립트 동적 로드 검증
    if (window.daum && window.daum.Postcode && window.kakao) {
      initEmbed();
    } else {
      // 1. 다음 우편번호 스크립트 로드
      const scriptDaum = document.createElement('script');
      scriptDaum.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      scriptDaum.onload = () => {
        // 2. 카카오 지도 스크립트 로드 (좌표 변환용)
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          initEmbed();
        } else {
          const scriptKakao = document.createElement("script");
          scriptKakao.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
          scriptKakao.onload = () => {
            window.kakao.maps.load(() => initEmbed());
          };
          document.head.appendChild(scriptKakao);
        }
      };
      document.head.appendChild(scriptDaum);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && key !== 'logoUrl' && key !== 'id') {
        submitData.append(key, String(value));
      }
    });

    if (file) submitData.append("logo", file);

    const url = isEdit 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/coop-members/${initialData.id}` 
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/coop-members`;
    
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, { method, body: submitData });
      if (res.ok) {
        alert("저장되었습니다.");
        router.push("/admin/coopmembers");
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400";

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 relative">
        {isSubmitting && <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl cursor-not-allowed"></div>}

        <div className="grid grid-cols-2 gap-6 relative z-0">
          <div className="col-span-2 md:col-span-1">
            <label className="block font-bold mb-1.5">기업명 <span className="text-red-500">*</span></label>
            <input type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} required className={inputClass} />
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block font-bold mb-1.5">연락처</label>
            <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className={inputClass} placeholder="예: 02-1234-5678" />
          </div>

          <div className="col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <label className="block font-bold mb-2">기업 주소 <span className="text-red-500">*</span></label>
            <div className="flex gap-2 mb-3">
              <input type="text" value={formData.address} readOnly required className={`${inputClass} bg-white`} placeholder="주소 검색을 이용해주세요" />
              {/* 💡 커스텀 모달을 여는 버튼 */}
              <button type="button" onClick={handleOpenPostcode} className="bg-slate-800 text-white px-4 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap hover:bg-black">
                <MapPin size={16}/> 주소 검색
              </button>
            </div>
            <input type="text" value={formData.addressDetail} onChange={e => setFormData({...formData, addressDetail: e.target.value})} className={inputClass} placeholder="상세 주소 입력" />
            
            <div className="flex gap-3 mt-4 border-t border-slate-200 pt-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">시/도</label>
                <select 
                  value={formData.regionSido} 
                  onChange={(e) => setFormData({...formData, regionSido: e.target.value, regionSigungu: ""})} 
                  className={inputClass}
                >
                  <option value="">선택</option>
                  {Object.keys(KOREA_REGIONS).map(sido => (
                    <option key={sido} value={sido}>{sido}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1">시/군/구</label>
                <select 
                  value={formData.regionSigungu} 
                  onChange={(e) => setFormData({...formData, regionSigungu: e.target.value})} 
                  className={inputClass}
                  disabled={!formData.regionSido}
                >
                  <option value="">선택</option>
                  {formData.regionSido && KOREA_REGIONS[formData.regionSido]?.map(sigungu => (
                    <option key={sigungu} value={sigungu}>{sigungu}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-3 text-xs text-slate-400 font-mono">
              <p>Lat: {formData.latitude || '0.0000000'}</p>
              <p>Lng: {formData.longitude || '0.0000000'}</p>
            </div>
          </div>

          <div className="col-span-2 md:col-span-1">
            <label className="block font-bold mb-1.5">홈페이지 링크</label>
            <input type="url" value={formData.homepageUrl} onChange={e => setFormData({...formData, homepageUrl: e.target.value})} className={inputClass} placeholder="https://..." />
          </div>

          <div className="col-span-2 md:col-span-1 flex items-center mt-7">
            <label className="flex items-center gap-2 font-bold text-emerald-600 cursor-pointer">
              <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
              사이트에 노출하기
            </label>
          </div>

          <div className="col-span-2">
            <label className="block font-bold mb-2">기업 로고</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            
            {formData.logoUrl && !file && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg inline-block border border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-2">현재 로고</p>
                <img src={formData.logoUrl} alt="로고" className="h-16 object-contain bg-white p-1 border rounded" />
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 relative z-20 flex gap-3">
          <button type="button" onClick={() => router.push('/admin/coopmembers')} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3.5 rounded-lg hover:bg-slate-200 transition">취소</button>
          <button type="submit" disabled={isSubmitting} className="flex-[2] flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-black transition">
            {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> 처리 중...</> : (isEdit ? "수정 완료" : "조합원 등록하기")}
          </button>
        </div>
      </form>

      {/* 💡 다음 우편번호 커스텀 모달 창 레이어 */}
      {isPostcodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[500px]">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <h3 className="font-bold text-base">주소 검색</h3>
              <button 
                onClick={() => setIsPostcodeOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* 다음 우편번호 embed가 들어갈 컨테이너 */}
            <div ref={postcodeRef} className="w-full flex-1 relative"></div>
          </div>
        </div>
      )}
    </>
  );
}