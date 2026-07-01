/**
 * 사주/운세 데이터 생성 엔진
 */

// 12지신(띠) 배열
const ZODIACS = ["쥐띠", "소띠", "호랑이띠", "토끼띠", "용띠", "뱀띠", "말띠", "양띠", "원숭이띠", "닭띠", "개띠", "돼지띠"];

// 띠별 고정 운세 샘플 (실제 서비스에서는 날짜 시드 혹은 AI API를 통해 다채롭게 변환)
const FORTUNE_TEMPLATES = [
  "귀인의 도움으로 막혔던 일들이 시원하게 풀리는 날입니다. 적극적으로 움직이세요.",
  "생각지도 못한 행운이 찾아옵니다. 겸손한 자세를 유지하면 복이 더 오래 머뭅니다.",
  "오늘은 한 걸음 물러나서 상황을 관망하는 것이 유리합니다. 급한 결정은 피하세요.",
  "주변 사람들과의 소통이 중요한 날입니다. 경청하는 태도가 행운을 불러옵니다.",
  "새로운 도전을 하기에 좋은 시기입니다. 망설이지 말고 자신감을 가지세요.",
  "건강과 컨디션 관리에 힘써야 하는 날입니다. 무리한 일정은 삼가는 것이 좋습니다.",
  "재물운이 상승하는 날입니다. 사소한 지출을 아끼고 기회를 포착하세요.",
  "마음의 여유를 가지면 보이지 않던 해결책이 보입니다. 명상이나 가벼운 산책을 추천합니다.",
  "가까운 사람과의 오해가 풀리고 관계가 돈독해지는 계기가 생깁니다.",
  "작은 노력으로 큰 성과를 거둘 수 있는 운수 좋은 날입니다. 끝까지 집중하세요.",
  "주변의 시기나 질투가 있을 수 있으니 행동을 조심하고 말을 아끼는 것이 안전합니다.",
  "기다리던 소식이 찾아와 기쁨을 주는 날입니다. 긍정적인 에너지를 주변에 나누세요."
];

/**
 * 특정 날짜에 대한 12띠별 일일 운세를 생성합니다.
 * @param {Date} date 운세를 추출할 기준 날짜
 * @returns {Array<{zodiac: string, fortune: string}>} 띠별 운세 리스트
 */
function getDailyZodiacFortune(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 날짜 기반으로 매일 다른 패턴의 운세가 섞이도록 간단한 해시 시드값 계산
  const seed = (year + month * 31 + day) % FORTUNE_TEMPLATES.length;

  return ZODIACS.map((zodiac, index) => {
    // 띠별로 고유하게 인덱스를 조합하여 매일 변경되는 운세 지정
    const templateIndex = (seed + index) % FORTUNE_TEMPLATES.length;
    return {
      zodiac: zodiac,
      fortune: FORTUNE_TEMPLATES[templateIndex]
    };
  });
}

module.exports = {
  getDailyZodiacFortune
};
