document.addEventListener('DOMContentLoaded', () => {

    const refreshButton =
        document.getElementById('btnRefresh');

    refreshButton.addEventListener(
        'click',
        loadDashboardData
    );

    loadDashboardData();
});


/*
=========================================================
전체 대시보드 데이터 로딩
=========================================================
*/

async function loadDashboardData() {
    showLoading(true);
    hideError();

    try {
        // 저장된 날씨 데이터 먼저 조회
        const observationsRes = await fetchAPI(
            '/api/weather/observations'
        );

        const observations = observationsRes.data || [];

        // 날씨 화면 표시
        renderNationalWeather(observations);
        renderMajorRegions(observations);

        // 기상 이벤트는 별도로 조회
        try {
            const eventsRes = await fetchAPI(
                '/api/weather/events'
            );

            const events = eventsRes.data || [];

            renderWarnings(events);
            renderWeatherEvents(events);

        } catch (error) {
            console.error('기상 이벤트 조회 실패:', error);
            renderWarnings([]);
            renderWeatherEvents([]);
        }

        // 뉴스도 별도로 조회
        try {
            const newsRes = await fetchAPI(
                '/api/weather-news'
            );

            renderTodayNews(newsRes.data || []);

        } catch (error) {
            console.error('뉴스 조회 실패:', error);
            renderTodayNews([]);
        }

        renderDustStatus();
        renderClimateChange();

    } catch (error) {
        console.error('날씨 조회 실패:', error);
        showError(error.message);

    } finally {
        showLoading(false);
    }
}


/*
=========================================================
API 공통 함수
=========================================================
*/

async function fetchAPI(url, options = {}) {

    const response =
        await fetch(url, options);

    if (!response.ok) {

        throw new Error(
            `서버 응답 오류: ${response.status}`
        );
    }

    const result =
        await response.json();

    if (!result.success) {

        throw new Error(
            result.message ||
            '데이터를 불러오지 못했습니다.'
        );
    }

    return result;
}


/*
=========================================================
전국 평균 날씨
=========================================================
*/

function renderNationalWeather(
    observations
) {

    const container =
        document.getElementById(
            'nationalWeatherSummary'
        );

    if (
        !observations ||
        observations.length === 0
    ) {

        container.innerHTML =
            '<p class="text-muted">관측 데이터가 없습니다.</p>';

        return;
    }


    const temperatures =
        observations.map(
            item => Number(item.temperature)
        );

    const avgTemp =
        (
            temperatures.reduce(
                (sum, value) => sum + value,
                0
            ) / temperatures.length
        ).toFixed(1);


    const maxTempObs =
        observations.reduce(
            (prev, current) =>
                Number(prev.temperature) >
                Number(current.temperature)
                    ? prev
                    : current
        );


    const minTempObs =
        observations.reduce(
            (prev, current) =>
                Number(prev.temperature) <
                Number(current.temperature)
                    ? prev
                    : current
        );


    container.innerHTML = `

        <div class="col-md-4 mb-3">

            <div class="summary-box">

                <small>
                    전국 평균 기온
                </small>

                <strong class="text-primary">
                    ${avgTemp}℃
                </strong>

            </div>

        </div>


        <div class="col-md-4 mb-3">

            <div class="summary-box">

                <small>
                    최고 기온
                </small>

                <strong class="text-danger">
                    ${maxTempObs.region_name}
                    ${maxTempObs.temperature}℃
                </strong>

            </div>

        </div>


        <div class="col-md-4 mb-3">

            <div class="summary-box">

                <small>
                    최저 기온
                </small>

                <strong class="text-info">
                    ${minTempObs.region_name}
                    ${minTempObs.temperature}℃
                </strong>

            </div>

        </div>

    `;
}


/*
=========================================================
17개 시·도 날씨
=========================================================
*/

