const { GoogleGenAI } = require('@google/generative-ai');
require('dotenv').config();

// 9가지 대주제 정의
const TOPICS = [
  { id: 1, name: "사주팔자", desc: "내 사주 오행 및 기운 분석" },
  { id: 2, name: "인연운", desc: "나에게 올 인연과 미래 배우자 특징" },
  { id: 3, name: "가족/자녀운", desc: "가족 궁합 및 자녀의 성공 기운" },
  { id: 4, name: "인간관계", desc: "사주 속 귀인과 악인 구별법 및 처세술" },
  { id: 5, name: "금전/재물운", desc: "내 타고난 재물 그릇 크기와 대운 시기" },
  { id: 6, name: "직업/사업/이직운", desc: "내 사주에 맞는 천직 및 이직 타이밍" },
  { id: 7, name: "건강운", desc: "오행 분석을 통한 취약 질환 및 에너지 처방" },
  { id: 8, name: "오늘의 운세", desc: "오늘 하루의 전체적인 일진 흐름" },
  { id: 9, name: "띠별 운세", desc: "12지신 띠별 오늘의 세부 운세 흐름" }
];

// Gemini API 미작동 시 사용할 로컬 백업 더미 데이터베이스
const BACKUP_DATABASE = {
  "사주팔자": {
    thumbnail: "내 사주 속 숨겨진 오행 대공개",
    content: "사주팔자에서 목(木), 화(火), 토(土), 금(金), 수(水) 중 어떤 기운이 부족하고 넘치는지에 따라 인생의 흐름이 결정됩니다. 본인의 탄생월에 맞춰 조화로운 기운을 채워주면, 막혔던 사주가 시원하게 풀리는 개운법이 작동합니다."
  },
  "인연운": {
    thumbnail: "사주로 미리 보는 평생 인연의 얼굴",
    content: "당신의 사주 일지에 있는 일간 기운(목화토금수)을 분석해 보면, 올해 다가올 인연이 든든한 조력자일지 혹은 격정적인 사랑을 나눌 인연일지 미리 엿볼 수 있습니다. 서로 보완되는 기운을 가진 연인을 만나면 대운의 시기가 앞당겨집니다."
  },
  "가족/자녀운": {
    thumbnail: "우리 아이 사주에 숨어있는 성공 기운",
    content: "부모와 자식 간에도 사주 상생과 상극이 존재합니다. 아이의 사주에서 식상(食傷) 기운이 발달해 있다면 창의력과 예술 분야에서 대성할 팔자이며, 관성(官星) 기운이 뚜렷하다면 명예와 학문으로 가문을 일으킬 인재가 됩니다."
  },
  "인간관계": {
    thumbnail: "내 사주 속 귀인 vs 악인 구분법",
    content: "나를 돕는 귀인은 사주 일간을 생해주는 용신(用神)의 해에 찾아옵니다. 반대로 나의 기운을 극단적으로 빼앗아가는 악인은 기신(忌神)의 흐름에 나타나므로, 대인관계에서 사소한 충돌이 잦아질 때는 말을 아끼고 내실을 기하는 것이 안전합니다."
  },
  "금전/재물운": {
    thumbnail: "평생 만져볼 내 재물 그릇 크기는?",
    content: "재물운이 열리는 시기는 사주에 편재(偏財) 혹은 정재(正財) 기운이 대운(大運)과 합을 이룰 때입니다. 타고난 재물 그릇을 깨지 않고 불리기 위해서는 올해 돈이 들어오는 문을 활짝 열어주는 개운 소품과 골드 톤의 방향 설정을 추천합니다."
  },
  "직업/사업/이직운": {
    thumbnail: "내 사주가 말해주는 최적의 천직",
    content: "사업가 팔자(편재/식상 발달)와 공무원/회사원 팔자(관성/인성 발달)는 사주 원국에서부터 뚜렷하게 나뉩니다. 만약 현재 이직을 고민 중이라면 관성 기운이 들어오는 분기를 타깃팅해야 이직 후 명예와 보상이 배가됩니다."
  },
  "건강운": {
    thumbnail: "오행으로 보는 내 몸의 건강 취약 부위",
    content: "화(火) 기운이 지나치게 강하면 심혈관계나 혈압을 조심해야 하며, 수(水) 기운이 고갈되면 신장 및 비뇨계통 질환에 취약해집니다. 사주의 음양 조화를 맞추기 위해 자연의 기운을 담은 힐링 컬러와 명상으로 신체 밸런스를 조율하세요."
  },
  "오늘의 운세": {
    thumbnail: "오늘 당신에게 일어날 가장 기쁜 일",
    content: "귀인이 서쪽에서 찾아와 당신이 안고 있던 오랜 고민을 실마리 풀듯 시원하게 해결해 줄 하루입니다. 망설이던 결정이 있다면 주저하지 말고 행동에 옮기세요. 오늘 하루는 온전히 당신의 우호적인 기운으로 가득 찹니다."
  },
  "띠별 운세": {
    thumbnail: "오늘 가장 운이 좋은 12지신 띠",
    content: "용띠와 말띠는 귀인의 보살핌이 깃드는 최고 길일입니다. 호랑이띠와 토끼띠는 재물 거래 시 꼼꼼한 계약서 작성을 권장하며, 돼지띠와 닭띠는 저녁 시간 뜻밖의 반가운 소식으로 행복을 나눌 하루입니다."
  }
};

