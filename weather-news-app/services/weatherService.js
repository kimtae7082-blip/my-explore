const dbPool = require('../db/connection');

/*
=========================================================
대한민국 17개 시·도 좌표
OpenWeather 사용
=========================================================
*/

const REGION_COORDINATES = {
    seoul: {
        name: '서울',
        latitude: 37.5665,
        longitude: 126.9780
    },

    busan: {
        name: '부산',
        latitude: 35.1796,
        longitude: 129.0756
    },

    daegu: {
        name: '대구',
        latitude: 35.8714,
        longitude: 128.6014
    },

    incheon: {
        name: '인천',
        latitude: 37.4563,
        longitude: 126.7052
    },

    gwangju: {
        name: '광주',
        latitude: 35.1595,
        longitude: 126.8526
    },

    daejeon: {
        name: '대전',
        latitude: 36.3504,
        longitude: 127.3845
    },

    ulsan: {
        name: '울산',
        latitude: 35.5384,
        longitude: 129.3114
    },

    sejong: {
        name: '세종',
        latitude: 36.4800,
        longitude: 127.2890
    },

    gyeonggi: {
        name: '경기',
        latitude: 37.4138,
        longitude: 127.5183
    },

    gangwon: {
        name: '강원',
        latitude: 37.8228,
        longitude: 128.1555
    },

    chungbuk: {
        name: '충북',
        latitude: 36.8000,
        longitude: 127.7000
    },

    chungnam: {
        name: '충남',
        latitude: 36.5184,
        longitude: 126.8000
    },

    jeonbuk: {
        name: '전북',
        latitude: 35.8203,
        longitude: 127.1089
    },

    jeonnam: {
        name: '전남',
        latitude: 34.8679,
        longitude: 126.9910
    },

    gyeongbuk: {
        name: '경북',
        latitude: 36.4919,
        longitude: 128.8889
    },

    gyeongnam: {
        name: '경남',
        latitude: 35.4606,
        longitude: 128.2132
    },

    jeju: {
        name: '제주',
        latitude: 33.4996,
        longitude: 126.5312
    }
};


/*
=========================================================
OpenWeather 날씨 코드 → 한글 상태
=========================================================
*/

function weatherCodeToText(code) {

    const weatherMap = {

        // 천둥번개
        200: '약한 천둥번개',
        201: '천둥번개',
        202: '강한 천둥번개',
        210: '약한 천둥번개',
        211: '천둥번개',
        212: '강한 천둥번개',
        221: '불규칙한 천둥번개',
        230: '약한 천둥번개와 이슬비',
        231: '천둥번개와 이슬비',
        232: '강한 천둥번개와 이슬비',

        // 이슬비
        300: '약한 이슬비',
        301: '이슬비',
        302: '강한 이슬비',
        310: '약한 이슬비',
        311: '이슬비',
        312: '강한 이슬비',
        313: '소나기성 이슬비',
        314: '강한 소나기성 이슬비',
        321: '소나기성 이슬비',

        // 비
        500: '약한 비',
        501: '비',
        502: '강한 비',
        503: '매우 강한 비',
        504: '극심한 비',
        511: '어는 비',
        520: '약한 소나기',
        521: '소나기',
        522: '강한 소나기',
        531: '불규칙한 소나기',

        // 눈
        600: '약한 눈',
        601: '눈',
        602: '강한 눈',
        611: '진눈깨비',
        612: '약한 소나기성 진눈깨비',
        613: '소나기성 진눈깨비',
        615: '약한 비와 눈',
        616: '비와 눈',
        620: '약한 소나기성 눈',
        621: '소나기성 눈',
        622: '강한 소나기성 눈',

        // 안개 등
        701: '안개',
        711: '연기',
        721: '연무',
        731: '모래먼지',
        741: '안개',
        751: '모래',
        761: '먼지',
        762: '화산재',
        771: '돌풍',
        781: '토네이도',

        // 맑음
        800: '맑음',

        // 구름
        801: '구름 조금',
        802: '부분적으로 흐림',
        803: '구름 많음',
        804: '흐림'
    };

    return weatherMap[code] || '알 수 없음';
}


/*
=========================================================
OpenWeather timestamp → MySQL DATETIME
한국 시간 기준
=========================================================
*/

