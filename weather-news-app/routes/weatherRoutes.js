const express = require('express');
const router = express.Router();

const dbPool = require('../db/connection');

const weatherService = require('../services/weatherService');


/*
=========================================================
DB 연결 확인
GET /api/health
=========================================================
*/

router.get('/health', async (req, res) => {

    try {

        await dbPool.query('SELECT 1');

        res.json({
            success: true,
            database: 'connected',
            message: '서버와 데이터베이스가 정상적으로 연결되었습니다.'
        });

    } catch (error) {

        console.error('DB 연결 테스트 실패:', error);

        res.status(500).json({
            success: false,
            database: 'disconnected',
            message: '데이터베이스 연결에 실패했습니다.',
            error: error.message
        });
    }
});


/*
=========================================================
17개 시·도 조회
GET /api/regions
=========================================================
*/

router.get('/regions', async (req, res) => {

    try {

        const regions =
            await weatherService.getAllRegions();

        res.json({
            success: true,
            data: regions
        });

    } catch (error) {

        console.error('지역 조회 실패:', error);

        res.status(500).json({
            success: false,
            message: '지역 목록을 불러오지 못했습니다.',
            error: error.message
        });
    }
});


/*
=========================================================
날씨 데이터 수집
POST /api/weather/collect
=========================================================
*/

router.post('/weather/collect', async (req, res) => {

    try {

        const result =
            await weatherService.fetchAndSaveWeatherData();

        res.json({
            success: true,
            message: '전국 17개 시·도 날씨 데이터 수집이 완료되었습니다.',
            result
        });

    } catch (error) {

        console.error('날씨 수집 실패:', error);

        res.status(500).json({
            success: false,
            message: '날씨 데이터를 수집하지 못했습니다.',
            error: error.message
        });
    }
});


/*
=========================================================
최근 날씨 조회
GET /api/weather/observations
=========================================================
*/

router.get('/weather/observations', async (req, res) => {

    try {

        const observations =
            await weatherService.getLatestObservations();

        res.json({
            success: true,
            data: observations
        });

    } catch (error) {

        console.error('날씨 조회 실패:', error);

        res.status(500).json({
            success: false,
            message: '날씨 데이터를 불러오지 못했습니다.',
            error: error.message
        });
    }
});


/*
=========================================================
기상 이벤트 분석
POST /api/weather/analyze
=========================================================
*/

router.post('/weather/analyze', async (req, res) => {

    try {

        const result =
            await weatherService.analyzeAndSaveEvents();

        res.json({
            success: true,
            message: '기상 이벤트 분석이 완료되었습니다.',
            result
        });

    } catch (error) {

        console.error('기상 이벤트 분석 실패:', error);

        res.status(500).json({
            success: false,
            message: '기상 이벤트 분석에 실패했습니다.',
            error: error.message
        });
    }
});


/*
=========================================================
기상 이벤트 조회
GET /api/weather/events
=========================================================
*/

router.get('/weather/events', async (req, res) => {

    try {

        const events =
            await weatherService.getLatestEvents();

        res.json({
            success: true,
            data: events
        });

    } catch (error) {

        console.error('이벤트 조회 실패:', error);

        res.status(500).json({
            success: false,
            message: '기상 이벤트를 불러오지 못했습니다.',
            error: error.message
        });
    }
});


/*
=========================================================
뉴스 조회
GET /api/weather-news
=========================================================
*/

router.get('/weather-news', async (req, res) => {

    try {

        const news =
            await weatherService.getAllNews();

        res.json({
            success: true,
            data: news
        });

    } catch (error) {

        console.error('뉴스 조회 실패:', error);

        res.status(500).json({
            success: false,
            message: '날씨 뉴스를 불러오지 못했습니다.',
            error: error.message
        });
    }
});


/*
=========================================================
뉴스 생성
POST /api/weather-news
=========================================================
*/

router.post('/weather-news', async (req, res) => {

    const {
        region,
        temp,
        weather_status,
        warning_type
    } = req.body;

    if (
        !region ||
        temp === undefined ||
        !weather_status
    ) {
        return res.status(400).json({
            success: false,
            message:
                '지역명, 기온, 날씨 상태는 필수 입력값입니다.'
        });
    }

    try {

        const news =
            await weatherService.createNews(
                region,
                temp,
                weather_status,
                warning_type
            );

        res.status(201).json({
            success: true,
            message: '날씨 뉴스가 생성되었습니다.',
            data: news
        });

    } catch (error) {

        console.error('뉴스 생성 실패:', error);

        res.status(500).json({
            success: false,
            message: '날씨 뉴스 생성에 실패했습니다.',
            error: error.message
        });
    }
});


/*
=========================================================
관측 데이터 → 뉴스 자동 생성
POST /api/weather-news/generate
=========================================================
*/

router.post('/weather-news/generate', async (req, res) => {

    try {

        const news =
            await weatherService.generateNewsArticle();

        res.json({
            success: true,
            message: '전국 날씨 뉴스 생성이 완료되었습니다.',
            data: news
        });

    } catch (error) {

        console.error('뉴스 자동 생성 실패:', error);

        res.status(500).json({
            success: false,
            message: '뉴스 자동 생성에 실패했습니다.',
            error: error.message
        });
    }
});


module.exports = router;