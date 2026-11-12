"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Edit2, Trash2, ClipboardList } from "lucide-react";

export default function EduApplicationManager() {
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 페이징 및 검색 상태
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [totalPages, setTotalPages] = useState(1);

  const [searchType, setSearchType] = useState("applicantName");
  const [keyword, setKeyword] = useState("");

  const getAuthHeaders = () => {
    const rawToken = localStorage.getItem("token") || "";
    const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`
    };
  };

  // DB에서 교육 신청 목록 불러오기
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edu-applications`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      
      if (res.ok) {
        setApplications(data);
        applyFilters(data, searchType, keyword, 1);
      } else {
        alert(data.message || "교육 신청 목록을 불러오지 못했습니다.");
      }
    } catch (error) {
      console.error("교육 신청 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // 검색 및 필터 적용 함수
  const applyFilters = (
    data: any[], 
    sType: string, 
    kw: string, 
    targetPage: number
  ) => {
    let result = [...data];

    // 검색어 적용
    if (kw.trim() !== "") {
      result = result.filter(item => {
        if (sType === "applicantName") return item.applicantName.includes(kw);
        if (sType === "contact") return item.contact.includes(kw);
        if (sType === "eduName") return item.eduName.includes(kw);
        return false;
      });
    }

    setTotalPages(Math.ceil(result.length / itemsPerPage) || 1);
    
    // 페이징 자르기
    const startIndex = (targetPage - 1) * itemsPerPage;
    const paginatedResult = result.slice(startIndex, startIndex + itemsPerPage);
    
    setFilteredData(paginatedResult);
    setPage(targetPage);
  };

  // 검색 버튼 클릭 시
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(applications, searchType, keyword, 1);
  };

  // 삭제 처리
  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 교육 신청 내역을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.")) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edu-applications/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
      });
      const json = await res.json();

      if (res.ok) {
        alert("삭제되었습니다.");
        fetchApplications(); // 재조회
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
          <h2 className="text-2xl font-extrabold text-slate-900">교육 신청 관리</h2>
          <p className="text-sm text-slate-500 mt-1">고객들이 신청한 교육 내역을 확인하고 관리합니다.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* 검색바 */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <ClipboardList className="text-indigo-600" size={18} />
            전체 신청 내역 ({applications.length}건)
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)} 
              className="border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 w-28"
            >
              <option value="applicantName">신청자명</option>
              <option value="contact">연락처</option>
              <option value="eduName">교육명</option>
            </select>
            <input 
              type="text" 
              placeholder="검색어 입력..." 
              value={keyword} 
              onChange={(e) => setKeyword(e.target.value)} 
              className="flex-1 md:w-56 border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500" 
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
                <th className="p-4 font-bold w-32">신청자명</th>
                <th className="p-4 font-bold w-40">연락처</th>
                <th className="p-4 font-bold text-center w-36">신청일</th>
                <th className="p-4 font-bold text-center w-28">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? filteredData.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-center text-slate-500">{item.id}</td>
                  <td className="p-4 font-bold text-slate-800">
                    <div className="truncate w-full max-w-[250px]" title={item.eduName}>
                      {item.eduName}
                    </div>
                  </td>
                  <td className="p-4 text-slate-800 font-medium">{item.applicantName}</td>
                  <td className="p-4 text-slate-600">{item.contact}</td>
                  <td className="p-4 text-center text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => router.push(`/admin/edu/applications/${item.id}`)} 
                      className="text-indigo-600 hover:text-indigo-800 mr-3 transition-colors" 
                      title="상세 보기/수정"
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
                  <td colSpan={6} className="p-12 text-center text-slate-500">
                    신청 내역이 없습니다.
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
                  onClick={() => applyFilters(applications, searchType, keyword, p)}
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