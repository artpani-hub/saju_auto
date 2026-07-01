# 1. Base 이미지 지정 (Node.js 20 LTS 버전의 경량 이미지)
FROM node:20-slim

# 2. 필수 시스템 패키지 및 한글 폰트 설치
# (Canvas 렌더링에 필요한 폰트 환경과 미디어 합성에 필요한 ffmpeg 설치)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    fonts-nanum \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 3. 작업 디렉터리 설정
WORKDIR /usr/src/app

# 4. 패키지 파일 복사 및 설치
COPY package*.json ./
RUN npm ci --only=production

# 5. 소스 코드 복사
COPY . .

# 6. 실행 명령 (1회성 카드뉴스 생성 또는 크론 스케줄러 실행)
CMD [ "node", "index.js" ]
