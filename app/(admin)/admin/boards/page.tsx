"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, List, Save, Settings } from "lucide-react";

// --- 전체 모델 타입 정의 ---
interface BoardConfig {
  id: number;
  tableName: string;
  boardName: string;
  boardType: "GENERAL" | "GALLERY" | "FAQ";
  
  listCount: number;
  pageSize: number;
  readLevel: number;
  writeLevel: number;
  deleteLevel: number;
  useComment: boolean;
  commentWriteLevel: number;
  showOnMain: boolean;
  
  useCaptcha: boolean;
  useExtraFields: boolean;
  
  galleryCols: number;
  galleryRows: number;
  useVideo: boolean;
  videoAutoPlay: boolean;
  
  mainExposureCount: number;
  fileUploadCount: number;
}

const initialFormState: Partial<BoardConfig> = {
  tableName: "", boardName: "", boardType: "GENERAL",
  listCount: 10, pageSize: 10, readLevel: 1, writeLevel: 1, deleteLevel: 1,
  useComment: false, commentWriteLevel: 1, showOnMain: false,
  useCaptcha: true, useExtraFields: false,
  galleryCols: 3, galleryRows: 3, useVideo: false, videoAutoPlay: false,
  mainExposureCount: 5, fileUploadCount: 2,
};

