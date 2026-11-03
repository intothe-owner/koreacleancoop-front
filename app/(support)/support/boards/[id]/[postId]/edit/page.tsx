// src/app/(main)/boards/[id]/[postId]/edit/page.tsx
'use client';

import { useState, use, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CustomEditor from '@/components/main/CustomEditor';

export default function PostEditPage({ params }: { params: Promise<{ id: string, postId: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedParams = use(params);
  const { id: boardId, postId } = resolvedParams;

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  const [formData, setFormData] = useState({ writerName: '', password: '', title: '', content: '', category: '' });
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  const [editorFiles, setEditorFiles] = useState<{ file: File, id: string }[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setIsLoggedIn(true);
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
        if (post.extraData) {
          if (typeof post.extraData === 'string') {
            try { setExtraData(JSON.parse(post.extraData)); } catch { setExtraData({}); }
          } else {
            setExtraData(post.extraData);
          }
        }
        if (post.mediaUrls) setExistingFiles(typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : post.mediaUrls);
      }
    });
  }, [boardId, postId]);

  const editMutation = useMutation({
    mutationFn: async (submitData: FormData) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`, { 
        method: 'PUT', 
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: submitData 
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '수정 실패');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postDetail', postId] });
      queryClient.invalidateQueries({ queryKey: ['boardPosts', boardId] });
      router.push(`/support/boards/${boardId}/${postId}`);
      router.refresh();
    },
    onError: (error: any) => {
      alert(`수정 실패: ${error.message}`);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (fieldName: string, option: string, checked: boolean) => {
    setExtraData(prev => {
      const current = Array.isArray(prev[fieldName]) ? prev[fieldName] : [];
      return { ...prev, [fieldName]: checked ? [...current, option] : current.filter((item: string) => item !== option) };
    });
  };

  const handleEditorImageAttach = (file: File, id: string) => {
    setEditorFiles(prev => [...prev, { file, id }]);
  };

  // 💡 기존 파일 갯수를 고려하여 새 첨부파일 개수 제한을 체크하도록 보완
  const addFiles = (newFiles: File[]) => {
    const currentTotal = existingFiles.length + files.length;
    if (currentTotal + newFiles.length > boardConfig.fileUploadCount) {
      alert(`첨부파일은 최대 ${boardConfig.fileUploadCount}개까지만 업로드 가능합니다.`);
      const spaceLeft = Math.max(0, boardConfig.fileUploadCount - currentTotal);
      if (spaceLeft > 0) setFiles(prev => [...prev, ...newFiles.slice(0, spaceLeft)]);
    } else {
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const removeExistingFile = (indexToRemove: number) => {
    setExistingFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const pureText = formData.content.replace(/<[^>]*>?/gm, '').trim();
    if (!formData.content.includes('<img') && pureText === '') {
      alert('내용을 입력해주세요.');
      return;
    }

    const submitData = new FormData(); 
    submitData.append('writerName', formData.writerName);
    
    if (!isLoggedIn) submitData.append('password', formData.password);
    submitData.append('title', formData.title);
    
    let finalContent = formData.content;
    if (boardConfig?.useEditor) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = finalContent;
      tempDiv.querySelectorAll('img[data-file-id]').forEach(img => {
        const id = img.getAttribute('data-file-id');
        img.setAttribute('src', `cid:${id}`); 
        img.removeAttribute('data-file-id');
      });
      finalContent = tempDiv.innerHTML;
    }
    submitData.append('content', finalContent);

    if (formData.category) submitData.append('category', formData.category);
    if (Object.keys(extraData).length > 0) submitData.append('extraData', JSON.stringify(extraData));
    submitData.append('existingFiles', JSON.stringify(existingFiles));

    editorFiles.forEach(ef => {
      submitData.append('editorImages', ef.file, `${ef.id}.${ef.file.name.split('.').pop()}`);
    });

    files.forEach((file) => { if (file) submitData.append('attachments', file); });

    editMutation.mutate(submitData);
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
                    <label className="text-sm font-bold text-slate-700">작성자 *</label>
                    <input type="text" name="writerName" value={formData.writerName} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">비밀번호 확인 *</label>
                    <input type="password" name="password" value={formData.password} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 *</label>
              <input type="text" name="title" value={formData.title} required onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 *</label>
              {boardConfig.useEditor ? (
                <CustomEditor value={formData.content} onChange={(val) => setFormData(prev => ({ ...prev, content: val }))} onImageAttach={handleEditorImageAttach} />
              ) : (
                <textarea name="content" value={formData.content} required rows={12} onChange={handleChange} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 resize-none leading-relaxed" />
              )}
            </div>

            {/* 💡 파일 첨부 영역 추가 (수정 시 기존 파일 유지 및 새 파일 드래그앤드롭) */}
            {boardConfig.fileUploadCount > 0 && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 flex justify-between items-center">
                  <span>첨부파일</span>
                  <span className="text-xs text-slate-500 font-medium">최대 {boardConfig.fileUploadCount}개</span>
                </label>
                
                <div 
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                    ${isDragging ? 'border-blue-500 bg-blue-50/50' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    onChange={(e) => {
                      if (e.target.files) addFiles(Array.from(e.target.files));
                      e.target.value = ''; // 재선택을 위한 초기화
                    }} 
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="text-sm font-medium text-slate-600">클릭하거나 파일을 이곳으로 드래그하세요</p>
                    <p className="text-xs text-slate-400">현재 첨부된 파일: {existingFiles.length + files.length} / {boardConfig.fileUploadCount}개</p>
                  </div>
                </div>

                {/* 1. 기존 첨부파일 목록 */}
                {existingFiles.length > 0 && (
                  <ul className="space-y-2 mt-4">
                    {existingFiles.map((url, index) => {
                      const rawFileName = url.split('/').pop()?.split('?')[0];
                      const fileName = rawFileName ? decodeURIComponent(rawFileName) : `기존 파일 ${index + 1}`;
                      return (
                        <li key={`existing-${index}`} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                          <span className="text-sm text-slate-700 truncate max-w-[80%]">
                            {fileName} <span className="text-xs text-blue-500 ml-2 font-medium">(기존 파일)</span>
                          </span>
                          <button type="button" onClick={() => removeExistingFile(index)} className="text-slate-400 hover:text-red-500 p-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* 2. 신규 첨부파일 목록 */}
                {files.length > 0 && (
                  <ul className="space-y-2 mt-2">
                    {files.map((file, index) => (
                      <li key={`new-${index}`} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <span className="text-sm text-blue-800 truncate max-w-[80%]">
                          {file.name} <span className="text-xs text-blue-500 ml-2 font-medium">(새로 추가됨)</span>
                        </span>
                        <button type="button" onClick={() => removeFile(index)} className="text-slate-400 hover:text-red-500 p-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {boardConfig.useExtraFields && extraFields.length > 0 && (
              <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-xl space-y-6">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">추가 정보 수정</h3>
                {extraFields.map((field: any, index: number) => (
                  <div key={`${field.fieldName}-${index}`} className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{field.fieldName}</label>
                    {['text', 'number', 'url', 'email', 'date'].includes(field.inputType) ? (
                      <input type={field.inputType} value={extraData[field.fieldName] ?? ''} onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500" />
                    ) : field.inputType === 'select' ? (
                      <select value={extraData[field.fieldName] ?? ''} onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-blue-500">
                        <option value="">선택하세요</option>
                        {field.options?.split(',').map((opt: string) => <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>)}
                      </select>
                    ) : field.inputType === 'radio' ? (
                      <div className="flex flex-wrap gap-4 pt-1">{field.options?.split(',').map((opt: string) => {
                        const value = opt.trim();
                        return <label key={value} className="flex items-center gap-2 cursor-pointer text-sm"><input type="radio" name={`extra-${field.fieldName}`} value={value} checked={extraData[field.fieldName] === value} onChange={(e) => setExtraData(prev => ({ ...prev, [field.fieldName]: e.target.value }))} className="w-4 h-4 text-blue-600" />{value}</label>;
                      })}</div>
                    ) : field.inputType === 'checkbox' ? (
                      <div className="flex flex-wrap gap-4 pt-1">{field.options?.split(',').map((opt: string) => {
                        const value = opt.trim();
                        return <label key={value} className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" value={value} checked={(Array.isArray(extraData[field.fieldName]) ? extraData[field.fieldName] : []).includes(value)} onChange={(e) => handleCheckboxChange(field.fieldName, value, e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />{value}</label>;
                      })}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">취소</button>
              <button type="submit" disabled={editMutation.isPending} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">수정 완료</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}