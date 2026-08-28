"use client";

import { useEffect, useRef } from "react";

interface ExecutableHtmlProps {
  el: any;
  adaptColorForDarkMode: any;
  html: string;
}

export default function ExecutableHtml({ el, adaptColorForDarkMode, html }: ExecutableHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. HTML을 DOM에 삽입
    container.innerHTML = html;

    // 💡 비동기로 스크립트를 순차적으로 실행하는 함수
    const executeScriptsSequentially = async () => {
      const scripts = Array.from(container.querySelectorAll("script"));
      
      for (const oldScript of scripts) {
        await new Promise<void>((resolve) => {
          const newScript = document.createElement("script");
          
          // 속성 복사
          Array.from(oldScript.attributes).forEach((attribute) => {
            newScript.setAttribute(attribute.name, attribute.value);
          });
          
          // ✅ 수정: innerHTML 대신 textContent를 사용하여 코드 깨짐 방지
          if (oldScript.textContent) {
            newScript.textContent = oldScript.textContent;
          }
          
          if (newScript.src) {
            // ✅ 수정: 외부 스크립트(src가 있는 경우)는 로드가 완료될 때까지 대기
            newScript.onload = () => resolve();
            newScript.onerror = () => resolve(); // 로드 실패해도 다음 스크립트는 실행되도록 처리
            oldScript.replaceWith(newScript);
          } else {
            // 인라인 스크립트인 경우 교체 후 즉시 완료 처리
            oldScript.replaceWith(newScript);
            resolve();
          }
        });
      }
    };

    // 2. DOM 렌더링이 완전히 끝난 직후 스크립트 실행
    const timeoutId = setTimeout(() => {
      executeScriptsSequentially();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      container.innerHTML = "";
    };
  }, [html]);

  return (
    <div 
      ref={containerRef} 
      style={{
        fontSize: `${el.styles?.fontSize || 16}px`,
        color: adaptColorForDarkMode(el.styles?.color),
        textAlign: el.styles?.textAlign || "left",
        fontFamily: el.styles?.fontFamily !== "default" ? el.styles?.fontFamily : "inherit",
        width: el.styles?.width === "auto" ? "100%" : `${el.styles?.width}px`,
        height: el.styles?.height === "auto" ? "auto" : `${el.styles?.height}px`,
        fontWeight: el.styles?.fontWeight || "normal",
        fontStyle: el.styles?.fontStyle || "normal",
        textDecoration: el.styles?.textDecoration || "none",
      }}
      className="whitespace-pre-wrap break-words prose prose-slate dark:prose-invert max-w-none w-full"
    />
  );
}