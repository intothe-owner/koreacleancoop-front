"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Users, Shield, List, Loader2, FileText } from "lucide-react";
import Script from "next/script";

const LEVEL_NAMES: Record<number, string> = {
  0: "차단/대기", 1: "일반회원", 2: "정회원", 3: "우수회원", 4: "VIP회원",
  5: "특별회원", 6: "부관리자", 7: "운영자", 8: "부서장", 9: "관리자", 10: "최고관리자"
};

export default function MemberDetail() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const initialForm = {
    id: 0, loginId: "", name: "", nickname: "", phone: "", mobile: "", 
    postcode: "", address: "", address_detail: "", latitude: "", longitude: "", 
    level: 1, password: "", createdAt: "", 
    memberType: "NORMAL", companyName: "", approvalFileUrl: ""
  };
  const [formData, setFormData] = useState(initialForm);
  const [approvalFile, setApprovalFile] = useState<File | null>(null);

  const getAuthHeaders = () => {
    const rawToken = localStorage.getItem("token") || "";
    const cleanToken = rawToken.replace(/^['"]|['"]$/g, ''); 
    return {
      "Authorization": `Bearer ${cleanToken}`
    };
  };

  useEffect(() => {
    const fetchMember = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${memberId}`, {
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" }
        });
        const json = await res.json();

        if (json.success) {
          setFormData({ ...json.data, password: "" });
        } else {
          alert(json.message || "회원 정보를 불러오지 못했습니다.");
          router.push("/admin/member");
        }
      } catch (error) {
        console.error("회원 상세 조회 오류:", error);
        alert("서버 오류가 발생했습니다.");
        router.push("/admin/member");
      } finally {
        setIsLoading(false);
      }
    };

    if (memberId) {
      fetchMember();
    }
  }, [memberId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setApprovalFile(e.target.files[0]);
    } else {
      setApprovalFile(null);
    }
  };

  const openPostcode = () => {
    if (typeof window === "undefined" || !(window as any).daum) {
      alert("우편번호 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
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
        
        if ((window as any).kakao && (window as any).kakao.maps.services) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("회원 정보를 수정하시겠습니까?")) return;

    setIsSaving(true);

    try {
      const submitData = new FormData();
      
      if (formData.password) submitData.append("password", formData.password);
      if (formData.name) submitData.append("name", formData.name);
      if (formData.phone) submitData.append("phone", formData.phone);
      if (formData.mobile) submitData.append("mobile", formData.mobile);
      if (formData.postcode) submitData.append("postcode", formData.postcode);
      if (formData.address) submitData.append("address", formData.address);
      if (formData.address_detail) submitData.append("address_detail", formData.address_detail);
      if (formData.latitude) submitData.append("latitude", String(formData.latitude));
      if (formData.longitude) submitData.append("longitude", String(formData.longitude));
      
      submitData.append("level", String(formData.level));

      if (formData.memberType === "NORMAL" && formData.nickname) {
        submitData.append("nickname", formData.nickname);
      }
      
      if (formData.memberType === "UNION") {
        if (formData.companyName) submitData.append("companyName", formData.companyName);
        if (approvalFile) {
          submitData.append("approvalFile", approvalFile);
        }
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/members/${formData.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: submitData
      });
      
      const json = await res.json();
      
      if (res.ok && json.success) {
        alert("수정되었습니다.");
        router.push("/admin/member");
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
    <>
      <Script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js" strategy="lazyOnload" />
      <Script 
        src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&libraries=services&autoload=false`} 
        strategy="lazyOnload"
        onLoad={() => {
          if ((window as any).kakao && (window as any).kakao.maps) {
            (window as any).kakao.maps.load(() => {});
          }
        }}
      />

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">회원 상세 정보</h2>
            <p className="text-sm text-slate-500 mt-1">선택한 회원의 정보를 확인하고 수정합니다.</p>
          </div>
          <button 
            onClick={() => router.push("/admin/member")}
            className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm hover:bg-black transition"
          >
            <List size={16}/> 목록으로
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-full shadow-sm border border-slate-100">
                <Users className="text-indigo-600" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  {formData.loginId}
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${formData.memberType === "UNION" ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-700"}`}>
                    {formData.memberType === "UNION" ? "조합원회원" : "일반회원"}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">가입일: {formData.createdAt ? new Date(formData.createdAt).toLocaleString() : ''}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block font-bold mb-1 text-slate-700">
                {formData.memberType === "UNION" ? "담당자 이름" : "이름"}
              </label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className={inputClass} />
            </div>

            {formData.memberType === "NORMAL" && (
              <div>
                <label className="block font-bold mb-1 text-slate-700">닉네임</label>
                <input type="text" value={formData.nickname || ""} onChange={e => setFormData({...formData, nickname: e.target.value})} className={inputClass} />
              </div>
            )}

            {formData.memberType === "UNION" && (
              <div className="col-span-2 grid grid-cols-2 gap-6 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">기업명</label>
                  <input type="text" value={formData.companyName || ""} onChange={e => setFormData({...formData, companyName: e.target.value})} required className={inputClass} placeholder="기업명 입력" />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-slate-700">승인 증빙서류 (사업자등록증 등)</label>
                  <input 
                    type="file" onChange={handleFileChange} 
                    className={`${inputClass} !p-1.5 bg-white`} accept=".jpg,.jpeg,.png,.pdf" 
                  />
                  {formData.approvalFileUrl && !approvalFile && (
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg flex items-center gap-2">
                      <FileText className="text-indigo-500" size={16} />
                      <a 
                        href={`${formData.approvalFileUrl}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-sm text-indigo-600 font-semibold hover:underline"
                      >
                        기존 등록된 서류 확인하기
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold mb-1 text-slate-700">유선 전화번호</label>
              <input type="text" value={formData.phone || ""} onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} />
            </div>
            <div>
              <label className="block font-bold mb-1 text-slate-700">
                {formData.memberType === "UNION" ? "담당자 휴대폰 번호" : "휴대폰 번호"}
              </label>
              <input type="text" value={formData.mobile || ""} onChange={e => setFormData({...formData, mobile: e.target.value})} className={inputClass} />
            </div>

            <div className="col-span-2 space-y-3">
              <label className="block font-bold mb-1 text-slate-700">주소</label>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={formData.postcode || ""} 
                  readOnly 
                  className={`${inputClass} flex-1 bg-slate-100 cursor-not-allowed`} 
                  placeholder="우편번호" 
                />
                <button 
                  type="button" 
                  onClick={openPostcode} 
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-sm font-bold text-slate-700 transition-colors whitespace-nowrap"
                >
                  우편번호 검색
                </button>
              </div>
              
              <input 
                type="text" 
                value={formData.address || ""} 
                readOnly 
                className={`${inputClass} bg-slate-100 cursor-not-allowed`} 
                placeholder="기본 주소" 
              />
              
              <input 
                type="text" 
                value={formData.address_detail || ""} 
                onChange={e => setFormData({...formData, address_detail: e.target.value})} 
                className={inputClass} 
                placeholder="상세 주소를 입력해주세요" 
              />

              {(formData.latitude && formData.longitude) && (
                <div className="text-xs text-slate-400 font-mono pl-1">
                  위치 좌표 저장됨 (Lat: {formData.latitude}, Lng: {formData.longitude})
                </div>
              )}
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-6 mt-2">
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield size={18} className="text-rose-500"/> 계정 보안 및 등급 관리
              </h4>
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div>
                  <label className="block font-bold mb-1 text-slate-700">회원 등급(권한)</label>
                  <select 
                    value={formData.level} 
                    onChange={e => setFormData({...formData, level: Number(e.target.value)})} 
                    className={inputClass}
                    disabled={formData.level === 10} 
                  >
                    {Object.entries(LEVEL_NAMES).map(([level, name]) => (
                      <option key={level} value={level}>{name} (Level {level})</option>
                    ))}
                  </select>
                  {formData.level === 10 && <p className="text-xs text-rose-500 mt-1">최고관리자 계정은 등급을 변경할 수 없습니다.</p>}
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700">비밀번호 강제 변경</label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder="변경 시에만 입력하세요." 
                    className={inputClass} 
                  />
                  <p className="text-xs text-slate-500 mt-1">입력하지 않으면 기존 비밀번호가 유지됩니다.</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200 flex justify-center items-center"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
            회원 정보 수정 저장하기
          </button>
        </form>
      </div>
    </>
  );
}