import Link from 'next/link';
import PostActionButtons from './PostActionButtons';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getPostData(boardId: string, postId: string) {
  const [boardRes, postRes] = await Promise.all([
    fetch(`${API_URL}/api/board-configs/${boardId}`, { cache: 'no-store' }),
    fetch(`${API_URL}/api/boards/posts/${postId}`, { cache: 'no-store' })
  ]);
  return {
    boardConfig: boardRes.ok ? (await boardRes.json()).data : null,
    post: postRes.ok ? (await postRes.json()).data : null
  };
}

const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp)$/i.test(url);
const isVideo = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

export default async function PostDetailPage({ params }: { params: Promise<{ id: string, postId: string }> }) {
  const resolvedParams = await params;
  const { id: boardId, postId } = resolvedParams;
  const { boardConfig, post } = await getPostData(boardId, postId);

  if (!post) {
    return (
      <div className="w-full flex justify-center pt-32">
        <div className="text-center bg-slate-50 p-12 rounded-2xl border border-slate-200">
          <p className="text-xl font-bold text-slate-700 mb-4">게시글을 찾을 수 없습니다.</p>
          <Link href={`/boards/${boardId}`} className="text-blue-600 font-medium hover:underline">목록으로 돌아가기</Link>
        </div>
      </div>
    );
  }

  const mediaUrls: string[] = typeof post.mediaUrls === 'string' ? JSON.parse(post.mediaUrls) : (post.mediaUrls || []);
  const hasFiles = mediaUrls.some(url => !isImage(url) && !isVideo(url));

  return (
    <div className="w-full flex flex-col pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 w-full">
        
        <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* 헤더 */}
          <header className="px-6 py-8 md:px-10 md:py-10 border-b border-slate-100 bg-slate-50/30">
            {/* 💡 추가된 부분: 게시판 이름 출력 */}
            
            
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5 text-slate-700">
                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600">👤</div>
                {post.writerName}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {post.hitCount}
              </span>
            </div>
          </header>

          {/* 본문 영역 */}
          <div className="px-6 py-8 md:px-10 md:py-12">
            
            {/* 미디어 자동 렌더링 */}
            {mediaUrls.length > 0 && (
              <div className="mb-10 space-y-6">
                {mediaUrls.map((url, idx) => {
                  if (isImage(url)) return <img key={idx} src={url} alt="첨부 이미지" className="w-full max-w-3xl mx-auto rounded-xl border border-slate-100 shadow-sm" />;
                  if (isVideo(url)) return <video key={idx} src={url} controls className="w-full max-w-3xl mx-auto rounded-xl border border-slate-100 shadow-sm" />;
                  return null;
                })}
              </div>
            )}

            {/* 텍스트 본문 */}
            <div className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap min-h-[250px]">
              {post.content}
            </div>
          </div>

          {/* 일반 파일 다운로드 박스 */}
          {hasFiles && (
            <div className="mx-6 md:mx-10 mb-8 border border-slate-200 rounded-xl p-5 bg-slate-50">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                첨부파일
              </h4>
              <ul className="space-y-2">
                {mediaUrls.map((url, idx) => {
                  if (!isImage(url) && !isVideo(url)) {
                    const fileName = url.split('/').pop();
                    return (
                      <li key={idx} className="flex items-center">
                        <a href={url} download className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2">
                          <span className="px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-500">FILE</span>
                          {fileName || `첨부파일 ${idx + 1}`}
                        </a>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          )}
        </article>

        {/* 버튼 컨트롤 */}
        <div className="flex justify-between items-center mt-8">
          <Link href={`/boards/${boardId}`} className="px-6 py-2.5 font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-sm transition-colors">
            목록으로
          </Link>
          <PostActionButtons boardId={boardId} postId={postId} />
        </div>

        {/* 댓글 시스템 */}
        {boardConfig?.useComment && (
          <div className="mt-16 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
            <h3 className="font-extrabold text-xl text-slate-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
              댓글
            </h3>
            <div className="flex flex-col items-center justify-center py-12 bg-slate-50 border border-slate-100 rounded-xl border-dashed">
              <p className="text-slate-400 font-medium text-sm">댓글 시스템이 연동될 영역입니다.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}