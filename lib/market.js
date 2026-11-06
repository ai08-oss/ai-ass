// 코스피 지수 + 시가총액 상위 종목 (네이버 증권 공개 데이터)
// api/market.js(Vercel)와 local-server.js(내 PC)가 함께 사용
// ※ 네이버가 공식 제공하는 API가 아니므로 예고 없이 바뀌거나 막힐 수 있음

const BASE = 'https://m.stock.naver.com/api';
const TOP_COUNT = 3;
const CACHE_MS = 30 * 1000; // 30초 동안은 저장해 둔 값을 다시 사용 (요청 과다 방지)
const TIMEOUT_MS = 8000;

let cache = { at: 0, data: null };

// "5,059.69" → 5059.69
const toNumber = (s) => Number(String(s ?? '').replace(/,/g, ''));

// 상승/하락/보합
function direction(info) {
  const name = info?.name;
  if (name === 'RISING' || name === 'UPPER_LIMIT') return 'up';
  if (name === 'FALLING' || name === 'LOWER_LIMIT') return 'down';
  return 'flat';
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (quality-ai-assistant)' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`market ${res.status}`);
  return res.json();
}

async function fetchMarket() {
  const [index, ranking] = await Promise.all([
    getJson(`${BASE}/index/KOSPI/basic`),
    getJson(`${BASE}/stocks/marketValue/KOSPI?page=1&pageSize=${TOP_COUNT}`),
  ]);

  return {
    kospi: {
      value: toNumber(index.closePrice),
      change: toNumber(index.compareToPreviousClosePrice),
      rate: toNumber(index.fluctuationsRatio),
      direction: direction(index.compareToPreviousPrice),
      open: index.marketStatus === 'OPEN',
      tradedAt: index.localTradedAt ?? null,
    },
    top: (ranking.stocks ?? []).slice(0, TOP_COUNT).map((s, i) => ({
      rank: i + 1,
      name: String(s.stockName ?? ''),
      code: /^\d{6}$/.test(s.itemCode) ? s.itemCode : '',
      price: toNumber(s.closePrice),
      change: toNumber(s.compareToPreviousClosePrice),
      rate: toNumber(s.fluctuationsRatio),
      direction: direction(s.compareToPreviousPrice),
      marketCap: String(s.marketValueHangeul ?? ''),
    })),
    fetchedAt: new Date().toISOString(),
  };
}

/** { status, data } 형식으로 돌려줌. 실패 시 data = { error } */
export async function handleMarket() {
  if (cache.data && Date.now() - cache.at < CACHE_MS) {
    return { status: 200, data: cache.data };
  }
  try {
    const data = await fetchMarket();
    cache = { at: Date.now(), data };
    return { status: 200, data };
  } catch (err) {
    console.error(`[market] 시세 조회 실패 (${err?.name ?? 'error'})`);
    // 직전 값이 있으면 그것이라도 보여줌
    if (cache.data) return { status: 200, data: { ...cache.data, stale: true } };
    return { status: 502, data: { error: '시세 정보를 불러오지 못했습니다.' } };
  }
}
