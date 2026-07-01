const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const sajuRotator = require('./sajuRotator');
const imageGenerator = require('./imageGenerator');

// SNS 발행 모듈 로드
const instagramPublisher = require('./publisherInstagram');
const threadsPublisher = require('./publisherThreads');
const youtubePublisher = require('./publisherYouTube');

// 9대 주제 로테이션 생성 및 SNS 배포 메인 프로세스
async function runFortuneBot() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  console.log(`\n======================================================`);
  console.log(`[봇 작동 시작] ${dateStr} 일일 사주 로테이션 자동화 작업을 시작합니다...`);
  console.log(`======================================================`);

  // 1. 오늘의 사주 대주제 및 텍스트 생성 (Gemini API or 로컬 DB)
  let contentData;
  try {
    contentData = await sajuRotator.generateTodaySajuContent(today);
  } catch (error) {
    console.error(`✗ 콘텐츠 생성 실패:`, error.message);
    return;
  }

  const outputDir = path.join(__dirname, 'output', dateStr);
  fs.mkdirSync(outputDir, { recursive: true });

  // 2. 카드뉴스 이미지 세트(표지 + 본문) 생성
  console.log(`[봇] 1단계: 카드뉴스 드로잉 작업 진행 중...`);
  let mediaPaths;
  try {
    mediaPaths = await imageGenerator.generateSajuCards(
      contentData.topic,
      contentData.thumbnailText,
      contentData.contentText,
      dateStr,
      outputDir
    );
    console.log(`✓ 썸네일 카드뉴스 렌더링 완료: ${mediaPaths.coverPath}`);
    console.log(`✓ 본문 상세 카드뉴스 렌더링 완료: ${mediaPaths.contentPath}`);
  } catch (error) {
    console.error(`✗ 카드뉴스 렌더링 실패:`, error.message);
    return;
  }

  // 3. 뷰어 연동용 메타데이터 JSON 파일 기록
  const metadata = {
    date: dateStr,
    topic: contentData.topic,
    thumbnailText: contentData.thumbnailText,
    contentText: contentData.contentText
  };
  fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`✓ 메타데이터 기록 완료: output/${dateStr}/metadata.json`);

  // 4. SNS 채널별 배포 시도
  // (실제 Meta API 상에서는 Public 접근 가능한 이미지 링크를 요구하므로 Mock URL 전달)
  const mockPublicUrlCover = `https://raw.githubusercontent.com/artpani-hub/saju_auto/main/samples/${dateStr}_01_cover.png`;
  const captionText = `[${dateStr} 오늘의 ${contentData.topic} 운세]\n\n${contentData.contentText}\n\n#사주 #운세 #오늘의운세 #saju_auto`;

  // 4-1. 인스타그램 배포
  try {
    await instagramPublisher.uploadToInstagram(mockPublicUrlCover, captionText);
  } catch (err) {
    console.error(`✗ 인스타그램 발행 중 예외:`, err.message);
  }

  // 4-2. 스레드 배포
  try {
    const threadsText = `[${dateStr} 오늘의 ${contentData.topic} 운세]\n\n${contentData.contentText}\n\n#사주 #운세 #오늘의운세`;
    await threadsPublisher.uploadToThreads(threadsText, mockPublicUrlCover);
  } catch (err) {
    console.error(`✗ 스레드 발행 중 예외:`, err.message);
  }

  // 4-3. 유튜브 쇼츠 시뮬레이터 (3단계 비디오 렌더러 완료 시 본격 가동)
  try {
    const mockVideoPath = path.join(outputDir, 'shorts_video.mp4');
    const youtubeTitle = `[2026 오늘의 ${contentData.topic}] #Shorts`;
    const youtubeDesc = `매일 업데이트되는 9대 주제별 자동 사주 봇입니다.`;
    await youtubePublisher.uploadToYouTube(mockVideoPath, youtubeTitle, youtubeDesc);
  } catch (err) {
    console.error(`✗ 유튜브 발행 중 예외:`, err.message);
  }

  console.log(`======================================================`);
  console.log(`[봇 작동 완료] ${dateStr} 모든 사주 콘텐츠 생성 및 자동 배포가 끝났습니다.`);
  console.log(`======================================================\n`);
}

// 1. 컨테이너 기동 즉시 테스트용 1회 실행
runFortuneBot();

// 2. 매일 오전 07:00에 실행되도록 크론 스케줄 등록
cron.schedule('0 0 7 * * *', () => {
  console.log('[스케줄러 트리거] 오전 7시 정각입니다. 사주 순환 봇 자동 운행을 시작합니다.');
  runFortuneBot();
});

console.log('[시스템 대기] 사주 운세 자동 봇이 백그라운드 대기 모드로 기동되었습니다. (스케줄: 매일 오전 7시)');

// 3. 로컬 대시보드 웹 서버 실행
const dashboardServer = require('./server');
dashboardServer.startServer();


