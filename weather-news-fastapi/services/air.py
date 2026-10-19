import asyncio
import httpx
from services.regions import regions,COORDS

def grade(v,pm10):
    if v is None:return '정보 없음'
    limits=[30,80,150] if pm10 else [15,35,75]
    return next((g for n,g in zip(limits,['좋음','보통','나쁨']) if v<=n),'매우 나쁨')

async def get_air():
    async with httpx.AsyncClient(timeout=25) as client:
        async def one(r):
            try:
                lat,lon=COORDS[r['city_code']]
                resp=await client.get('https://air-quality-api.open-meteo.com/v1/air-quality',params={'latitude':lat,'longitude':lon,'current':'pm10,pm2_5','timezone':'Asia/Seoul'})
                resp.raise_for_status(); c=resp.json()['current']; p=c.get('pm10');f=c.get('pm2_5')
                return {'region_id':r['region_id'],'region_name':r['region_name'],'pm10':p,'pm25':f,'pm10_grade':grade(p,True),'pm25_grade':grade(f,False),'observed_at':c.get('time')}
            except Exception as exc:return {'region_id':r['region_id'],'region_name':r['region_name'],'error':str(exc)}
        return await asyncio.gather(*(one(r) for r in regions()))
