const { useState, useRef, useEffect } = React;

// 내 PC에서 열면 로컬 서버, 배포된 사이트에서는 같은 주소의 /api/chat
const isLocal = ['127.0.0.1', 'localhost'].includes(window.location.hostname);
const API_URL = isLocal ? 'http://127.0.0.1:3001/api/chat' : '/api/chat';

const WELCOME = {
  role: 'assistant',
  text: '안녕하세요! 품질경영실 AI 비서입니다. 무엇을 도와드릴까요?',
  local: true, // 서버로 보내지 않는 안내 메시지
};

// 대화가 비어 있을 때 보여줄 자주 묻는 질문
const SUGGESTIONS = [
  'ST30 체결 토크 기준은?',
  '출하검사기준서에서 시방서와 다른 항목을 모두 알려줘.',
  '출하 검사 기록은 몇 년 보관해야 해?',
];

// 말풍선 모양 채팅 아이콘
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.4 1.32 4.55 3.4 6.02L4.5 21l4.13-2.27c1.06.26 2.19.4 3.37.4 5.52 0 10-3.58 10-8.13S17.52 3 12 3zm-4 9.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm4 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm4 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z"
      />
    </svg>
  );
}

// 닫기(X) 아이콘
function CloseIcon({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

// 채팅창 이동·크기 조절 설정
const MIN_W = 300; // 최소 너비(px)
const MIN_H = 360; // 최소 높이(px)
const EDGE = 8; // 화면 가장자리 여백(px)
const RESIZE_DIRS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const MOBILE_QUERY = '(max-width: 480px)';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// 창 위치·크기가 화면 밖으로 나가지 않게 맞춤
function fitToViewport(box) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = clamp(box.width, MIN_W, vw - EDGE * 2);
  const height = clamp(box.height, MIN_H, vh - EDGE * 2);
  return {
    width,
    height,
    left: clamp(box.left, EDGE, vw - width - EDGE),
    top: clamp(box.top, EDGE, vh - height - EDGE),
  };
}

// 휴대폰 화면인지 확인 (휴대폰에서는 전체 화면이라 이동·크기 조절을 끔)
function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => setMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
}

