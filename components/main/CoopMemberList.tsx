"use client";

import { useState, useEffect } from "react";
import { Map, List as ListIcon, Search, Building2, Phone, Globe, MapPin } from "lucide-react";
import { KOREA_REGIONS } from "@/lib/regions";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function CoopMemberList() {
  const [members, setMembers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "MAP">("LIST");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSido, setSelectedSido] = useState("");
  const [selectedSigungu, setSelectedSigungu] = useState("");

  const fetchMembers = async () => {
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/coop-members`);
      // 💡 사용자 페이지이므로 노출(isActive=true)인 것만 필터링
      url.searchParams.append("isActive", "true");
      
      if (searchTerm) url.searchParams.append("search", searchTerm);
      if (selectedSido) url.searchParams.append("regionSido", selectedSido);
      if (selectedSigungu) url.searchParams.append("regionSigungu", selectedSigungu);
        
      const res = await fetch(url.toString());
      const json = await res.json();
      if (json.success) setMembers(json.data);
    } catch (error) {
      console.error("조합원 목록 로딩 실패:", error);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  // 지도 렌더링 및 포커스 이동 로직
  useEffect(() => {
    if (viewMode !== "MAP") return;

    const initMap = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('user-map');
        const options = {
          center: new window.kakao.maps.LatLng(36.5, 127.5),
          level: 13
        };
        const map = new window.kakao.maps.Map(container, options);

        members.forEach(member => {
          if (member.latitude && member.longitude) {
            const markerPosition = new window.kakao.maps.LatLng(member.latitude, member.longitude);
            const marker = new window.kakao.maps.Marker({ position: markerPosition });
            marker.setMap(map);

            const iwContent = `
              <div style="padding:10px;font-size:13px;min-width:150px;line-height:1.5;">
                <strong style="color:#1e293b;font-size:14px;">${member.companyName}</strong><br />
                <span style="color:#64748b;">${member.regionSido} ${member.regionSigungu}</span>
              </div>
            `;
            const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });
            window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
            window.kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
          }
        });

        if (selectedSido) {
          const geocoder = new window.kakao.maps.services.Geocoder();
          const query = `${selectedSido} ${selectedSigungu}`.trim();

          geocoder.addressSearch(query, function (result: any, status: any) {
            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              map.setCenter(coords);
              map.setLevel(selectedSigungu ? 7 : 10);
            }
          });
        }
      });
    };

    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
      script.onload = () => {
        window.kakao.maps.load(() => initMap());
      };
      document.head.appendChild(script);
    }
  }, [viewMode, members, selectedSido, selectedSigungu]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8 w-full">
      {/* 상단 타이틀 및 뷰 토글 */}
      <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={32} />
            조합원 현황
          </h2>
          <p className="text-slate-500 mt-2">전국에 있는 당사 조합원 네트워크를 확인해 보세요.</p>
        </div>
        
        <div className="flex bg-slate-100 rounded-lg p-1 shadow-inner">
          <button onClick={() => setViewMode("LIST")} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${viewMode === "LIST" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
            <ListIcon size={18}/> 목록 보기
          </button>
          <button onClick={() => setViewMode("MAP")} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${viewMode === "MAP" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}>
            <Map size={18}/> 지도 보기
          </button>
        </div>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <select 
          value={selectedSido} 
          onChange={(e) => {
            setSelectedSido(e.target.value);
            setSelectedSigungu(""); 
          }} 
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none w-full md:w-auto"
        >
          <option value="">시/도 전체</option>
          {Object.keys(KOREA_REGIONS).map(sido => (
            <option key={sido} value={sido}>{sido}</option>
          ))}
        </select>

        <select 
          value={selectedSigungu} 
          onChange={(e) => setSelectedSigungu(e.target.value)} 
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none w-full md:w-auto"
          disabled={!selectedSido}
        >
          <option value="">시/군/구 전체</option>
          {selectedSido && KOREA_REGIONS[selectedSido]?.map(sigungu => (
            <option key={sigungu} value={sigungu}>{sigungu}</option>
          ))}
        </select>

        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="기업명을 검색하세요" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          />
        </div>
        <button onClick={fetchMembers} className="bg-slate-900 text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-black transition-colors w-full md:w-auto">
          조회하기
        </button>
      </div>

      {/* 목록 뷰 (카드 형태의 반응형 디자인 적용) */}
      {viewMode === "LIST" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              검색된 조합원 정보가 없습니다.
            </div>
          ) : (
            members.map(member => (
              <div key={member.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 shrink-0 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden flex items-center justify-center p-1">
                    {member.logoUrl ? (
                      <img src={member.logoUrl} alt={member.companyName} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="text-slate-300" size={24} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{member.companyName}</h3>
                    <span className="inline-block mt-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full">
                      {member.regionSido} {member.regionSigungu}
                    </span>
                  </div>
                </div>

                <div className="mt-auto space-y-2 text-sm text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{member.address} {member.addressDetail}</span>
                  </div>
                  {member.contact && (
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-slate-400 shrink-0" />
                      <span>{member.contact}</span>
                    </div>
                  )}
                  {member.homepageUrl && (
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-slate-400 shrink-0" />
                      <a href={member.homepageUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline line-clamp-1">
                        {member.homepageUrl.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 지도 뷰 */}
      <div className={`${viewMode === "MAP" ? 'block' : 'hidden'} w-full h-[600px] bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative shadow-inner`}>
        <div id="user-map" className="w-full h-full"></div>
      </div>
    </div>
  );
}