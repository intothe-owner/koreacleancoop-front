import BlockRenderer from "@/components/main/BlockRenderer";//콘텐츠 내용
import MainSlider from "@/components/main/MainSlider"; // 메인 슬라이드


export default async function MainPage() {
  let mainPageData = null;

  try {
    // 1. 서버 사이드에서 페이지 데이터 페칭 (항상 최신 데이터를 가져오도록 no-store 설정)
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages`, {
      cache: "no-store",
    });
    const json = await res.json();

    if (json.success) {
      // 2. menuId가 null인 데이터를 메인 페이지로 간주하여 추출
      mainPageData = json.data.find((p: any) => p.menuId === null);
    }
  } catch (error) {
    console.error("메인 페이지 데이터 로딩 실패:", error);
  }

  // 3. 등록된 메인 페이지가 없을 경우의 Fallback UI
  if (!mainPageData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-500">
          메인 페이지가 아직 설정되지 않았습니다.
        </h1>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      
      {/* 슬라이더 렌더링 영역 */}
      {mainPageData.sliderData && mainPageData.sliderData.length > 0 && (
        <MainSlider slides={mainPageData.sliderData} />
      )}

      {/* 블록 렌더러 영역 (빌더에서 만든 컨테이너들을 렌더링) */}
      {mainPageData.contentBlocks && mainPageData.contentBlocks.length > 0 && (
        <BlockRenderer blocks={mainPageData.contentBlocks} />
      )}
    </div>
  );
}