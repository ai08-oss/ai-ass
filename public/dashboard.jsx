// 메인 대시보드 (knowledge/ 문서 내용을 사람이 정리한 고정 데이터)
// ※ knowledge/ 문서가 바뀌면 아래 데이터도 함께 고쳐야 합니다.

const DOCS = [
  {
    name: '기술시방서',
    code: 'SJ-AL200-SPEC',
    rev: 'Rev.C',
    date: '2026-10-12',
    status: 'latest',
    note: '최신본 · 기준 문서',
  },
  {
    name: '출하검사기준서',
    code: 'QI-AL200',
    rev: 'Rev.2',
    date: '2026-10-05',
    status: 'review',
    note: '시방서 Rev.C(10-12)보다 먼저 개정되어 변경 내용 미반영',
  },
  {
    name: 'ST20·ST30 작업표준서',
    code: 'WS-AL200-2030',
    rev: 'Rev.3',
    date: '2026-09-22',
    status: 'review',
    note: '시방서 Rev.B 참조 · 토크값 2026-10-19 수기 정정(정식 개정 필요)',
  },
  {
    name: '납품계약서',
    code: 'HK-2026-0915-07',
    rev: '계약',
    date: '2026-09-15',
    status: 'info',
    note: '우선순위: 특수조건 → 계약서 본문 → 시방서 (제3조 제2항)',
  },
];

const TYPES = {
  history: { label: '불일치 · 개정 이력', tone: 'warn' },
  unknown: { label: '불일치 · 원인 불명', tone: 'danger' },
  unit: { label: '단위만 다름', tone: 'ok' },
  missing: { label: '누락', tone: 'danger' },
  contract: { label: '계약 우선', tone: 'info' },
};

const ITEMS = [
  {
    type: 'history',
    item: '연속 시운전',
    spec: '72시간 [시방서 3]',
    other: '48시간 [검사기준서 No.4]',
    memo: '시방서 Rev.C에서 48→72시간으로 변경',
  },
  {
    type: 'history',
    item: 'ST30 체결 토크',
    spec: '9.8 N·m ±5% [시방서 5.2]',
    other: '9.0 N·m ±5% [검사기준서 No.8]',
    memo: '시방서 Rev.C에서 9.0→9.8 N·m로 변경',
  },
  {
    type: 'history',
    item: 'ST30 체결 개소',
    spec: '6개소 [시방서 5.2]',
    other: '8개소 [표준서 4]',
    memo: '시방서 Rev.C에서 8→6개소로 변경 (표준서는 Rev.B 참조)',
  },
  {
    type: 'unknown',
    item: '택트타임',
    spec: '12.0초 이하 [시방서 3]',
    other: '12.5초 이하 [검사기준서 No.1]',
    memo: '개정 이력에 없는 차이',
  },
  {
    type: 'unknown',
    item: 'ST20 압입 깊이 공차',
    spec: '±0.05 mm [시방서 5.1]',
    other: '±0.10 mm [검사기준서 No.6]',
    memo: '개정 이력에 없는 차이',
  },
  {
    type: 'unknown',
    item: 'ST50 누설 허용치',
    spec: '5 cc/min 이하 [시방서 5.4]',
    other: '10 cc/min 이하 [검사기준서 No.12]',
    memo: '개정 이력에 없는 차이',
  },
  {
    type: 'unknown',
    item: 'ST20 압입 후 유지 시간',
    spec: '0.5초 [시방서 5.1]',
    other: '1.0초 [표준서 3]',
    memo: '개정 이력에 없는 차이',
  },
  {
    type: 'unknown',
    item: '너트러너 교정 주기',
    spec: '6개월 [시방서 5.2]',
    other: '12개월 [표준서 4]',
    memo: '개정 이력에 없는 차이',
  },
  {
    type: 'unit',
    item: 'ST50 시험 압력',
    spec: '200 kPa [시방서 5.4]',
    other: '2.04 kgf/cm² [검사기준서 No.10]',
    memo: '200 kPa ÷ 98.0665 ≈ 2.04 kgf/cm²',
  },
  {
    type: 'unit',
    item: 'ST20 압입 하중',
    spec: '8.0 kN ±0.3 kN [시방서 5.1]',
    other: '816 kgf ±30 kgf [표준서 3]',
    memo: '8.0 kN × 1000 ÷ 9.80665 ≈ 815.8 kgf, 0.3 kN ≈ 30.6 kgf',
  },
  {
    type: 'unit',
    item: '공급 공압',
    spec: '0.6 MPa (허용 0.5~0.7) [시방서 4]',
    other: '6 kgf/cm² [표준서 2]',
    memo: '6 × 0.0980665 ≈ 0.59 MPa (허용 범위 이내)',
  },
  {
    type: 'missing',
    item: '기종 교체 시간',
    spec: '15분 이내 [시방서 3]',
    other: '검사기준서에 항목 없음',
    memo: '성능 검사 항목에 추가 검토',
  },
  {
    type: 'missing',
    item: '라이트커튼',
    spec: 'Type 4, 차단 시 0.2초 이내 정지 [시방서 6.1, 6.2]',
    other: '검사기준서에 항목 없음',
    memo: '안전 검사 항목에 추가 검토',
  },
  {
    type: 'missing',
    item: 'ST40 검출 항목',
    spec: '볼트 유무, 머리 들뜸, 부싱 위치, 스크래치 0.5 mm 이상 [시방서 5.3]',
    other: '검사기준서에 항목 없음 (분해능만 있음)',
    memo: '스테이션 검사 항목에 추가 검토',
  },
  {
    type: 'contract',
    item: '하자 현장 출동',
    spec: '24시간 이내 [시방서 9.1]',
    other: '48시간 이내 [계약서 제17조]',
    memo: '계약서 본문이 시방서보다 우선 → 48시간 적용',
  },
];