function unixToKoreaDatetime(unixTimestamp) {

    const date = new Date(unixTimestamp * 1000);

    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23'
    }).format(date).replace('T', ' ');
}


/*
=========================================================
지역 목록
=========================================================
*/

async function getAllRegions() {

    const [rows] = await dbPool.query(`
        SELECT
            region_id,
            city_code,
            region_name
        FROM region
        ORDER BY region_id
    `);

    return rows;
}


/*
=========================================================
OpenWeather 현재 날씨 데이터 수집
=========================================================
*/

async function fetchWeatherForRegion(region) {

    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
        throw new Error(
            'OPENWEATHER_API_KEY가 .env 파일에 설정되지 않았습니다.'
        );
    }

    const url =
        `https://api.openweathermap.org/data/2.5/weather` +
        `?lat=${region.latitude}` +
        `&lon=${region.longitude}` +
        `&appid=${apiKey}` +
        `&units=metric` +
        `&lang=kr`;

    const response = await fetch(url);

    if (!response.ok) {

        let errorMessage = '';

        try {
            const errorData = await response.json();

            errorMessage =
                errorData.message || '알 수 없는 API 오류';

        } catch (error) {
            errorMessage = 'API 응답을 확인할 수 없습니다.';
        }

        throw new Error(
            `${region.name} OpenWeather API 요청 실패: ${errorMessage}`
        );
    }

    const data = await response.json();

    const weatherCode =
        data.weather &&
        data.weather.length > 0
            ? data.weather[0].id
            : 0;

    /*
    OpenWeather의 rain.1h 또는 snow.1h가 없을 수 있음
    없으면 0으로 처리
    */

    const rain =
        data.rain && data.rain['1h']
            ? Number(data.rain['1h'])
            : 0;

    const snow =
        data.snow && data.snow['1h']
            ? Number(data.snow['1h'])
            : 0;

    /*
    비 + 눈을 강수량으로 저장
    */

    const precipitation =
        rain + snow;

    return {

        temperature: Number(data.main.temp),

        humidity: Number(data.main.humidity),

        wind_speed:
            data.wind && data.wind.speed
                ? Number(data.wind.speed)
                : 0,

        precipitation,

        weather_code: Number(weatherCode),

        weather_status:
            data.weather &&
            data.weather.length > 0
                ? data.weather[0].description
                : weatherCodeToText(weatherCode),

        observed_at:
            unixToKoreaDatetime(data.dt)
    };
}


/*
=========================================================
날씨 데이터 수집 + DB 저장
=========================================================
*/

async function fetchAndSaveWeatherData() {

    const regions = await getAllRegions();

    let insertedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const dbRegion of regions) {

        const coordinate =
            REGION_COORDINATES[dbRegion.city_code];

        if (!coordinate) {

            console.warn(
                `좌표가 없는 지역: ${dbRegion.city_code}`
            );

            failedCount++;

            continue;
        }

        try {

            const weather =
                await fetchWeatherForRegion(coordinate);

            const [result] =
                await dbPool.query(
                    `
                    INSERT INTO weather_observation
                    (
                        region_id,
                        temperature,
                        humidity,
                        wind_speed,
                        precipitation,
                        weather_code,
                        observed_at
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)

                    ON DUPLICATE KEY UPDATE
                        temperature = VALUES(temperature),
                        humidity = VALUES(humidity),
                        wind_speed = VALUES(wind_speed),
                        precipitation = VALUES(precipitation),
                        weather_code = VALUES(weather_code)
                    `,
                    [
                        dbRegion.region_id,
                        weather.temperature,
                        weather.humidity,
                        weather.wind_speed,
                        weather.precipitation,
                        weather.weather_code,
                        weather.observed_at
                    ]
                );

            if (result.affectedRows === 1) {

                insertedCount++;

            } else {

                skippedCount++;

            }

            console.log(
                `날씨 저장 완료: ${dbRegion.region_name} ` +
                `${weather.temperature}℃ / ` +
                `${weather.humidity}% / ` +
                `${weather.wind_speed}m/s / ` +
                `${weather.weather_status}`
            );

        } catch (error) {

            failedCount++;

            console.error(
                `${dbRegion.region_name} 날씨 저장 실패:`,
                error.message
            );
        }
    }

    return {

        insertedCount,

        skippedCount,

        failedCount
    };
}