function renderMajorRegions(
    observations
) {

    const tbody =
        document.getElementById(
            'majorRegionsTable'
        );

    tbody.innerHTML = '';


    if (
        !observations ||
        observations.length === 0
    ) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6"
                    class="text-center text-muted">
                    관측 데이터가 없습니다.
                </td>
            </tr>
        `;

        return;
    }


    observations.forEach(obs => {

        const row = document.createElement('tr');

        row.innerHTML = `

            <td class="fw-bold">
                ${obs.region_name}
            </td>

            <td>
                ${obs.temperature}℃
            </td>

            <td>
                ${obs.weather_status}
            </td>

            <td>
                ${obs.humidity}%
            </td>

            <td>
                ${obs.wind_speed} m/s
            </td>

            <td>
                ${obs.precipitation} mm
            </td>

        `;

        tbody.appendChild(row);
    });
}


/*
=========================================================
기상특보 / 이벤트
=========================================================
*/

function renderWarnings(events) {

    const list =
        document.getElementById(
            'warningsList'
        );

    list.innerHTML = '';


    if (
        !events ||
        events.length === 0
    ) {

        list.innerHTML = `
            <li class="list-group-item text-muted">
                현재 감지된 특이 기상 현상이 없습니다.
            </li>
        `;

        return;
    }


    events.forEach(event => {

        const li =
            document.createElement('li');

        const badgeClass =
            event.severity_level === '경보'
                ? 'bg-danger'
                : 'bg-warning text-dark';


        li.className =
            'list-group-item d-flex justify-content-between align-items-start';


        li.innerHTML = `

            <div class="ms-2 me-auto">

                <div class="fw-bold">
                    ${event.region_name}
                    -
                    ${event.event_type}
                </div>

                <small class="text-secondary">
                    ${event.description}
                </small>

            </div>

            <span class="badge ${badgeClass} rounded-pill">
                ${event.severity_level}
            </span>

        `;

        list.appendChild(li);
    });
}


/*
=========================================================
기상 이벤트 카드
=========================================================
*/

function renderWeatherEvents(events) {

    const container =
        document.getElementById(
            'weatherEventsContainer'
        );

    container.innerHTML = '';


    if (
        !events ||
        events.length === 0
    ) {

        container.innerHTML =
            '<p class="text-muted">현재 특별한 기상 현상이 없습니다.</p>';

        return;
    }


    events.forEach(event => {

        const card =
            document.createElement('div');

        card.className =
            'event-card';


        card.innerHTML = `

            <span class="badge bg-secondary">
                ${event.region_name}
            </span>

            <strong>
                ${event.event_type}
            </strong>

            <small>
                ${event.description}
            </small>

        `;

        container.appendChild(card);
    });
}


/*
=========================================================
미세먼지
=========================================================
*/

function renderDustStatus() {

    const container =
        document.getElementById(
            'dustStatusContainer'
        );

    container.innerHTML = `

        <div class="col-12">

            <div class="alert alert-info mb-0">

                <strong>
                    미세먼지 데이터
                </strong>

                <br>

                현재 날씨 데이터에는
                미세먼지 정보가 포함되어 있지 않습니다.

                실제 PM10 / PM2.5 데이터를 표시하려면
                별도의 대기질 API 연동이 필요합니다.

            </div>

        </div>

    `;
}


/*
=========================================================
오늘의 날씨 뉴스
=========================================================
*/

function renderTodayNews(newsList) {

    const container =
        document.getElementById(
            'todayNewsContainer'
        );

    container.innerHTML = '';


    if (
        !newsList ||
        newsList.length === 0
    ) {

        container.innerHTML =
            '<p class="text-muted">등록된 날씨 뉴스가 없습니다.</p>';

        return;
    }


    newsList.slice(0, 5).forEach(news => {

        const item =
            document.createElement('div');

        item.className =
            'news-item';


        const date =
            news.created_at
                ? new Date(
                    news.created_at
                ).toLocaleDateString('ko-KR')
                : '';


        item.innerHTML = `

            <div class="d-flex justify-content-between">

                <span class="badge bg-info text-dark">
                    ${news.region}
                </span>

                <small class="text-muted">
                    ${date}
                </small>

            </div>

            <h6 class="fw-bold mt-2">
                ${news.news_title}
            </h6>

            <p class="small text-secondary mb-0">
                ${news.news_content}
            </p>

        `;

        container.appendChild(item);
    });
}


/*
=========================================================
기후변화 안내
=========================================================
*/

function renderClimateChange() {

    const container =
        document.getElementById(
            'climateChangeContainer'
        );

    container.innerHTML = `

        <div class="alert alert-success mb-0">

            <h6 class="fw-bold">
                🌡️ 기후변화 분석
            </h6>

            <p class="small mb-0">

                현재 데이터베이스에는
                장기간 기후 관측 데이터가 별도로 저장되어 있지 않습니다.

                따라서 현재 화면에서는
                실시간 날씨와 기상 이벤트를 중심으로 제공합니다.

                향후 연도별 평균기온,
                강수량,
                폭염일수 등의 데이터를 축적하면
                장기 기후변화 분석 기능을 추가할 수 있습니다.

            </p>

        </div>

    `;
}


/*
=========================================================
로딩
=========================================================
*/

function showLoading(isLoading) {

    const spinner =
        document.getElementById(
            'loadingSpinner'
        );

    if (isLoading) {

        spinner.classList.remove(
            'd-none'
        );

    } else {

        spinner.classList.add(
            'd-none'
        );
    }
}


/*
=========================================================
에러
=========================================================
*/

function showError(message) {

    const errorBox =
        document.getElementById(
            'errorMessage'
        );

    const errorText =
        document.getElementById(
            'errorText'
        );

    errorText.textContent =
        message;

    errorBox.classList.remove(
        'd-none'
    );
}


function hideError() {

    const errorBox =
        document.getElementById(
            'errorMessage'
        );

    errorBox.classList.add(
        'd-none'
    );
}