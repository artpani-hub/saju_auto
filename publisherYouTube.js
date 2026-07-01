const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

/**
 * 유튜브 쇼츠(Shorts)로 동영상을 업로드합니다.
 * @param {string} videoPath 로컬 동영상 파일 경로 (예: "output/2026-07-01/zodiac_video.mp4")
 * @param {string} title 비디오 제목 (유튜브 규격상 #Shorts 해시태그 필수 포함)
 * @param {string} description 비디오 상세 설명
 * @returns {Promise<boolean>} 성공 여부
 */
async function uploadToYouTube(videoPath, title, description) {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  // 자격증명이 제대로 세팅되지 않았을 경우, 목(Mock) 테스트 모드로 우회 동작
  if (!clientId || clientId.includes('your_youtube') || !refreshToken || refreshToken.includes('your_youtube')) {
    console.log(`\n[YouTube 시뮬레이터] API 토큰이 설정되지 않아 시뮬레이션 비디오 업로드로 대체합니다.`);
    console.log(`  - 동영상 경로: ${videoPath}`);
    console.log(`  - 제목: ${title}`);
    console.log(`  - 설명: ${description}`);
    console.log(`[YouTube 시뮬레이터] 테스트 업로드 성공!`);
    return true;
  }

  try {
    console.log(`[YouTube API] 1단계: Refresh Token을 사용하여 Access Token 갱신 요청 중...`);
    
    // 1. OAuth2 Access Token 갱신 요청
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    const accessToken = tokenRes.data.access_token;
    console.log(`[YouTube API] Access Token 갱신 완료.`);

    // 2. 비디오 데이터 및 메타데이터 업로드 요청 (Resumable Upload 메커니즘 간소화)
    console.log(`[YouTube API] 2단계: 유튜브 동영상 업로드 진행 중...`);
    
    if (!fs.existsSync(videoPath)) {
      throw new Error(`동영상 파일을 찾을 수 없습니다: ${videoPath}`);
    }

    const videoStream = fs.createReadStream(videoPath);
    
    // 유튜브 API 규격에 맞는 멀티파트(Multipart) 헤더 생성 준비
    const metadata = {
      snippet: {
        title: title,
        description: description,
        categoryId: '22', // People & Blogs
        tags: ['사주', '운세', 'Shorts', '쇼츠']
      },
      status: {
        privacyStatus: 'public', // 공개 설정 (public/unlisted/private)
        selfDeclaredMadeForKids: false
      }
    };

    // Resumable upload 초기화 요청
    const initRes = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      metadata,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': fs.statSync(videoPath).size,
          'X-Upload-Content-Type': 'video/mp4'
        }
      }
    );

    const uploadUrl = initRes.headers.location;
    console.log(`[YouTube API] 세션 생성 완료. 바이너리 전송 중...`);

    // 생성된 세션 URL로 바이너리 스트림 전송
    const uploadRes = await axios.put(uploadUrl, videoStream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fs.statSync(videoPath).size
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    console.log(`[YouTube API] ✓ 유튜브 쇼츠 업로드 완료! (Video ID: ${uploadRes.data.id})`);
    return true;
  } catch (error) {
    console.error(`[YouTube API] ✗ 업로드 실패:`, error.response ? error.response.data : error.message);
    return false;
  }
}

module.exports = {
  uploadToYouTube
};
