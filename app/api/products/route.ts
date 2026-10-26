import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ success: false, error: 'URL이 필요합니다.' }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      cache: 'no-store',
    });

    if (!response.ok) throw new Error('페이지를 불러오는 데 실패했습니다.');

    const html = await response.text();
    const $ = cheerio.load(html);
    const products: any[] = [];
    const baseUrl = 'https://ecomint1527.cafe24.com';

    $('.prdList > li').each((_, el) => {
      // 1. 링크 추출
      let link = $(el).find('.thumbnail a').attr('href') || '';
      if (link.startsWith('/')) link = baseUrl + link;

      // 2. 이미지 추출
      let image = $(el).find('.thumbnail img').attr('src') || '';
      if (image.startsWith('//')) image = 'https:' + image;
      else if (image.startsWith('/')) image = baseUrl + image;

      // 3. 상품명 추출 (중복 제거 및 정제)
      // 이전처럼 a와 span을 같이 찾지 않고 a 태그 안의 텍스트만 가져온 후 불필요한 단어 제거
      let name = $(el).find('.description .name a').text().trim();
      name = name
        .replace(/상품명\s*:/g, '') // '상품명 :' 제거
        .replace(/상품명/g, '')     // 혹시 남은 '상품명' 단어 제거
        .trim();

      // 4. 가격 추출
      let price = $(el).find('li[rel="판매가"] span').not('.title').text().trim();
      if (!price) {
        price = $(el).find('li.price, .xans-record- span').filter((_, e) => $(e).text().includes('원')).first().text().trim();
      }
      if (!price) {
        price = $(el).find('.description li').filter((_, e) => $(e).text().includes('원')).first().text().trim();
      }
      
      price = price.replace(/판매가\s*/g, '').trim();

      if (name && link) {
        products.push({ name, price, image, link });
      }
    });

    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}