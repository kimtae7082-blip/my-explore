from collections import defaultdict
import httpx
from services.regions import regions,COORDS

async def analyze_climate(region_id):
    region=next((r for r in regions() if r['region_id']==region_id),None)
    if not region:raise ValueError('지역을 찾을 수 없습니다.')
    lat,lon=COORDS[region['city_code']]
    async with httpx.AsyncClient(timeout=90) as client:
        response=await client.get('https://archive-api.open-meteo.com/v1/archive',params={'latitude':lat,'longitude':lon,'start_date':'2016-01-01','end_date':'2025-12-31','daily':'temperature_2m_mean,temperature_2m_max,precipitation_sum','timezone':'Asia/Seoul'})
        response.raise_for_status(); d=response.json()['daily']
    annual=defaultdict(lambda:{'tempSum':0,'tempCount':0,'rainfall':0,'heatwaveDays':0})
    for i,date in enumerate(d['time']):
        a=annual[int(date[:4])];t=d['temperature_2m_mean'][i];mx=d['temperature_2m_max'][i];rain=d['precipitation_sum'][i]
        if t is not None:a['tempSum']+=t;a['tempCount']+=1
        if rain is not None:a['rainfall']+=rain
        if mx is not None and mx>=33:a['heatwaveDays']+=1
    years=[{'year':y,'avgTemperature':round(a['tempSum']/a['tempCount'],2) if a['tempCount'] else None,'rainfall':round(a['rainfall'],1),'heatwaveDays':a['heatwaveDays']} for y,a in sorted(annual.items())]
    first,last=years[0],years[-1]
    return {'region':region['region_name'],'period':'2016~2025','years':years,'comparison':{'temperatureDifference':round(last['avgTemperature']-first['avgTemperature'],2) if first['avgTemperature'] is not None and last['avgTemperature'] is not None else None,'rainfallDifference':round(last['rainfall']-first['rainfall'],1),'heatwaveDaysDifference':last['heatwaveDays']-first['heatwaveDays']}}
