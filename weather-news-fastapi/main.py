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

app=FastAPI(title='전국 날씨 뉴스 FastAPI',version='1.0.0')
PUBLIC=Path(__file__).resolve().parent/'public'
app.mount('/css',StaticFiles(directory=PUBLIC/'css'),name='css')
app.mount('/js',StaticFiles(directory=PUBLIC/'js'),name='js')

def ok(data=None,**extras):
    return jsonable_encoder({'success':True,**({'data':data} if data is not None else {}),**extras})

@app.get('/')
def home():return FileResponse(PUBLIC/'index.html')

@app.get('/api/health')
def health():
    try:query('SELECT 1');return ok(message='MySQL 연결 정상')
    except Exception as exc:return JSONResponse(status_code=503,content={'success':False,'message':'DB 연결 실패: '+str(exc)})

@app.get('/api/regions')
def get_regions():return ok(regions())

@app.get('/api/weather/observations')
def get_observations():return ok(weather.observations())

@app.post('/api/weather/collect')
async def collect():
    try:
        result=await weather.collect()
        return ok(result,**result)
    except ValueError as exc:raise HTTPException(400,str(exc))

@app.post('/api/weather/analyze')
def analyze():return ok(weather.analyze())

@app.get('/api/weather/events')
def events():return ok(weather.events())

@app.get('/api/air-quality')
async def air_quality():
    data=await air.get_air();return ok(data,count=len(data))

@app.get('/api/climate/analysis/{region_id}')
async def climate_analysis(region_id:int):
    try:return ok(await climate.analyze_climate(region_id))
    except ValueError as exc:raise HTTPException(404,str(exc))

@app.get('/api/weather-news')
def get_news():return ok(news.list_news())

class NewsInput(BaseModel):
    region:str
    temp:float
    weather_status:str
    warning_type:str='없음'

@app.post('/api/weather-news')
def create_news(item:NewsInput):
    try:return ok(news.create(**item.model_dump()))
    except ValueError as exc:raise HTTPException(400,str(exc))

@app.post('/api/weather-news/generate')
def generate_news():return ok(news.generate())
