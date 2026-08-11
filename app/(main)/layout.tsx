// src/app/(main)/layout.tsx
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ClientLayoutWrapper from "./ClientLayoutWrapper";
import { ThemeProvider } from "@/components/ThemeProvider"; // 경로에 맞게 수정
export async function generateMetadata(): Promise<Metadata> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings`, { cache: "no-store" });
    const json = await res.json();
    if (json.success && json.data) {
      return {
        title: json.data.siteName,
        description: json.data.metaDescription,
        keywords: json.data.metaKeywords,
        icons: { icon: json.data.faviconUrl || "/favicon.ico" },
      };
    }
  } catch (e) {}
  return { title: "기본 사이트명" };
}
export const dynamic = 'force-dynamic';
export default async function MainLayout({ children }: { children: React.ReactNode }) {
  
  // 💡 1. 최고관리자 존재 여부 확인 (경로 검사 없이 무조건 체크)
  let hasAdmin = false;
  try {
    const adminCheckRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/check-admin`, { 
      cache: "no-store" 
    });
    const adminCheckJson = await adminCheckRes.json();
    if (adminCheckJson.success) {
      hasAdmin = adminCheckJson.hasAdmin;
    }
  } catch (error) {
    console.error("관리자 확인 통신 실패:", error);
  }

  // 💡 2. 관리자가 없으면 /setup 으로 강제 이동
  // 이제 /setup 페이지는 (main) 바깥에 있으므로 layout.tsx를 타지 않아 무한루프가 발생하지 않습니다.
  if (!hasAdmin) {
    redirect("/setup");
  }

  // --- 3. 이후 기존 데이터 페칭 로직 정상 실행 ---
  let settings = null;
  let flatMenus = [];
  let memberSettings = null;

  try {
    const [settingsRes, menusRes, memberSettingsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/settings`, { cache: "no-store" }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/menus`, { cache: "no-store" }),
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/member-settings`, { cache: "no-store" }),
    ]);

    // 각 응답이 정상(200번대)일 때만 JSON 변환 시도
    if (settingsRes.ok) {
      const settingsJson = await settingsRes.json();
      settings = settingsJson.success ? settingsJson.data : null;
    } else {
      console.error("settings API 에러:", settingsRes.status);
    }

    if (menusRes.ok) {
      const menusJson = await menusRes.json();
      flatMenus = menusJson.success ? menusJson.data : [];
    } else {
      console.error("menus API 에러:", menusRes.status);
    }

    if (memberSettingsRes.ok) {
      const memberSettingsJson = await memberSettingsRes.json();
      memberSettings = memberSettingsJson.success ? memberSettingsJson.data : null;
    } else {
      console.error("memberSettings API 에러:", memberSettingsRes.status);
    }

  } catch (error) {
    // API 주소가 틀렸거나 백엔드 서버가 죽어있을 때 여기서 잡힘
    console.error("메인 레이아웃 데이터 페칭 완전 실패:", error);
  }

  const buildMenuTree = (flat: any[]) => {
    const map: Record<number, any> = {};
    const roots: any[] = [];
    flat.forEach(m => { map[m.id] = { ...m, children: [] }; });
    flat.forEach(m => {
      if (m.parentId && map[m.parentId]) map[m.parentId].children.push(map[m.id]);
      else roots.push(map[m.id]);
    });
    return roots;
  };

  return (
    <ThemeProvider 
          attribute="class" // Tailwind의 다크모드 클래스 기반 제어를 위해 'class' 사용
          defaultTheme="system" // 사용자의 OS 설정에 맞춤
          enableSystem
          disableTransitionOnChange // 테마 변경 시 트랜지션 애니메이션 충돌 방지
        >
      <ClientLayoutWrapper settings={settings} menus={buildMenuTree(flatMenus)} memberSettings={memberSettings} hasSlider={false}>
        {children}
      </ClientLayoutWrapper>
    </ThemeProvider>
  );
}