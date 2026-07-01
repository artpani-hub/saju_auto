const path = require('path');
const sajuEngine = require('./sajuEngine');
const imageGenerator = require('./imageGenerator');

async function main() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  console.log(`[시작] ${dateStr} 일일 띠별 운세 카드뉴스 생성 작업을 시작합니다...\n`);

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

  console.log(`\n[완료] 모든 카드뉴스 이미지 생성이 완료되었습니다. 폴더 위치: ${outputDir}`);
}

main();
