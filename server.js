const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const OUTPUT_DIR = path.join(__dirname, 'output');
const PUBLIC_DIR = path.join(__dirname, 'public');

// JSON 파싱 및 정적 파일 경로 바인딩
app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use('/output', express.static(OUTPUT_DIR));

// 유튜브 인기 사주 벤치마킹 데이터 (2개 탭 분리 구성: 26년 최다 조회수(top) vs 최근 인기 급상승(rising))
const BENCHMARK_SHORTS = [
  // 1. 26년 최다 조회수 (top)
  { type: "top", topic: "사주팔자", title: "사주에 '이 글자' 있으면 평생 돈 고생 끝납니다", views: "142만 회", url: "https://www.youtube.com/results?search_query=사주에+이글자+있으면+평생+돈고생" },
  { type: "top", topic: "인연운", title: "2026년 하반기 무조건 결혼하게 될 인연의 얼굴 특징", views: "215만 회", url: "https://www.youtube.com/results?search_query=무조건+결혼하게+될+인연+사주" },
  { type: "top", topic: "가족/자녀운", title: "이거 모르면 자식의 천재적 성공운 평생 가로막습니다", views: "110만 회", url: "https://www.youtube.com/results?search_query=자식의+성공운+사주" },
  { type: "top", topic: "인간관계", title: "당장 인연을 끊어야 할 내 사주 속 최악의 악인", views: "168만 회", url: "https://www.youtube.com/results?search_query=인연을+끊어야할+내사주속+악인" },
  { type: "top", topic: "금전/재물운", title: "말년에 빌딩 사고 대박 날 부자 사주 특징 3가지", views: "340만 회", url: "https://www.youtube.com/results?search_query=말년에+부자되는+사주+특징" },
  { type: "top", topic: "금전/재물운", title: "지갑에 '이것' 넣고 다니면 돈벼락 맞습니다", views: "287만 회", url: "https://www.youtube.com/results?search_query=지갑에+이것+넣고다니면+돈벼락" },
  { type: "top", topic: "직업/사업/이직운", title: "사주에 '인목(寅木)'이 있는 사람들의 공통점", views: "125만 회", url: "https://www.youtube.com/results?search_query=사주에+인목이+있는+사람" },
  { type: "top", topic: "오늘의 운세", title: "오늘 무조건 로또 사야 할 대박 징조 3가지", views: "204만 회", url: "https://www.youtube.com/results?search_query=오늘+무조건+로또사야할+징조" },
  { type: "top", topic: "띠별 운세", title: "내일 아침 눈 뜨자마자 돈벼락 맞을 3가지 대박 띠", views: "310만 회", url: "https://www.youtube.com/results?search_query=내일아침+돈벼락맞을+대박띠" },

  // 2. 최근 인기 급상승 (rising) - 최근 반응이 뜨거운 키워드 저격형 문구
  { type: "rising", topic: "사주팔자", title: "사주에 흙(土) 기운이 많은 사람들의 소름 돋는 특징", views: "89만 회", url: "https://www.youtube.com/results?search_query=사주에+흙+기운+많은+사람" },
  { type: "rising", topic: "인연운", title: "나와 찰떡인 연인은 사주 '이 일간'을 가졌습니다", views: "74만 회", url: "https://www.youtube.com/results?search_query=나와+찰떡인+연인+사주" },
  { type: "rising", topic: "가족/자녀운", title: "부모 자식간 사주 상극 해결하고 대박 나는 비방", views: "52만 회", url: "https://www.youtube.com/results?search_query=부모자식간+사주+상극" },
  { type: "rising", topic: "인간관계", title: "사주에 천을귀인(天乙貴인) 들어올 때 생기는 징조", views: "95만 회", url: "https://www.youtube.com/results?search_query=사주에+천을귀인+들어올때" },
  { type: "rising", topic: "금전/재물운", title: "태어난 날짜 끝자리에 '이 숫자' 있으면 자손대대 부자됩니다", views: "112만 회", url: "https://www.youtube.com/results?search_query=태어난날짜+끝자리+숫자+사주" },
  { type: "rising", topic: "직업/사업/이직운", title: "회사 퇴사하고 사업해서 대박 날 사주 구분법", views: "82만 회", url: "https://www.youtube.com/results?search_query=퇴사하고+사업해서+대박날+사주" },
  { type: "rising", topic: "건강운", title: "사주에 불(火) 기운 부족하면 찾아오는 무서운 현상", views: "98만 회", url: "https://www.youtube.com/results?search_query=사주에+불기운+부족" },
  { type: "rising", topic: "오늘의 운세", title: "당장 24시간 안에 귀인이 전할 놀라운 행운 소식", views: "148만 회", url: "https://www.youtube.com/results?search_query=24시간안에+귀인이+전할+소식" },
  { type: "rising", topic: "띠별 운세", title: "이번 달부터 묶였던 금전운이 강물처럼 터지는 4가지 띠", views: "196만 회", url: "https://www.youtube.com/results?search_query=이번달부터+금전운이+터지는+띠" }
];

