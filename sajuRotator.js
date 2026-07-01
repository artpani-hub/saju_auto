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

// 유튜브 쇼츠 조회수 대박 패턴을 적용한 고화질 로컬 백업 데이터베이스 리뉴얼
const BACKUP_DATABASE = {
  "사주팔자": {
    thumbnail: "사주에 '이 글자' 있으면 평생 돈 걱정 없습니다",
    content: "사주 원국에 재물의 창고라 불리는 진(辰), 술(戌), 축(丑), 미(未) 중 단 하나라도 있다면, 평생 굶어 죽지 않는 튼튼한 금전 그릇을 타고난 것입니다. 특히 올해 대운과 만나 흙의 문이 열릴 때 숨어있던 횡재수가 발동하므로, 이때를 기점으로 과감한 투자를 단행해야 대부의 반열에 오릅니다."
  },
  "인연운": {
    thumbnail: "2026년 하반기 무조건 결혼하게 될 사람의 사주 특징",
    content: "내 사주 일지에 배우자 기운을 극하는 글자가 없거나, 올해 일간과 육합(六合)을 이루는 귀인이 다가올 때 평생의 배필을 만나게 됩니다. 이 인연은 겉보기엔 무뚝뚝하나 당신의 부족한 목(木) 기운을 온전히 채워주는 따뜻한 흙의 기운을 가진 귀인으로, 만나는 즉시 사주가 풀리게 됩니다."
  },
  "가족/자녀운": {
    thumbnail: "이거 모르면 자식의 성공운을 평생 가로막습니다",
    content: "아이의 사주에 식상(食傷) 기운이 발달해 있는데 억지로 공무원이나 대기업 입사를 강요하면 평생 부모와 원수가 됩니다. 자유롭게 재주를 부려 재물을 캐내는 식신생재(食神生財) 사주는 부모가 틀을 깨주고 날개를 달아줄 때 가문을 일으킬 세계적인 인재로 대성합니다."
  },
  "인간관계": {
    thumbnail: "당장 인연을 끊어야 할 내 사주 속 최악의 악인",
    content: "내 일간을 강하게 극하는 칠살(七殺)이 가득한 사람과 엮이면 이유 없이 몸이 아프거나 재물이 새어나갑니다. 반대로 나의 용신(用神) 기운을 듬뿍 가진 귀인은 곁에만 두어도 꼬였던 계약과 인간관계가 시원하게 풀리므로, 내 기운을 갉아먹는 관계는 단호하게 정돈해야 개운이 시작됩니다."
  },
  "금전/재물운": {
    thumbnail: "말년에 빌딩 사고 대박 날 사주 특징 3가지",
    content: "첫째, 사주에 편재(偏財)가 뚜렷하고, 둘째, 식상과 재성이 유기적으로 연결되어 있으며, 셋째, 말년 대운에 용신 방향이 들어오는 사주입니다. 이 세 가지 중 두 개만 충족해도 젊은 날 고생은 훈장이 되며 50대 이후 부동산과 문서운으로 엄청난 거부가 될 명식입니다."
  },
  "직업/사업/이직운": {
    thumbnail: "사주에 '인목(寅木)'이 있는 사람들의 놀라운 공통점",
    content: "호랑이를 뜻하는 인목(寅木)을 가진 분들은 타고난 역마와 권력의 기운을 품고 있어, 지시를 받기보다 주도적으로 판을 짜는 전문직이나 사업에서 폭발적인 두각을 드러냅니다. 이 글자가 사주에 있다면 절대 남 밑에서 썩지 말고, 대운이 트이는 올해를 이직 및 창업의 원년으로 삼으십시오."
  },
  "건강운": {
    thumbnail: "사주에 화(火) 기운 부족하면 꼭 일어나는 무서운 현상",
    content: "불의 기운이 말라버리면 심혈관계 압박과 극심한 무기력증, 혈액순환 장애가 직격타로 찾아옵니다. 차가운 수(水) 기운에 눌려 몸의 불씨가 꺼지지 않도록 붉은색 계열의 소품을 가까이하고 동쪽을 향해 명상을 수행하여 사주의 온도를 맞춰주는 비방 개운법이 시급합니다."
  },
  "오늘의 운세": {
    thumbnail: "오늘 무조건 로또 사야 할 대박 징조의 일진",
    content: "오늘 당신의 일진에 재성을 생하는 천을귀인(天乙貴人)의 기운이 강하게 투출했습니다. 우연히 마주친 사람으로부터 유익한 제안을 받거나 횡재수가 열리는 날이니, 망설이던 비즈니스 제안이나 사소한 추첨에 과감히 발을 들이면 생각지도 못한 행운을 쥐게 될 것입니다."
  },
  "띠별 운세": {
    thumbnail: "내일 아침 눈 뜨자마자 돈벼락 맞을 3가지 띠",
    content: "용띠, 뱀띠, 원숭이띠 분들은 내일 천살(天殺)이 물러가고 천재지변과 같은 반가운 횡재 대운이 문을 두드립니다. 뜻밖의 미수금이 해결되거나 귀인의 금전 투자가 성사되는 형국이니, 들어오는 금전 물꼬를 막지 않도록 긍정적인 마음으로 하루를 맞이하십시오."
  }
};

