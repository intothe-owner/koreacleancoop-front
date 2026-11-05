"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserCog, CheckCircle2, AlertCircle } from "lucide-react";
import Script from "next/script";

export default function EditProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true); // 초기 데이터 로딩 상태
  const [userData, setUserData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null); // ✨ 관리자 설정 상태 추가

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    password: "", // 빈 값이면 변경 안 함
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

  // 1. 초기 렌더링 시 내 정보 및 회원 설정 불러오기
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
      
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        nickname: user.nickname || "",
        mobile: user.mobile || "",
        postcode: user.postcode || "",
        address: user.address || "",
        address_detail: user.address_detail || "",
        latitude: user.latitude || "",
        longitude: user.longitude || "",
      }));

      // ✨ 관리자 회원 설정 API 호출
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setSettings(json.data);
          }
        })
        .finally(() => setIsFetchingData(false));

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
        
        // ✨ 설정에서 useLocation이 켜져 있을 때만 좌표 변환 실행
        if (settings?.useLocation && (window as any).kakao && (window as any).kakao.maps?.services) {
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
      
      // 제출할 데이터 구성 (설정에 맞춰 활성화된 데이터만 전송)
      const submitData: any = {};
      if (formData.password) submitData.password = formData.password;
      if (settings?.useName) submitData.name = formData.name;
      if (settings?.useNickname) submitData.nickname = formData.nickname;
      if (settings?.useMobile) submitData.mobile = formData.mobile;
      
      if (settings?.useAddress) {
        submitData.postcode = formData.postcode;
        submitData.address = formData.address;
        submitData.address_detail = formData.address_detail;
        
        if (settings?.useLocation) {
          submitData.latitude = formData.latitude;
          submitData.longitude = formData.longitude;
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${userData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.message || "수정 중 오류가 발생했습니다.");
      }

      setSuccessMessage("회원 정보가 성공적으로 수정되었습니다.");
      
      // 로컬스토리지 정보 최신화 (Header 이름 갱신용)
      const updatedUser = { 
        ...userData, 
        ...(settings?.useName && { name: formData.name }),
        ...(settings?.useNickname && { nickname: formData.nickname })
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
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

  // 데이터 로딩 중 화면
  if (isFetchingData || !userData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-white";
  const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";

  return (
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      
      {/* ✨ 설정에서 위치 기능(useLocation)을 켰을 때만 카카오 맵 API 로드 */}
      {settings?.useLocation && (
        <Script 
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`} 
          strategy="lazyOnload"
          onLoad={() => {
            if ((window as any).kakao && (window as any).kakao.maps) {
              (window as any).kakao.maps.load(() => {});
            }
          }}
        />
      )}

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

            {/* ✨ 설정에 따라 동적으로 필드 노출 */}
            {settings?.useName && (
              <div>
                <label className={labelClass}>이름 <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={formData.name} required onChange={handleChange} className={inputClass} />
              </div>
            )}

            {settings?.useNickname && (
              <div>
                <label className={labelClass}>닉네임</label>
                <input type="text" name="nickname" value={formData.nickname} onChange={handleChange} className={inputClass} />
              </div>
            )}

            {settings?.useMobile && (
              <div>
                <label className={labelClass}>휴대폰 번호</label>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className={inputClass} placeholder="010-0000-0000" />
              </div>
            )}

            {settings?.useAddress && (
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
            )}

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