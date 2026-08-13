// src/app/(main)/boards/[id]/write/page.tsx
'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomEditor from '@/components/main/CustomEditor'; // 경로 맞춰 수정

export default function PostWritePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const boardId = resolvedParams.id;

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [extraData, setExtraData] = useState<Record<string, any>>({});
  
  const [content, setContent] = useState('');
  // 💡 본문에 삽입된 에디터 이미지 파일들을 모아두는 배열
  const [editorFiles, setEditorFiles] = useState<{ file: File, id: string }[]>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    let currentLevel = 1;
    
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

  // 💡 CustomEditor에서 호출되는 이미지 첨부 훅
  const handleEditorImageAttach = (file: File, id: string) => {
    setEditorFiles(prev => [...prev, { file, id }]);
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
    
    const pureText = content.replace(/<[^>]*>?/gm, '').trim();
    if (!content.includes('<img') && pureText === '') {
      alert('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // 💡 1. 폼 전송 직전: 본문의 blob URL들을 백엔드가 식별할 수 있는 cid:id로 치환
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const imgs = tempDiv.querySelectorAll('img[data-file-id]');
    
    imgs.forEach(img => {
      const id = img.getAttribute('data-file-id');
      img.setAttribute('src', `cid:${id}`); // 백엔드 치환용 마커
      img.removeAttribute('data-file-id');
    });
    
    // 치환된 HTML을 전송
    formData.set('content', tempDiv.innerHTML);

    // 💡 2. 본문에 쓰인 에디터 이미지 파일들을 FormData에 병합
    editorFiles.forEach(ef => {
      const ext = ef.file.name.split('.').pop();
      // 백엔드에서 원본 이름(originalname)으로 식별할 수 있도록 id.확장자 로 전송
      formData.append('editorImages', ef.file, `${ef.id}.${ext}`);
    });

    // 3. 기존 첨부파일 병합
    files.forEach(file => { if (file) formData.append('attachments', file); });
    
    if (Object.keys(extraData).length > 0) formData.append('extraData', JSON.stringify(extraData));
    if (isLoggedIn && userData) formData.append('memberId', userData.id);

    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${boardId}/posts`, {
        method: 'POST', 
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
        body: formData, // FormData 전송
      });
      if (res.ok) {
        router.push(`/boards/${boardId}`);
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.message || '게시글 등록에 실패했습니다.');
      }
    } catch (error) { 
      alert('서버 오류가 발생했습니다.'); 
    }
    setIsSubmitting(false);
  };

  if (!boardConfig) return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;

  const categories = boardConfig.categories ? boardConfig.categories.split(',').map((c: string) => c.trim()) : [];
  const extraFields = boardConfig.extraFields || [];

  return (
    <div className="w-full flex flex-col pt-24 pb-24 bg-slate-50/50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 w-full">
        {/* 헤더 유지 생략... */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName} 글 작성</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* 기본 입력 폼(카테고리, 작성자, 비번 등) 유지 생략... */}
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
              {!isLoggedIn ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">작성자 *</label>
                    <input type="text" name="writerName" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">비밀번호 *</label>
                    <input type="password" name="password" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                  </div>
                </>
              ) : (
                <input type="hidden" name="writerName" value={userData?.name || '회원'} />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 *</label>
              <input type="text" name="title" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>

            {/* 💡 커스텀 에디터 호출 부분 */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 *</label>
              {boardConfig.useEditor ? (
                <CustomEditor 
                  value={content} 
                  onChange={setContent} 
                  onImageAttach={handleEditorImageAttach}
                  placeholder="자유롭게 내용을 작성해주세요. (이미지 드래그 후 크기 조절 가능)" 
                />
              ) : (
                <textarea 
                  name="content" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required 
                  rows={12} 
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed"
                />
              )}
            </div>

            {boardConfig.fileUploadCount > 0 && (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 mb-2">첨부파일 (최대 {boardConfig.fileUploadCount}개)</h3>
                <div className="space-y-3">
                  {Array.from({ length: boardConfig.fileUploadCount }).map((_, index) => (
                    <input key={index} type="file" onChange={(e) => { const newFiles = [...files]; newFiles[index] = e.target.files?.[0] || null as any; setFiles(newFiles); }} className="block w-full text-sm border border-slate-200 rounded-lg bg-white p-1.5" />
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