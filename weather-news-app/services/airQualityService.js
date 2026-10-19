// services/airQualityService.js

const dbPool = require('../db/connection');

// 미세먼지 등급 계산
function getDustGrade(value, type) {
    if (value === null || value === undefined) {
        return '정보 없음';
    }

    const limits = type === 'pm10'
        ? [30, 80, 150]
        : [15, 35, 75];

    if (value <= limits[0]) return '좋음';
    if (value <= limits[1]) return '보통';
    if (value <= limits[2]) return '나쁨';

    return '매우 나쁨';
}

// 지역별 미세먼지 가져오기
async function fetchAirQuality() {
    const [regions] = await dbPool.query(`
        SELECT region_id, region_name, latitude, longitude
        FROM region
        ORDER BY region_id
    `);

    const results = await Promise.all(
        regions.map(async (region) => {
            try {
                const params = new URLSearchParams({
                    latitude: String(region.latitude),
                    longitude: String(region.longitude),
                    current: 'pm10,pm2_5',
                    timezone: 'Asia/Seoul'
                });

                const url =
                    `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`;

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`API 오류: ${response.status}`);
                }

                const data = await response.json();
                const current = data.current;

                if (!current) {
                    throw new Error('미세먼지 데이터 없음');
                }

                return {
                    region_id: region.region_id,
                    region_name: region.region_name,
                    pm10: current.pm10 ?? null,
                    pm25: current.pm2_5 ?? null,
                    pm10_grade: getDustGrade(current.pm10, 'pm10'),
                    pm25_grade: getDustGrade(current.pm2_5, 'pm25'),
                    observed_at: current.time
                };

            } catch (error) {
                console.error(
                    `${region.region_name} 미세먼지 오류:`,
                    error.message
                );

                return {
                    region_id: region.region_id,
                    region_name: region.region_name,
                    error: error.message
                };
            }
        })
    );

    return results;
}

module.exports = {
    fetchAirQuality
};