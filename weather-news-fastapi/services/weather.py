import os
from datetime import datetime, timezone
import httpx
from database.connection import db, query
from services.regions import regions, COORDS

def status(code):
    code=int(code or 0)
    if 200<=code<300:return '뇌우'
    if 300<=code<400:return '이슬비'
    if 500<=code<600:return '비'
    if 600<=code<700:return '눈'
    if 700<=code<800:return '안개/대기현상'
    return {800:'맑음',801:'구름 조금',802:'구름 많음',803:'흐림',804:'매우 흐림'}.get(code,'정보 없음')

def observations():
    rows=query("""SELECT o.observation_id,r.region_id,r.region_name,r.city_code,o.temperature,o.humidity,o.wind_speed,o.precipitation,o.weather_code,o.observed_at FROM weather_observation o JOIN region r ON r.region_id=o.region_id JOIN (SELECT region_id,MAX(observed_at) t FROM weather_observation GROUP BY region_id) x ON x.region_id=o.region_id AND x.t=o.observed_at ORDER BY r.region_id""")
    for r in rows:r['weather_status']=status(r['weather_code'])
    return rows

async def collect():
    key=os.getenv('OPENWEATHER_API_KEY')
    if not key or key=='YOUR_OPENWEATHER_KEY':raise ValueError('OPENWEATHER_API_KEY를 .env에 입력하세요.')
    results={'insertedCount':0,'skippedCount':0,'failedCount':0,'errors':[]}
    async with httpx.AsyncClient(timeout=20) as client:
        for r in regions():
            try:
                lat,lon=COORDS[r['city_code']]
                resp=await client.get('https://api.openweathermap.org/data/2.5/weather',params={'lat':lat,'lon':lon,'appid':key,'units':'metric','lang':'kr'})
                resp.raise_for_status(); j=resp.json()
                observed=datetime.fromtimestamp(j['dt'],timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
                rain=float(j.get('rain',{}).get('1h',0))+float(j.get('snow',{}).get('1h',0))
                with db() as conn:
                    with conn.cursor() as cur:
                        cur.execute("""INSERT INTO weather_observation(region_id,temperature,humidity,wind_speed,precipitation,weather_code,observed_at) VALUES(%s,%s,%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE temperature=VALUES(temperature),humidity=VALUES(humidity),wind_speed=VALUES(wind_speed),precipitation=VALUES(precipitation),weather_code=VALUES(weather_code)""",(r['region_id'],j['main']['temp'],j['main']['humidity'],j['wind']['speed']*3.6,rain,j['weather'][0]['id'],observed))
                        results['insertedCount' if cur.rowcount==1 else 'skippedCount']+=1
            except Exception as exc:
                results['failedCount']+=1;results['errors'].append(f"{r['region_name']}: {exc}")
    return results

def event_rules(o):
    t=float(o['temperature']); w=float(o['wind_speed']);rain=float(o['precipitation'] or 0);code=int(o['weather_code']); found=[]
    if t>=33:found.append(('폭염','경보' if t>=35 else '주의',f'기온 {t}℃'))
    if t<=-12:found.append(('한파','경보' if t<=-15 else '주의',f'기온 {t}℃'))
    if rain>=30:found.append(('호우','경보' if rain>=50 else '주의',f'강수량 {rain}mm'))
    if w>=14:found.append(('강풍','경보' if w>=21 else '주의',f'풍속 {w}km/h'))
    if 600<=code<700:found.append(('대설','주의','눈 날씨 코드 감지'))
    if 200<=code<300:found.append(('뇌우','주의','뇌우 날씨 코드 감지'))
    return found

def analyze():
    obs=observations(); count=0
    with db() as conn:
        with conn.cursor() as cur:
            for o in obs:
                for name,level,desc in event_rules(o):
                    cur.execute("""INSERT INTO weather_event(observation_id,region_id,event_type,severity_level,description) VALUES(%s,%s,%s,%s,%s) ON DUPLICATE KEY UPDATE severity_level=VALUES(severity_level),description=VALUES(description)""",(o['observation_id'],o['region_id'],name,level,desc));count+=1
    return {'analyzedCount':len(obs),'savedEventCount':count}

def events():
    return query("""SELECT e.event_id,e.region_id,r.region_name,e.event_type,e.severity_level,e.description,e.created_at FROM weather_event e JOIN region r ON r.region_id=e.region_id ORDER BY e.created_at DESC LIMIT 50""")
