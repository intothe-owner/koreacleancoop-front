"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!token) {
    return (
      <div className="mt-6 text-center space-y-4">
        <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900 rounded-xl">
          <p className="text-sm font-bold text-red-600 dark:text-red-400">유효하지 않은 접근입니다. (토큰 누락)</p>
        </div>
        <Link href="/find-password" className="inline-block text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
          비밀번호 찾기 처음부터 다시하기
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      alert("비밀번호는 8자리 이상이어야 합니다.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 💡 설정한 API 라우트에 맞게 경로 확인 (/api/members/reset-password 또는 /api/reset-password)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSuccess(true);
      } else {
        alert(json.message || "비밀번호 변경에 실패했습니다.");
      }
    } catch (error) {
      alert("서버 통신 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-700 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm";
  const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5";

  if (isSuccess) {
    return (
      <div className="mt-6 space-y-6 text-center">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 rounded-xl space-y-2">
          <CheckCircle2 className="mx-auto text-emerald-600 dark:text-emerald-400" size={36} />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">비밀번호가 성공적으로 변경되었습니다.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            이제 새로운 비밀번호로 로그인해 주세요.
          </p>
        </div>
        <Link href="/login" className="w-full block bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold text-sm text-center transition-all shadow-lg shadow-indigo-500/30">
          로그인 화면으로 이동
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      <div>
        <label className={labelClass}>새로운 비밀번호</label>
        <input 
          type="password" 
          value={newPassword} 
          onChange={(e) => setNewPassword(e.target.value)} 
          placeholder="8자리 이상 입력" 
          className={inputClass} 
          required 
        />
      </div>

      <div>
        <label className={labelClass}>새로운 비밀번호 확인</label>
        <input 
          type="password" 
          value={confirmPassword} 
          onChange={(e) => setConfirmPassword(e.target.value)} 
          placeholder="비밀번호를 다시 입력하세요" 
          className={inputClass} 
          required 
        />
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white p-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70">
        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : null}
        {isSubmitting ? "변경 중..." : "비밀번호 변경하기"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors pt-34">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
        <div className="text-center">
          <h2 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">비밀번호 변경</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            새롭게 사용할 비밀번호를 입력해 주세요.
          </p>
        </div>
        
        {/* Next.js App Router에서 useSearchParams를 안전하게 사용하기 위해 Suspense로 래핑 */}
        <Suspense fallback={<div className="flex justify-center p-6"><Loader2 className="animate-spin text-indigo-600" size={24} /></div>}>
          <ResetPasswordForm />
        </Suspense>

      </div>
    </div>
  );
}