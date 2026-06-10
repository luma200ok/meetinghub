# 김관영 — 기업 & 조직 관리

> 먼저 [공통 가이드](00-common.md)를 읽으세요.

## 담당 범위
회원가입 · 기업 생성 · 직원 초대 · 조직도(부서/직급/직원)

## 담당 파일
| 파일 | 내용 |
|------|------|
| `backend/app/routes/auth.py` | 회원가입 / 초대 / 초대 수락 |
| `backend/app/routes/companies.py` | 기업 생성/조회 |
| `backend/app/routes/organization.py` | 부서 / 직급 / 직원 |
| `backend/app/services/auth_service.py` | ← 구현 |
| `backend/app/services/company_service.py` | ← 구현 |
| `backend/app/services/organization_service.py` | ← 구현 |
| `frontend/src/app/(auth)/` | 로그인/회원가입/초대 화면 |
| `frontend/src/app/(dashboard)/organization/` | 조직도 화면 |

## 관련 테이블
`companies`, `users`, `company_members`, `departments`, `positions`, `invitations`

## 핵심 시나리오 (PRD §18)
```
회원가입 → 기업 생성(생성자=ADMIN 자동) → 직원 초대 → 초대 수락 → 조직도 구성
```

## 구현 순서
1. **회원가입** (`auth_service.signup`)
   - Supabase Auth로 계정 생성 → `users` 테이블에 행 추가
2. **기업 생성** (`company_service.create`)
   - `companies` insert
   - 생성한 사용자를 `company_members`에 `role='ADMIN'`으로 등록 ← 핵심
3. **직원 초대** (`auth_service.invite`)
   - `invitations`에 토큰 생성(예: `uuid4`) + 저장
   - (선택) 이메일 발송
4. **초대 수락** (`auth_service.accept_invite`)
   - 토큰 검증 → 만료/사용여부 확인 → 회원 생성 → `company_members`에 `role='MEMBER'` 등록 → 초대 `accepted=true`
5. **조직도** (`organization_service`)
   - 부서 CRUD (부서는 `parent_id`로 계층 가능)
   - 직급 등록
   - 직원 목록 (부서·직급 join)
   - ADMIN이 기존 직원의 이름·부서·직급 수정

## 체크포인트
- [ ] 기업 생성자가 자동으로 ADMIN이 되는가?
- [ ] 초대 토큰은 한 번만 사용 가능한가? (재사용 방지)
- [ ] 부서/직급/직원 조회 시 `company_id`로 격리되는가?
- [ ] ADMIN만 부서/직급을 생성·삭제할 수 있는가? (권한 체크)
- [ ] ADMIN만 직원의 이름·부서·직급을 수정할 수 있는가?
- [ ] 직원에게 배정하는 부서·직급이 같은 회사 소속인지 검증하는가?

## 힌트
- 권한 체크는 `g.user`로 현재 사용자의 `company_members.role`을 조회해 판단
- 부서 계층은 트리. 우선 1단계만 구현하고 나중에 `parent_id` 확장
