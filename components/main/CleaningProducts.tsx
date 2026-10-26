'use client';

import { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'multi', name: '다목적세정제', url: 'https://ecomint1527.cafe24.com/category/%EB%8B%A4%EB%AA%A9%EC%A0%81%EC%84%B8%EC%A0%95%EC%A0%9C/56/' },
  { id: 'tile', name: '타일세척제', url: 'https://ecomint1527.cafe24.com/category/%EC%A0%84%EB%AC%B8%EA%B0%80%EC%9A%A9-%ED%83%80%EC%9D%BC%EC%84%B8%EC%B2%99%EC%A0%9C/31/' },
  { id: 'oven', name: '오븐클리너', url: 'https://ecomint1527.cafe24.com/category/%EC%98%A4%EB%B8%90%ED%81%B4%EB%A6%AC%EB%84%88/50/' },
  { id: 'floor', name: '바닥세척제', url: 'https://ecomint1527.cafe24.com/category/%EB%B0%94%EB%8B%A5%EC%84%B8%EC%B2%99%EC%A0%9C/55/' },
  { id: 'wax', name: '왁스박리제', url: 'https://ecomint1527.cafe24.com/category/%EC%99%81%EC%8A%A4%EB%B0%95%EB%A6%AC%EC%A0%9C-%EA%B3%A0%EA%B8%89%ED%98%95/42/' },
  { id: 'urine', name: '요석제거제', url: 'https://ecomint1527.cafe24.com/category/%EC%9A%94%EC%84%9D%EC%A0%9C%EA%B1%B0%EC%A0%9C/57/' },
];

interface Product {
  name: string;
  price: string;
  image: string;
  link: string;
}

export default function CleaningProducts() {
  const [activeMenu, setActiveMenu] = useState(CATEGORIES[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?url=${encodeURIComponent(activeMenu.url)}`);
        const json = await res.json();
        if (json.success) setProducts(json.data);
      } catch (error) {
        console.error('API 호출 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [activeMenu]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 bg-gray-50 flex flex-col md:flex-row-reverse gap-6 md:gap-8">
      
      {/* 우측 사이드바 */}
      <div className="w-full md:w-64 lg:w-72 shrink-0 z-10">
        <div className="bg-white md:rounded-2xl md:shadow-md p-3 md:p-6 sticky top-0 md:top-8 -mx-4 md:mx-0 px-4 md:px-6">
          <h2 className="hidden md:block text-lg font-bold text-gray-800 mb-4 pb-3">상세메뉴</h2>
          
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 md:space-y-2 pb-2 md:pb-0 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const isActive = activeMenu.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveMenu(cat)}
                  className={`
                    shrink-0 text-center md:text-left px-4 py-2 md:px-5 md:py-3 rounded-full md:rounded-lg transition-colors font-medium text-sm
                    md:flex md:items-center md:before:content-['•'] md:before:mr-2
                    ${isActive 
                      ? 'bg-green-700 text-white shadow-md' 
                      : 'bg-gray-100 md:bg-transparent text-gray-600 hover:bg-gray-200 md:hover:bg-gray-50'
                    }
                  `}
                >
                  {cat.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 좌측 상품 리스트 */}
      <div className="flex-1">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">{activeMenu.name}</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <span className="text-gray-500 font-medium">상품 정보를 불러오는 중입니다...</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {products.map((product, idx) => (
              <a 
                key={idx} 
                href={product.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 group block flex flex-col"
              >
                <div className="aspect-square relative overflow-hidden bg-gray-100 shrink-0">
                  <img 
                    src={product.image || 'https://via.placeholder.com/300'} 
                    alt={product.name}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-3 md:p-4 flex flex-col flex-1 justify-between">
                  <h3 className="font-semibold text-gray-800 text-xs md:text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-sm md:text-lg font-bold text-green-700">{product.price}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}