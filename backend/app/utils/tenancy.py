def require_same_company(resource_company_id: int, current_company_id: int):
    if resource_company_id != current_company_id:
        raise PermissionError("다른 기업의 데이터에는 접근할 수 없습니다.")
