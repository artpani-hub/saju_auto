const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

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
    
    // 띄어쓰기가 아닌 한국어 글자 단위의 처리를 위해 글자마다 측정
    if (testWidth > maxWidth && n > 0) {
      lines.push(line);
      line = words[n];
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  // 세로 정렬 시 전체 높이를 고려할 수 있게 lines 배열 반환
  return lines;
}

/**
 * 띠별 운세 카드뉴스 이미지를 렌더링하여 저장합니다.
 * @param {string} zodiac 띠 이름 (예: "호랑이띠")
 * @param {string} fortune 운세 텍스트
 * @param {string} dateStr 날짜 표시 텍스트 (예: "2026-07-01")
 * @param {string} outputPath 이미지가 저장될 파일 경로
 */
async function generateZodiacCard(zodiac, fortune, dateStr, outputPath) {
  const width = 1080;
  const height = 1080;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 1. 고급스러운 그라데이션 배경 그리기
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1a1a24'); // 깊은 다크 네이비/차콜
  gradient.addColorStop(1, '#2c2538'); // 은은한 다크 바이올렛
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 2. 테두리 가이드 선 (고급스러운 카드 느낌)
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)'; // 은은한 골드 투명도 라인
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  // 내부 얇은 보더 라인 추가
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, width - 110, height - 110);

  // 3. 날짜 텍스트 렌더링 (상단 중앙)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '300 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dateStr, width / 2, 150);

  // 4. 메인 제목 렌더링 (띠 이름)
  ctx.fillStyle = '#d4af37'; // 메탈릭 골드 컬러톤
  ctx.font = 'bold 72px sans-serif';
  ctx.fillText(zodiac, width / 2, 270);

  // 데코레이션 문양 (디자인 포인트)
  ctx.fillStyle = 'rgba(212, 175, 55, 0.6)';
  ctx.font = '28px sans-serif';
  ctx.fillText('✦ ─────────── ✦', width / 2, 350);

  // 5. 운세 본문 텍스트 자동 줄바꿈 및 렌더링 (중앙 정렬)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'normal 42px sans-serif';
  
  const textX = width / 2;
  const startY = 460;
  const maxWidth = 750;
  const lineHeight = 65;

  const lines = wrapText(ctx, fortune, textX, startY, maxWidth, lineHeight);

  // 줄바꿈된 텍스트들을 중앙 정렬 상태로 순차 렌더링
  lines.forEach((line, index) => {
    ctx.fillText(line, textX, startY + (index * lineHeight));
  });

  // 6. 하단 워터마크/채널 홍보 (아웃트로 유도)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = '300 28px sans-serif';
  ctx.fillText('@saju_auto • 일일 운세', width / 2, 920);

  // 이미지 파일로 디스크에 저장
  const buffer = canvas.toBuffer('image/png');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
}

module.exports = {
  generateZodiacCard
};
