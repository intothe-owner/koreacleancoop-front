import BlockRenderer from "@/components/main/BlockRenderer";
import MainSlider from "@/components/main/MainSlider";

interface SubPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubPage({ params }: SubPageProps) {
  const { id } = await params;
  const targetId = id;

  let pageData = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/pages/${targetId}`, { cache: "no-store" });
    const json = await res.json();
    if (json.success) pageData = json.data;

  } catch (error) {
    console.error("서브페이지 데이터 로딩 실패:", error);
  }

  if (!pageData) {
    return (
      <div className="flex h-[70vh] items-center justify-center pt-16">
        <h1 className="text-2xl font-bold text-slate-500">
          해당 페이지를 찾을 수 없습니다.
        </h1>
      </div>
    );
  }
  
  // 💡 핵심 수정 부분: 배열 길이뿐만 아니라 실제 mediaUrl 값이 존재하는 슬라이드가 최소 1개 이상인지 검증합니다.
  const hasSlider = pageData.sliderData && 
                    pageData.sliderData.length > 0 && 
                    pageData.sliderData.some((slide: any) => slide.mediaUrl && slide.mediaUrl.trim() !== "");
                    
  const meta = pageData.pageMeta || {};
  
  return (
    <div className={`w-full flex flex-col ${hasSlider || meta.bgImage ? '' : 'pt-24'}`}>
      {/* 1. 슬라이드 렌더링 */}
      {hasSlider && <MainSlider slides={pageData.sliderData} />}
      
      {/* 2. 슬라이드가 없고 배경이미지가 있을 때 헤더 렌더링 */}
      {!hasSlider && meta.bgImage && (
        <div className="relative w-full h-[400px] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${meta.bgImage})` }}>
          <div className="absolute inset-0 bg-black/40"></div> {/* 오버레이 */}
          <h1 className="relative z-10 text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg">
            {meta.bgTitle || pageData.title}
          </h1>
        </div>
      )}

      {/* 3. 둘 다 없을 때 기본 텍스트 렌더링 */}
      {!hasSlider && !meta.bgImage && (
        <div className="max-w-6xl mx-auto px-4 w-full mt-8 text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">{pageData.title}</h1>
        </div>
      )}

      {/* 본문 렌더링 */}
      {pageData.contentBlocks && pageData.contentBlocks.length > 0 && (
        <BlockRenderer blocks={pageData.contentBlocks} />
      )}
    </div>
  );
}