/**
 * 특정 날짜에 맞춰 오늘 순환 순서의 사주 주제를 계산합니다.
 */
function getTodayTopic(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 날짜 시드를 기반으로 9개 주제 로테이션 인덱스 산출
  const index = (year * 365 + month * 31 + day) % TOPICS.length;
  return TOPICS[index];
}

/**
 * Google Gemini API 또는 로컬 DB를 사용하여 오늘의 사주 콘텐츠를 자동 생성합니다.
 */
async function generateTodaySajuContent(date = new Date()) {
  const topic = getTodayTopic(date);
  const apiKey = process.env.GEMINI_API_KEY;

  console.log(`[Rotator] 오늘의 로테이션 주제: "${topic.name}" (${topic.desc})`);

  // 1. API 키가 없거나 예시 상태인 경우 -> 백업 로컬 데이터베이스 즉시 반환 (비용 0원 테스트 지원)
  if (!apiKey || apiKey.includes('your_google_gemini')) {
    console.log(`[Rotator] Gemini API Key가 설정되지 않아 로컬 백업 사주 DB 데이터를 로드합니다.`);
    const localData = BACKUP_DATABASE[topic.name];
    return {
      topic: topic.name,
      thumbnailText: localData.thumbnail,
      contentText: localData.content
    };
  }

  // 2. 구글 제미나이 AI SDK 연동 호출
  try {
    console.log(`[Rotator] Google Gemini 1.5 Flash API에 콘텐츠 생성 요청 중...`);
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      너는 전문 사주 학자이자 SNS 마케팅 작가야.
      오늘 다룰 사주 대주제는 [${topic.name}] 이고 상세 방향은 [${topic.desc}] 야.
      
      인스타그램 카드뉴스 및 숏폼 영상 자막용으로 최적화된 아래의 2가지 콘텐츠를 한국어로 창작해줘.
      1. thumbnailText: 사람들의 시선을 바로 강렬하게 사로잡는 한 줄 어그로 썸네일 제목 문구 (25자 이내, 예: '2026년 이 글자 있으면 무조건 대박 납니다')
      2. contentText: 쉽고 흥미로우며 깊은 신뢰감을 주는 상세 사주 설명 본문 문구 (200자~300자 정도의 매끄러운 단락)
      
      반드시 기교 없는 순수한 JSON Object 포맷으로만 출력해야 해. 마크다운(\`\`\`)을 씌우지 마.
      JSON 형식 예시:
      {
        "thumbnailText": "썸네일 내용",
        "contentText": "본문 내용"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const responseText = response.text.trim();
    // JSON 파싱 시 발생할 수 있는 마크다운 코드 블럭 백틱 정제 작업
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanJson);

    console.log(`[Rotator] Gemini 콘텐츠 생성 완료!`);
    return {
      topic: topic.name,
      thumbnailText: result.thumbnailText || BACKUP_DATABASE[topic.name].thumbnail,
      contentText: result.contentText || BACKUP_DATABASE[topic.name].content
    };
  } catch (error) {
    console.error(`[Rotator] Gemini API 호출 실패로 로컬 데이터베이스를 로드합니다. 에러:`, error.message);
    const localData = BACKUP_DATABASE[topic.name];
    return {
      topic: topic.name,
      thumbnailText: localData.thumbnail,
      contentText: localData.content
    };
  }
}

module.exports = {
  getTodayTopic,
  generateTodaySajuContent
};
