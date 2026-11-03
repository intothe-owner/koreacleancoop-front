"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays } from "lucide-react";

export default function CustomerAchievementList() {
  const { data: achievements = [], isLoading: achLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/achievements`);
      const json = await res.json();
      return json.success ? json.data.filter((item: any) => item.isActive) : [];
    }
  });

  const { data: customers = [], isLoading: custLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/customers`);
      const json = await res.json();
      return json.success ? json.data.filter((item: any) => item.isActive) : [];
    }
  });

  if (achLoading || custLoading) {
    return <div className="py-20 text-center text-slate-500">데이터를 불러오는 중입니다...</div>;
  }

  // 💡 1. 가져온 실적 데이터를 연도별로 그룹화합니다.
  const groupedAchievements = achievements.reduce((acc: any, curr: any) => {
    if (!acc[curr.year]) acc[curr.year] = [];
    acc[curr.year].push(curr);
    return acc;
  }, {});

  // 💡 2. 연도 내림차순으로 정렬
  const sortedYears = Object.keys(groupedAchievements).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="max-w-6xl w-full mx-auto px-4 py-16 space-y-24">
      
      {/* 주요 실적 (이미지 타임라인 스타일 반영) */}
      <section>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
            <CalendarDays className="text-emerald-600" size={32} />
            주요 실적
          </h2>
        </div>

        <div className="relative border-l border-slate-200 ml-4 md:ml-12 space-y-12 pb-4">
          {sortedYears.length === 0 ? (
            <p className="text-center text-slate-400 py-10">등록된 내역이 없습니다.</p>
          ) : (
            sortedYears.map(year => (
              <div key={year} className="relative flex flex-col md:flex-row gap-4 md:gap-10 pl-8 md:pl-12">
                
                {/* 타임라인 초록색 마커 (이미지 참조) */}
                <div className="absolute -left-[9px] top-1.5 w-[17px] h-[17px] bg-white border-[3px] border-emerald-500 rounded-full"></div>
                
                {/* 2025, 2024 등 큰 연도 */}
                <div className="w-24 flex-shrink-0 text-[26px] tracking-tighter font-extrabold text-slate-800 leading-none mt-0.5">
                  {year}
                </div>
                
                {/* 해당 연도의 실적 리스트 */}
                <div className="flex-1 space-y-5 mt-1 md:mt-0">
                  {groupedAchievements[year].map((item: any) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4">
                      {/* 12.23, 10.27~11 등 월.일 */}
                      <span className="w-20 flex-shrink-0 text-emerald-600 font-extrabold text-[15px] pt-[2px]">
                        {item.dateOrMonth}
                      </span>
                      {/* 실적 내용 */}
                      <div className="flex-1 text-[15.5px] text-slate-800 font-bold leading-snug">
                        {item.title}
                        {item.description && (
                          <p className="text-sm font-normal text-slate-500 mt-1">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <hr className="border-slate-100" />

      {/* 고객 및 기관 현황 */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-3">
            <Building2 className="text-emerald-600" size={32} />
            함께하는 고객현황
          </h2>
        </div>

        {customers.length === 0 ? (
          <p className="text-center text-slate-400 py-10">등록된 내역이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {customers.map((item: any) => (
              <div 
                key={item.id} 
                className="bg-white hover:border-emerald-500 hover:text-emerald-600 transition-colors border border-slate-200 rounded-xl py-4 px-3 text-center font-bold text-slate-700 break-keep shadow-sm"
              >
                {item.name}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}