const SCHEDULE = [
  { date: '2026-09-15', title: '계약 체결', ref: '계약서' },
  { date: '2026-09-29', title: '계약금 30% 지급 기한 (계약 후 14일)', ref: '계약서 제6조' },
  { date: '2027-02-12', title: 'ST30 체결 스테이션 선행 납품', ref: '특수조건 제1조' },
  { date: '2027-02-26', title: 'FAT 완료 기한', ref: '계약서 제5조' },
  { date: '2027-03-31', title: '설치 완료 (납기)', ref: '계약서 제5조' },
];

const DAY = 24 * 60 * 60 * 1000;
function dday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(dateStr + 'T00:00:00') - today) / DAY);
  if (diff === 0) return 'D-DAY';
  return diff > 0 ? `D-${diff}` : `완료 · ${-diff}일 전`;
}

// ===== 왼쪽 상단: 오늘 날짜·시간·날씨 =====
// 날씨 위치 (서울시청 기준). 다른 지역으로 바꾸려면 위도·경도만 고치면 됩니다.
const WEATHER_PLACE = { name: '서울', lat: 37.5665, lon: 126.978 };
const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${WEATHER_PLACE.lat}&longitude=${WEATHER_PLACE.lon}` +
  '&current=temperature_2m,weather_code' +
  '&daily=temperature_2m_max,temperature_2m_min' +
  '&timezone=Asia%2FSeoul&forecast_days=1';
const WEATHER_REFRESH_MS = 30 * 60 * 1000; // 30분마다 새로고침

// 세계기상기구(WMO) 날씨 코드 → 한국어 + 아이콘 종류
function describeWeather(code) {
  if (code === 0) return { text: '맑음', icon: 'sun' };
  if (code === 1) return { text: '대체로 맑음', icon: 'sun' };
  if (code === 2) return { text: '구름 조금', icon: 'cloud' };
  if (code === 3) return { text: '흐림', icon: 'cloud' };
  if (code === 45 || code === 48) return { text: '안개', icon: 'cloud' };
  if (code >= 51 && code <= 57) return { text: '이슬비', icon: 'rain' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { text: '비', icon: 'rain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { text: '눈', icon: 'snow' };
  if (code >= 95) return { text: '뇌우', icon: 'rain' };
  return { text: '-', icon: 'cloud' };
}

function WeatherIcon({ type }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', 'aria-hidden': true };
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' };
  if (type === 'sun') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4.5" {...stroke} />
        <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" {...stroke} />
      </svg>
    );
  }
  const cloud = <path d="M7 17.5h10a4 4 0 0 0 .4-8 5.5 5.5 0 0 0-10.6 1.6A3.3 3.3 0 0 0 7 17.5z" {...stroke} />;
  if (type === 'rain') {
    return (
      <svg {...common}>
        <g transform="translate(0 -3)">{cloud}</g>
        <path d="M9 18l-1 3M13 18l-1 3M17 18l-1 3" {...stroke} />
      </svg>
    );
  }
  if (type === 'snow') {
    return (
      <svg {...common}>
        <g transform="translate(0 -3)">{cloud}</g>
        <path d="M8.5 19.5h.01M12.5 20.5h.01M16.5 19.5h.01" {...stroke} strokeWidth="3" />
      </svg>
    );
  }
  return <svg {...common}>{cloud}</svg>;
}

function TodayBar() {
  const [now, setNow] = React.useState(new Date());
  const [weather, setWeather] = React.useState(null); // null: 불러오는 중, false: 실패

  // 시계: 1초마다 갱신
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 날씨: 처음 한 번 + 30분마다
  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(WEATHER_URL);
        if (!res.ok) throw new Error('weather');
        const d = await res.json();
        if (!alive) return;
        setWeather({
          temp: Math.round(d.current.temperature_2m),
          max: Math.round(d.daily.temperature_2m_max[0]),
          min: Math.round(d.daily.temperature_2m_min[0]),
          ...describeWeather(d.current.weather_code),
        });
      } catch {
        if (alive) setWeather(false);
      }
    };
    load();
    const t = setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const dateText = now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  const timeText = now.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="today-bar">
      <div className="today-time">
        <span className="today-date">{dateText}</span>
        <span className="today-clock">{timeText}</span>
      </div>
      <span className="today-divider" aria-hidden="true" />
      <div className="today-weather">
        {weather === null && <span className="today-muted">날씨 불러오는 중...</span>}
        {weather === false && <span className="today-muted">날씨 정보를 불러오지 못했습니다</span>}
        {weather && (
          <>
            <WeatherIcon type={weather.icon} />
            <span>
              {WEATHER_PLACE.name} <b>{weather.temp}°</b> {weather.text}
            </span>
            <span className="today-muted">
              최고 {weather.max}° / 최저 {weather.min}°
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ===== 오른쪽 상단: 코스피 지수 + 시가총액 1~3위 =====
const MARKET_URL = ['127.0.0.1', 'localhost'].includes(window.location.hostname)
  ? 'http://127.0.0.1:3001/api/market'
  : '/api/market';
const MARKET_REFRESH_MS = 30 * 1000; // 30초마다 갱신

const fmt = (n, digits = 0) =>
  Number.isFinite(n)
    ? n.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : '-';

// 국내 증시 표기: 상승 ▲ 빨강, 하락 ▼ 파랑
function Change({ dir, change, rate, digits = 0 }) {
  const mark = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '-';
  return (
    <span className={`chg ${dir}`}>
      {mark} {fmt(Math.abs(change), digits)} ({rate > 0 ? '+' : ''}
      {fmt(rate, 2)}%)
    </span>
  );
}

function MarketPanel() {
  const [market, setMarket] = React.useState(null); // null: 불러오는 중, false: 실패

  React.useEffect(() => {
    let alive = true;
    const load = async () => {
      if (document.hidden) return; // 다른 탭을 보고 있을 때는 쉬기
      try {
        const res = await fetch(MARKET_URL);
        const d = await res.json();
        if (!res.ok || !d.kospi) throw new Error('market');
        if (alive) setMarket(d);
      } catch {
        if (alive) setMarket((prev) => prev || false);
      }
    };
    load();
    const t = setInterval(load, MARKET_REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      alive = false;
      clearInterval(t);
      document.removeEventListener('visibilitychange', load);
    };
  }, []);

  if (market === null) {
    return <aside className="market"><span className="today-muted">시세 불러오는 중...</span></aside>;
  }
  if (market === false) {
    return <aside className="market"><span className="today-muted">시세 정보를 불러오지 못했습니다</span></aside>;
  }

  const { kospi, top } = market;
  const updated = new Date(market.fetchedAt).toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <aside className="market" aria-label="코스피 지수와 시가총액 상위 종목">
      <div className="market-head">
        <span className="market-title">코스피</span>
        <span className={`market-status ${kospi.open ? 'open' : ''}`}>
          {kospi.open ? '장중' : '장 마감'}
        </span>
      </div>
      <div className="kospi-row">
        <strong className={`kospi-value ${kospi.direction}`}>{fmt(kospi.value, 2)}</strong>
        <Change dir={kospi.direction} change={kospi.change} rate={kospi.rate} digits={2} />
      </div>

      <div className="market-sub">시가총액 상위</div>
      <ol className="top-list">
        {top.map((s) => (
          <li key={s.rank}>
            <span className="top-rank">{s.rank}</span>
            <div className="top-name">
              {s.code ? (
                <a
                  href={`https://finance.naver.com/item/main.naver?code=${s.code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.name}
                </a>
              ) : (
                s.name
              )}
              <span className="top-cap">{s.marketCap}</span>
            </div>
            <div className="top-price">
              <b>{fmt(s.price)}원</b>
              <Change dir={s.direction} change={s.change} rate={s.rate} />
            </div>
          </li>
        ))}
      </ol>

      <div className="market-foot">
        {updated} 기준{market.stale ? ' (최근 값)' : ''} · 30초마다 갱신 · 출처: 네이버 증권
      </div>
    </aside>
  );
}

