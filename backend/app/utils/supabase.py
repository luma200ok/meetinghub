from supabase import create_client, Client
from flask import current_app


def get_supabase() -> Client:
    return create_client(
        current_app.config['SUPABASE_URL'],
        current_app.config['SUPABASE_SERVICE_KEY'],
    )


def single_or_none(query):
    """`maybe_single()` 쿼리를 실행하고 0행이면 None 을 반환한다.

    일부 supabase-py/postgrest 버전은 `maybe_single().execute()` 가 0행일 때
    응답 객체가 아니라 **None** 을 반환한다. 그 결과 `.execute().data` 가
    `AttributeError: 'NoneType' object has no attribute 'data'` (=500) 로 터졌다.
    (회의록 저장/조회 500의 근본 원인). 응답·데이터 모두 안전 처리한다.

    사용: `single_or_none(self.table.select(...).eq(...).maybe_single())`
    """
    res = query.execute()
    return res.data if res is not None else None
