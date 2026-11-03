"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";

export default function FindPasswordPage() {
  const [loginId, setLoginId] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId.trim() || !name.trim()) {
      alert("아이디와 이름을 모두 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/find-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, name }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsSent(true);
      } else {
        alert(json.message || "일치하는 회원 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm";
  const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors pt-34">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">비밀번호 재설정</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            등록된 이메일로 비밀번호 변경 링크를 발송해 드립니다.
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div>
              <label className={labelClass}>아이디 (이메일)</label>
              <input type="email" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="admin@example.com" className={inputClass} required />
            </div>

            <div>
              <label className={labelClass}>이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" className={inputClass} required />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
              {isSubmitting ? "메일 발송 중..." : "재설정 링크 받기"}
            </button>
          </form>
        ) : (
          <div className="mt-6 space-y-6 text-center">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 rounded-xl space-y-2">
              <CheckCircle2 className="mx-auto text-emerald-600 dark:text-emerald-400" size={36} />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">재설정 메일이 발송되었습니다.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                입력하신 이메일함에서 인증 링크를 확인해 주세요. 링크는 1시간 동안만 유효합니다.
              </p>
            </div>
            <Link href="/login" className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold text-sm text-center transition-all shadow-lg shadow-indigo-500/30">
              로그인 화면으로 이동
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