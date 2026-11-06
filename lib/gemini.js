// Gemini 호출 공통 로직 (api/chat.js 와 local-server.js 가 함께 사용)
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'knowledge');

const ANSWER_RULES = `[답변 규칙]
1. 너는 신진엠텍 품질경영실의 AI 비서다. 한국어로 간결하게 답한다.
2. 제공된 문서에 있는 내용만 근거로 답한다.
3. 답변 끝에 근거를 [시방서 5.2], [검사기준서 No.8], [표준서 4], [계약서 제10조] 형식으로 표시한다.
4. 문서에 없으면 추측하지 말고 "제공된 문서에서 확인되지 않습니다"라고 답한다.
5. 사내 기준서(검사기준서, 작업표준서)의 값이 시방서 최신본과 다르면 양쪽 값을 모두 보여주고, 시방서 값을 기준으로 안내하며 해당 기준서의 개정 검토가 필요하다고 알린다. 개정 이력으로 설명되는 차이인지, 문서만으로 원인을 알 수 없는 차이인지도 구분한다.
6. 계약서와 시방서가 다르면 계약서 제3조 제2항의 우선순위(특수조건 → 계약서 본문 → 시방서)를 따른다.
7. 단위만 다른 값은 환산식을 보여주고, 불일치가 아니라 "단위만 다름"으로 구분한다.
8. 시방서의 기준이 사내 기준서에 없으면 "누락"이라고 분명히 알린다.
9. 최종 합격·불합격 판정과 기준서 개정은 품질 담당자가 결정한다고 안내한다.`;

// knowledge/ 폴더의 .md 파일을 모두 읽어 하나의 문자열로 합침
// (요청마다 읽으므로 문서를 고쳐도 서버 재시작 없이 바로 반영됨)
function loadKnowledge() {
  let files = [];
  try {
    files = fs
      .readdirSync(KNOWLEDGE_DIR)
      .filter((name) => name.toLowerCase().endsWith('.md'))
      .sort();
  } catch {
    console.error('[knowledge] knowledge 폴더를 찾을 수 없습니다.');
    return '';
  }
  return files
    .map((name) => {
      const text = fs.readFileSync(path.join(KNOWLEDGE_DIR, name), 'utf8');
      return `===== 문서 시작: ${name} =====\n${text.trim()}\n===== 문서 끝: ${name} =====`;
    })
    .join('\n\n');
}

function buildSystemInstruction() {
  const knowledge = loadKnowledge();
  return `${ANSWER_RULES}

[제공된 문서]
${knowledge || '(제공된 문서가 없습니다)'}`;
}

const MAX_TEXT_LENGTH = 2000;
const MAX_HISTORY = 20;

let ai = null;
function getClient() {
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
}

// 입력 검증: 문제가 있으면 한국어 오류 문장, 없으면 null
function validate(body) {
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return '메시지가 비어 있습니다.';
  }
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) {
      return '메시지 형식이 올바르지 않습니다.';
    }
    if (typeof m.text !== 'string' || m.text.trim() === '') {
      return '빈 메시지는 보낼 수 없습니다.';
    }
    if (m.text.length > MAX_TEXT_LENGTH) {
      return `메시지는 ${MAX_TEXT_LENGTH.toLocaleString()}자 이하로 입력해 주세요.`;
    }
  }
  return null;
}

// 우리 형식 → Gemini 형식 (assistant → model), 최근 20개만
function toGeminiContents(messages) {
  const recent = messages.slice(-MAX_HISTORY);
  // Gemini 대화는 user 메시지로 시작해야 하므로 앞쪽 model 메시지는 제외
  while (recent.length > 0 && recent[0].role === 'assistant') recent.shift();
  return recent.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));
}

// 오류를 쉬운 한국어로 변환 (원문은 화면에 보내지 않음)
function toFriendlyError(err) {
  const status = Number(err?.status ?? err?.code) || 0;
  const msg = String(err?.message ?? '');
  if (status === 429) {
    return { status: 429, error: '요청이 많습니다. 잠시 후 다시 시도해 주세요.' };
  }
  if (status === 401 || status === 403 || /API[_ ]?key/i.test(msg)) {
    return { status: 500, error: 'API 키를 확인하세요.' };
  }
  return { status: 500, error: '답변을 만드는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.' };
}

/**
 * 요청 본문을 받아 { status, data } 를 돌려준다.
 * data 는 성공 시 { reply }, 실패 시 { error }
 */
export async function handleChat(body) {
  const invalid = validate(body);
  if (invalid) return { status: 400, data: { error: invalid } };

  if (!process.env.GEMINI_API_KEY) {
    return { status: 500, data: { error: 'API 키를 확인하세요.' } };
  }

  const contents = toGeminiContents(body.messages);
  if (contents.length === 0) {
    return { status: 400, data: { error: '사용자 메시지가 필요합니다.' } };
  }

  try {
    const response = await getClient().models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      contents,
      config: { systemInstruction: buildSystemInstruction() },
    });
    const reply = response.text?.trim();
    if (!reply) {
      return { status: 502, data: { error: '답변을 받지 못했습니다. 다시 시도해 주세요.' } };
    }
    return { status: 200, data: { reply } };
  } catch (err) {
    const friendly = toFriendlyError(err);
    // 서버 로그에는 상태 코드만 남김 (오류 원문·키 값은 남기지 않음)
    console.error(`[gemini] 호출 실패 (status: ${err?.status ?? err?.code ?? 'unknown'})`);
    return { status: friendly.status, data: { error: friendly.error } };
  }
}
