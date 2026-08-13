// src/app/(main)/boards/[id]/[postId]/edit/page.tsx
'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomEditor from '@/components/main/CustomEditor'; // 💡 커스텀 에디터 임포트

export default function PostEditPage({ params }: { params: Promise<{ id: string, postId: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id: boardId, postId } = resolvedParams;

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ writerName: '', password: '', title: '', content: '', category: '' });
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  const [extraData, setExtraData] = useState<Record<string, any>>({});
  
  // 💡 새롭게 에디터에 추가되는 이미지를 담는 상태
  const [editorFiles, setEditorFiles] = useState<{ file: File, id: string }[]>([]);

  useEffect(() => {
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
        setFormData({ 
          writerName: post.writerName || '', 
          password: '', 
          title: post.title || '', 
          content: post.content || '', 
          category: post.category || '' 
        });
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

  // 💡 에디터 이미지 첨부 훅
  const handleEditorImageAttach = (file: File, id: string) => {
    setEditorFiles(prev => [...prev, { file, id }]);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 내용 유효성 검사
    const pureText = formData.content.replace(/<[^>]*>?/gm, '').trim();
    if (!formData.content.includes('<img') && pureText === '') {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    const submitData = new FormData(); 
    
    submitData.append('writerName', formData.writerName);
    
    if (!isLoggedIn) {
      submitData.append('password', formData.password);
    }
    
    submitData.append('title', formData.title);
    
    // 💡 에디터 본문 이미지 마킹 처리 (새로 추가된 이미지만 cid:id 로 치환)
    let finalContent = formData.content;
    if (boardConfig?.useEditor) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = finalContent;
      const imgs = tempDiv.querySelectorAll('img[data-file-id]');
      
      imgs.forEach(img => {
        const id = img.getAttribute('data-file-id');
        img.setAttribute('src', `cid:${id}`); 
        img.removeAttribute('data-file-id');
      });
      finalContent = tempDiv.innerHTML;
    }
    submitData.append('content', finalContent);

    if (formData.category) submitData.append('category', formData.category);
    if (Object.keys(extraData).length > 0) submitData.append('extraData', JSON.stringify(extraData));
    
    // 💡 에디터에 새로 삽입된 파일 추가
    editorFiles.forEach(ef => {
      const ext = ef.file.name.split('.').pop();
      submitData.append('editorImages', ef.file, `${ef.id}.${ext}`);
    });

    files.forEach((file) => { if (file) submitData.append('attachments', file); });

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`, { 
        method: 'PUT', 
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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

            {/* 💡 에디터 사용 여부에 따른 컴포넌트 렌더링 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 <span className="text-red-500">*</span></label>
              {boardConfig.useEditor ? (
                <CustomEditor 
                  value={formData.content} 
                  onChange={(val) => setFormData(prev => ({ ...prev, content: val }))} 
                  onImageAttach={handleEditorImageAttach}
                  placeholder="자유롭게 내용을 수정해주세요. (이미지 드래그 후 크기 조절 가능)" 
                />
              ) : (
                <textarea 
                  name="content" 
                  value={formData.content} 
                  required 
                  rows={12} 
                  onChange={handleChange} 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none leading-relaxed" 
                />
              )}
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