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
  const [formData, setFormData] = useState({
    writerName: '', password: '', title: '', content: ''
  });

  useEffect(() => {
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
          content: post.content || ''
        });
        
        if (post.mediaUrls) {
          const parsedMedia = typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : post.mediaUrls;
          setExistingFiles(parsedMedia);
        }
      }
    });
  }, [boardId, postId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const submitData = new FormData(); 
    
    submitData.append('writerName', formData.writerName);
    submitData.append('password', formData.password);
    submitData.append('title', formData.title);
    submitData.append('content', formData.content);
    
    files.forEach((file) => { if (file) submitData.append('attachments', file); });

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`, { method: 'PUT', body: submitData });
      if (res.ok) {
        router.push(`/boards/${boardId}/${postId}`);
        router.refresh();
      } else {
        const error = await res.json();
        alert(`수정 실패: ${error.message}`);
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
          {/* 💡 추가된 부분: 게시판 이름 출력 */}
          
          
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{boardConfig.boardName} 게시글 수정</h1>
          <p className="text-slate-500 mt-2 text-sm">작성한 게시글의 내용을 수정합니다.</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">작성자 <span className="text-red-500">*</span></label>
                <input type="text" name="writerName" value={formData.writerName} required onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">비밀번호 확인 <span className="text-red-500">*</span></label>
                <input type="password" name="password" value={formData.password} required placeholder="수정을 위해 비밀번호 입력" onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">제목 <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={formData.title} required onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">내용 <span className="text-red-500">*</span></label>
              <textarea name="content" value={formData.content} required rows={12} onChange={handleChange}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed"></textarea>
            </div>

            {boardConfig.fileUploadCount > 0 && (
              <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  첨부파일 관리 (최대 {boardConfig.fileUploadCount}개)
                </h3>
                
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

                <p className="text-xs text-red-500 mb-4">* 새로운 파일을 첨부하면 기존 파일은 모두 삭제되고 새로 덮어씌워집니다.</p>
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
                {isSubmitting ? '수정 중...' : '수정 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}