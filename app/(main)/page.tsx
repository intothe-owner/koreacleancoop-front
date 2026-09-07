"use client"; // 💡 1. 클라이언트 컴포넌트로 선언 (React Query 훅을 쓰기 위해 필수)

import Link from "next/link";
import BlockRenderer from "@/components/main/BlockRenderer";
import MainSlider from "@/components/main/MainSlider";
import { useQuery } from "@tanstack/react-query";

// 💡 2. 데이터를 가져오는 순수 통신 함수들을 컴포넌트 밖으로 분리합니다.
const fetchMainPageData = async () => {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/0`);
  const json = await res.json();
  if (!json.success) throw new Error("메인 페이지 데이터 로딩 실패");
  return json.data;
};

const fetchMainBoards = async () => {
  // 게시판 설정 불러오기
  const configsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/board-configs`);
  const configsJson = await configsRes.json();
  
  if (!configsJson.success) return [];

  const mainBoards = (configsJson.data || [])
    .filter((b: any) => b.showOnMain)
    .sort((a: any, b: any) => (a.exposureOrder || 0) - (b.exposureOrder || 0));

  // 각 게시판별 최신 게시글 가져오기
  const boardsWithPosts = await Promise.all(mainBoards.map(async (board: any) => {
    const postsRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/boards/${board.tableName || board.id}/posts?page=1&limit=${board.mainExposureCount || 5}`);
    const postsJson = postsRes.ok ? await postsRes.json() : { data: [] };
    return { ...board, posts: postsJson.data || [] };
  }));

  return boardsWithPosts;
};

export default function MainPage() {
  
  // 💡 4. React Query의 useQuery 훅으로 데이터를 가져오고 상태를 관리합니다.
  const { 
    data: mainPageData, 
    isLoading: isMainLoading, 
    isError: isMainError 
  } = useQuery({
    queryKey: ['mainPageData'],
    queryFn: fetchMainPageData,
  });

  const { 
    data: mainBoardsWithPosts = [], 
    isLoading: isBoardsLoading 
  } = useQuery({
    queryKey: ['mainBoards'],
    queryFn: fetchMainBoards,
  });

  // 💡 5. 로딩 중일 때 보여줄 UI
  if (isMainLoading || isBoardsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-xl font-bold text-slate-500">데이터를 불러오는 중입니다...</h1>
      </div>
    );
  }

  // 에러가 났거나 데이터가 없을 때의 처리
  if (isMainError || !mainPageData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-500">메인 페이지가 아직 설정되지 않았습니다.</h1>
      </div>
    );
  }

  // 💡 6. 렌더링 영역
  return (
    <div className="w-full flex flex-col pb-24">
      {/* 슬라이더 영역 */}
      {mainPageData.sliderData && mainPageData.sliderData.length > 0 && (
        <MainSlider slides={mainPageData.sliderData} />
      )}

      {/* 빌더 콘텐츠 영역 */}
      {mainPageData.contentBlocks && mainPageData.contentBlocks.length > 0 && (
        <BlockRenderer blocks={mainPageData.contentBlocks} />
      )}

      {/* 메인 노출 게시판 렌더링 영역 */}
      {mainBoardsWithPosts.length > 0 && (
        <div className="w-full max-w-6xl mx-auto px-4 mt-16 flex flex-col gap-16">
          {mainBoardsWithPosts.map((board: any) => (
            <section key={board.id} className="w-full">
              {/* 게시판 타이틀 및 더보기 버튼 */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                  {board.name || board.title || '게시판'}
                </h2>
                <Link
                  href={`/boards/${board.tableName || board.id}`}
                  className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                  더보기 &gt;
                </Link>
              </div>

              {/* 게시판 타입에 따른 분기 렌더링 */}
              {board.boardType === 'gallery' ? (
                // 갤러리형 렌더링: 사진(썸네일) 중심
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {board.posts.length > 0 ? (
                    board.posts.map((post: any) => (
                      <Link 
                        href={`/boards/${board.tableName || board.id}/${post.id}`} 
                        key={post.id} 
                        className="group flex flex-col gap-3"
                      >
                        <div className="w-full aspect-square bg-slate-100 rounded-lg overflow-hidden relative">
                          {(post.thumbnailUrl || post.imageUrl) ? (
                            <img 
                              src={post.thumbnailUrl || post.imageUrl} 
                              alt={post.title} 
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                              No Image
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900 line-clamp-1 group-hover:underline">
                            {post.title}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-slate-500 col-span-full py-8 text-center bg-slate-50 rounded-lg">
                      등록된 게시글이 없습니다.
                    </p>
                  )}
                </div>
              ) : (
                // 일반형 렌더링: 리스트 중심 (제목과 날짜)
                <div className="flex flex-col border-t-2 border-slate-900">
                  {board.posts.length > 0 ? (
                    board.posts.map((post: any) => (
                      <Link 
                        href={`/boards/${board.tableName || board.id}/${post.id}`} 
                        key={post.id} 
                        className="flex items-center justify-between py-4 border-b border-slate-200 hover:bg-slate-50 transition-colors px-2"
                      >
                        <span className="font-medium text-slate-800 truncate pr-4 flex-1">
                          {post.title}
                        </span>
                        <span className="text-sm text-slate-500 shrink-0 w-24 text-right">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-slate-500 py-8 text-center border-b border-slate-200 bg-slate-50">
                      등록된 게시글이 없습니다.
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}