/*
=========================================================
각 지역의 최신 관측값 1개 조회
=========================================================
*/

async function getLatestObservations() {

    const [rows] = await dbPool.query(`
        SELECT
            o.observation_id,
            r.region_id,
            r.region_name,
            r.city_code,
            o.temperature,
            o.humidity,
            o.wind_speed,
            o.precipitation,
            o.weather_code,
            o.observed_at

        FROM weather_observation o

        INNER JOIN region r
            ON o.region_id = r.region_id

        INNER JOIN (
            SELECT
                region_id,
                MAX(observed_at) AS latest_time

            FROM weather_observation

            GROUP BY region_id
        ) latest

            ON o.region_id = latest.region_id
            AND o.observed_at = latest.latest_time

        ORDER BY r.region_id
    `);

    return rows.map(row => ({

        ...row,

        weather_status:
            weatherCodeToText(
                row.weather_code
            )
    }));
}


/*
=========================================================
기상 이벤트 분석
=========================================================
*/

function evaluateWeatherEvents(observation) {

    const events = [];

    const temperature =
        Number(observation.temperature);

    const precipitation =
        Number(observation.precipitation);

    const windSpeed =
        Number(observation.wind_speed);

    const weatherCode =
        Number(observation.weather_code);


    // 폭염
    if (temperature >= 33) {

        events.push({

            event_type: '폭염',

            severity_level:
                temperature >= 35
                    ? '경보'
                    : '주의',

            description:
                `${observation.region_name}의 현재 기온이 ` +
                `${temperature}℃로 높습니다.`
        });
    }


    // 한파
    if (temperature <= -12) {

        events.push({

            event_type: '한파',

            severity_level:
                temperature <= -15
                    ? '경보'
                    : '주의',

            description:
                `${observation.region_name}의 현재 기온이 ` +
                `${temperature}℃로 매우 낮습니다.`
        });
    }


    // 호우
    if (precipitation >= 30) {

        events.push({

            event_type: '호우',

            severity_level:
                precipitation >= 50
                    ? '경보'
                    : '주의',

            description:
                `${observation.region_name}에서 ` +
                `${precipitation}mm의 강수가 관측되었습니다.`
        });
    }


    // 강풍
    if (windSpeed >= 14) {

        events.push({

            event_type: '강풍',

            severity_level:
                windSpeed >= 21
                    ? '경보'
                    : '주의',

            description:
                `${observation.region_name}의 풍속이 ` +
                `${windSpeed}m/s로 강합니다.`
        });
    }


    // 눈
    if (
        weatherCode >= 600 &&
        weatherCode <= 622
    ) {

        events.push({

            event_type: '대설',

            severity_level: '주의',

            description:
                `${observation.region_name}에 ` +
                `눈이 관측되고 있습니다.`
        });
    }


    // 뇌우
    if (
        weatherCode >= 200 &&
        weatherCode <= 232
    ) {

        events.push({

            event_type: '뇌우',

            severity_level: '주의',

            description:
                `${observation.region_name}에서 ` +
                `뇌우가 관측되고 있습니다.`
        });
    }


    return events;
}


/*
=========================================================
이벤트 분석 + 저장
=========================================================
*/

async function analyzeAndSaveEvents() {

    const observations =
        await getLatestObservations();

    let savedEventCount = 0;

    for (const observation of observations) {

        const events =
            evaluateWeatherEvents(observation);

        for (const event of events) {

            const [result] =
                await dbPool.query(
                    `
                    INSERT INTO weather_event
                    (
                        observation_id,
                        region_id,
                        event_type,
                        severity_level,
                        description
                    )
                    VALUES (?, ?, ?, ?, ?)

                    ON DUPLICATE KEY UPDATE
                        severity_level =
                            VALUES(severity_level),

                        description =
                            VALUES(description)
                    `,
                    [
                        observation.observation_id,
                        observation.region_id,
                        event.event_type,
                        event.severity_level,
                        event.description
                    ]
                );

            if (result.affectedRows > 0) {

                savedEventCount++;
            }
        }
    }

    return {

        analyzedCount:
            observations.length,

        savedEventCount
    };
}


