import os
from contextlib import contextmanager
import pymysql
from dotenv import load_dotenv
load_dotenv()

@contextmanager
def db():
    conn = pymysql.connect(host=os.getenv('DB_HOST','localhost'), port=int(os.getenv('DB_PORT','3306')), user=os.getenv('DB_USER','root'), password=os.getenv('DB_PASSWORD',''), database=os.getenv('DB_NAME','weather_korea'), charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor, connect_timeout=5, autocommit=False)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def query(sql, args=()):
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql,args)
            return cur.fetchall()
