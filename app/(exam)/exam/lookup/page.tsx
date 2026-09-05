"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Award, ChevronRight, XCircle } from "lucide-react";

export default function ExamLookupPage() {
  const router = useRouter();
  const [centerName, setCenterName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centerName.trim() || !studentName.trim()) return alert("모두 입력해 주세요.");
    
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/api/qualifications/lookup?centerName=${encodeURIComponent(centerName)}&studentName=${encodeURIComponent(studentName)}`);
      const data = await res.json();
      console.log(data);
      if (data.ok) setResults(data.data);
      else alert(data.message);
    } catch (error) {
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 pt-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mb-6">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search size={28} className="text-indigo-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-800">합격/정답지 조회</h1>
          <p className="text-sm text-slate-500 mt-1">응시했던 센터명과 이름을 입력해 주세요.</p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <input type="text" placeholder="센터명" required value={centerName} onChange={(e)=>setCenterName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
          <input type="text" placeholder="수강생 이름" required value={studentName} onChange={(e)=>setStudentName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
          <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : "조회하기"}
          </button>
        </form>
      </div>

      {results !== null && (
        <div className="w-full max-w-md space-y-3">
          <h3 className="font-bold text-slate-500 px-2">총 {results.length}건의 기록이 있습니다.</h3>
          {results.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">일치하는 시험 기록이 없습니다.</div>
          ) : (
            results.map((r, i) => (
              <div key={i} onClick={() => router.push(`/exam/review?sessionId=${r.id}`)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {r.isPassed ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-black">합격</span> : <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded font-black">불합격</span>}
                    <span className="font-black text-slate-800 text-lg">{r.score}점</span>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()} 응시</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                  정답지 보기 <ChevronRight size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}