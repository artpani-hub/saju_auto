const path = require('path');
const cron = require('node-cron');
const sajuEngine = require('./sajuEngine');
const imageGenerator = require('./imageGenerator');

// 카드뉴스 생성 메인 태스크 함수
async function runFortuneBot() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  console.log(`[봇 작동 시작] ${dateStr} 일일 띠별 운세 카드뉴스 작업을 시작합니다...`);

  // 1. 오늘의 띠별 운세 텍스트 로드
  const fortunes = sajuEngine.getDailyZodiacFortune(today);

  // 2. 띠별 이미지 순차 생성
  const outputDir = path.join(__dirname, 'output', dateStr);
  
  for (const item of fortunes) {
    const fileName = `${dateStr}_${item.zodiac}.png`;
    const outputPath = path.join(outputDir, fileName);
    
    try {
      await imageGenerator.generateZodiacCard(
        item.zodiac,
        item.fortune,
        `${dateStr} 오늘의 운세`,
        outputPath
      );
      console.log(`✓ 생성 완료: [${item.zodiac}] -> output/${dateStr}/${fileName}`);
    } catch (error) {
      console.error(`✗ 생성 실패: [${item.zodiac}]`, error);
    }
  }

  console.log(`[봇 작동 완료] 모든 작업이 완료되었습니다. 위치: ${outputDir}\n`);
}

// 1. 컨테이너가 켜졌을 때 즉시 최초 1회 실행 (정상 작동 테스트용)
runFortuneBot();

// 2. 매일 오전 07:00에 실행되도록 크론 스케줄 등록
// 초 분 시 일 월 요일 (node-cron 기준)
cron.schedule('0 0 7 * * *', () => {
  console.log('[스케줄러 트리거] 오전 7시 정각입니다. 운세를 생성합니다.');
  runFortuneBot();
});

console.log('[시스템 대기] 사주 운세 자동 봇이 백그라운드 대기 모드로 기동되었습니다. (스케줄: 매일 오전 7시)');

