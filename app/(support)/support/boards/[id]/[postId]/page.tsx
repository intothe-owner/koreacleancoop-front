'use client';

import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import PostActionButtons from './PostActionButtons';

const fetchPostDetail = async (boardId: string, postId: string) => {
  const [boardRes, postRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs/${boardId}`),
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/posts/${postId}`)
  ]);
  
  const postData = postRes.ok ? await postRes.json() : null;
  const boardConfig = boardRes.ok ? (await boardRes.json()).data : null;

  return {
    boardConfig,
    post: postData?.data || null,
    prevPost: postData?.prevPost || null,
    nextPost: postData?.nextPost || null
  };
};

const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

export default function PostDetailPage({ params }: { params: Promise<{ id: string, postId: string }> }) {
  const resolvedParams = use(params);
  const { id: boardId, postId } = resolvedParams;

  const { data, isLoading } = useQuery({
    queryKey: ['postDetail', postId],
    queryFn: () => fetchPostDetail(boardId, postId),
  });

  if (isLoading) {
    return <div className="w-full text-center pt-32 text-slate-500 font-medium">로딩 중...</div>;
  }

  const { boardConfig, post, prevPost, nextPost } = data || {};

  if (!post) {
    return (
      <div className="w-full flex justify-center pt-32">
        <div className="text-center bg-slate-50 p-12 rounded-2xl border border-slate-200">
          <p className="text-xl font-bold text-slate-700 mb-4">게시글을 찾을 수 없습니다.</p>
          <Link href={`/support/boards/${boardId}`} className="text-blue-600 font-medium hover:underline">목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const mediaUrls: string[] = typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : (post.mediaUrls || []);
  
  // 💡 첨부파일을 이미지와 일반 파일로 분리합니다.
  const attachedImages = mediaUrls.filter(isImage);
  const attachedFiles = mediaUrls.filter((url) => !isImage(url));

  const extraFields = boardConfig?.extraFields || [];
  const extraData = typeof post.extraData === 'string'
    ? (() => { try { return JSON.parse(post.extraData); } catch { return {}; } })()
    : (post.extraData || {});

  const formatExtraValue = (field: any) => {
    const value = extraData[field.fieldName];
    if (Array.isArray(value)) return value.join(', ');
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  };

  return (
    <div className="w-full flex flex-col pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 w-full">
        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <header className="px-6 py-8 md:px-10 md:py-10 border-b border-slate-100 bg-slate-50/30">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              {post.category && <span className="text-blue-600 mr-3">[{post.category}]</span>}
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700">{post.writerName}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>조회 {post.hitCount}</span>
            </div>
          </header>

          {boardConfig?.useExtraFields && extraFields.length > 0 && (
            <dl className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-100 bg-slate-50/50">
              {extraFields.map((field: any, index: number) => (
                <div key={`${field.fieldName}-${index}`} className="grid grid-cols-[120px_1fr] gap-4 px-6 py-4 md:px-10 border-b border-slate-100 last:border-b-0 md:[&:nth-last-child(-n+2)]:border-b-0">
                  <dt className="text-sm font-bold text-slate-600">{field.fieldName}</dt>
                  <dd className="text-sm text-slate-900 break-words">{formatExtraValue(field)}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* 본문 영역 */}
          <div className="px-6 py-8 md:px-10 md:py-12">
            {boardConfig?.useEditor ? (
              <div className="text-slate-800 text-lg leading-relaxed min-h-[250px] editor-output" dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[250px]">{post.content}</div>
            )}

            {/* 💡 첨부파일 중 이미지가 있다면 본문 바로 아래에 렌더링합니다 */}
            {attachedImages.length > 0 && (
              <div className="mt-10 space-y-6">
                {attachedImages.map((url, index) => (
                  <img 
                    key={`img-${index}`} 
                    src={url} 
                    alt={`첨부 이미지 ${index + 1}`} 
                    className="max-w-full h-auto rounded-xl shadow-sm mx-auto" 
                  />
                ))}
              </div>
            )}
          </div>

          {/* 💡 이미지를 제외한 일반 첨부파일 목록 렌더링 */}
          {attachedFiles.length > 0 && (
            <div className="px-6 py-5 md:px-10 border-t border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
                첨부파일 ({attachedFiles.length})
              </h3>
              <ul className="flex flex-col gap-2">
                {attachedFiles.map((url: string, index: number) => {
                  const rawFileName = url.split('/').pop()?.split('?')[0];
                  const fileName = rawFileName ? decodeURIComponent(rawFileName) : `첨부파일 ${index + 1}`;
                  
                  return (
                    <li key={`file-${index}`} className="flex items-center">
                      <a 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                        download
                      >
                        {fileName}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </article>

        <div className="flex justify-between items-center mt-8">
          <Link href={`/support/boards/${boardId}`} className="px-6 py-2.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
            목록으로
          </Link>
          <PostActionButtons boardId={boardId} postId={postId} boardConfig={boardConfig}/>
        </div>
      </div>
    </div>
  );
}