function Dashboard({ onAsk }) {
  const [filter, setFilter] = React.useState('all');

  const count = (type) => ITEMS.filter((i) => i.type === type).length;
  const mismatch = count('history') + count('unknown');
  const next = SCHEDULE.find((s) => new Date(s.date + 'T23:59:59') >= new Date());
  const shown = filter === 'all' ? ITEMS : ITEMS.filter((i) => i.type === filter);

  return (
    <main className="dash">
      {/* 위쪽: 왼쪽 날짜·날씨 / 오른쪽 코스피 */}
      <div className="top-row">
        <TodayBar />
        <MarketPanel />
      </div>

      <header className="dash-hero">
        <div>
          <p className="eyebrow">품질경영실 AI 비서</p>
          <h1>SJ-AL200 품질 기준 대시보드</h1>
          <p className="hero-sub">
            기술시방서 Rev.C 기준으로 사내 기준서와 계약서를 비교한 현황입니다.
          </p>
        </div>
        <span className="tag-sample">교육용 가상 자료</span>
      </header>

      {/* 요약 숫자 */}
      <section className="kpis">
        <div className="kpi danger">
          <span className="kpi-label">기준 불일치</span>
          <strong className="kpi-value">{mismatch}건</strong>
          <span className="kpi-desc">
            개정 이력 {count('history')} · 원인 불명 {count('unknown')}
          </span>
        </div>
        <div className="kpi danger">
          <span className="kpi-label">누락</span>
          <strong className="kpi-value">{count('missing')}건</strong>
          <span className="kpi-desc">시방서 기준이 검사기준서에 없음</span>
        </div>
        <div className="kpi ok">
          <span className="kpi-label">단위만 다름</span>
          <strong className="kpi-value">{count('unit')}건</strong>
          <span className="kpi-desc">환산하면 같은 값</span>
        </div>
        <div className="kpi info">
          <span className="kpi-label">다음 일정</span>
          <strong className="kpi-value">{next ? dday(next.date) : '-'}</strong>
          <span className="kpi-desc">{next ? next.title : '남은 일정 없음'}</span>
        </div>
      </section>

      <div className="dash-grid">
        {/* 기준 비교 */}
        <section className="card wide">
          <div className="card-head">
            <h2>기준 비교 현황</h2>
            <div className="chips" role="group" aria-label="구분 필터">
              <button
                className={`chip${filter === 'all' ? ' active' : ''}`}
                onClick={() => setFilter('all')}
              >
                전체 {ITEMS.length}
              </button>
              {Object.entries(TYPES).map(([key, t]) => (
                <button
                  key={key}
                  className={`chip${filter === key ? ' active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {t.label} {count(key)}
                </button>
              ))}
            </div>
          </div>

          <ul className="compare-list">
            {shown.map((i) => (
              <li key={i.item} className="compare-row">
                <div className="compare-top">
                  <span className={`badge ${TYPES[i.type].tone}`}>{TYPES[i.type].label}</span>
                  <strong className="compare-item">{i.item}</strong>
                </div>
                <div className="compare-values">
                  <div>
                    <span className="val-label">시방서 (기준)</span>
                    <span className="val">{i.spec}</span>
                  </div>
                  <div>
                    <span className="val-label">비교 문서</span>
                    <span className="val">{i.other}</span>
                  </div>
                </div>
                <div className="compare-bottom">
                  <span className="memo">{i.memo}</span>
                  <button
                    className="ask-btn"
                    onClick={() => onAsk(`${i.item} 기준이 문서마다 어떻게 다른지 근거와 함께 설명해줘.`)}
                  >
                    AI에게 묻기
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 문서 현황 */}
        <section className="card">
          <h2>문서 개정 현황</h2>
          <ul className="doc-list">
            {DOCS.map((d) => (
              <li key={d.code} className={`doc ${d.status}`}>
                <div className="doc-top">
                  <strong>{d.name}</strong>
                  <span className="doc-rev">{d.rev}</span>
                </div>
                <span className="doc-meta">
                  {d.code} · {d.date}
                </span>
                <span className="doc-note">{d.note}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 일정 */}
        <section className="card">
          <h2>주요 일정</h2>
          <ol className="timeline">
            {SCHEDULE.map((s) => {
              const label = dday(s.date);
              const done = label.startsWith('완료');
              return (
                <li key={s.date} className={done ? 'done' : ''}>
                  <span className="tl-date">{s.date}</span>
                  <span className="tl-title">{s.title}</span>
                  <span className="tl-meta">
                    [{s.ref}] · <b>{label}</b>
                  </span>
                </li>
              );
            })}
            <li className="pending">
              <span className="tl-date">설치 완료 후 30일 이내</span>
              <span className="tl-title">SAT 실시</span>
              <span className="tl-meta">[계약서 제12조]</span>
            </li>
          </ol>
        </section>
      </div>

      <p className="dash-foot">
        이 화면은 문서 내용을 정리한 참고 자료입니다. 최종 합격·불합격 판정과 기준서 개정은 품질
        담당자가 결정합니다.
      </p>
    </main>
  );
}

window.Dashboard = Dashboard;
