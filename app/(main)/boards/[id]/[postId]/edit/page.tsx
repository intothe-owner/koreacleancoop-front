// src/app/(main)/boards/[id]/[postId]/edit/page.tsx
'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostEditPage({ params }: { params: Promise<{ id: string, postId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id: boardId, postId } = resolvedParams;

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ writerName: '', password: '', title: '', content: '', category: '' });
  
  // 💡 로그인 상태 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [extraData, setExtraData] = useState<Record<string, any>>({});

  useEffect(() => {
    // 로컬 스토리지에서 로그인 정보 확인
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(userStr));
    }

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${boardId}`).then(res => res.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`).then(res => res.json())
    ]).then(([boardRes, postRes]) => {
      if (boardRes.success) setBoardConfig(boardRes.data);
      if (postRes.success) {
        const post = postRes.data;
        setFormData({ writerName: post.writerName || '', password: '', title: post.title || '', content: post.content || '', category: post.category || '' });
        if (post.extraData) setExtraData(post.extraData);
        if (post.mediaUrls) setExistingFiles(typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : post.mediaUrls);
      }
    });
  }, [boardId, postId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
    const submitData = new FormData(); 
    
    // 원래 작성자 이름 유지
    submitData.append('writerName', formData.writerName);
    
    // 비회원일 경우만 수정을 위한 비밀번호 전송
    if (!isLoggedIn) {
      submitData.append('password', formData.password);
    }
    
    submitData.append('title', formData.title);
    submitData.append('content', formData.content);
    if (formData.category) submitData.append('category', formData.category);
    if (Object.keys(extraData).length > 0) submitData.append('extraData', JSON.stringify(extraData));
    
    files.forEach((file) => { if (file) submitData.append('attachments', file); });

    // 💡 로그인 시 발급받은 토큰 정보 가져오기
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`, { 
        method: 'PUT', 
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}) // 💡 토큰 전송 (관리자/작성자 인증)
        },
        body: submitData 
      });
      
      if (res.ok) {
        router.push(`/boards/${boardId}/${postId}`);
        router.refresh();
      } else { 
        const errorData = await res.json();
        alert(`수정 실패: ${errorData.message}`); 
      }
    } catch (error) { alert('서버 오류'); }
    setIsSubmitting(false);
  };

  if (!boardConfig) return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;

  const categories = boardConfig.categories ? boardConfig.categories.split(',').map((c: string) => c.trim()) : [];
  const extraFields = boardConfig.extraFields || [];

  return (
    <div className="w-full flex flex-col pt-24 pb-24 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <div className="mb-8"><h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName} 수정</h1></div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.length > 0 && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">카테고리</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                    <option value="">카테고리 선택</option>
                    {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              )}
              
              {/* 💡 로그인하지 않은 상태일 때만 작성자와 비밀번호 입력창을 노출 */}
              {!isLoggedIn && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">작성자 <span className="text-red-500">*</span></label>
                    <input type="text" name="writerName" value={formData.writerName} required placeholder="이름 또는 닉네임" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">비밀번호 확인 <span className="text-red-500">*</span></label>
                    <input type="password" name="password" value={formData.password} required placeholder="수정을 위해 게시글 비밀번호 입력" onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                  </div>
                </>
              )}
            </div>

            {boardConfig.useExtraFields && extraFields.length > 0 && (
              <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-xl space-y-6">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 mb-4">추가 정보 수정</h3>
                {extraFields.map((field: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{field.fieldName}</label>
                    {['text', 'number', 'url', 'email'].includes(field.inputType) ? (
                      <input type={field.inputType} value={extraData[field.fieldName] || ''} onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                    ) : field.inputType === 'select' ? (
                      <select value={extraData[field.fieldName] || ''} onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                        <option value="">선택하세요</option>
                        {field.options?.split(',').map((opt: string) => <option key={opt} value={opt.trim()}>{opt.trim()}</option>)}
                      </select>
                    ) : field.inputType === 'radio' ? (
                      <div className="flex flex-wrap gap-4 pt-1">
                        {field.options?.split(',').map((opt: string) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input type="radio" name={field.fieldName} value={opt.trim()} checked={extraData[field.fieldName] === opt.trim()} onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))} className="w-4 h-4 text-blue-600" />
                            {opt.trim()}
                          </label>
                        ))}
                      </div>
                    ) : field.inputType === 'checkbox' ? (
                      <div className="flex flex-wrap gap-4 pt-1">
                        {field.options?.split(',').map((opt: string) => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                            <input type="checkbox" value={opt.trim()} checked={(extraData[field.fieldName] || []).includes(opt.trim())} onChange={(e) => handleCheckboxChange(field.fieldName, opt.trim(), e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
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
              <input type="text" name="title" value={formData.title} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 <span className="text-red-500">*</span></label>
              <textarea name="content" value={formData.content} required rows={12} onChange={handleChange} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none leading-relaxed"></textarea>
            </div>

            {boardConfig.fileUploadCount > 0 && (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 mb-2">첨부파일 관리 (최대 {boardConfig.fileUploadCount}개)</h3>
                
                {existingFiles.length > 0 && (
                  <div className="mb-5 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <p className="text-xs font-bold text-blue-800 mb-2">현재 첨부된 파일</p>
                    <ul className="space-y-1 text-sm text-blue-600">
                      {existingFiles.map((url, idx) => {
                        const fileName = url.split('/').pop();
                        return (
                          <li key={idx} className="flex items-center gap-2">
                            <span>📎</span>
                            <a href={url} target="_blank" rel="noreferrer" className="hover:underline">{fileName}</a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                <p className="text-xs text-red-500 mb-4">* 새로운 파일을 첨부하면 기존 파일은 덮어씌워집니다.</p>
                <div className="space-y-3">
                  {Array.from({ length: boardConfig.fileUploadCount }).map((_, index) => (
                    <input key={index} type="file" onChange={(e) => { const newFiles = [...files]; newFiles[index] = e.target.files?.[0] || null as any; setFiles(newFiles); }} className="block w-full text-sm border border-slate-200 rounded-lg bg-white p-1.5" />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">취소</button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700">수정 완료</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}