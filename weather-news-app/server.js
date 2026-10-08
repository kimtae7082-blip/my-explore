require('dotenv').config();

const express = require('express');
const path = require('path');

const weatherRoutes = require('./routes/weatherRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 데이터 처리
app.use(express.json());

// public 폴더의 HTML, CSS, JS 제공
app.use(express.static(path.join(__dirname, 'public')));

// API 라우터
app.use('/api', weatherRoutes);

// 메인 페이지
app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'public', 'index.html')
    );
});

// 서버 실행
app.listen(PORT, () => {
    console.log('=================================');
    console.log('전국 날씨 뉴스 앱 서버 실행');
    console.log(`접속 URL: http://localhost:${PORT}`);
    console.log(`DB 상태 확인: http://localhost:${PORT}/api/health`);
    console.log('=================================');
});