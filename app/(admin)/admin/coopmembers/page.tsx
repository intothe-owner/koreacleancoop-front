"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Map, List, Search, Building2 } from "lucide-react";
import { KOREA_REGIONS } from "@/lib/regions";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function CoopMemberManager() {
  const [members, setMembers] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "MAP">("LIST");
  
  // 💡 검색 상태 관리
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSido, setSelectedSido] = useState("");
  const [selectedSigungu, setSelectedSigungu] = useState("");

  const fetchMembers = async () => {
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/coop-members`);
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

  // 💡 지도 렌더링 및 포커스 이동 로직
  useEffect(() => {
    if (viewMode !== "MAP") return;

    const initMap = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        const options = {
          center: new window.kakao.maps.LatLng(36.5, 127.5), // 기본 대한민국 중앙
          level: 13
        };
        const map = new window.kakao.maps.Map(container, options);

        // 1. 조합원 마커 표시
        members.forEach(member => {
          if (member.latitude && member.longitude) {
            const markerPosition = new window.kakao.maps.LatLng(member.latitude, member.longitude);
            const marker = new window.kakao.maps.Marker({ position: markerPosition });
            marker.setMap(map);

            const iwContent = `<div style="padding:5px;font-size:12px;font-weight:bold;color:#333;">${member.companyName}</div>`;
            const infowindow = new window.kakao.maps.InfoWindow({ content: iwContent });
            window.kakao.maps.event.addListener(marker, 'mouseover', () => infowindow.open(map, marker));
            window.kakao.maps.event.addListener(marker, 'mouseout', () => infowindow.close());
          }
        });

        // 2. ✨ 검색된 지역(행정구역)으로 지도 포커스 이동
        if (selectedSido) {
          const geocoder = new window.kakao.maps.services.Geocoder();
          // 예: "부산 해운대구"
          const query = `${selectedSido} ${selectedSigungu}`.trim();

          geocoder.addressSearch(query, function (result: any, status: any) {
            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              map.setCenter(coords); // 해당 지역으로 중심 이동
              // 시/군/구까지 선택했으면 더 가깝게(level 7), 시/도만 선택했으면 넓게(level 10)
              map.setLevel(selectedSigungu ? 7 : 10);
            }
          });
        }
      });
    };

    // 스크립트 로드 처리
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

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/coop-members/${id}`, { method: "DELETE" });
      if (res.ok) fetchMembers();
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={28} />
            조합원 현황 관리
          </h2>
        </div>
        
        <div className="flex gap-3">
          <div className="flex bg-white rounded-lg border border-slate-300 p-1">
            <button onClick={() => setViewMode("LIST")} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${viewMode === "LIST" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"}`}>
              <List size={16}/> 목록
            </button>
            <button onClick={() => setViewMode("MAP")} className={`px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${viewMode === "MAP" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900"}`}>
              <Map size={16}/> 지도
            </button>
          </div>
          
          <Link href="/admin/coopmembers/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition hover:bg-indigo-700">
            <Plus size={16}/> 새 조합원 등록
          </Link>
        </div>
      </div>

      {/* 💡 검색 바 & 지역 필터 영역 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4">
        {/* 지역 선택 */}
        <select 
          value={selectedSido} 
          onChange={(e) => {
            setSelectedSido(e.target.value);
            setSelectedSigungu(""); // 시/도가 바뀌면 시/군/구 초기화
          }} 
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none min-w-[140px]"
        >
          <option value="">시/도 전체</option>
          {Object.keys(KOREA_REGIONS).map(sido => (
            <option key={sido} value={sido}>{sido}</option>
          ))}
        </select>

        <select 
          value={selectedSigungu} 
          onChange={(e) => setSelectedSigungu(e.target.value)} 
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none min-w-[140px]"
          disabled={!selectedSido}
        >
          <option value="">시/군/구 전체</option>
          {selectedSido && KOREA_REGIONS[selectedSido]?.map(sigungu => (
            <option key={sigungu} value={sigungu}>{sigungu}</option>
          ))}
        </select>

        {/* 텍스트 검색 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="기업명을 검색하세요" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMembers()}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
          />
        </div>
        <button onClick={fetchMembers} className="bg-slate-900 text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-black">
          조회
        </button>
      </div>

      {/* 목록 뷰 */}
      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold">로고</th>
                <th className="p-4 font-bold">기업명</th>
                <th className="p-4 font-bold">주소</th>
                <th className="p-4 font-bold">행정구역</th>
                <th className="p-4 font-bold text-center">관리</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">등록된 조합원이 없습니다.</td></tr>
              ) : (
                members.map(member => (
                  <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50 align-middle">
                    <td className="p-4">
                      {member.logoUrl ? (
                        <img src={member.logoUrl} alt="로고" className="w-12 h-12 object-contain bg-white border rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 border rounded flex items-center justify-center text-xs text-slate-400">N/A</div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-800">{member.companyName}</td>
                    <td className="p-4 text-slate-600 truncate max-w-xs">{member.address} {member.addressDetail}</td>
                    <td className="p-4 text-slate-600">{member.regionSido} {member.regionSigungu}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Link href={`/admin/coopmembers/${member.id}`} className="text-indigo-600 hover:text-indigo-800 transition"><Edit2 size={18}/></Link>
                        <button onClick={() => handleDelete(member.id)} className="text-red-500 hover:text-red-700 transition"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 지도 뷰 */}
      <div className={`${viewMode === "MAP" ? 'block' : 'hidden'} w-full h-[600px] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative`}>
        <div id="map" className="w-full h-full"></div>
      </div>
    </div>
  );
}