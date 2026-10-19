이 폴더의 `login-demo.html`은 claude.ai 아티팩트로 만든 "샤오미 매장 보고 도우미" 데모야.
(React 18 UMD + htm, 단일 HTML 파일, 약 3,600줄)
이걸 **Next.js(App Router, TypeScript)** 로 옮기고 **Vercel**에 배포할 수 있게 만들어줘.

먼저 파일 전체를 읽고, 구조 파악 → 작업 계획을 단계별로 보여준 뒤 진행해줘.
화면·기능·문구·디자인(CSS 변수, 다크모드 포함)은 최대한 그대로 유지해.

---

## 0. 구조
- htm 템플릿 → JSX 컴포넌트로 분리 (탭별 폴더: open, record, close, sales, todo, schedule, community, retro, products, settings, admin)
- 데이터 상수(GROUPS, METRICS, ALL_PRODUCTS, 문구 칩, GUIDES 등)는 `src/data/`로 분리
- 전역 변수(PERM, ROLE, DEFS, ITEM_T, REQ 등)는 React Context로 바꿔줘
- `confirm()` / `prompt()` / `alert()`는 전부 화면 안 모달·인라인 확인으로 교체
- 모바일 우선(390px 기준), 상단 탭 내비 유지

## 1. 로그인 (첫 화면)
버튼 3개: **직원으로 로그인 / 게스트로 둘러보기 / 관리자 로그인**
- 앱은 Firebase 익명 로그인으로 시작하고, 역할은 서버가 custom claim으로 붙임
  `{role:"admin"|"staff"|"guest", store?:string}` → 클라이언트는 `getIdToken(true)`로 갱신
- **직원**: 버튼을 누른 뒤에만 "매장 오픈일 (yymmdd 형식)" 입력칸과 이름(선택) 칸이 나옴
  - `POST /api/login/staff` 에서 env `STORE_CODES`(JSON: 코드→지점명)와 비교
  - 맞으면 `role:"staff", store:지점명` claim 부여 → 그 지점으로 자동 입장, 지점은 고정(설정에서 변경 불가)
  - 이름을 비우면 지점 기준 랜덤 기본값: `"김"+지점명에서 '점' 뺀 것+1~99` (예: 김수지12, 김구리5, 김운정71)
  - 이름은 `users/{uid}`에 저장, 설정 탭에서 변경 가능
- **관리자**: 아이디·비밀번호 → `POST /api/login/admin` 에서 env `ADMIN_ID`/`ADMIN_PASSWORD`와 timing-safe 비교 → `role:"admin"`. 매장 선택 자유
- **게스트**: `POST /api/login/guest` → `role:"guest"` 바로 입장. 지점 없음 → 헤더는 그냥 "보고 도우미", 보고서 문구의 지점명 자리는 "매장"
- 첫 화면에 admin 계정이나 "오픈일로 로그인" 같은 힌트 문구 넣지 마
- 로그인 API에 실패 횟수 제한 (IP+uid 기준 5회 실패 시 10분 잠금)
- 코드·비밀번호는 **서버 env에서만** 읽기 (`NEXT_PUBLIC_` 금지, 클라이언트 번들에 절대 포함 X)
  - 데모 HTML에 있는 `STORE_CODE_HASH`, `ADMIN_DEFAULT` 해시, '관리자 계정 변경' 카드, `config/admin` 문서는 전부 삭제
- 상단 바: 역할 칩 + 이름 · 지점 + 로그아웃 버튼(확인창 없이 바로 첫 화면으로)

## 2. 권한
| | 관리자 | 직원 | 게스트 |
|---|---|---|---|
| 공유 데이터 조회 | O | O | 제품·팁·경쟁 제품만 |
| 추가 | O | O | X |
| 수정 | O | 본인 글만 (공유방 글·댓글, 팁, 경쟁 제품). 일정·제품 가격은 누구나 | X |
| 삭제·단종 숨김·기본값 복원 | O | X → "삭제 요청" 버튼 | X |
| 관리 탭 | O | X | X |
| 공유방 탭 | O | O | **숨김** |
| 일정 탭 + 오픈/마감 탭의 일정 미리보기 | O | O | **숨김** |
| 오픈·기록·마감·세일즈·회고·할일 (로컬) | O | O | O |

- 일정은 만든 사람 `by`와 마지막 수정자 `editedBy`를 표시
- 관리 탭: 삭제 요청 처리(삭제/반려, 처리 기록), 전체 콘텐츠(공유방 글·댓글·팁·경쟁 제품·일정·수정된 제품) 검색·삭제, 탭에 대기 건수 배지

## 3. 데이터 저장 위치 (중요: 법적 이슈)
- **매출·목표·고객 정보(오픈/마감/기록/세일즈/회고)와 할일 체크리스트는 localStorage에만** 저장. 절대 Firestore로 보내지 마
- 백업·복구 기능 없음. "브라우저 캐시 지우면 사라지니 필요하면 복사해서 개인 메모에 보관" 안내 유지
- 공유 데이터는 Firestore. 컬렉션 이름 유지: `catalog, tips, rivals, schedule, posts, comments, delreq, users`
- 공유 입력에 전화번호·매출 금액 패턴 차단(`checkShare`, `PHONE_RE`, `MONEY_RE`) 유지

## 4. 할일 탭 (개인 체크리스트, 로컬 전용)
데모의 `TodoTab` 그대로 옮기기:
- 첫 진입 시 "빈 목록으로 시작 / 예시 목록으로 시작"
- 묶음(섹션) 직접 생성·이름변경·삭제, 묶음마다 "항상 / 오픈 근무 / 마감 근무" 표시 조건
- 오늘 근무 선택(오픈·마감·풀타임·휴무) → 맞는 묶음만 표시, 휴무는 '쉬는 날 할 일'만
- 항목: 오늘만 / 반복, 요일 지정, 세부 항목(전부 체크되면 상위 자동 체크), 날짜별 체크 기록
- 편집 모드에서 **드래그 앤 드롭** (pointer events 기반, 터치 지원, 화면 끝 자동 스크롤)
  - 항목 순서, 다른 묶음으로 이동, 세부 항목으로 넣기/빼기, 묶음 순서
  - 가능하면 `@dnd-kit` 사용해서 접근성(키보드)까지 챙겨줘
- 오픈보고·미워크·회고·매출기록·제품공부 항목엔 해당 탭 바로가기

## 5. firestore.rules
- 읽기: 로그인 + role 있음. 단 guest는 `posts, comments, schedule, delreq, users` 읽기 불가
- `delreq` 전체 조회·`users` 전체 조회는 admin만 (본인 users 문서는 본인 가능)
- 생성: role in [admin, staff] && `by == request.auth.uid`
- 수정:
  - posts / comments / tips / rivals → `resource.data.by == request.auth.uid`, by 필드 변경 금지
  - posts의 `likes` 필드만 바꾸는 업데이트는 staff 누구나
  - schedule → staff/admin 누구나 (by·created 변경 금지)
  - catalog → staff/admin, 단 `hidden` 변경은 admin만
- 삭제: admin만 (단 delreq 생성은 staff 가능)
- guest는 모든 쓰기 거부

## 6. 마무리
- `.env.example` (키 이름만), README에 Firebase 설정(익명 로그인 활성화, 서비스 계정, `firebase deploy --only firestore:rules`)과 Vercel 배포 방법
- `npm run build` 통과 확인, 각 역할(직원/게스트/관리자)로 주요 흐름 수동 테스트 체크리스트도 README에
