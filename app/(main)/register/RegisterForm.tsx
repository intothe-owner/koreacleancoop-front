"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RegisterForm({ settings }: { settings: any }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // 기본 폼 데이터 State
  const [formData, setFormData] = useState({
    loginId: "",
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    nickname: "",
    mobile: "",
    phone: "",
    dob: "",
    address: ""
  });

  // 💡 약관 동의 상태 관리 State
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 비밀번호 확인 유효성 체크
    if (formData.password !== formData.passwordConfirm) {
      return alert("비밀번호가 일치하지 않습니다.");
    }

    // 2. 💡 약관 동의 유효성 체크
    if (settings.useTermsOfService && !agreeTerms) {
      return alert("이용약관에 동의해 주세요.");
    }
    if (settings.usePrivacyPolicy && !agreePrivacy) {
      return alert("개인정보처리방침에 동의해 주세요.");
    }

    // 이메일을 아이디로 사용하는 경우 loginId에 email 값 복사
    const submitData = { ...formData };
    if (settings.useEmailAsLoginId) {
      submitData.loginId = submitData.email;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();

      if (data.success) {
        alert("회원가입이 완료되었습니다. 로그인해 주세요.");
        router.push("/login");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("서버와 통신할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white";
  const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* --- 기본 정보 입력 영역 --- */}
      {settings.useEmailAsLoginId ? (
        <div>
          <label className={labelClass}>이메일 (아이디) <span className="text-red-500">*</span></label>
          <input type="email" name="email" required onChange={handleChange} className={inputClass} placeholder="example@email.com" />
        </div>
      ) : (
        <>
          <div>
            <label className={labelClass}>아이디 <span className="text-red-500">*</span></label>
            <input type="text" name="loginId" required onChange={handleChange} className={inputClass} placeholder="영문, 숫자 조합 4~12자" />
          </div>
          {settings.useEmail && (
            <div>
              <label className={labelClass}>이메일 <span className="text-red-500">*</span></label>
              <input type="email" name="email" required onChange={handleChange} className={inputClass} placeholder="example@email.com" />
            </div>
          )}
        </>
      )}

      <div>
        <label className={labelClass}>비밀번호 <span className="text-red-500">*</span></label>
        <input type="password" name="password" required onChange={handleChange} className={inputClass} placeholder="비밀번호 입력" />
      </div>
      <div>
        <label className={labelClass}>비밀번호 확인 <span className="text-red-500">*</span></label>
        <input type="password" name="passwordConfirm" required onChange={handleChange} className={inputClass} placeholder="비밀번호를 다시 입력해주세요" />
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 my-4"></div>

      {settings.useName && (
        <div>
          <label className={labelClass}>이름 <span className="text-red-500">*</span></label>
          <input type="text" name="name" required onChange={handleChange} className={inputClass} placeholder="실명 입력" />
        </div>
      )}

      {settings.useNickname && (
        <div>
          <label className={labelClass}>닉네임</label>
          <input type="text" name="nickname" onChange={handleChange} className={inputClass} placeholder="활동에 사용할 닉네임" />
        </div>
      )}

      {settings.useMobile && (
        <div>
          <label className={labelClass}>휴대폰 번호 <span className="text-red-500">*</span></label>
          <input type="tel" name="mobile" required onChange={handleChange} className={inputClass} placeholder="010-0000-0000" />
        </div>
      )}

      {settings.useDob && (
        <div>
          <label className={labelClass}>생년월일</label>
          <input type="date" name="dob" onChange={handleChange} className={inputClass} />
        </div>
      )}

      {/* --- 💡 약관 및 정책 동의 영역 --- */}
      {(settings.useTermsOfService || settings.usePrivacyPolicy) && (
        <div className="pt-4 space-y-6 border-t border-slate-100 dark:border-slate-800">
          
          {/* 이용약관 노출부 */}
          {settings.useTermsOfService && (
            <div className="space-y-3">
              <label className={labelClass}>이용약관 동의 <span className="text-red-500">*</span></label>
              <div 
                className="w-full h-36 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: settings.termsContent || "이용약관 내용이 아직 등록되지 않았습니다." }}
              />
              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <input 
                  type="checkbox" 
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700" 
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  (필수) 이용약관에 동의합니다.
                </span>
              </label>
            </div>
          )}

          {/* 개인정보처리방침 노출부 */}
          {settings.usePrivacyPolicy && (
            <div className="space-y-3">
              <label className={labelClass}>개인정보처리방침 동의 <span className="text-red-500">*</span></label>
              <div 
                className="w-full h-36 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: settings.privacyContent || "개인정보처리방침 내용이 아직 등록되지 않았습니다." }}
              />
              <label className="flex items-center gap-2.5 cursor-pointer w-fit">
                <input 
                  type="checkbox" 
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-700" 
                />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  (필수) 개인정보 수집 및 이용에 동의합니다.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* --- 가입하기 버튼 --- */}
      <div className="pt-6">
        <button 
          type="submit" 
          disabled={isLoading}
          className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-colors text-lg disabled:opacity-70"
        >
          {isLoading && <Loader2 className="animate-spin" size={20} />}
          가입하기
        </button>
      </div>
    </form>
  );
}