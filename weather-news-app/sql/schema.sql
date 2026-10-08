-- =========================================================
-- 전국 날씨 뉴스 앱
-- MySQL 8.0+
-- =========================================================

CREATE DATABASE IF NOT EXISTS weather_korea
DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE weather_korea;


-- =========================================================
-- 기존 테이블 삭제
-- =========================================================
-- 개발 단계에서 테이블 구조를 새로 맞추기 위한 작업
-- =========================================================

DROP TABLE IF EXISTS weather_event;
DROP TABLE IF EXISTS weather_observation;
DROP TABLE IF EXISTS weather_news;
DROP TABLE IF EXISTS region;


-- =========================================================
-- 1. 지역
-- =========================================================

CREATE TABLE region (

    region_id INT AUTO_INCREMENT PRIMARY KEY,

    city_code VARCHAR(50)
        NOT NULL UNIQUE,

    region_name VARCHAR(50)
        NOT NULL

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 17개 시·도
-- =========================================================

INSERT INTO region
(
    city_code,
    region_name
)

VALUES
('seoul', '서울'),
('busan', '부산'),
('daegu', '대구'),
('incheon', '인천'),
('gwangju', '광주'),
('daejeon', '대전'),
('ulsan', '울산'),
('sejong', '세종'),
('gyeonggi', '경기'),
('gangwon', '강원'),
('chungbuk', '충북'),
('chungnam', '충남'),
('jeonbuk', '전북'),
('jeonnam', '전남'),
('gyeongbuk', '경북'),
('gyeongnam', '경남'),
('jeju', '제주');


-- =========================================================
-- 2. 날씨 관측
-- =========================================================

CREATE TABLE weather_observation (

    observation_id BIGINT AUTO_INCREMENT PRIMARY KEY,

    region_id INT NOT NULL,

    temperature DECIMAL(5,2) NOT NULL,

    humidity INT NOT NULL,

    wind_speed DECIMAL(6,2) NOT NULL,

    precipitation DECIMAL(5,1)
        DEFAULT 0.0,

    weather_code INT NOT NULL DEFAULT 0,

    observed_at DATETIME NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_observation_region
        FOREIGN KEY (region_id)
        REFERENCES region(region_id)
        ON DELETE CASCADE,

    UNIQUE KEY uk_region_observed
        (region_id, observed_at),

    INDEX idx_observed_at
        (observed_at)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 3. 기상 이벤트
-- =========================================================

CREATE TABLE weather_event (

    event_id INT AUTO_INCREMENT PRIMARY KEY,

    observation_id BIGINT NOT NULL,

    region_id INT NOT NULL,

    event_type VARCHAR(50)
        NOT NULL,

    severity_level VARCHAR(20)
        DEFAULT '주의',

    description VARCHAR(255)
        NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_observation
        FOREIGN KEY (observation_id)
        REFERENCES weather_observation(observation_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_region
        FOREIGN KEY (region_id)
        REFERENCES region(region_id)
        ON DELETE CASCADE,

    UNIQUE KEY uk_obs_event
        (observation_id, event_type)

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 4. 날씨 뉴스
-- =========================================================

CREATE TABLE weather_news (

    id INT AUTO_INCREMENT PRIMARY KEY,

    region_id INT NOT NULL,

    temp DECIMAL(5,2),

    weather_status VARCHAR(50)
        NOT NULL,

    warning_type VARCHAR(100)
        DEFAULT '없음',

    news_title VARCHAR(255)
        NOT NULL,

    news_content TEXT
        NOT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_news_region
        FOREIGN KEY (region_id)
        REFERENCES region(region_id)
        ON DELETE CASCADE

) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4;


-- =========================================================
-- 5. 초기 뉴스
-- =========================================================

INSERT INTO weather_news
(
    region_id,
    temp,
    weather_status,
    warning_type,
    news_title,
    news_content
)

SELECT
    region_id,
    22.5,
    '맑음',
    '없음',
    '[서울 날씨] 맑은 날씨',
    '서울 지역의 날씨 정보를 확인하세요.'
FROM region
WHERE city_code = 'seoul';


INSERT INTO weather_news
(
    region_id,
    temp,
    weather_status,
    warning_type,
    news_title,
    news_content
)

SELECT
    region_id,
    19.0,
    '비',
    '강풍',
    '[부산 날씨] 비와 강한 바람',
    '부산 지역의 날씨 정보를 확인하세요.'
FROM region
WHERE city_code = 'busan';


-- =========================================================
-- 6. 테이블 구조 확인
-- =========================================================

SHOW COLUMNS FROM region;

SHOW COLUMNS FROM weather_observation;

SHOW COLUMNS FROM weather_event;

SHOW COLUMNS FROM weather_news;


-- =========================================================
-- 7. 데이터 확인
-- =========================================================

SELECT *
FROM region
ORDER BY region_id;


SELECT *
FROM weather_observation
ORDER BY observed_at DESC;


SELECT *
FROM weather_event
ORDER BY created_at DESC;


SELECT
    n.id,
    r.region_name,
    n.temp,
    n.weather_status,
    n.warning_type,
    n.news_title,
    n.news_content,
    n.created_at
FROM weather_news n
INNER JOIN region r
    ON n.region_id = r.region_id
ORDER BY n.created_at DESC;