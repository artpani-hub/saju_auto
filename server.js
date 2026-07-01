const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const OUTPUT_DIR = path.join(__dirname, 'output');
const PUBLIC_DIR = path.join(__dirname, 'public');

// JSON 파싱 및 정적 파일 경로 지정
app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use('/output', express.static(OUTPUT_DIR));

/**
 * 1. 생성된 운세 날짜 목록 조회 API
 * output 디렉토리 내 폴더명(날짜형식) 목록 반환
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
      .sort((a, b) => b.localeCompare(a)); // 최신 날짜순 정렬
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: '날짜 디렉토리 로드 중 에러 발생' });
  }
});

/**
 * 2. 특정 날짜에 생성된 사주 정보 및 카드뉴스 이미지 정보 제공 API
 * 각 일자별 폴더 내 metadata.json 파일을 읽어서 반환
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
