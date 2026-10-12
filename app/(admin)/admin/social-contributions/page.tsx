"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, List, HeartHandshake, Loader2 } from "lucide-react";
import CustomEditor from "@/components/main/CustomEditor";

export default function SocialContributionManager() {
  const [items, setItems] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File }[]>([]);

  const initialForm = { id: null, title: "", content: "", author: "관리자", isActive: true };
  const [formData, setFormData] = useState(initialForm);

  const fetchData = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/social-contributions`);
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/social-contributions/${formData.id}` 
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/social-contributions`;
      
    try {
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("저장되었습니다.");
        setViewMode("LIST");
        fetchData();
      } else {
        alert("저장에 실패했습니다.");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/social-contributions/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  // 날짜 포맷 함수 (YYYY-MM-DD)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="text-indigo-600" size={28} />
            사회적공헌활동 관리
          </h2>
          <p className="text-sm text-slate-500 mt-1">조합의 사회적 공헌 활동 내역을 게시판 형태로 관리합니다.</p>
        </div>
        <button 
          onClick={() => {
            if (viewMode === "FORM") { 
              setViewMode("LIST"); 
            } else { 
              setIsEditing(false);
              setFormData(initialForm);
              setViewMode("FORM"); 
            }
          }}
          disabled={isSubmitting}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition hover:bg-indigo-700"
        >
          {viewMode === "FORM" ? <List size={16}/> : <Plus size={16}/>}
          {viewMode === "FORM" ? "목록으로" : "새 활동 등록"}
        </button>
      </div>

      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-center">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold w-16">No</th>
                <th className="p-4 font-bold text-left">제목</th>
                <th className="p-4 font-bold w-28">작성자</th>
                <th className="p-4 font-bold w-28">등록일</th>
                <th className="p-4 font-bold w-20">조회수</th>
                <th className="p-4 font-bold w-20">상태</th>
                <th className="p-4 font-bold w-28">관리</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">등록된 내역이 없습니다.</td></tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-slate-500">{items.length - index}</td>
                    <td className="p-4 text-left font-bold text-slate-800">{item.title}</td>
                    <td className="p-4 text-slate-600">{item.author}</td>
                    <td className="p-4 text-slate-500">{formatDate(item.createdAt)}</td>
                    <td className="p-4 text-slate-500">{item.views}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {item.isActive ? '노출' : '숨김'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => { setFormData(item); setIsEditing(true); setViewMode("FORM"); }} className="text-indigo-600"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === "FORM" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
          <div className="grid grid-cols-4 gap-6">
            
            <div className="col-span-4 md:col-span-3">
              <label className="block font-bold mb-1.5 text-slate-800">제목 <span className="text-red-500">*</span></label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required className={inputClass} placeholder="게시글 제목을 입력하세요" />
            </div>
            
            <div className="col-span-4 md:col-span-1">
              <label className="block font-bold mb-1.5 text-slate-800">작성자 <span className="text-red-500">*</span></label>
              <input type="text" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} required className={inputClass} />
            </div>

            <div className="col-span-4">
              <label className="block font-bold mb-1.5 text-slate-800">내용 <span className="text-red-500">*</span></label>
              <CustomEditor
                value={formData.content}
                onChange={(val) => setFormData({ ...formData, content: val })}
                onImageAttach={(file, id) => {
                  setPendingImages(prev => [...prev, { id, file }]);
                }}
                placeholder="사회적 공헌 활동 내용을 상세히 적어주세요."
              />
            </div>
            
            <div className="col-span-4 flex items-center">
              <label className="flex items-center gap-2 font-bold text-emerald-600 cursor-pointer">
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 accent-emerald-500" />
                사용자 페이지에 노출하기
              </label>
            </div>

          </div>
          <div className="mt-8">
            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-3 font-bold py-3.5 rounded-lg bg-slate-900 text-white hover:bg-black transition text-lg">
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (isEditing ? "게시글 수정하기" : "새 게시글 등록하기")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}