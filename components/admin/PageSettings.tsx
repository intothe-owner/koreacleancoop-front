// @/components/main/PageSettings.tsx
import { Save, Sparkles, ImagePlus } from "lucide-react";
import { MenuType } from "@/types/types";

interface PageSettingsProps {
    selectedMenuId: string;
    setSelectedMenuId: (id: string) => void;
    menus: MenuType[];
    title: string;
    setTitle: (title: string) => void;
    handleSave: () => void;
    pageMeta: { bgImage: string; bgTitle: string };
    setPageMeta: (meta: { bgImage: string; bgTitle: string }) => void;
    setMetaBgFile: (file: File | null) => void;
    // 💡 AI 모달 호출 함수 프롭스 추가
    setAiModalOpen?: (type: string, id?: string, content?: string) => void;
}

export default function PageSettings({
    selectedMenuId, setSelectedMenuId, menus, title, setTitle, handleSave, pageMeta, setPageMeta, setMetaBgFile, setAiModalOpen
}: PageSettingsProps) {
    return (
        <>
            <div className="flex flex-col gap-4 mb-6 border-b border-slate-200 pb-4 pt-4">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedMenuId}
                        onChange={(e) => setSelectedMenuId(e.target.value)}
                        className="border border-slate-300 rounded-lg px-4 py-2 bg-white text-slate-700 font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    >
                        <option value="">연결할 메뉴 선택...</option>
                        <option value="0">메인</option>
                        {menus.map(menu => (
                            <option key={menu.id} value={menu.id}>
                                {"\u00A0".repeat((menu.depth - 1) * 4)} {menu.depth > 1 ? '└ ' : ''}{menu.name}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-slate-500">선택된 메뉴와 연동될 페이지 콘텐츠를 구성합니다.</p>
                </div>
                <div className="flex items-center justify-between">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="페이지 관리용 제목 입력"
                        className="text-3xl font-extrabold text-slate-800 outline-none placeholder-slate-300 bg-transparent w-full"
                    />
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-bold transition flex-shrink-0 ml-4 shadow-md"
                    >
                        <Save size={18} /> 저장하기
                    </button>
                </div>
            </div>

            {/* 💡 AI 생성 버튼과 배경 이미지 관리 UI 보강 */}
            <div className="mb-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700 text-sm">페이지 헤더 (상단 배경) 설정</h3>
                    {setAiModalOpen && (
                        <button
                            onClick={() => setAiModalOpen('META', 'meta', JSON.stringify(pageMeta))}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-200 transition"
                        >
                            <Sparkles size={14} /> AI로 제목 및 배경 생성
                        </button>
                    )}
                </div>
                
                <div className="p-5 grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">상단 배경 제목 (텍스트)</label>
                        <input
                            type="text"
                            value={pageMeta.bgTitle}
                            onChange={(e) => setPageMeta({ ...pageMeta, bgTitle: e.target.value })}
                            placeholder="페이지 기본 제목 대신 표시될 배경 위 제목"
                            className="w-full border border-slate-300 p-2.5 rounded-lg outline-none focus:border-indigo-500 font-bold"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">상단 배경 이미지</label>
                        
                        {pageMeta.bgImage ? (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-200 w-full h-24 bg-slate-100">
                                <img src={pageMeta.bgImage} className="w-full h-full object-cover" alt="배경" />
                                
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                    <label className="flex items-center gap-1 bg-white text-slate-800 px-3 py-1.5 rounded text-xs font-bold cursor-pointer shadow hover:bg-slate-100">
                                        <ImagePlus size={14} /> 직접 첨부
                                        <input type="file" accept="image/*" onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setMetaBgFile(e.target.files[0]);
                                                setPageMeta({ ...pageMeta, bgImage: URL.createObjectURL(e.target.files[0]) });
                                            }
                                        }} className="hidden" />
                                    </label>
                                    <button 
                                        onClick={() => setPageMeta({ ...pageMeta, bgImage: '' })} 
                                        className="bg-red-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow hover:bg-red-600"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition">
                                <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><ImagePlus size={18}/> 이미지 첨부하기</span>
                                <input type="file" accept="image/*" onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setMetaBgFile(e.target.files[0]);
                                        setPageMeta({ ...pageMeta, bgImage: URL.createObjectURL(e.target.files[0]) });
                                    }
                                }} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}