"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, List, TrendingUp, Users, Loader2 } from "lucide-react";

export default function CustomersManager() {
  const [activeTab, setActiveTab] = useState<"ACHIEVEMENTS" | "CUSTOMERS">("ACHIEVEMENTS");
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [achievements, setAchievements] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // 💡 상태 변경: year와 dateOrMonth 분리
  const initialAchievementForm = { id: null, year: "", dateOrMonth: "", title: "", description: "", isActive: true };
  const [achievementForm, setAchievementForm] = useState(initialAchievementForm);

  const initialCustomerForm = { id: null, name: "", isActive: true };
  const [customerForm, setCustomerForm] = useState(initialCustomerForm);

  const fetchData = async () => {
    try {
      if (activeTab === "ACHIEVEMENTS") {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/achievements`);
        const json = await res.json();
        // 정렬: 연도 내림차순, 같은 연도 내에서는 월.일 내림차순
        if (json.success) {
          const sorted = json.data.sort((a: any, b: any) => {
            if (a.year !== b.year) return Number(b.year) - Number(a.year);
            return b.dateOrMonth.localeCompare(a.dateOrMonth);
          });
          setAchievements(sorted);
        }
      } else {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/customers`);
        const json = await res.json();
        if (json.success) setCustomers(json.data);
      }
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isAch = activeTab === "ACHIEVEMENTS";
    const endpoint = isAch ? "/api/achievements" : "/api/customers";
    const formData = isAch ? achievementForm : customerForm;
    
    const url = isEditing 
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}/${formData.id}` 
      : `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`;
      
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
    const endpoint = activeTab === "ACHIEVEMENTS" ? "/api/achievements" : "/api/customers";
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("삭제 실패:", error);
    }
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 disabled:bg-slate-100";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={28} />
            주요실적 및 고객현황
          </h2>
          <p className="text-sm text-slate-500 mt-1">기업의 주요 연혁(실적)과 고객사(기관) 현황을 관리합니다.</p>
        </div>
        <button 
          onClick={() => {
            if (viewMode === "FORM") { 
              setViewMode("LIST"); 
            } else { 
              setIsEditing(false);
              setAchievementForm(initialAchievementForm);
              setCustomerForm(initialCustomerForm);
              setViewMode("FORM"); 
            }
          }}
          disabled={isSubmitting}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm transition hover:bg-indigo-700"
        >
          {viewMode === "FORM" ? <List size={16}/> : <Plus size={16}/>}
          {viewMode === "FORM" ? "목록으로" : (activeTab === "ACHIEVEMENTS" ? "새 실적 등록" : "새 고객 등록")}
        </button>
      </div>

      {viewMode === "LIST" && (
        <div className="flex gap-4 border-b border-slate-200">
          <button onClick={() => setActiveTab("ACHIEVEMENTS")} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "ACHIEVEMENTS" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <TrendingUp size={16} /> 주요 실적 (연혁)
          </button>
          <button onClick={() => setActiveTab("CUSTOMERS")} className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === "CUSTOMERS" ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
            <Users size={16} /> 고객 현황 (기관명)
          </button>
        </div>
      )}

      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {activeTab === "ACHIEVEMENTS" ? (
                  <>
                    <th className="p-4 font-bold w-24">년도</th>
                    <th className="p-4 font-bold w-32">월.일</th>
                    <th className="p-4 font-bold">실적 내용</th>
                  </>
                ) : (
                  <th className="p-4 font-bold">고객/기관명</th>
                )}
                <th className="p-4 font-bold text-center w-24">상태</th>
                <th className="p-4 font-bold text-center w-32">관리</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === "ACHIEVEMENTS" ? (
                achievements.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">내역이 없습니다.</td></tr> :
                achievements.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-extrabold text-slate-800">{item.year}</td>
                    <td className="p-4 font-bold text-emerald-600">{item.dateOrMonth}</td>
                    <td className="p-4 text-slate-800">
                      <div className="font-bold">{item.title}</div>
                      {item.description && <div className="text-xs text-slate-500 mt-1">{item.description}</div>}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{item.isActive ? '노출' : '숨김'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => { setAchievementForm(item); setIsEditing(true); setViewMode("FORM"); }} className="text-indigo-600"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-500"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                customers.length === 0 ? <tr><td colSpan={3} className="p-8 text-center text-slate-500">내역이 없습니다.</td></tr> :
                customers.map(item => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{item.name}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{item.isActive ? '노출' : '숨김'}</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-3">
                        <button onClick={() => { setCustomerForm(item); setIsEditing(true); setViewMode("FORM"); }} className="text-indigo-600"><Edit2 size={18}/></button>
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
          <div className="grid grid-cols-2 gap-6">
            {activeTab === "ACHIEVEMENTS" ? (
              <>
                {/* 💡 연도와 월.일을 가로로 배치 */}
                <div className="col-span-2 md:col-span-1 flex gap-4">
                  <div className="w-1/2">
                    <label className="block font-bold mb-1.5 text-slate-800">년도 <span className="text-red-500">*</span></label>
                    <input type="text" value={achievementForm.year} onChange={e => setAchievementForm({...achievementForm, year: e.target.value})} required className={inputClass} placeholder="예: 2025" />
                  </div>
                  <div className="w-1/2">
                    <label className="block font-bold mb-1.5 text-slate-800">월.일 <span className="text-red-500">*</span></label>
                    <input type="text" value={achievementForm.dateOrMonth} onChange={e => setAchievementForm({...achievementForm, dateOrMonth: e.target.value})} required className={inputClass} placeholder="예: 12.23 또는 10.27~11" />
                  </div>
                </div>
                
                <div className="col-span-2 md:col-span-1">
                  <label className="block font-bold mb-1.5 text-slate-800">실적 내용 <span className="text-red-500">*</span></label>
                  <input type="text" value={achievementForm.title} onChange={e => setAchievementForm({...achievementForm, title: e.target.value})} required className={inputClass} placeholder="주요 실적 입력" />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold mb-1.5 text-slate-800">상세 설명</label>
                  <textarea value={achievementForm.description} onChange={e => setAchievementForm({...achievementForm, description: e.target.value})} rows={3} className={inputClass}></textarea>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 font-bold text-emerald-600">
                    <input type="checkbox" checked={achievementForm.isActive} onChange={e => setAchievementForm({...achievementForm, isActive: e.target.checked})} className="w-5 h-5" />
                    노출하기
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="col-span-2 md:col-span-1">
                  <label className="block font-bold mb-1.5 text-slate-800">고객/기관명 <span className="text-red-500">*</span></label>
                  <input type="text" value={customerForm.name} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} required className={inputClass} />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-center md:mt-7 mt-2">
                  <label className="flex items-center gap-2 font-bold text-emerald-600">
                    <input type="checkbox" checked={customerForm.isActive} onChange={e => setCustomerForm({...customerForm, isActive: e.target.checked})} className="w-5 h-5" />
                    노출하기
                  </label>
                </div>
              </>
            )}
          </div>
          <div className="mt-8">
            <button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-3.5 rounded-lg bg-slate-900 text-white font-bold text-lg hover:bg-black transition">
              {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditing ? "수정하기" : "등록하기")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}