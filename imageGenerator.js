const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

// 9대 주제별 맞춤 그라데이션 테마 셋팅
const THEMES = {
  "사주팔자": { bgStart: "#1a1a24", bgEnd: "#2c2538", accent: "#d4af37", text: "#ffffff" }, // 신비로운 다크 바이올렛
  "인연운": { bgStart: "#281b22", bgEnd: "#402030", accent: "#ff6b8b", text: "#ffffff" },   // 로맨틱 피치 핑크
  "가족/자녀운": { bgStart: "#12251a", bgEnd: "#1f3c2a", accent: "#2ecc71", text: "#ffffff" }, // 편안한 그린
  "인간관계": { bgStart: "#1a2535", bgEnd: "#101825", accent: "#3498db", text: "#ffffff" }, // 차분한 스카이블루
  "금전/재물운": { bgStart: "#2b2015", bgEnd: "#45321b", accent: "#f39c12", text: "#ffffff" }, // 클래식 딥골드
  "직업/사업/이직운": { bgStart: "#152528", bgEnd: "#0e1a1b", accent: "#1abc9c", text: "#ffffff" }, // 지적인 틸(Teal)
  "건강운": { bgStart: "#251212", bgEnd: "#3a1d1d", accent: "#e74c3c", text: "#ffffff" },   // 강렬한 딥레드
  "오늘의 운세": { bgStart: "#1a1a24", bgEnd: "#2c2538", accent: "#d4af37", text: "#ffffff" }, // 신비로운 골드
  "띠별 운세": { bgStart: "#23232f", bgEnd: "#151522", accent: "#9b59b6", text: "#ffffff" }  // 화려한 아메시스트 퍼플
};

/**
 * 텍스트가 캔버스 폭을 넘어갈 때 자동으로 줄바꿈을 해주는 함수
 */
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split('');
  let line = '';
  const lines = [];

  for (let n = 0; n < words.length; n++) {
    let testLine = line + words[n];
    let metrics = ctx.measureText(testLine);
    let testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n];
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  return lines;
}

/**
 * 주제별 맞춤 카드뉴스 이미지 2장(썸네일 표지 + 상세 내용 페이지)을 렌더링하여 저장합니다.
 * @param {string} topic 사주 주제 (예: "인연운")
 * @param {string} thumbnailText 썸네일 제목 문구
 * @param {string} contentText 운세 상세 본문
 * @param {string} dateStr 날짜
 * @param {string} outputDir 이미지가 저장될 디렉토리 경로
 * @returns {Promise<{coverPath: string, contentPath: string}>} 저장된 이미지 경로 객체
 */
async function generateSajuCards(topic, thumbnailText, contentText, dateStr, outputDir) {
  const width = 1080;
  const height = 1080;
  const theme = THEMES[topic] || THEMES["오늘의 운세"];

  fs.mkdirSync(outputDir, { recursive: true });

  // ----------------------------------------------------
  // [1페이지: 썸네일 표지 카드 생성]
  // ----------------------------------------------------
  const canvasCover = createCanvas(width, height);
  const ctxCover = canvasCover.getContext('2d');

  // 배경 그라데이션
  const gradCover = ctxCover.createLinearGradient(0, 0, width, height);
  gradCover.addColorStop(0, theme.bgStart);
  gradCover.addColorStop(1, theme.bgEnd);
  ctxCover.fillStyle = gradCover;
  ctxCover.fillRect(0, 0, width, height);

  // 이중 골드/액센트 보더 라인
  ctxCover.strokeStyle = `rgba(${hexToRgb(theme.accent)}, 0.25)`;
  ctxCover.lineWidth = 4;
  ctxCover.strokeRect(40, 40, width - 80, height - 80);
  
  ctxCover.strokeStyle = `rgba(${hexToRgb(theme.accent)}, 0.45)`;
  ctxCover.lineWidth = 1;
  ctxCover.strokeRect(55, 55, width - 110, height - 110);

  // 상단 주제 카테고리 태그 박스
  ctxCover.fillStyle = `rgba(${hexToRgb(theme.accent)}, 0.15)`;
  ctxCover.strokeStyle = theme.accent;
  ctxCover.lineWidth = 1;
  roundRect(ctxCover, width / 2 - 110, 160, 220, 50, 25, true, true);
  
  ctxCover.fillStyle = theme.accent;
  ctxCover.font = 'bold 24px sans-serif';
  ctxCover.textAlign = 'center';
  ctxCover.fillText(topic, width / 2, 193);

  // 중앙 썸네일 카피 제목 드로잉 (어그로 텍스트 줄바꿈 적용)
  ctxCover.fillStyle = '#ffffff';
  ctxCover.font = 'bold 64px sans-serif';
  const coverLines = wrapText(ctxCover, thumbnailText, width / 2, 380, 800, 90);
  
  const coverStartY = 450 - ((coverLines.length - 1) * 45);
  coverLines.forEach((line, index) => {
    ctxCover.fillText(line, width / 2, coverStartY + (index * 95));
  });

  // 데코 문양
  ctxCover.fillStyle = theme.accent;
  ctxCover.font = '36px sans-serif';
  ctxCover.fillText('✦ ─────────── ✦', width / 2, coverStartY + (coverLines.length * 95) + 30);

  // 하단 워터마크
  ctxCover.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctxCover.font = '300 28px sans-serif';
  ctxCover.fillText('@saju_auto • 사주 분석', width / 2, 920);

  const coverPath = path.join(outputDir, `${dateStr}_01_cover.png`);
  fs.writeFileSync(coverPath, canvasCover.toBuffer('image/png'));

  // ----------------------------------------------------
  // [2페이지: 상세 본문 카드 생성]
  // ----------------------------------------------------
  const canvasContent = createCanvas(width, height);
  const ctxContent = canvasContent.getContext('2d');

  // 배경 채우기
  ctxContent.fillStyle = gradCover;
  ctxContent.fillRect(0, 0, width, height);
  ctxContent.strokeRect(40, 40, width - 80, height - 80);
  ctxContent.strokeRect(55, 55, width - 110, height - 110);

  // 상단 헤더
  ctxContent.fillStyle = theme.accent;
  ctxContent.font = 'bold 36px sans-serif';
  ctxContent.fillText(topic, width / 2, 180);

  ctxContent.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctxContent.font = '300 24px sans-serif';
  ctxContent.fillText('──────── 기운의 해석 ────────', width / 2, 230);

  // 본문 텍스트 자동 줄바꿈 드로잉
  ctxContent.fillStyle = theme.text;
  ctxContent.font = 'normal 40px sans-serif';
  const contentLines = wrapText(ctxContent, contentText, width / 2, 330, 820, 68);
  
  const contentStartY = 330;
  contentLines.forEach((line, index) => {
    ctxContent.fillText(line, width / 2, contentStartY + (index * 72));
  });

  // 하단 안내
  ctxContent.fillStyle = theme.accent;
  ctxContent.font = 'bold 30px sans-serif';
  ctxContent.fillText('✦ 복채는 좋아요와 구독으로 ✦', width / 2, 900);

  const contentPath = path.join(outputDir, `${dateStr}_02_content.png`);
  fs.writeFileSync(contentPath, canvasContent.toBuffer('image/png'));

  return { coverPath, contentPath };
}

// 둥근 사각형 그리기 헬퍼
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height - radius);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

// Hex 색상값을 RGB로 파싱해주는 헬퍼
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "212, 175, 55";
}

module.exports = {
  generateSajuCards
};
