// src/app/(admin)/admin/edu/schedule/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Edit2, Trash2, CalendarPlus } from "lucide-react";

export default function EduScheduleManager() {
  const router = useRouter();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 페이징 및 검색 상태
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(1);

  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "준비중" | "모집중" | "종료">("ALL");

  const getAuthHeaders = () => {
    const rawToken = localStorage.getItem("token") || "";
    const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`
    };
  };

  // DB에서 교육 일정 불러오기 (백엔드가 전체 데이터를 주므로 프론트에서 필터링)
  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edu-schedules`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      
      if (res.ok) {
        setSchedules(data);
        applyFilters(data, statusFilter, searchType, keyword, 1);
      } else {
        alert(data.message || "교육 일정 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("교육 일정 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // 검색 및 필터 적용 함수
  const applyFilters = (
    data: any[], 
    filter: string, 
    sType: string, 
    kw: string, 
    targetPage: number
  ) => {
    let result = [...data];

    // 1. 상태 필터 적용
    if (filter !== "ALL") {
      result = result.filter(item => item.status === filter);
    }

    // 2. 검색어 적용
    if (kw.trim() !== "") {
      result = result.filter(item => {
        if (sType === "title") return item.title.includes(kw);
        if (sType === "location") return item.location.includes(kw);
        return false;
      });
    }

    setTotalPages(Math.ceil(result.length / itemsPerPage) || 1);
    
    // 3. 페이징 자르기
    const startIndex = (targetPage - 1) * itemsPerPage;
    const paginatedResult = result.slice(startIndex, startIndex + itemsPerPage);
    
    setFilteredData(paginatedResult);
    setPage(targetPage);
  };

  // 검색 버튼 클릭 시
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(schedules, statusFilter, searchType, keyword, 1);
  };

  // 필터 탭 클릭 시
  const handleFilterClick = (filter: "ALL" | "준비중" | "모집중" | "종료") => {
    setStatusFilter(filter);
    applyFilters(schedules, filter, searchType, keyword, 1);
  };

  // 삭제 처리
  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 교육 일정을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edu-schedules/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const json = await res.json();

      if (res.ok) {
        alert("삭제되었습니다.");
        fetchSchedules(); // 재조회
      } else {
        alert(json.message || "삭제에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">교육 일정 관리</h2>
          <p className="text-sm text-slate-500 mt-1">교육 일정을 등록하고 관리하며 목록에 노출할 상태를 설정합니다.</p>
        </div>
        <button 
          onClick={() => router.push('/admin/edu/schedule/new')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-sm"
        >
          <CalendarPlus size={18} /> 새 일정 등록
        </button>
      </div>

      <div className="space-y-4">
        {/* 필터 및 검색바 */}
        <div className="flex flex-col xl:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            {["ALL", "준비중", "모집중", "종료"].map((f) => (
              <button 
                key={f}
                onClick={() => handleFilterClick(f as any)}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                  statusFilter === f 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === "ALL" ? "전체 목록" : f}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full xl:w-auto">
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)} 
              className="border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 w-28"
            >
              <option value="title">교육명</option>
              <option value="location">교육장소</option>
            </select>
            <input 
              type="text" 
              placeholder="검색어 입력..." 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)} 
              className="flex-1 xl:w-56 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" 
            />
            <button type="submit" className="bg-slate-800 text-white px-4 rounded-lg flex items-center gap-2 font-medium">
              <Search size={16} /> 검색
            </button>
          </form>
        </div>

        {/* 데이터 테이블 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="animate-spin text-indigo-600" size={32} />
            </div>
          )}

          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold text-center w-16">ID</th>
                <th className="p-4 font-bold">교육명</th>
                <th className="p-4 font-bold">교육 일시</th>
                <th className="p-4 font-bold">장소</th>
                <th className="p-4 font-bold text-center w-24">상태</th>
                <th className="p-4 font-bold text-center w-28">등록일</th>
                <th className="p-4 font-bold text-center w-28">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center text-slate-500">{item.id}</td>
                  <td className="p-4 font-bold text-slate-800">{item.title}</td>
                  <td className="p-4 text-slate-600">{item.eduDate}</td>
                  <td className="p-4 text-slate-600">{item.location}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      item.status === '모집중' ? 'bg-indigo-50 text-indigo-700' :
                      item.status === '종료' ? 'bg-rose-50 text-rose-700' : 
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-center text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => router.push(`/admin/edu/schedule/${item.id}`)} 
                      className="text-indigo-600 hover:text-indigo-800 mr-3 transition-colors" 
                      title="수정"
                    >
                      <Edit2 size={16}/>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)} 
                      className="text-red-400 hover:text-red-600 transition-colors" 
                      title="삭제"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    등록된 교육 일정이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* 페이징 */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => applyFilters(schedules, statusFilter, searchType, keyword, p)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                    p === page ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}