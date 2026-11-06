// Gemini 연결 확인용 테스트 (키 값은 절대 출력하지 않음)
import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY가 .env에 없습니다.');
  process.exit(1);
}

console.log(`모델: ${model}`);

try {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model,
    contents: '"연결 성공"이라고 한 문장으로만 답해줘.',
  });
  console.log('✅ 응답:', response.text);
} catch (err) {
  const status = err?.status ?? err?.code ?? '알 수 없음';
  // 혹시 메시지에 키가 섞여 있어도 가려서 출력
  const message = String(err?.message ?? err).split(apiKey).join('***');
  console.error(`❌ 실패 (오류 코드: ${status})`);
  console.error(message.slice(0, 500));
  process.exit(1);
}
