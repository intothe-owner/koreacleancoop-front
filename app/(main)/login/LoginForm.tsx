// src/app/(main)/login/LoginForm.tsx
"use client";

import { useState } from "react";
import { Lock, Mail, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm({ settings }: { settings: any }) {
  const isEmailId = settings.useEmailAsLoginId;
  const router = useRouter();
  
  const [formData, setFormData] = useState({ loginId: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        // 성공 시 로컬 스토리지에 토큰 저장 후 메인으로 이동
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert(`${data.user.name}님 환영합니다!`);
       window.location.href = "/";
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("서버와 통신할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          {isEmailId ? "이메일" : "아이디"}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isEmailId ? <Mail size={18} className="text-slate-400" /> : <User size={18} className="text-slate-400" />}
          </div>
          <input 
            type={isEmailId ? "email" : "text"} 
            required 
            value={formData.loginId}
            onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white"
            placeholder={isEmailId ? "example@email.com" : "아이디를 입력하세요"}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">비밀번호</label>
          <Link href="#" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            비밀번호 찾기
          </Link>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Lock size={18} className="text-slate-400" />
          </div>
          <input 
            type="password" 
            required 
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white"
            placeholder="비밀번호를 입력하세요"
          />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isLoading}
        className="flex items-center justify-center gap-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-70"
      >
        {isLoading && <Loader2 className="animate-spin" size={18} />}
        로그인
      </button>
    </form>
  );
}