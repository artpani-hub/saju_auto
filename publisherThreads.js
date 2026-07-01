const axios = require('axios');
require('dotenv').config();

const API_VERSION = 'v19.0';

/**
 * 스레드 채널에 포스팅을 진행합니다.
 * @param {string} text 본문 메시지
 * @param {string} imageUrl (선택) 첨부할 이미지 URL
 * @returns {Promise<boolean>} 성공 여부
 */
async function uploadToThreads(text, imageUrl = '') {
  const token = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;

  // 자격증명 미등록 시, 목(Mock) 테스트 모드로 우회 동작
  if (!token || token.includes('your_threads') || !userId || userId.includes('your_threads')) {
    console.log(`\n[Threads 시뮬레이터] API 토큰이 설정되지 않아 시뮬레이션 게시물로 대체합니다.`);
    console.log(`  - 포스팅 텍스트: ${text.substring(0, 50)}...`);
    if (imageUrl) {
      console.log(`  - 첨부 이미지: ${imageUrl}`);
    }
    console.log(`[Threads 시뮬레이터] 테스트 배포 성공!`);
    return true;
  }

  try {
    console.log(`[Threads API] 1단계: 스레드 미디어 컨테이너 생성 요청 중...`);
    
    const requestData = {
      media_type: imageUrl ? 'IMAGE' : 'TEXT',
      text: text,
      access_token: token
    };

    if (imageUrl) {
      requestData.image_url = imageUrl;
    }

    // 1. 스레드 미디어 생성 API 호출
    const containerRes = await axios.post(`https://graph.threads.com/${API_VERSION}/${userId}/threads`, requestData);
    const creationId = containerRes.data.id;
    console.log(`[Threads API] 컨테이너 생성 완료 (ID: ${creationId})`);

    // 2. 스레드 미디어 발행 API 호출
    console.log(`[Threads API] 2단계: 스레드 게시물 최종 발행(Publish) 요청 중...`);
    const publishRes = await axios.post(`https://graph.threads.com/${API_VERSION}/${userId}/threads_publish`, {
      creation_id: creationId,
      access_token: token
    });

    const postId = publishRes.data.id;
    console.log(`[Threads API] ✓ 스레드 포스팅 발행 완료! (Post ID: ${postId})`);
    return true;
  } catch (error) {
    console.error(`[Threads API] ✗ 업로드 실패:`, error.response ? error.response.data : error.message);
    return false;
  }
}

module.exports = {
  uploadToThreads
};
