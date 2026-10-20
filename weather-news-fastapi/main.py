# 이 파일은 URL(주소)과 처리 함수를 연결하는 진입점입니다.
# 브라우저 → 이 파일의 API → services의 수집·분석 함수 → DB 순서로 처리합니다.
from pathlib import Path
from datetime import date,datetime
from decimal import Decimal
from fastapi import FastAPI,HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import FileResponse,JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from database.connection import query
from services.regions import regions
from services import weather,air,climate,news

# FastAPI는 JSON 응답과 /docs의 API 설명 화면을 만듭니다.
app=FastAPI(title='전국 날씨 뉴스 FastAPI',version='1.0.0')
# 실행 위치와 관계없이 이 파일 옆의 public 폴더를 찾습니다.
# 단, services 등의 import와 .env 로딩을 위해 README의 폴더에서 실행하세요.
PUBLIC=Path(__file__).resolve().parent/'public'
app.mount('/css',StaticFiles(directory=PUBLIC/'css'),name='css')
app.mount('/js',StaticFiles(directory=PUBLIC/'js'),name='js')

# 응답 형식을 success/data로 통일합니다. 날짜·Decimal도 JSON으로 바꿉니다.
# data=None이면 data 항목을 생략하고, extras는 추가 집계값 등을 넣습니다.
def ok(data=None,**extras):
    return jsonable_encoder({'success':True,**({'data':data} if data is not None else {}),**extras})

# /는 HTML을, /css와 /js는 화면 꾸미기·동작 파일을 제공합니다.
@app.get('/')
def home():return FileResponse(PUBLIC/'index.html')

# SELECT 1로 실제 DB 접속을 검사합니다. 외부 날씨 API까지 확인하지는 않습니다.
# 실패 시 HTTP 503을 반환하며 현재 구현은 오류 문자열도 응답에 포함합니다.
@app.get('/api/health')
def health():
    try:query('SELECT 1');return ok(message='MySQL 연결 정상')
    except Exception as exc:return JSONResponse(status_code=503,content={'success':False,'message':'DB 연결 실패: '+str(exc)})

# 지역 번호는 DB가 정합니다. 서울이 항상 1이라고 가정하지 말고 목록을 확인하세요.
@app.get('/api/regions')
def get_regions():return ok(regions())

# 저장된 최신 관측을 조회합니다. 이 GET 요청이 새 날씨를 수집하지는 않습니다.
@app.get('/api/weather/observations')
def get_observations():return ok(weather.observations())

# POST 수집은 DB를 변경합니다. await는 외부 응답을 기다리는 동안 제어를 양보합니다.
# API 키 누락 같은 ValueError는 사용자가 수정할 수 있는 HTTP 400으로 안내합니다.
@app.post('/api/weather/collect')
async def collect():
    try:
        result=await weather.collect()
        return ok(result,**result)
    except ValueError as exc:raise HTTPException(400,str(exc))

# 저장된 관측에 자체 규칙을 적용해 이벤트를 저장합니다. 공식 특보가 아닙니다.
@app.post('/api/weather/analyze')
def analyze():return ok(weather.analyze())

@app.get('/api/weather/events')
def events():return ok(weather.events())

# 대기질은 요청할 때 외부에서 조회하며, 이 경로에서는 DB에 저장하지 않습니다.
@app.get('/api/air-quality')
async def air_quality():
    data=await air.get_air();return ok(data,count=len(data))

# 경로의 region_id를 정수로 받고, 없는 지역은 HTTP 404로 처리합니다.
@app.get('/api/climate/analysis/{region_id}')
async def climate_analysis(region_id:int):
    try:return ok(await climate.analyze_climate(region_id))
    except ValueError as exc:raise HTTPException(404,str(exc))

@app.get('/api/weather-news')
def get_news():return ok(news.list_news())

# 요청 본문의 자료형을 검사합니다. 잘못된 형식은 FastAPI가 HTTP 422로 거절합니다.
# warning_type을 생략하면 '없음'이 됩니다. 기사 내용의 사실 검증은 별도입니다.
class NewsInput(BaseModel):
    region:str
    temp:float
    weather_status:str
    warning_type:str='없음'

# 사용자가 보낸 값을 정해진 문장 틀로 바꾸고 DB에 저장합니다.
@app.post('/api/weather-news')
def create_news(item:NewsInput):
    try:return ok(news.create(**item.model_dump()))
    except ValueError as exc:raise HTTPException(400,str(exc))

# 최신 관측을 이용해 지역별 초안을 생성합니다. 언어 모델 API를 호출하지 않습니다.
@app.post('/api/weather-news/generate')
def generate_news():return ok(news.generate())

