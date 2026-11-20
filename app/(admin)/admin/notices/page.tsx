"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
} from "lucide-react";

type BoardKey = "kdissw" | "kcpass-home" | "kcpass-service" | "sscf";

interface BoardConfig {
  label: string;
  endpoint: string;
  orgUrl: string;
  badgeColor: string;
}

const BOARD_CONFIG: Record<BoardKey, BoardConfig> = {
  kdissw: {
    label: "한국자활복지개발원 (사업공고)",
    endpoint: "/api/kdissw/notices",
    orgUrl: "https://www.kdissw.or.kr/board.es?mid=a10501040000&bid=0046",
    badgeColor: "bg-indigo-50 text-indigo-700",
  },
  "kcpass-home": {
    label: "중앙사회서비스원 (스마트 홈·사회복지시설)",
    endpoint: "/api/kcpass/smart-home",
    orgUrl: "https://www.kcpass.or.kr/board?menuId=MENU002060501000000",
    badgeColor: "bg-blue-50 text-blue-700",
  },
  "kcpass-service": {
    label: "중앙사회서비스원 (스마트 사회서비스 시범사업)",
    endpoint: "/api/kcpass/smart-service",
    orgUrl: "https://www.kcpass.or.kr/board?menuId=MENU002060702000000",
    badgeColor: "bg-cyan-50 text-cyan-700",
  },
  sscf: {
    label: "수원도시재단 (지원사업공고)",
    endpoint: "/api/sscf/entries",
    orgUrl: "https://sscf2016.or.kr/entry_list.do",
    badgeColor: "bg-emerald-50 text-emerald-700",
  },
};

interface NoticeItem {
  title: string;
  date?: string;
  department?: string;
  type?: string;
  url: string;
}

interface PaginationInfo {
  totalCount?: number;
  currentPage: number;
  totalPages: number;
  pages: number[];
  hasPrev: boolean;
  hasNext: boolean;
}

export default function PublicNoticeList() {
  const [mounted, setMounted] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<BoardKey>("kdissw");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [items, setItems] = useState<NoticeItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    pages: [1],
    hasPrev: false,
    hasNext: false,
  });

  const fetchNotices = useCallback(async (board: BoardKey, page: number) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const token = localStorage.getItem("token");
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const url = `${baseUrl}${BOARD_CONFIG[board].endpoint}?page=${page}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "목록을 불러오지 못했습니다.");
      }

      setItems(data.items ?? []);
      if (data.pagination) {
        setPagination(data.pagination);
      } else {
        setPagination({
          currentPage: page,
          totalPages: 1,
          pages: [1],
          hasPrev: false,
          hasNext: false,
        });
      }
    } catch (error) {
      console.error("공모사업 로딩 실패:", error);
      setItems([]);
      setErrorMsg(
        error instanceof Error ? error.message : "데이터 로딩 중 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 기관 변경 시 1페이지부터 새로 조회
  useEffect(() => {
    if (!mounted) return;
    fetchNotices(selectedBoard, 1);
  }, [mounted, selectedBoard, fetchNotices]);

  const handlePageChange = (targetPage: number) => {
    if (
      targetPage < 1 ||
      targetPage > pagination.totalPages ||
      targetPage === pagination.currentPage
    ) {
      return;
    }
    fetchNotices(selectedBoard, targetPage);
  };

  if (!mounted) return null;

  const currentConfig = BOARD_CONFIG[selectedBoard];
  const isSscf = selectedBoard === "sscf";

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* 상단 헤더 및 기관 선택 셀렉트 박스 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-slate-900">공모사업 목록</h1>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold ${currentConfig.badgeColor}`}
            >
              {pagination.totalCount
                ? `전체 ${pagination.totalCount}건`
                : `${pagination.currentPage} / ${pagination.totalPages} 페이지`}
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            기관별 최신 공모사업 및 지원사업 공고를 실시간으로 확인합니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedBoard}
            onChange={(e) => setSelectedBoard(e.target.value as BoardKey)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500 bg-white min-w-[260px]"
          >
            {(Object.keys(BOARD_CONFIG) as BoardKey[]).map((key) => (
              <option key={key} value={key}>
                {BOARD_CONFIG[key].label}
              </option>
            ))}
          </select>

          <a
            href={currentConfig.orgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Building2 size={16} />
            원본 사이트
          </a>

          <button
            onClick={() => fetchNotices(selectedBoard, pagination.currentPage)}
            title="새로고침"
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 목록 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-16 text-center">
                  NO
                </th>
                {isSscf ? (
                  <>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-44">
                      지원부서
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-28 text-center">
                      유형
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      제목
                    </th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">
                      제목
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-36 text-center">
                      등록일
                    </th>
                  </>
                )}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase w-32 text-center">
                  상세보기
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isSscf ? 5 : 4}
                    className="px-6 py-12 text-center text-slate-400"
                  >
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mb-2"></div>
                    <p>데이터를 불러오는 중입니다...</p>
                  </td>
                </tr>
              ) : errorMsg ? (
                <tr>
                  <td
                    colSpan={isSscf ? 5 : 4}
                    className="px-6 py-12 text-center text-red-500 font-medium"
                  >
                    {errorMsg}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={isSscf ? 5 : 4}
                    className="px-6 py-12 text-center text-slate-500 font-medium"
                  >
                    등록된 공모사업이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={`${selectedBoard}-${pagination.currentPage}-${idx}`}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-400 text-center">
                      {(pagination.currentPage - 1) * 10 + idx + 1}
                    </td>

                    {isSscf ? (
                      <>
                        <td className="px-6 py-4">
                          <span className="inline-block px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700">
                            {item.department || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.type ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                              {item.type}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">
                          {item.title}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800">
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-indigo-600 transition-colors"
                            >
                              {item.title}
                            </a>
                          ) : (
                            item.title
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                            <Calendar size={13} />
                            {item.date || "-"}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-center">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <ExternalLink size={14} /> 바로가기
                        </a>
                      ) : (
                        <a
                          href={currentConfig.orgUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          <ExternalLink size={14} /> 목록이동
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 (이전 / 숫자 버튼 / 다음) */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 p-4 border-t border-slate-100">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrev || isLoading}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>

            {pagination.pages.map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                disabled={isLoading}
                className={`min-w-[36px] h-9 px-2.5 rounded-lg text-sm font-bold transition-colors ${
                  pageNum === pagination.currentPage
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNext || isLoading}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}