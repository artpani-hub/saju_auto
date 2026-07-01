const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const sajuRotator = require('./sajuRotator');
const imageGenerator = require('./imageGenerator');

// SNS 발행 모듈 로드
const instagramPublisher = require('./publisherInstagram');
const threadsPublisher = require('./publisherThreads');
const youtubePublisher = require('./publisherYouTube');

// 9대 주제 로테이션 생성 및 SNS 배포 공용 함수 (수동 생성 시에도 호출 가능하도록 매개변수화)
async function generateAndPublishByTopic(targetDate = new Date(), customTopicName = null) {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;

  console.log(`\n======================================================`);
  console.log(`[엔진 가동] 기준 날짜: ${dateStr} | 수동 지정 주제: ${customTopicName || '없음(자동 로테이션)'}`);
  console.log(`======================================================`);

  // 1. 오늘의 사주 대주제 및 텍스트 생성 (Gemini API or 로컬 DB)
  let contentData;
  try {
    if (customTopicName) {
      // 수동 생성 시: 지정된 주제를 강제 설정하고 Gemini API 호출 시뮬레이션
      const apiKey = process.env.GEMINI_API_KEY;
      const topicDesc = "사용자 지정 수동 즉시 생성 콘텐츠";
      
      if (!apiKey || apiKey.includes('your_google_gemini')) {
        // 백업 더미 라이브러리 참조
        const rotatorModule = require('./sajuRotator');
        // sajuRotator 내부에 정의된 BACKUP_DATABASE를 가져와 셋팅하기 위해 에이징 호출
        const mockData = {
          "사주팔자": "내 사주 오행 분석 결과입니다. 수동 즉시 생성 모듈 작동 완료.",
          "인연운": "당신에게 다가올 연인의 특징입니다. 수동 즉시 생성 모듈 작동 완료.",
          "가족/자녀운": "가족 궁합 및 자녀의 성공 기운 분석입니다. 수동 즉시 생성 모듈 작동 완료.",
          "인간관계": "주변 사람과의 귀인 악인 구별법 분석입니다. 수동 즉시 생성 모듈 작동 완료.",
          "금전/재물운": "재물 그릇 크기와 금전운 흐름 분석입니다. 수동 즉시 생성 모듈 작동 완료.",
          "직업/사업/이직운": "천직 추천 및 사업 이직 타이밍 분석입니다. 수동 즉시 생성 모듈 작동 완료.",
          "건강운": "건강을 보살펴주는 오행 한방 기운 처방 분석입니다. 수동 즉시 생성 모듈 작동 완료.",
          "오늘의 운세": "오늘 하루의 기운과 행운 포인트 분석입니다. 수동 즉시 생성 모듈 작동 완료.",
          "띠별 운세": "12지신 띠별 맞춤 상세 운세 분석입니다. 수동 즉시 생성 모듈 작동 완료."
        };
        contentData = {
          topic: customTopicName,
          thumbnailText: `수동 즉시 생성: [${customTopicName}]`,
          contentText: mockData[customTopicName] || "수동으로 직접 요청하신 주제에 맞춰 실시간 생성된 행운의 운세 조언입니다. 대운의 시기를 잡으세요!"
        };
      } else {
        // 구글 제미나이 AI API 실시간 호출
        const { GoogleGenAI } = require('@google/generative-ai');
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
          너는 전문 사주 학자이자 SNS 마케팅 작가야.
          오늘의 커스텀 사주 대주제는 [${customTopicName}] 이고 상세 방향은 [수동 즉시 생성 및 분석] 이야.
          
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
        const cleanJson = response.text.trim().replace(/```json|```/g, '').trim();
        const result = JSON.parse(cleanJson);
        contentData = {
          topic: customTopicName,
          thumbnailText: result.thumbnailText,
          contentText: result.contentText
        };
      }
    } else {
      // 자동 크론 스케줄링 시: 날짜 기반 자동 로테이션
      contentData = await sajuRotator.generateTodaySajuContent(targetDate);
    }
  } catch (error) {
    console.error(`✗ 콘텐츠 생성 실패:`, error.message);
    throw error;
  }

  const outputDir = path.join(__dirname, 'output', dateStr);
  fs.mkdirSync(outputDir, { recursive: true });

  // 2. 카드뉴스 이미지 세트(표지 + 본문) 생성
  console.log(`[엔진] 2단계: 카드뉴스 드로잉 작업 진행 중...`);
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
    throw error;
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
  const mockPublicUrlCover = `https://raw.githubusercontent.com/artpani-hub/saju_auto/main/samples/${dateStr}_01_cover.png`;
  const captionText = `[${dateStr} 오늘의 ${contentData.topic} 운세]\n\n${contentData.contentText}\n\n#사주 #운세 #오늘의운세 #saju_auto`;

  // 4-1. 인스타그램 배포
  try {
    await instagramPublisher.uploadToInstagram(mockPublicUrlCover, captionText);
  } catch (err) {
    console.error(`✗ 인스타그램 발행 실패:`, err.message);
  }

  // 4-2. 스레드 배포
  try {
    const threadsText = `[${dateStr} 오늘의 ${contentData.topic} 운세]\n\n${contentData.contentText}\n\n#사주 #운세 #오늘의운세`;
    await threadsPublisher.uploadToThreads(threadsText, mockPublicUrlCover);
  } catch (err) {
    console.error(`✗ 스레드 발행 실패:`, err.message);
  }

  // 4-3. 유튜브 쇼츠 시뮬레이터 (3단계 비디오 렌더러 완료 시 본격 가동)
  try {
    const mockVideoPath = path.join(outputDir, 'shorts_video.mp4');
    const youtubeTitle = `[2026 오늘의 ${contentData.topic}] #Shorts`;
    const youtubeDesc = `매일 업데이트되는 9대 주제별 자동 사주 봇입니다.`;
    await youtubePublisher.uploadToYouTube(mockVideoPath, youtubeTitle, youtubeDesc);
  } catch (err) {
    console.error(`✗ 유튜브 발행 실패:`, err.message);
  }

  console.log(`======================================================`);
  console.log(`[엔진 완료] 모든 콘텐츠 생성 및 배포 파이프라인 수행 완료.`);
  console.log(`======================================================\n`);
  
  return metadata;
}

// 1. 컨테이너 기동 즉시 테스트용 1회 실행
generateAndPublishByTopic();

// 2. 매일 오전 07:00에 실행되도록 크론 스케줄 등록
cron.schedule('0 0 7 * * *', () => {
  console.log('[스케줄러 트리거] 오전 7시 정각입니다. 사주 순환 봇 자동 운행을 시작합니다.');
  generateAndPublishByTopic();
});

console.log('[시스템 대기] 사주 운세 자동 봇이 백그라운드 대기 모드로 기동되었습니다. (스케줄: 매일 오전 7시)');

// 3. 로컬 대시보드 웹 서버 실행
const dashboardServer = require('./server');
dashboardServer.startServer();

module.exports = {
  generateAndPublishByTopic
};


