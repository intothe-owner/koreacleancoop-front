export function GET() {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://www.koreacleancoop.kr/sitemap.xml

#DaumWebMasterTool:0cf48ab96a31248411afe0856d1e0287191b190b5a190fec537a0b8ac734a7a9:/U8QWp/Cxm097lAEJOWTSw==`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}