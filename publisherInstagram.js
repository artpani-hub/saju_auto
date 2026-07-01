const axios = require('axios');
require('dotenv').config();

// Meta Graph API 버전 지정
const API_VERSION = 'v19.0';

/**
 * 인스타그램 피드에 이미지 포스팅을 진행합니다.
 * (Meta API 특징: 로컬 파일 직접 전송이 아닌, 외부 접근 가능한 이미지 URL이 필요합니다.)
 * @param {string} imageUrl 외부에서 접근 가능한 이미지 URL (또는 테스트 더미 URL)
 * @param {string} caption 본문 문구 (해시태그 등 포함)
 * @returns {Promise<boolean>} 성공 여부
 */
async function uploadToInstagram(imageUrl, caption) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  // 자격증명이 등록되지 않았을 경우, 목(Mock) 테스트 모드로 우회 동작
  if (!token || token.includes('your_instagram') || !accountId || accountId.includes('your_instagram')) {
    console.log(`\n[Instagram 시뮬레이터] API 토큰이 설정되지 않아 시뮬레이션 게시물로 대체합니다.`);
    console.log(`  - 대상 이미지: ${imageUrl}`);
    console.log(`  - 캡션 문구: ${caption.substring(0, 50)}...`);
    console.log(`[Instagram 시뮬레이터] 테스트 배포 성공!`);
    return true;
  }

  try {
    console.log(`[Instagram API] 1단계: 미디어 컨테이너 생성 요청 중...`);
    
    // 1. 컨테이너 생성 API 호출
    const containerRes = await axios.post(`https://graph.facebook.com/${API_VERSION}/${accountId}/media`, {
      image_url: imageUrl,
      caption: caption,
      access_token: token
    });

    const creationId = containerRes.data.id;
    console.log(`[Instagram API] 컨테이너 생성 완료 (ID: ${creationId})`);

    // 2. 미디어 발행 API 호출
    console.log(`[Instagram API] 2단계: 피드 최종 발행(Publish) 요청 중...`);
    const publishRes = await axios.post(`https://graph.facebook.com/${API_VERSION}/${accountId}/media_publish`, {
      creation_id: creationId,
      access_token: token
    });

    const postId = publishRes.data.id;
    console.log(`[Instagram API] ✓ 피드 발행 완료! (Post ID: ${postId})`);
    return true;
  } catch (error) {
    console.error(`[Instagram API] ✗ 업로드 실패:`, error.response ? error.response.data : error.message);
    return false;
  }
}

module.exports = {
  uploadToInstagram
};
