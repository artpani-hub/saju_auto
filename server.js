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
 * 2. 특정 날짜에 생성된 카드뉴스 이미지 파일 정보 제공 API
 */
app.get('/api/images/:date', (req, res) => {
  const dateStr = req.params.date;
  const targetDir = path.join(OUTPUT_DIR, dateStr);

  if (!fs.existsSync(targetDir)) {
    return res.status(404).json({ error: '해당 날짜의 데이터가 없습니다.' });
  }

  try {
    const files = fs.readdirSync(targetDir)
      .filter(file => file.endsWith('.png'))
      .map(file => {
        // 파일명 분석 (예: 2026-07-01_쥐띠.png -> "쥐띠" 추출)
        const zodiac = file.replace(`${dateStr}_`, '').replace('.png', '');
        return {
          zodiac,
          fileName: file,
          url: `/output/${dateStr}/${file}`
        };
      });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: '이미지 목록 로드 중 에러 발생' });
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
