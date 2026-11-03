"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const fetchMemberSettings = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`);
  const json = await res.json();
  if (!json.success) throw new Error("설정 정보를 불러오지 못했습니다.");
  return json.data;
};

export default function FindIdPage() {
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['memberSettings'],
    queryFn: fetchMemberSettings,
  });

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [dob, setDob] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [foundEmail, setFoundEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (settings?.findIdMethod === "PHONE" && !mobile.trim()) {
      alert("휴대폰 번호를 입력해주세요.");
      return;
    }
    if (settings?.findIdMethod === "DOB" && !dob) {
      alert("생년월일을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/find-id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile: settings?.findIdMethod === "PHONE" ? mobile : undefined, dob: settings?.findIdMethod === "DOB" ? dob : undefined }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setFoundEmail(json.email); // 마스킹된 이메일 또는 아이디
      } else {
        alert(json.message || "일치하는 회원 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSettingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm";
  const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors pt-34">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">아이디 찾기</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            가입 시 등록하신 정보로 아이디(이메일)를 확인합니다.
          </p>
        </div>

        {!foundEmail ? (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <label className={labelClass}>이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" className={inputClass} required />
            </div>

            {settings?.findIdMethod === "PHONE" ? (
              <div>
                <label className={labelClass}>휴대폰 번호</label>
                <input type="text" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="01012345678" className={inputClass} required />
              </div>
            ) : (
              <div>
                <label className={labelClass}>생년월일</label>
                <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} required />
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
              {isSubmitting ? "조회 중..." : "아이디 찾기"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-6 text-center">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 rounded-xl space-y-2">
              <CheckCircle2 className="mx-auto text-indigo-600 dark:text-indigo-400" size={36} />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">회원님의 아이디(이메일)는 아래와 같습니다.</p>
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{foundEmail}</p>
            </div>
            <Link href="/login" className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold text-sm text-center transition-all shadow-lg shadow-indigo-500/30">
              로그인하러 가기
            </Link>
          </div>
        )}

        <div className="text-center pt-4 border-t border-slate-100 dark:border-slate-700">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400">
            <ArrowLeft size={16} /> 로그인 화면으로 돌아가기
          </Link>
        </div>

      </div>
    </div>
  );
}