/*
=========================================================
최근 이벤트 조회
=========================================================
*/

async function getLatestEvents() {

    const [rows] = await dbPool.query(`
        SELECT
            e.event_id,
            e.region_id,
            r.region_name,
            e.event_type,
            e.severity_level,
            e.description,
            e.created_at

        FROM weather_event e

        INNER JOIN region r
            ON e.region_id = r.region_id

        ORDER BY e.created_at DESC

        LIMIT 50
    `);

    return rows;
}


/*
=========================================================
날씨 뉴스 자동 생성
=========================================================
*/

function createNewsContent(
    regionName,
    temperature,
    weatherStatus,
    warningType
) {

    let content =
        `${regionName} 지역은 현재 ` +
        `${temperature}℃이며 ` +
        `${weatherStatus} 날씨가 나타나고 있습니다.`;

    if (
        warningType &&
        warningType !== '없음'
    ) {

        content +=
            ` 현재 ${warningType} 관련 ` +
            `기상 상황에 주의가 필요합니다.`;
    }

    return content;
}


async function createNews(
    region,
    temp,
    weather_status,
    warning_type = '없음'
) {

    const [regionRows] =
        await dbPool.query(
            `
            SELECT
                region_id,
                region_name

            FROM region

            WHERE region_name = ?

            LIMIT 1
            `,
            [region]
        );

    if (regionRows.length === 0) {

        throw new Error(
            `존재하지 않는 지역입니다: ${region}`
        );
    }

    const regionId =
        regionRows[0].region_id;


    const newsTitle =
        `[${region}] 현재 날씨 ` +
        `${temperatureText(temp)} · ` +
        `${weather_status}`;


    const newsContent =
        createNewsContent(
            region,
            temp,
            weather_status,
            warning_type
        );


    const [result] =
        await dbPool.query(
            `
            INSERT INTO weather_news
            (
                region_id,
                temp,
                weather_status,
                warning_type,
                news_title,
                news_content
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                regionId,
                temp,
                weather_status,
                warning_type,
                newsTitle,
                newsContent
            ]
        );


    const [rows] =
        await dbPool.query(
            `
            SELECT
                n.id,
                r.region_name AS region,
                n.temp,
                n.weather_status,
                n.warning_type,
                n.news_title,
                n.news_content,
                n.created_at

            FROM weather_news n

            INNER JOIN region r
                ON n.region_id = r.region_id

            WHERE n.id = ?
            `,
            [result.insertId]
        );


    return rows[0];
}


function temperatureText(temp) {

    return `${Number(temp).toFixed(1)}℃`;
}


/*
=========================================================
전체 뉴스 조회
=========================================================
*/

async function getAllNews() {

    const [rows] =
        await dbPool.query(`
            SELECT
                n.id,
                r.region_name AS region,
                n.temp,
                n.weather_status,
                n.warning_type,
                n.news_title,
                n.news_content,
                n.created_at

            FROM weather_news n

            INNER JOIN region r
                ON n.region_id = r.region_id

            ORDER BY n.created_at DESC

            LIMIT 30
        `);

    return rows;
}


/*
=========================================================
현재 관측값으로 뉴스 자동 생성
=========================================================
*/

async function generateNewsArticle() {

    const observations =
        await getLatestObservations();

    const createdNews = [];

    for (const observation of observations) {

        const relatedEvents =
            evaluateWeatherEvents(
                observation
            );

        const warningType =
            relatedEvents.length > 0
                ? relatedEvents
                    .map(event =>
                        event.event_type
                    )
                    .join(', ')
                : '없음';


        const news =
            await createNews(
                observation.region_name,
                observation.temperature,
                observation.weather_status,
                warningType
            );

        createdNews.push(news);
    }

    return createdNews;
}


/*
=========================================================
외부 공개
=========================================================
*/

module.exports = {

    REGION_COORDINATES,

    weatherCodeToText,

    getAllRegions,

    fetchAndSaveWeatherData,

    getLatestObservations,

    evaluateWeatherEvents,

    analyzeAndSaveEvents,

    getLatestEvents,

    createNews,

    getAllNews,

    generateNewsArticle
};