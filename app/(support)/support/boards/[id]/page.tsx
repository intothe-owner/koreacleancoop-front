"use client"; 
// src/app/(main)/boards/[id]/page.tsx
import MainSlider from '@/components/main/MainSlider';
import BoardListClient from './BoardListClient';
import { SUPPORT_TABS } from '@/lib/supportMenus';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const resolvedParams = await params;
  const boardId = resolvedParams.id;
  
  // 💡 주소창의 ?category=값을 읽어옵니다.
  const resolvedSearchParams = await searchParams;
  const categoryQuery = (resolvedSearchParams.category as string) || "";

  const boardConfig = await getBoardConfig(boardId);
  
  if (!boardConfig) {
    return <div className="p-8 text-center text-gray-500 w-full">게시판 설정을 찾을 수 없습니다.</div>;
  }

  // 💡 초기 데이터 페칭 시 category 파라미터 추가
  const res = await fetch(`${API_URL}/api/boards/${boardId}/posts?page=1&limit=${boardConfig.listCount || 10}&category=${encodeURIComponent(categoryQuery)}`, { cache: 'no-store' });
  const postsJson = res.ok ? await res.json() : { data: [], totalPages: 1 };

  let pageData = null;

  try {
    const pageRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/boards/${boardId}`, { cache: "no-store" });
    const json = await pageRes.json();
    if (json.success) pageData = json.data;
  } catch (error) {
    console.error("서브페이지 데이터 로딩 실패:", error);
  }

  
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
      {/* 2. 탭 메뉴 영역 (기존 TabMenu 컴포넌트의 디자인 동일 적용) */}
      <div className="w-full bg-white border-b border-slate-200 mt-6 pb-2">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap gap-2 justify-center">
          {SUPPORT_TABS.map((tab, index) => {
            // 💡 현재 URL과 탭의 URL이 일치하거나, 메인(/support)으로 접속 시 첫 번째 탭 활성화
            const isActive = pathname === tab.url || (pathname === '/support' && index === 0);

            return (
              <Link
                key={tab.name}
                href={tab.url}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 w-full mt-8 text-center">
        <BoardListClient 
          boardId={boardId} 
          boardConfig={boardConfig} 
          initialPosts={postsJson.data} 
          initialTotalPages={postsJson.totalPages}
          initialCategory={categoryQuery} // 💡 클라이언트 컴포넌트에 초기 카테고리 값 전달
          initialTotalCount={postsJson.totalCount || 0}
        />
      </div>
    </div>
  );
}