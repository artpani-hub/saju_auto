const path = require('path');
const cron = require('node-cron');
const sajuEngine = require('./sajuEngine');
const imageGenerator = require('./imageGenerator');

// SNS 발행 모듈 로드
const instagramPublisher = require('./publisherInstagram');
const threadsPublisher = require('./publisherThreads');
const youtubePublisher = require('./publisherYouTube');

// 카드뉴스 생성 및 SNS 자동 배포 메인 프로세스
async function runFortuneBot() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  console.log(`\n======================================================`);
  console.log(`[봇 작동 시작] ${dateStr} 일일 띠별 운세 자동화 작업을 시작합니다...`);
  console.log(`======================================================`);

  // 1. 오늘의 띠별 운세 텍스트 로드
  const fortunes = sajuEngine.getDailyZodiacFortune(today);

  // 2. 띠별 이미지 생성 및 SNS 자동 업로드
  const outputDir = path.join(__dirname, 'output', dateStr);
  
  for (const item of fortunes) {
    const fileName = `${dateStr}_${item.zodiac}.png`;
    const outputPath = path.join(outputDir, fileName);
    
    try {
      // 2-1. 카드뉴스 이미지 로컬 파일 렌더링 및 저장
      await imageGenerator.generateZodiacCard(
        item.zodiac,
        item.fortune,
        `${dateStr} 오늘의 운세`,
        outputPath
      );
      console.log(`✓ 렌더링 완료: [${item.zodiac}] -> output/${dateStr}/${fileName}`);

      // 2-2. 인스타그램 자동 포스팅 시도
      // (Meta API 규격상 로컬 주소 대신 외부 접근용 목업 URL과 운세 텍스트 전달)
      const mockPublicUrl = `https://raw.githubusercontent.com/artpani-hub/saju_auto/main/samples/${item.zodiac}.png`;
      const captionText = `[${dateStr} 오늘의 ${item.zodiac} 운세]\n\n${item.fortune}\n\n#사주 #운세 #${item.zodiac} #오늘의운세 #saju_auto`;
      
      await instagramPublisher.uploadToInstagram(mockPublicUrl, captionText);

      // 2-3. 스레드 자동 포스팅 시도
      const threadsText = `[${dateStr} 오늘의 ${item.zodiac} 운세]\n\n${item.fortune}\n\n#사주 #운세 #오늘의운세`;
      await threadsPublisher.uploadToThreads(threadsText, mockPublicUrl);

    } catch (error) {
      console.error(`✗ [${item.zodiac}] 작업 중 에러 발생:`, error.message);
    }
  }

  // 3. 유튜브 쇼츠 시뮬레이터 (3단계 비디오 렌더러 구현 후 실제 비디오 파일 패스 연결)
  const mockVideoPath = path.join(outputDir, 'shorts_video_sample.mp4');
  const youtubeTitle = `[2026 오늘의 띠별 운세] #Shorts`;
  const youtubeDesc = `매일 업데이트되는 12간지 오늘의 띠별 사주 운세입니다.`;
  await youtubePublisher.uploadToYouTube(mockVideoPath, youtubeTitle, youtubeDesc);

  console.log(`======================================================`);
  console.log(`[봇 작동 완료] ${dateStr} 모든 이미지 생성 및 SNS 업로드 배포 완료.`);
  console.log(`======================================================\n`);
}

// 1. 컨테이너 기동 즉시 테스트용 1회 실행
runFortuneBot();

// 2. 매일 오전 07:00에 실행되도록 크론 스케줄 등록
cron.schedule('0 0 7 * * *', () => {
  console.log('[스케줄러 트리거] 오전 7시 정각입니다. 자동 운세 봇 작동을 시작합니다.');
  runFortuneBot();
});

console.log('[시스템 대기] 사주 운세 자동 봇이 백그라운드 대기 모드로 기동되었습니다. (스케줄: 매일 오전 7시)');

// 3. 로컬 대시보드 웹 서버 실행
const dashboardServer = require('./server');
dashboardServer.startServer();


