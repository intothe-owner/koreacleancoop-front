"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { List, Loader2, UserCheck, Calendar } from "lucide-react";

export default function EduApplicationDetail() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const initialForm = {
    id: 0,
    scheduleId: null,
    eduName: "",
    applicantName: "",
    contact: "",
    inquiry: "",
    createdAt: "",
    scheduleInfo: null as any // 연결된 교육 일정 정보
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

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edu-applications/${applicationId}`, {
          headers: getAuthHeaders()
        });

        const json = await res.json();

        if (res.ok) {
          setFormData(json);
        } else {
          alert(json.message || "신청 내역을 불러오지 못했습니다.");
          router.push("/admin/edu/applications");
        }
      } catch (error) {
        console.error("데이터 조회 오류:", error);
        alert("서버 오류가 발생했습니다.");
        router.push("/admin/edu/applications");
      } finally {
        setIsLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("신청 정보를 수정하시겠습니까?")) return;

    setIsSaving(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/edu-applications/${formData.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          applicantName: formData.applicantName,
          contact: formData.contact,
          inquiry: formData.inquiry
        })
      });
      
      const json = await res.json();
      
      if (res.ok) {
        alert("수정되었습니다.");
        router.push("/admin/edu/applications");
      } else {
        alert(json.message || "수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("수정 오류:", error);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 bg-white";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">교육 신청 상세 정보</h2>
          <p className="text-sm text-slate-500 mt-1">고객의 신청 정보를 확인하고 필요시 수정합니다.</p>
        </div>
        <button 
          onClick={() => router.push("/admin/edu/applications")}
          className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm hover:bg-black transition"
        >
          <List size={16}/> 목록으로
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        
        {/* 상단 요약 배너 */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
              <UserCheck className="text-indigo-600" size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                신청번호: {formData.id}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                신청일시: {formData.createdAt ? new Date(formData.createdAt).toLocaleString() : ''}
              </p>
            </div>
          </div>
        </div>

        {/* 연결된 일정 정보 (존재할 경우 노출) */}
        {formData.scheduleInfo && (
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-4">
            <Calendar className="text-indigo-500 mt-0.5" size={20} />
            <div>
              <p className="text-xs font-bold text-indigo-700 mb-1">시스템에 등록된 원본 일정과 연결되어 있습니다.</p>
              <p className="text-sm text-slate-700 font-bold">{formData.scheduleInfo.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                일시: {formData.scheduleInfo.eduDate} | 장소: {formData.scheduleInfo.location}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block font-bold mb-1 text-slate-700">신청 교육명</label>
            <input 
              type="text" 
              value={formData.eduName} 
              readOnly
              className={`${inputClass} bg-slate-100 cursor-not-allowed`} 
            />
            <p className="text-xs text-slate-400 mt-1">※ 신청 당시의 교육명으로 임의 수정이 불가능합니다.</p>
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-700">신청자명 (고객명)</label>
            <input 
              type="text" 
              value={formData.applicantName} 
              onChange={e => setFormData({...formData, applicantName: e.target.value})} 
              required 
              className={inputClass} 
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-slate-700">연락처</label>
            <input 
              type="text" 
              value={formData.contact} 
              onChange={e => setFormData({...formData, contact: e.target.value})} 
              required 
              className={inputClass} 
            />
          </div>

          <div className="col-span-2">
            <label className="block font-bold mb-1 text-slate-700">문의사항</label>
            <textarea 
              value={formData.inquiry || ""} 
              onChange={e => setFormData({...formData, inquiry: e.target.value})} 
              rows={5}
              className={`${inputClass} resize-none`} 
              placeholder="고객이 남긴 문의사항이 없습니다."
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSaving}
          className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200 flex justify-center items-center"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
          신청 정보 저장하기
        </button>
      </form>
    </div>
  );
}