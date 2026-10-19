from database.connection import db,query
from services.weather import observations,status

def list_news():
    return query("""SELECT n.id,r.region_name AS region,n.temp,n.weather_status,n.warning_type,n.news_title,n.news_content,n.created_at FROM weather_news n JOIN region r ON r.region_id=n.region_id ORDER BY n.created_at DESC LIMIT 30""")

def create(region,temp,weather_status,warning_type='없음'):
    found=query('SELECT region_id FROM region WHERE region_name=%s OR city_code=%s LIMIT 1',(region,region))
    if not found:raise ValueError('등록되지 않은 지역입니다.')
    title=f'[{region}] 현재 날씨 {float(temp):.1f}℃ · {weather_status}'
    content=f'{region} 지역의 기온은 {float(temp):.1f}℃이며 날씨는 {weather_status}입니다. 기상 이벤트: {warning_type}.'
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute('INSERT INTO weather_news(region_id,temp,weather_status,warning_type,news_title,news_content) VALUES(%s,%s,%s,%s,%s,%s)',(found[0]['region_id'],temp,weather_status,warning_type,title,content))
            nid=cur.lastrowid
    return next(x for x in list_news() if x['id']==nid)

def generate():
    created=[]
    for o in observations():
        created.append(create(o['region_name'],o['temperature'],o['weather_status']))
    return {'generatedCount':len(created),'data':created}
