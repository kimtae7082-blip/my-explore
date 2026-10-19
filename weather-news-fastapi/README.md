# 전국 날씨 뉴스 FastAPI (Python + MySQL)

## 시작하기 (Windows PowerShell)
1. 기존 Node.js 서버는 Ctrl+C로 종료합니다.
2. `weather-news-fastapi` 폴더를 VS Code에서 엽니다.
3. `.env.example`을 복사해 `.env`를 만들고 MySQL 접속정보와 `OPENWEATHER_API_KEY`를 입력합니다.
4. **기존 MySQL `weather_korea` DB를 그대로 사용합니다.** 기존 `schema.sql`의 DROP TABLE을 실행하지 마세요.
5. PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 3000
```

6. 브라우저: http://localhost:3000 , API 문서: http://localhost:3000/docs
7. 서버 실행 후 새 터미널에서 `Invoke-RestMethod http://localhost:3000/api/health` 테스트.

## 기존 MySQL 구조
기존 ZIP에 포함된 `region`, `weather_observation`, `weather_event`, `weather_news` 테이블을 사용합니다. 데이터베이스 생성·삭제·마이그레이션은 자동으로 하지 않습니다. `region`에는 17개 city_code가 있어야 합니다. 원본 ZIP의 `schema.sql`에는 테이블 삭제문이 있으므로 포함하지 않았습니다.

## API
GET `/api/health`, `/api/regions`, `/api/weather/observations`, `/api/weather/events`, `/api/air-quality`, `/api/climate/analysis/1`, `/api/weather-news`
POST `/api/weather/collect`, `/api/weather/analyze`, `/api/weather-news`, `/api/weather-news/generate`

## 주의
- 기상 이벤트는 자체 임계값을 이용한 참고 정보이며 공식 기상특보가 아닙니다.
- 미세먼지는 Open-Meteo 모델 기반 자료입니다.
- 기후 분석은 2016~2025년의 과거 자료입니다. 두 해 차이는 장기 추세 검정이 아닙니다.
- OpenWeatherMap의 풍속은 m/s이므로 DB에 km/h로 변환하여 저장합니다.
- `public`은 업로드한 기존 프론트엔드에서 가져왔습니다. 일부 UI 기능은 API 응답에 따라 추가 조정이 필요할 수 있습니다.
