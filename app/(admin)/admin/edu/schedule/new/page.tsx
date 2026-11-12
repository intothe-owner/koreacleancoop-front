// src/app/(admin)/admin/edu/schedule/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { List, Loader2, CalendarPlus } from "lucide-react";

export default function EduScheduleCreate() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  const initialForm = {
    title: "",
    startDate: "",
    endDate: "",
    location: "",
    status: "준비중"
  };
  const [formData, setFormData] = useState(initialForm);

  const getAuthHeaders = () => {
    const rawToken = localStorage.getItem("token") || "";
    const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("새 교육 일정을 등록하시겠습니까?")) return;

    if (formData.startDate > formData.endDate) {
      alert("종료일이 시작일보다 빠를 수 없습니다.");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edu-schedules`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });
      
      const json = await res.json();
      
      if (res.ok) {
        alert("등록되었습니다.");
        router.push("/admin/edu/schedule");
      } else {
        alert(json.message || "등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("등록 오류:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 bg-white";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">새 교육 일정 등록</h2>
          <p className="text-sm text-slate-500 mt-1">새로운 교육의 기본 정보와 일정을 입력합니다.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/edu/schedule")}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm hover:bg-black transition"
        >
          <List size={16}/> 목록으로
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
            <CalendarPlus className="text-indigo-600" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">신규 교육 정보 입력</h3>
            <p className="text-xs text-slate-500 mt-1">정확한 일정과 장소를 입력해주세요.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block font-bold mb-1 text-slate-700">교육명</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              required 
              placeholder="예) 2026 하반기 에어컨 세척 전문가 양성 과정"
              className={inputClass} 
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-700">교육 시작일</label>
            <input 
              type="date" 
              value={formData.startDate} 
              onChange={e => setFormData({...formData, startDate: e.target.value})} 
              required 
              className={inputClass} 
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-700">교육 종료일</label>
            <input 
              type="date" 
              value={formData.endDate} 
              onChange={e => setFormData({...formData, endDate: e.target.value})} 
              required 
              className={inputClass} 
            />
          </div>

          <div className="col-span-2">
            <label className="block font-bold mb-1 text-slate-700">교육 장소</label>
            <input 
              type="text" 
              value={formData.location} 
              onChange={e => setFormData({...formData, location: e.target.value})} 
              required 
              placeholder="예) 서울특별시 강남구 테헤란로 123 교육장 302호"
              className={inputClass} 
            />
          </div>

          <div className="col-span-2 pt-4 border-t border-slate-100">
            <label className="block font-bold mb-1 text-slate-700">노출 상태 (비고)</label>
            <div className="flex gap-4">
              {["준비중", "모집중", "종료"].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="status"
                    value={status}
                    checked={formData.status === status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">{status}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              '준비중'과 '모집중' 상태만 사용자 페이지 목록에 노출됩니다. '종료' 선택 시 목록에서 숨겨집니다.
            </p>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200 flex justify-center items-center"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          교육 일정 등록하기
        </button>
      </form>
    </div>
  );
}