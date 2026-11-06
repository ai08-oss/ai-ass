// Vercel 서버리스 함수: GET /api/market (코스피 지수 + 시가총액 상위 3종목)
import { handleMarket } from '../lib/market.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'GET 요청만 사용할 수 있습니다.' });
  }

  const { status, data } = await handleMarket();
  // Vercel 캐시: 30초 동안 같은 결과 재사용
  if (status === 200) res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=30');
  return res.status(status).json(data);
}