/**
 * 1. 생성된 운세 날짜 목록 조회 API
 */
app.get('/api/dates', (req, res) => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return res.json([]);
  }
  
  try {
    const dates = fs.readdirSync(OUTPUT_DIR)
      .filter(file => {
        const stat = fs.statSync(path.join(OUTPUT_DIR, file));
        return stat.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(file);
      })
      .sort((a, b) => b.localeCompare(a));
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: '날짜 디렉토리 로드 중 에러 발생' });
  }
});

/**
 * 2. 특정 날짜에 생성된 사주 정보 및 카드뉴스 이미지 정보 제공 API
 */
app.get('/api/images/:date', (req, res) => {
  const dateStr = req.params.date;
  const targetDir = path.join(OUTPUT_DIR, dateStr);

  if (!fs.existsSync(targetDir)) {
    return res.status(404).json({ error: '해당 날짜의 데이터가 없습니다.' });
  }

  try {
    const files = fs.readdirSync(targetDir);
    const metaPath = path.join(targetDir, 'metadata.json');
    
    let metadata = {
      topic: "사주 분석",
      thumbnailText: "",
      contentText: ""
    };

    if (fs.existsSync(metaPath)) {
      metadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    }

    const coverFile = files.find(f => f.includes('_cover.png'));
    const contentFile = files.find(f => f.includes('_content.png'));

    res.json({
      date: dateStr,
      topic: metadata.topic,
      thumbnailText: metadata.thumbnailText,
      contentText: metadata.contentText,
      coverUrl: coverFile ? `/output/${dateStr}/${coverFile}` : null,
      contentUrl: contentFile ? `/output/${dateStr}/${contentFile}` : null,
      videoUrl: files.find(f => f.endsWith('.mp4')) ? `/output/${dateStr}/shorts_video.mp4` : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '사주 정보 로드 중 에러 발생' });
  }
});

/**
 * 3. 유튜브 쇼츠 벤치마킹 데이터 제공 API
 * 쿼리 파라미터 type (?type=top 혹은 ?type=rising)을 받아 필터 제공
 */
app.get('/api/benchmark-shorts', (req, res) => {
  const typeFilter = req.query.type;
  if (typeFilter) {
    const filtered = BENCHMARK_SHORTS.filter(item => item.type === typeFilter);
    return res.json(filtered);
  }
  res.json(BENCHMARK_SHORTS);
});

/**
 * 4. 수동 콘텐츠 즉시 생성 API
 */
app.post('/api/generate-manual', async (req, res) => {
  const { topic, date, customTitle } = req.body;

  if (!topic) {
    return res.status(400).json({ error: '주제(topic) 정보는 필수입니다.' });
  }

  const targetDate = date ? new Date(date) : new Date();
  
  try {
    console.log(`[Express API] 수동 즉시 생성 트리거 - 주제: ${topic} | 커스텀 썸네일 카피 지정: ${customTitle || '없음'}`);
    
    const botEngine = require('./index');
    const resultMetadata = await botEngine.generateAndPublishByTopic(targetDate, topic);
    
    if (customTitle) {
      const outputDir = path.join(OUTPUT_DIR, date ? date : new Date().toISOString().split('T')[0]);
      
      const imageGenerator = require('./imageGenerator');
      await imageGenerator.generateSajuCards(
        topic,
        customTitle,
        resultMetadata.contentText,
        date ? date : new Date().toISOString().split('T')[0],
        outputDir
      );

      const metadata = {
        date: date ? date : new Date().toISOString().split('T')[0],
        topic: topic,
        thumbnailText: customTitle,
        contentText: resultMetadata.contentText
      };
      fs.writeFileSync(path.join(outputDir, 'metadata.json'), JSON.stringify(metadata, null, 2), 'utf-8');
      resultMetadata.thumbnailText = customTitle;
    }

    res.json({
      success: true,
      message: `주제 [${topic}] 카드뉴스 생성이 성공적으로 트리거되었습니다.`,
      data: resultMetadata
    });
  } catch (error) {
    console.error(`[Express API] 수동 생성 실패:`, error.message);
    res.status(500).json({ error: `수동 콘텐츠 빌드 중 장애 발생: ${error.message}` });
  }
});

// 서버 실행 함수
function startServer() {
  app.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`[대시보드 실행] 로컬 대시보드 서버가 정상적으로 기동되었습니다.`);
    console.log(`- 접속 주소: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
  });
}

module.exports = {
  startServer
};