/**
 * 특정 날짜에 맞춰 오늘 순환 순서의 사주 주제를 계산합니다.
 */
function getTodayTopic(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const index = (year * 365 + month * 31 + day) % TOPICS.length;
  return TOPICS[index];
}

/**
 * Google Gemini API 또는 로컬 DB를 사용하여 유튜브 쇼츠 조회수 대박 패턴의 썸네일 카피와 매칭 해설 본문을 생성합니다.
 */
async function generateTodaySajuContent(date = new Date()) {
  const topic = getTodayTopic(date);
  const apiKey = process.env.GEMINI_API_KEY;

  console.log(`[Rotator] 썸네일 벤치마킹 콘텐츠 생성 주제: "${topic.name}"`);

  // 1. API 키가 없거나 예시 상태인 경우 -> 벤치마킹 개편된 로컬 백업 DB 데이터 즉시 반환
  if (!apiKey || apiKey.includes('your_google_gemini')) {
    console.log(`[Rotator] Gemini API Key 미기입 상태로, 인기 카피 룰셋이 적용된 로컬 백업 데이터를 로드합니다.`);
    const localData = BACKUP_DATABASE[topic.name];
    return {
      topic: topic.name,
      thumbnailText: localData.thumbnail,
      contentText: localData.content
    };
  }

  // 2. 구글 제미나이 AI API 실시간 호출 (인기 썸네일 3대 카피 프롬프트 강제)
  try {
    console.log(`[Rotator] Google Gemini 1.5 Flash API에 쇼츠 카피 벤치마킹 콘텐츠 생성 요청 중...`);
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      너는 유튜브 쇼츠 조회수 100만 회 이상을 기록하는 스타 사주 전문 마케팅 작가야.
      오늘 다룰 사주 카테고리 주제는 [${topic.name}] 이고 세부 방향은 [${topic.desc}] 야.
      
      아래의 '유튜브 쇼츠 사주 썸네일 3대 카피 패턴'을 강제 준수하여 콘텐츠를 창작해줘.
      
      [유튜브 사주 쇼츠 3대 썸네일 패턴]
      1. 손실 회피 및 호기심 극대화형: (예: "사주에 '이 글자' 있으면 평생 돈 고생합니다", "이거 모르면 내 돈 다 샙니다")
      2. 절대적 대박/부자 암시형: (예: "말년에 무조건 빌딩 사는 사주 특징 3가지", "2026년 대박 날 띠")
      3. 구체적 사주 특징 저격형: (예: "사주에 '인목(寅木)'이 있는 사람들의 소름 돋는 공통점")
      
      [콘텐츠 구성 요구사항]
      - thumbnailText: 위 3대 패턴 중 하나를 반드시 적용하여, 20자 내외의 눈을 뗄 수 없는 자극적이고 매력적인 썸네일 카피를 창작해줘. (예: "사주에 '이 글자' 있으면... " 과 같이 호기심을 유도해야 함)
      - contentText: 위에서 생성한 'thumbnailText'의 호기심이나 암시(예: '이 글자'가 무엇이고 왜 그런지 등)를 명쾌하게 풀이하고 답해주는 구조로 본문 사주 해설을 재구성해줘. (200~300자 정도, 한국어의 유려하고 흥미진진한 톤앤매너 유지)
      
      출력은 순수 JSON Object 포맷으로만 해야 해. 마크다운 따옴표(\`\`\`)는 붙이지 마.
      {
        "thumbnailText": "썸네일 문구",
        "contentText": "썸네일의 질문에 해답을 주는 상세 해설 내용"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt
    });

    const responseText = response.text.trim();
    const cleanJson = responseText.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanJson);

    console.log(`[Rotator] 유튜브 벤치마킹 콘텐츠 생성 완료!`);
    return {
      topic: topic.name,
      thumbnailText: result.thumbnailText || BACKUP_DATABASE[topic.name].thumbnail,
      contentText: result.contentText || BACKUP_DATABASE[topic.name].content
    };
  } catch (error) {
    console.error(`[Rotator] AI 호출 실패로 벤치마킹 로컬 백업 DB를 로드합니다. 에러:`, error.message);
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
