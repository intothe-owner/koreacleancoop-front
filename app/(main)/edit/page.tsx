"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCog, CheckCircle2, AlertCircle } from "lucide-react";
import Script from "next/script";

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    password: "", // 빈 값이면 변경 안 함 (백엔드 로직 대응)
    passwordConfirm: "",
    name: "",
    nickname: "",
    mobile: "",
    postcode: "",
    address: "",
    address_detail: "",
    latitude: "",
    longitude: "",
  });

  // 1. 초기 렌더링 시 로컬스토리지에서 내 정보 불러오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      alert("로그인이 필요합니다.");
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setUserData(user);
      
      // 폼에 기존 정보 세팅 (토큰 정보나 /api/auth/me API를 호출해서 최신 정보를 불러오는 것도 좋습니다)
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        nickname: user.nickname || "",
        mobile: user.mobile || "",
        postcode: user.postcode || "",
        address: user.address || "",
        address_detail: user.address_detail || "",
      }));
    } catch (e) {
      router.push("/login");
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    setSuccessMessage("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 다음 우편번호 검색 팝업
  const openPostcode = () => {
    if (typeof window === "undefined" || !(window as any).daum) {
      setErrorMessage("우편번호 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        const fullAddress = data.address;
        setFormData((prev) => ({
          ...prev,
          postcode: data.zonecode,
          address: fullAddress,
        }));
        
        // 카카오 Geocoder로 좌표 변환
        if ((window as any).kakao && (window as any).kakao.maps?.services) {
          const geocoder = new (window as any).kakao.maps.services.Geocoder();
          geocoder.addressSearch(fullAddress, (result: any, status: any) => {
            if (status === (window as any).kakao.maps.services.Status.OK) {
              setFormData((prev) => ({
                ...prev,
                latitude: result[0].y,
                longitude: result[0].x,
              }));
            }
          });
        }
      },
    }).open();
  };

  // 회원정보 수정 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (formData.password && formData.password !== formData.passwordConfirm) {
      return setErrorMessage("비밀번호가 일치하지 않습니다.");
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      // 백엔드 라우터 경로에 맞게 호출 (예: /api/members/:id)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${userData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          nickname: formData.nickname,
          mobile: formData.mobile,
          postcode: formData.postcode,
          address: formData.address,
          address_detail: formData.address_detail,
          latitude: formData.latitude,
          longitude: formData.longitude,
          ...(formData.password && { password: formData.password }), // 비밀번호 입력시에만 전송
        }),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "수정 중 오류가 발생했습니다.");
      }

      setSuccessMessage("회원 정보가 성공적으로 수정되었습니다.");
      
      // 로컬스토리지 정보 최신화 (헤더 갱신용)
      const updatedUser = { ...userData, name: formData.name, nickname: formData.nickname };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      // 헤더 등에 변경사항 즉각 반영을 위한 강제 리로드 또는 마이페이지 이동
      setTimeout(() => {
        router.push("/mypage");
        router.refresh();
      }, 1500);

    } catch (error: any) {
      setErrorMessage(error.message || "서버와 통신할 수 없습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) return null;

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white";
  const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      {/* 카카오맵 API KEY 적용 부분 (선택) */}
      <Script 
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`} 
        strategy="lazyOnload"
        onLoad={() => {
          if ((window as any).kakao && (window as any).kakao.maps) {
            (window as any).kakao.maps.load(() => {});
          }
        }}
      />

      <div className="min-h-[80vh] py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 transition-colors flex justify-center pt-34">
        <div className="max-w-2xl w-full space-y-8 bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
          
          <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-8">
            <UserCog className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
            <h2 className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-white">
              정보수정
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {userData.loginId} 계정의 정보를 수정합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 비밀번호 변경 구역 */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
              <div>
                <label className={labelClass}>새 비밀번호</label>
                <input type="password" name="password" onChange={handleChange} className={inputClass} placeholder="변경하려면 입력하세요 (비워두면 기존 유지)" />
              </div>
              <div>
                <label className={labelClass}>새 비밀번호 확인</label>
                <input type="password" name="passwordConfirm" onChange={handleChange} className={inputClass} placeholder="변경할 비밀번호 재입력" />
              </div>
            </div>

            {/* 일반 정보 구역 */}
            <div>
              <label className={labelClass}>이름 <span className="text-red-500">*</span></label>
              <input type="text" name="name" value={formData.name} required onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>닉네임</label>
              <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>휴대폰 번호</label>
              <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className={inputClass} placeholder="010-0000-0000" />
            </div>

            <div className="space-y-3">
              <label className={labelClass}>주소</label>
              <div className="flex gap-2">
                <input 
                  type="text" name="postcode" value={formData.postcode} readOnly 
                  className={`${inputClass} flex-1 bg-slate-100 dark:bg-slate-700/50 cursor-not-allowed`} 
                  placeholder="우편번호" 
                />
                <button 
                  type="button" onClick={openPostcode} 
                  className="px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
                >
                  우편번호 검색
                </button>
              </div>
              <input 
                type="text" name="address" value={formData.address} readOnly 
                className={`${inputClass} bg-slate-100 dark:bg-slate-700/50 cursor-not-allowed`} 
                placeholder="기본 주소" 
              />
              <input 
                type="text" name="address_detail" value={formData.address_detail} onChange={handleChange} 
                className={inputClass} placeholder="상세 주소를 입력해주세요" 
              />
            </div>

            {errorMessage && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold">
                <AlertCircle size={18} />
                <p>{errorMessage}</p>
              </div>
            )}
            
            {successMessage && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-600 text-sm font-bold">
                <CheckCircle2 size={18} />
                <p>{successMessage}</p>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button 
                type="button"
                onClick={() => router.back()}
                className="w-1/3 py-4 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-extrabold rounded-xl transition-colors text-lg"
              >
                취소
              </button>
              <button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-colors text-lg disabled:opacity-70"
              >
                {isLoading && <Loader2 className="animate-spin" size={20} />}
                {isLoading ? "수정 중..." : "정보 수정하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}