"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, HeartHandshake } from "lucide-react";

export default function SocialContributionList() {
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['socialContributions'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/social-contributions`);
      const json = await res.json();
      return json.success ? json.data.filter((item: any) => item.isActive) : [];
    }
  });

  const handleItemClick = async (item: any) => {
    setSelectedItem(item); 
    setIsModalOpen(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/social-contributions/${item.id}`);
      const json = await res.json();
      if (json.success) {
        setSelectedItem(json.data);
      }
    } catch (error) {
      console.error("상세 데이터 로딩 실패:", error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedItem(null), 200);
  };

  // 날짜 포맷 (예: 2026.07.16)
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="py-20 text-center text-slate-500">데이터를 불러오는 중입니다...</div>;
  }

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-16">
      
    

      {/* 반응형 게시판 리스트 영역 */}
      <div className="border-t-[3px] border-[#1875c0]">
        
        {/* 데스크톱용 테이블 헤더 */}
        <div className="hidden md:flex bg-[#f8f9fa] py-3 px-4 border-b border-slate-200 text-[15px] font-bold text-slate-700">
          <div className="flex-1 text-center">제목</div>
          <div className="w-28 text-center">등록일</div>
          <div className="w-20 text-center">조회수</div>
        </div>

        <ul className="flex flex-col">
          {items.length === 0 ? (
            <li className="py-10 text-center text-slate-400 border-b border-slate-200">등록된 내역이 없습니다.</li>
          ) : (
            items.map((item: any, idx: number) => {
              const displayId = items.length - idx; // 역순 번호 매기기

              return (
                <li 
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="flex flex-col md:flex-row md:items-center p-4 md:py-3.5 border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none mb-3 md:mb-0 border md:border-b md:border-x-0 md:border-t-0"
                >
                  {/* 모바일: 상단 (번호+제목) / 데스크톱: 제목 열 */}
                  <div className="flex flex-1 items-start md:items-center gap-3 md:gap-0 mb-3 md:mb-0 md:px-4">
                    <span className="md:hidden text-slate-400 font-bold text-lg leading-tight w-6 flex-shrink-0">
                      {displayId}
                    </span>
                    <span className="text-slate-800 font-semibold text-[16px] md:text-[15px] hover:underline flex-1 leading-snug break-keep">
                      {item.title}
                    </span>
                  </div>

                  {/* 모바일: 하단 (작성자|날짜|조회수) / 데스크톱: 날짜, 조회수 열 */}
                  <div className="flex items-center text-sm md:text-[14px] text-slate-500 md:text-slate-600 pl-9 md:pl-0">
                    <span className="md:hidden font-medium">{item.author}</span>
                    <span className="md:hidden text-slate-300 mx-2">|</span>
                    
                    <span className="md:w-28 md:text-center font-medium md:font-normal tracking-tight">
                      {formatDate(item.createdAt)}
                    </span>
                    
                    <span className="md:hidden text-slate-300 mx-2">|</span>
                    
                    <span className="md:w-20 md:text-center flex items-center">
                      <span className="md:hidden mr-1">조회</span>
                      {item.views}
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      </div>

      {/* 레이어 팝업 (모달) */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
          
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-100 bg-white">
              <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 pr-8 leading-snug break-keep">
                {selectedItem.title}
              </h3>
              <button onClick={closeModal} className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="bg-[#f8f9fa] px-5 md:px-6 py-3 border-b border-slate-200 flex flex-wrap items-center gap-4 md:gap-6 text-sm text-slate-600 font-medium">
              <span>작성자 : <span className="font-bold text-slate-800">{selectedItem.author}</span></span>
              <span className="w-px h-3 bg-slate-300 hidden md:block"></span>
              <span>등록일 : {formatDate(selectedItem.createdAt)}</span>
              <span className="w-px h-3 bg-slate-300 hidden md:block"></span>
              <span>조회수 : {selectedItem.views}</span>
            </div>

            <div className="p-6 md:p-10 overflow-y-auto flex-1 custom-scrollbar bg-white">
              <div 
                className="prose prose-slate max-w-none prose-img:rounded-xl prose-img:mx-auto leading-loose"
                dangerouslySetInnerHTML={{ __html: selectedItem.content }}
              />
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-center bg-white">
              <button onClick={closeModal} className="px-10 py-3.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-black transition-colors">
                목록으로
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}