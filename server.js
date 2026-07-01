const express = require('express');
const fs = require('fs');
const path = require('path');
const youtubeAnalyzer = require('./youtubeAnalyzer'); // 실시간 유튜브 분석 모듈 주입

const app = express();
const PORT = process.env.PORT || 3000;

const OUTPUT_DIR = path.join(__dirname, 'output');
const PUBLIC_DIR = path.join(__dirname, 'public');

// JSON 파싱 및 정적 파일 경로 바인딩
app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use('/output', express.static(OUTPUT_DIR));

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
 * 실시간 수집 분석기(youtubeAnalyzer)를 통해 최다 조회수(top) 혹은 인기 급상승(rising) 목록을 생성 및 반환
 */
app.get('/api/benchmark-shorts', async (req, res) => {
  const typeFilter = req.query.type || 'top';
  try {
    const analyzedShorts = await youtubeAnalyzer.fetchAndAnalyzeShorts(typeFilter);
    res.json(analyzedShorts);
  } catch (error) {
    console.error(`[Express API] 유튜브 분석 목록 조회 실패:`, error.message);
    res.status(500).json({ error: '실시간 유튜브 쇼츠 분석 중 에러 발생' });
  }
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
