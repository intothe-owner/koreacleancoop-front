// src/app/(main)/boards/[id]/write/page.tsx
'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostWritePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const boardId = resolvedParams.id;

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 💡 로그인 상태 및 회원 정보를 관리할 state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // 추가 필드 데이터를 담을 state
  const [extraData, setExtraData] = useState<Record<string, any>>({});

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let currentLevel = 1;
    
    // 💡 로그인 정보가 있으면 state에 저장
    if (userStr) {
      const user = JSON.parse(userStr);
      currentLevel = user.level;
      setIsLoggedIn(true);
      setUserData(user);
    }

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${boardId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          if (currentLevel < json.data.writeLevel) {
            alert('글쓰기 권한이 없습니다.');
            router.push(`/boards/${boardId}`);
            return;
          }
          setBoardConfig(json.data);
        }
      });
  }, [boardId, router]);

  const handleCheckboxChange = (name: string, value: string, checked: boolean) => {
    setExtraData(prev => {
      const current = prev[name] || [];
      if (checked) return { ...prev, [name]: [...current, value] };
      else return { ...prev, [name]: current.filter((v: string) => v !== value) };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    files.forEach((file) => { if (file) formData.append('attachments', file); });
    
    if (Object.keys(extraData).length > 0) {
      formData.append('extraData', JSON.stringify(extraData));
    }

    // 💡 로그인한 경우 회원 ID 정보 추가 전송
    if (isLoggedIn && userData) {
      formData.append('memberId', userData.id);
    }

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${boardId}/posts`, {
        method: 'POST', 
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}) // 💡 토큰 포함
        },
        body: formData,
      });
      if (res.ok) {
        router.push(`/boards/${boardId}`);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.message || '게시글 등록에 실패했습니다.');
      }
    } catch (error) { alert('서버 오류가 발생했습니다.'); }
    setIsSubmitting(false);
  };

  if (!boardConfig) return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;

  const categories = boardConfig.categories ? boardConfig.categories.split(',').map((c: string) => c.trim()) : [];
  const extraFields = boardConfig.extraFields || [];

  return (
    <div className="w-full flex flex-col pt-24 pb-24 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName} 글 작성</h1>
          <p className="text-slate-500 mt-2 text-sm">{boardConfig.boardName}에 새로운 게시글을 등록합니다.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">카테고리</label>
                  <select name="category" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                    <option value="">카테고리 선택</option>
                    {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}

              {/* 💡 비회원일 때만 노출. 로그인이 되어있다면 숨겨집니다. */}
              {!isLoggedIn ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">작성자 <span className="text-red-500">*</span></label>
                    <input type="text" name="writerName" required placeholder="이름 또는 닉네임" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">비밀번호 <span className="text-red-500">*</span></label>
                    <input type="password" name="password" required placeholder="수정/삭제용 비밀번호" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                </>
              ) : (
                // 로그인 회원은 저장된 유저 이름만 서버로 전송
                <input type="hidden" name="writerName" value={userData?.name || userData?.nickname || '회원'} />
              )}
            </div>

            {boardConfig.useExtraFields && extraFields.length > 0 && (
              <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-xl space-y-6">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 mb-4">추가 정보 입력</h3>
                {extraFields.map((field: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{field.fieldName}</label>
                    {['text', 'number', 'url', 'email'].includes(field.inputType) ? (
                      <input 
                        type={field.inputType} 
                        value={extraData[field.fieldName] || ''} 
                        onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" 
                      />
                    ) : field.inputType === 'select' ? (
                      <select 
                        value={extraData[field.fieldName] || ''} 
                        onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                      >
                        <option value="">선택하세요</option>
                        {field.options?.split(',').map((opt: string) => <option key={opt} value={opt.trim()}>{opt.trim()}</option>)}
                      </select>
                    ) : field.inputType === 'radio' ? (
                      <div className="flex flex-wrap gap-4 pt-1">
                        {field.options?.split(',').map((opt: string) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input type="radio" name={field.fieldName} value={opt.trim()} checked={extraData[field.fieldName] === opt.trim()} onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                            {opt.trim()}
                          </label>
                        ))}
                      </div>
                    ) : field.inputType === 'checkbox' ? (
                      <div className="flex flex-wrap gap-4 pt-1">
                        {field.options?.split(',').map((opt: string) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input type="checkbox" value={opt.trim()} checked={(extraData[field.fieldName] || []).includes(opt.trim())} onChange={(e) => handleCheckboxChange(field.fieldName, opt.trim(), e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                            {opt.trim()}
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 <span className="text-red-500">*</span></label>
              <input type="text" name="title" required placeholder="게시글 제목을 입력해주세요" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 <span className="text-red-500">*</span></label>
              <textarea name="content" required rows={12} placeholder="자유롭게 내용을 작성해주세요" className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed"></textarea>
            </div>

            {boardConfig.fileUploadCount > 0 && (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">첨부파일 (최대 {boardConfig.fileUploadCount}개)</h3>
                <p className="text-xs text-slate-500 mb-4">50MB 이하의 파일만 업로드 가능하며, 실행 파일(.exe, .apk)은 제외됩니다.</p>
                <div className="space-y-3">
                  {Array.from({ length: boardConfig.fileUploadCount }).map((_, index) => (
                    <div key={index} className="relative">
                      <input type="file" onChange={(e) => { const newFiles = [...files]; newFiles[index] = e.target.files?.[0] || null as any; setFiles(newFiles); }} className="block w-full text-sm text-slate-500 border border-slate-200 rounded-lg bg-white p-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">취소</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">등록 완료</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}