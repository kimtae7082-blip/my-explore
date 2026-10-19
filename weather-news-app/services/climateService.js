const dbPool = require('../db/connection');

async function getClimateAnalysis(regionId) {
    const [regions] = await dbPool.query(
        `SELECT region_id, region_name, latitude, longitude
         FROM region WHERE region_id = ?`,
        [regionId]
    );

    if (regions.length === 0) {
        throw new Error('지역을 찾을 수 없습니다.');
    }

    const region = regions[0];

    const params = new URLSearchParams({
        latitude: String(region.latitude),
        longitude: String(region.longitude),
        start_date: '2016-01-01',
        end_date: '2025-12-31',
        daily: 'temperature_2m_mean,temperature_2m_max,precipitation_sum',
        timezone: 'Asia/Seoul'
    });

    const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?${params}`
    );

    if (!response.ok) {
        throw new Error(`기후 API 오류: ${response.status}`);
    }

    const json = await response.json();
    const daily = json.daily;

    if (!daily || !Array.isArray(daily.time)) {
        throw new Error('기후 데이터가 없습니다.');
    }

    const annual = {};

    daily.time.forEach((date, i) => {
        const year = date.slice(0, 4);

        if (!annual[year]) {
            annual[year] = {
                year: Number(year),
                tempSum: 0,
                tempCount: 0,
                rainfall: 0,
                heatwaveDays: 0
            };
        }

        const item = annual[year];
        const temp = daily.temperature_2m_mean[i];
        const maxTemp = daily.temperature_2m_max[i];
        const rain = daily.precipitation_sum[i];

        if (temp != null) {
            item.tempSum += temp;
            item.tempCount++;
        }

        if (rain != null) {
            item.rainfall += rain;
        }

        if (maxTemp != null && maxTemp >= 33) {
            item.heatwaveDays++;
        }
    });

    const years = Object.values(annual).map(item => ({
        year: item.year,
        avgTemperature: item.tempCount
            ? Number((item.tempSum / item.tempCount).toFixed(2))
            : null,
        rainfall: Number(item.rainfall.toFixed(1)),
        heatwaveDays: item.heatwaveDays
    }));

    const first = years[0];
    const last = years[years.length - 1];

    return {
        region: region.region_name,
        period: '2016~2025',
        years,
        comparison: {
            temperatureDifference:
                first.avgTemperature != null &&
                last.avgTemperature != null
                    ? Number((
                        last.avgTemperature - first.avgTemperature
                    ).toFixed(2))
                    : null,
            rainfallDifference:
                Number((last.rainfall - first.rainfall).toFixed(1)),
            heatwaveDaysDifference:
                last.heatwaveDays - first.heatwaveDays
        }
    };
}

module.exports = { getClimateAnalysis };