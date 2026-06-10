"""single_or_none 헬퍼 단위 테스트.

배포된 supabase-py 에서 maybe_single().execute() 가 0행일 때 None 을 반환해
.execute().data 가 AttributeError(=500) 로 터지던 회의록 저장/조회 500 의 근본 원인을
감싸는 헬퍼. 응답이 None 이든, 데이터가 None 이든, 정상 데이터든 안전 동작해야 한다.
"""
import unittest
from types import SimpleNamespace

from app.utils.supabase import single_or_none


class SingleOrNoneTest(unittest.TestCase):
    def test_returns_none_when_execute_returns_none(self):
        # 0행 → execute() 가 None (문제의 버전 동작)
        query = SimpleNamespace(execute=lambda: None)
        self.assertIsNone(single_or_none(query))

    def test_returns_none_when_data_is_none(self):
        # execute() 는 응답 객체지만 data 가 None
        query = SimpleNamespace(execute=lambda: SimpleNamespace(data=None))
        self.assertIsNone(single_or_none(query))

    def test_returns_data_when_present(self):
        row = {"id": "m1", "content": "hello"}
        query = SimpleNamespace(execute=lambda: SimpleNamespace(data=row))
        self.assertEqual(single_or_none(query), row)


if __name__ == "__main__":
    unittest.main()
