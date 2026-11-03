// src/app/(main)/boards/[id]/page.tsx
// ❌ "use client" 삭제 (이 파일은 데이터를 불러오는 서버 컴포넌트입니다)

import MainSlider from '@/components/main/MainSlider';
import BoardListClient from './BoardListClient';
import SupportTabMenu from '../../SupportTabMenu';


const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

async function getBoardConfig(boardId: string) {
  const res = await fetch(`${API_URL}/api/board-configs/${boardId}`, { cache: 'no-store' });
  return res.ok ? (await res.json()).data : null;
}

export default async function BoardListPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const boardId = resolvedParams.id;
  
  const resolvedSearchParams = await searchParams;
  const categoryQuery = (resolvedSearchParams.category as string) || "";

  const boardConfig = await getBoardConfig(boardId);
  
  if (!boardConfig) {
    return <div className="p-8 text-center text-gray-500 w-full">게시판 설정을 찾을 수 없습니다.</div>;
  }

  const res = await fetch(`${API_URL}/api/boards/${boardId}/posts?page=1&limit=${boardConfig.listCount || 10}&category=${encodeURIComponent(categoryQuery)}`, { cache: 'no-store' });
  const postsJson = res.ok ? await res.json() : { data: [], totalPages: 1 };

  return (
    <div className="w-full flex flex-col">
      {/* 1. 헤더 영역 (배경 이미지) */}
      <div 
        className="relative w-full h-[400px] flex items-center justify-center bg-cover bg-center" 
        style={{ backgroundImage: `url(/images/support.png)` }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mt-30">
          고객 지원
        </h1>
      </div>
      
      {/* 2. 탭 메뉴 영역 (클라이언트 컴포넌트로 분리) */}
      <SupportTabMenu />

      {/* 3. 본문 영역 */}
      <div className="max-w-6xl mx-auto px-4 w-full mt-8 text-center">
        <BoardListClient 
          boardId={boardId} 
          boardConfig={boardConfig} 
          initialPosts={postsJson.data} 
          initialTotalPages={postsJson.totalPages}
          initialCategory={categoryQuery} 
          initialTotalCount={postsJson.totalCount || 0}
        />
      </div>
    </div>
  );
}