function App() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [box, setBox] = useState(null); // 사용자가 옮기거나 키운 창 위치·크기 (null이면 기본 위치)
  const isMobile = useIsMobile();
  const popupRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // 브라우저 창 크기가 바뀌면 채팅창이 화면 안에 있도록 맞춤
  useEffect(() => {
    const onResize = () => setBox((b) => (b ? fitToViewport(b) : b));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 제목 줄을 끌면 이동, 가장자리를 끌면 크기 조절
  function startPointer(e, mode) {
    if (isMobile || e.button !== 0) return;
    if (mode === 'move' && e.target.closest('button')) return;
    e.preventDefault();

    const r = popupRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    document.body.classList.add('dragging');

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { left, top, width, height } = r;

      if (mode === 'move') {
        left += dx;
        top += dy;
      } else {
        if (mode.includes('e')) width = r.width + dx;
        if (mode.includes('s')) height = r.height + dy;
        if (mode.includes('w')) {
          width = Math.max(MIN_W, r.width - dx);
          left = r.right - width;
        }
        if (mode.includes('n')) {
          height = Math.max(MIN_H, r.height - dy);
          top = r.bottom - height;
        }
      }
      setBox(fitToViewport({ left, top, width, height }));
    };

    const onUp = () => {
      document.body.classList.remove('dragging');
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  // 제목 줄 더블클릭: 원래 위치·크기로
  function resetBox(e) {
    if (e.target.closest('button')) return;
    setBox(null);
  }

  const popupStyle =
    box && !isMobile
      ? { left: box.left, top: box.top, width: box.width, height: box.height, right: 'auto', bottom: 'auto' }
      : undefined;

  // 새 메시지가 생기거나 창을 열면 맨 아래로 스크롤
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  // 창을 열면 입력창에 커서, Esc 키로 닫기
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // 대시보드의 [AI에게 묻기] 버튼: 채팅창을 열고 질문을 바로 보냄
  function askAI(question) {
    setOpen(true);
    if (loading) {
      setInput(question);
      return;
    }
    send(question);
  }

  async function send(preset) {
    const text = (typeof preset === 'string' ? preset : input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    // 안내 메시지와 오류 메시지는 대화 기록에서 제외하고 서버로 전송
    const history = next
      .filter((m) => !m.local && !m.error)
      .map(({ role, text }) => ({ role, text }));

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.reply) {
        throw new Error(data.error || '답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요.');
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (err) {
      const msg =
        err instanceof TypeError
          ? '서버에 연결할 수 없습니다. 서버가 켜져 있는지 확인해 주세요.'
          : err.message;
      setMessages((prev) => [...prev, { role: 'assistant', text: msg, error: true }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e) {
    // 한글 조합 중 Enter는 무시 (중복 전송 방지)
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function clearChat() {
    setMessages([WELCOME]);
    setInput('');
    inputRef.current?.focus();
  }

  return (
    <>
      {/* 메인 대시보드 */}
      <Dashboard onAsk={askAI} />

      {/* 레이어 팝업 뒤 어두운 배경 (누르면 닫힘) */}
      <div
        className={`backdrop${open ? ' open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* 채팅 레이어 팝업 */}
      <section
        ref={popupRef}
        className={`chat-popup${open ? ' open' : ''}`}
        style={popupStyle}
        role="dialog"
        aria-modal="true"
        aria-label="품질경영실 AI 비서 채팅"
        aria-hidden={!open}
      >
      <div className="snow" aria-hidden="true" />

      {/* 가장자리·모서리를 끌어 크기 조절 */}
      {RESIZE_DIRS.map((d) => (
        <div
          key={d}
          className={`resize-handle ${d}`}
          onPointerDown={(e) => startPointer(e, d)}
          aria-hidden="true"
        />
      ))}

      <header
        className="header"
        onPointerDown={(e) => startPointer(e, 'move')}
        onDoubleClick={resetBox}
        title={isMobile ? undefined : '끌어서 옮기기 · 더블클릭하면 원래 위치로'}
      >
        <h2>❄ 품질경영실 AI 비서</h2>
        <div className="header-actions">
          <button className="clear-btn" onClick={clearChat} disabled={loading}>
            대화 지우기
          </button>
          <button className="close-btn" onClick={() => setOpen(false)} aria-label="채팅창 닫기">
            <CloseIcon size={20} />
          </button>
        </div>
      </header>

      <div className="chat">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`bubble ${m.role === 'user' ? 'user' : 'ai'}${m.error ? ' error' : ''}`}
          >
            {m.text}
          </div>
        ))}
        {/* 첫 화면(안내 메시지만 있을 때)에만 자주 묻는 질문 표시 */}
        {messages.length === 1 && !loading && (
          <div className="suggestions">
            <span className="suggestions-title">자주 묻는 질문</span>
            {SUGGESTIONS.map((q) => (
              <button key={q} className="suggestion-btn" onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
        )}
        {loading && <div className="bubble ai typing">답변 작성 중...</div>}
        <div ref={bottomRef} />
      </div>

      <footer className="composer">
        <div className="input-row">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="질문을 입력하세요 (Shift+Enter: 줄바꿈)"
            rows={2}
            maxLength={2000}
          />
          <button className="send-btn" onClick={() => send()} disabled={loading || !input.trim()}>
            보내기
          </button>
        </div>
        <p className="notice">실습용 챗봇입니다. 실제 회사 자료나 개인정보를 입력하지 마세요.</p>
      </footer>
      </section>

      {/* 오른쪽 아래 채팅 아이콘 */}
      <button
        className={`chat-fab${open ? ' open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? '채팅창 닫기' : 'AI 비서 채팅 열기'}
        aria-expanded={open}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </button>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
