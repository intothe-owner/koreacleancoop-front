// src/app/(main)/boards/[id]/write/PostWriteClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostWriteClient({ boardId }: { boardId: string }) {
  const router = useRouter();

  const [boardConfig, setBoardConfig] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${boardId}`)
      .then(res => res.json())
      .then(json => { 
        if (json.success) setBoardConfig(json.data); 
      });
  }, [boardId]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const currentLevel = userStr ? JSON.parse(userStr).level : 1;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${boardId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          // 💡 강제로 /write URL을 치고 들어왔을 때 튕겨내기
          if (currentLevel < json.data.writeLevel) {
            alert('글쓰기 권한이 없습니다.');
            router.push(`/boards/${boardId}`);
            return;
          }
          setBoardConfig(json.data);
        }
      });
  }, [boardId, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    files.forEach((file) => { 
      if (file) formData.append('attachments', file); 
    });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${boardId}/posts`, {
        method: 'POST', 
        body: formData,
      });
      if (res.ok) {
        router.push(`/boards/${boardId}`);
        router.refresh();
      }
    } catch (error) {
      alert('서버 오류가 발생했습니다.');
    }
    setIsSubmitting(false);
  };

  if (!boardConfig) return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;

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
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">작성자 <span className="text-red-500">*</span></label>
                <input type="text" name="writerName" required placeholder="이름 또는 닉네임"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">비밀번호 <span className="text-red-500">*</span></label>
                <input type="password" name="password" required placeholder="수정/삭제용 비밀번호"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 <span className="text-red-500">*</span></label>
              <input type="text" name="title" required placeholder="게시글 제목을 입력해주세요"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 <span className="text-red-500">*</span></label>
              <textarea name="content" required rows={12} placeholder="자유롭게 내용을 작성해주세요"
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed"></textarea>
            </div>

            {boardConfig.fileUploadCount > 0 && (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm3.675 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" /></svg>
                  첨부파일 (최대 {boardConfig.fileUploadCount}개)
                </h3>
                <p className="text-xs text-slate-500 mb-4">50MB 이하의 파일만 업로드 가능하며, 실행 파일(.exe, .apk)은 제외됩니다.</p>
                <div className="space-y-3">
                  {Array.from({ length: boardConfig.fileUploadCount }).map((_, index) => (
                    <div key={index} className="relative">
                      <input
                        type="file"
                        onChange={(e) => {
                          const newFiles = [...files];
                          newFiles[index] = e.target.files?.[0] || null as any;
                          setFiles(newFiles);
                        }}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => router.back()} className="px-6 py-3 font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                취소
              </button>
              <button type="submit" disabled={isSubmitting} className="px-8 py-3 font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50">
                {isSubmitting ? '등록 중...' : '등록 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}