# DB 연결·저장·실패 복구를 한곳에서 처리하는 공통 코드입니다.
import os
from contextlib import contextmanager
import pymysql
from dotenv import load_dotenv
# .env 값을 환경 변수로 읽습니다. 비밀번호와 API 키가 든 .env는 공유하지 마세요.
load_dotenv()

# with db() as conn: 블록이 끝나면 아래 commit/rollback/close가 실행됩니다.
@contextmanager
def db():
    # DictCursor는 조회 결과를 {'region_id': 1} 같은 사전 형태로 돌려줍니다.
    # autocommit=False이므로 성공한 블록의 작업만 명시적으로 저장합니다.
    conn = pymysql.connect(host=os.getenv('DB_HOST','localhost'), port=int(os.getenv('DB_PORT','3306')), user=os.getenv('DB_USER','root'), password=os.getenv('DB_PASSWORD',''), database=os.getenv('DB_NAME','weather_korea'), charset='utf8mb4', cursorclass=pymysql.cursors.DictCursor, connect_timeout=5, autocommit=False)
    try:
        # yield에서 호출한 쪽의 with 블록을 실행하고, 정상 종료하면 돌아옵니다.
        yield conn
        # 여기까지 오류가 없을 때만 이번 연결의 변경을 확정합니다.
        conn.commit()
    except Exception:
        # 실패한 연결의 미확정 변경을 취소합니다. 이미 끝난 다른 연결은 취소되지 않습니다.
        conn.rollback()
        # 오류를 숨기지 않고 호출한 서비스/API가 처리하도록 다시 전달합니다.
        raise
    finally:
        # 성공·실패와 관계없이 연결을 닫아 자원 낭비를 막습니다.
        conn.close()

# 조회용 도우미입니다. SQL의 %s 자리와 args 값을 분리해서 전달합니다.
# 사용자 입력을 문자열 덧붙이기로 SQL에 직접 넣지 마세요.
def query(sql, args=()):
    with db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql,args)
            return cur.fetchall()

