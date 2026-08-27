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

    // 2. setTimeout을 사용해 DOM 렌더링이 완전히 끝난 직후 스크립트 실행 보장
    const timeoutId = setTimeout(() => {
      const scripts = container.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        
        Array.from(oldScript.attributes).forEach((attribute) => {
          newScript.setAttribute(attribute.name, attribute.value);
        });
        
        // ✅ 추가: 외부 스크립트 삽입 시 실행 순서 보장
        if (oldScript.src) {
          newScript.async = false;
        }
        
        // ✅ 수정: textContent 대신 text 또는 innerHTML 사용
        newScript.text = oldScript.innerHTML || oldScript.text;
        
        oldScript.replaceWith(newScript);
      });
    }, 50);

    return () => {
      // 컴포넌트가 언마운트될 때 타이머도 정리
      clearTimeout(timeoutId);
      container.innerHTML = "";
    };
  }, [html]); // 💡 의존성 배열은 여전히 html만 둡니다!

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