export default function BoardConfigManager() {
  const [configs, setConfigs] = useState<BoardConfig[]>([]);
  const [viewMode, setViewMode] = useState<"LIST" | "FORM">("LIST");
  const [formData, setFormData] = useState<Partial<BoardConfig>>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs`);
      const json = await res.json();
      if (json.success) setConfigs(json.data);
    } catch (error) {
      console.error("게시판 설정 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // 입력값 처리 (체크박스와 숫자 필드 구분)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      const isNumberField = ['listCount', 'pageSize', 'readLevel', 'writeLevel', 'deleteLevel', 'commentWriteLevel', 'galleryCols', 'galleryRows', 'mainExposureCount', 'fileUploadCount'].includes(name);
      setFormData(prev => ({ ...prev, [name]: isNumberField ? Number(value) : value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${formData.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        alert(isEditing ? "수정되었습니다." : "생성되었습니다.");
        setViewMode("LIST");
        fetchConfigs();
      } else {
        alert("오류: " + json.message);
      }
    } catch (error) {
      alert("서버와 통신 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 게시판 설정을 삭제하시겠습니까? (관련 게시물도 삭제될 수 있습니다)")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        alert("삭제되었습니다.");
        fetchConfigs();
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const openCreateForm = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setViewMode("FORM");
  };

  const openEditForm = (config: BoardConfig) => {
    setFormData(config);
    setIsEditing(true);
    setViewMode("FORM");
  };

  const inputClass = "w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-500 cursor-pointer";
  const labelClass = "block text-sm font-bold text-slate-700 mb-1.5";

  // 권한 레벨 옵션 생성 헬퍼 함수
  const renderLevelOptions = () => {
    const options = [];
    options.push(<option key={1} value={1}>Level 1 (비회원 가능)</option>);
    for (let i = 2; i <= 10; i++) {
      options.push(<option key={i} value={i}>Level {i} 이상</option>);
    }
    return options;
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      {/* 타이틀 영역 */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">게시판 환경 설정</h2>
          <p className="text-sm text-slate-500 mt-1">사이트 내 다양한 게시판의 종류, 세부 권한 및 기능을 상세하게 관리합니다.</p>
        </div>
        <div className="flex-shrink-0">
          {viewMode === "FORM" ? (
            <button onClick={() => setViewMode("LIST")} className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition">
              <List size={16} /> 목록으로 돌아가기
            </button>
          ) : (
            <button onClick={openCreateForm} className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition">
              <Plus size={16} /> 새 게시판 만들기
            </button>
          )}
        </div>
      </div>

      {viewMode === "LIST" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-3.5 px-4 font-bold text-center w-16">No</th>
                  <th className="py-3.5 px-4 font-bold text-left">게시판 이름</th>
                  <th className="py-3.5 px-4 font-bold text-center">아이디 (DB)</th>
                  <th className="py-3.5 px-4 font-bold text-center">타입</th>
                  <th className="py-3.5 px-4 font-bold text-center">읽기/쓰기/삭제 권한</th>
                  <th className="py-3.5 px-4 font-bold text-center w-32">관리</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-500 font-bold">데이터를 불러오는 중입니다...</td></tr>
                ) : configs.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-500 font-bold">생성된 게시판이 없습니다.</td></tr>
                ) : (
                  configs.map((config, index) => (
                    <tr key={config.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-center text-slate-400 font-medium">{index + 1}</td>
                      <td className="py-4 px-4 font-bold text-slate-800">{config.boardName}</td>
                      <td className="py-4 px-4 text-center text-slate-500">{config.tableName}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold ${config.boardType === 'GALLERY' ? 'bg-emerald-100 text-emerald-700' : config.boardType === 'FAQ' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {config.boardType}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-500 text-xs font-medium">
                        Lv.{config.readLevel} / Lv.{config.writeLevel} / Lv.{config.deleteLevel}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => openEditForm(config)} className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition" title="수정"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(config.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md transition" title="삭제"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === "FORM" && (
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. 기본 정보 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">1. 기본 정보</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>게시판 아이디 (영문)</label>
                <input type="text" name="tableName" required value={formData.tableName} onChange={handleChange} disabled={isEditing} placeholder="예: notice" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm disabled:bg-slate-100 disabled:text-slate-500" />
                <span className="text-[11px] text-slate-500 mt-1 block">URL 및 DB 테이블 식별자로 사용됩니다. (수정 불가)</span>
              </div>
              <div>
                <label className={labelClass}>게시판 이름</label>
                <input type="text" name="boardName" required value={formData.boardName} onChange={handleChange} placeholder="예: 자유게시판" className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className={labelClass}>게시판 타입</label>
                <select name="boardType" value={formData.boardType} onChange={handleChange} className={inputClass}>
                  <option value="GENERAL">일반 게시판 (목록형)</option>
                  <option value="GALLERY">갤러리 게시판 (이미지 중심)</option>
                  <option value="FAQ">FAQ 게시판 (토글형)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. 권한 및 출력 설정 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">2. 권한 및 출력 설정</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={labelClass}>읽기 권한</label>
                <select name="readLevel" value={formData.readLevel} onChange={handleChange} className={inputClass}>
                  {renderLevelOptions()}
                </select>
              </div>
              <div>
                <label className={labelClass}>쓰기 권한</label>
                <select name="writeLevel" value={formData.writeLevel} onChange={handleChange} className={inputClass}>
                  {renderLevelOptions()}
                </select>
              </div>
              <div>
                <label className={labelClass}>삭제 권한</label>
                <select name="deleteLevel" value={formData.deleteLevel} onChange={handleChange} className={inputClass}>
                  {renderLevelOptions()}
                </select>
              </div>
              <div>
                <label className={labelClass}>페이지당 목록 수</label>
                <input type="number" name="listCount" min="1" max="100" value={formData.listCount} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className={labelClass}>페이징 사이즈</label>
                <input type="number" name="pageSize" min="1" max="20" value={formData.pageSize} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
              <div>
                <label className={labelClass}>메인 화면 노출 수</label>
                <input type="number" name="mainExposureCount" min="0" max="20" value={formData.mainExposureCount} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              </div>
            </div>
          </div>

          {/* 3. 부가 기능 및 첨부파일 */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">3. 기능 및 첨부파일 설정</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="useComment" checked={formData.useComment} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-700">댓글 사용 여부</span>
                </label>
                {formData.useComment && (
                  <div className="pl-6">
                    <label className={labelClass}>댓글 쓰기 권한</label>
                    <select name="commentWriteLevel" value={formData.commentWriteLevel} onChange={handleChange} className={inputClass}>
                      {renderLevelOptions()}
                    </select>
                  </div>
                )}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="useCaptcha" checked={formData.useCaptcha} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-700">비회원 자동등록방지 (Captcha) 사용</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="useExtraFields" checked={formData.useExtraFields} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-700">여분 필드(Extra Fields) 사용</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" name="showOnMain" checked={formData.showOnMain} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
                  <span className="text-sm font-bold text-slate-700">메인 화면에 노출</span>
                </label>
              </div>
              
              <div>
                <label className={labelClass}>최대 파일 첨부 개수</label>
                <input type="number" name="fileUploadCount" min="0" max="10" value={formData.fileUploadCount} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm" />
                <span className="text-[11px] text-slate-500 mt-1 block">게시물 1개당 업로드할 수 있는 파일의 개수입니다.</span>
              </div>
            </div>
          </div>

          {/* 4. 갤러리 전용 설정 (게시판 타입이 GALLERY일 때만 렌더링) */}
          {formData.boardType === "GALLERY" && (
            <div className="bg-emerald-50/50 rounded-2xl shadow-sm border border-emerald-200 overflow-hidden">
              <div className="bg-emerald-100/50 px-6 py-4 border-b border-emerald-200">
                <h3 className="text-lg font-bold text-emerald-800">4. 갤러리 전용 설정</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>갤러리 가로 열 (Cols) 개수</label>
                  <input type="number" name="galleryCols" min="1" max="10" value={formData.galleryCols} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
                <div>
                  <label className={labelClass}>갤러리 세로 행 (Rows) 개수</label>
                  <input type="number" name="galleryRows" min="1" max="20" value={formData.galleryRows} onChange={handleChange} className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm" />
                </div>
                <div className="md:col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="useVideo" checked={formData.useVideo} onChange={handleChange} className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500" />
                    <span className="text-sm font-bold text-emerald-900">동영상 업로드 허용</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name="videoAutoPlay" checked={formData.videoAutoPlay} onChange={handleChange} disabled={!formData.useVideo} className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 disabled:opacity-50" />
                    <span className="text-sm font-bold text-emerald-900">목록에서 동영상 자동 재생</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="flex justify-end pt-4 pb-10">
            <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-70">
              <Save size={20} />
              {isSaving ? "저장 중..." : (isEditing ? "수정 내용 저장" : "게시판 생성하기")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}