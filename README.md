# 보고 도우미

샤오미 매장 직원용 보고서 도우미. `login-demo.html`(claude.ai 아티팩트 프로토타입)을 Next.js(App Router, TypeScript)로 옮긴 버전입니다.

## 데이터가 어디에 저장되나

- **이 기기에만 저장 (localStorage, 서버로 전송 안 함)**: 오픈/마감 보고서, 판매 기록, 세일즈 보고, 회고, 할일 체크리스트. 매출·고객 정보가 섞여 있어서 법적 문제를 피하려고 의도적으로 서버에 보내지 않습니다. 브라우저 캐시를 지우면 복구할 수 없어요.
- **Firestore (직원끼리 공유)**: 제품 가격 수정·경쟁 제품 비교(`catalog`, `rivals`), 직원 세일즈 팁(`tips`), 매장 일정(`schedule`), 공유방 글/댓글(`posts`, `comments`), 삭제 요청(`delreq`), 직원 이름(`users`).

## 로그인 구조

- Firebase 익명 인증으로 시작 → `/api/login/{staff,admin,guest}`가 서버에서 자격을 확인하고 Firebase custom claim(`role`, `store`)을 붙입니다.
- 매장 코드(yymmdd)·관리자 아이디/비번은 서버 환경 변수에서만 읽습니다 (`NEXT_PUBLIC_` 아님 → 브라우저 번들에 들어가지 않음).
- 로그인 실패 5회(IP+세션 기준) 시 10분 잠금.

## 처음 설정하기

### 1. Firebase 프로젝트

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트를 만듭니다.
2. **Authentication** → 로그인 방법 → **익명** 활성화.
3. **Firestore Database** 생성 (프로덕션 모드).
4. 프로젝트 설정 → 일반 → 내 앱(웹 앱 추가) → `firebaseConfig` 값을 `.env.local`의 `NEXT_PUBLIC_FIREBASE_*`에 넣습니다.
5. 프로젝트 설정 → 서비스 계정 → **새 비공개 키 생성** → 받은 JSON 전체를 한 줄로 이어붙여 `.env.local`의 `FIREBASE_SERVICE_ACCOUNT`에 넣습니다.
6. `STORE_CODES`(JSON, 코드→지점명), `STORE_POS_IDS`(JSON, 지점명→포스ID 4자리), `ADMIN_ID`, `ADMIN_PASSWORD`를 정합니다. 예:
   ```
   STORE_CODES={"250101":"수지점","250202":"구리점"}
   STORE_POS_IDS={"수지점":"1004","구리점":"0000","운정점":"0000"}
   ADMIN_ID=admin
   ADMIN_PASSWORD=아무도-모르는-비밀번호
   ```
   직원 로그인은 매장 코드(yymmdd) + 포스ID(4자리) 두 가지를 모두 맞혀야 합니다. 구리점·운정점 포스ID는 아직 실제 값을 몰라서 `0000`으로 임시 설정해뒀으니, 알게 되면 바로 바꿔주세요.
7. `.env.example`을 참고해 `.env.local`을 채웁니다 (이미 채워져 있다면 생략).

### 2. Firestore 보안 규칙 배포

```bash
npm install -g firebase-tools   # 처음 한 번만
firebase login
firebase use <프로젝트-ID>
firebase deploy --only firestore:rules
```

(firebase.json이 없다면 `firebase init firestore`로 만들고 `firestore.rules` 경로만 이 레포의 `firestore.rules`로 맞춰주면 됩니다.)

### 3. 로컬 실행

```bash
npm install
npm run dev
```

### 4. Vercel 배포

1. 이 레포를 GitHub에 올리고 Vercel에서 Import.
2. Vercel 프로젝트 설정 → Environment Variables에 `.env.local`의 모든 값을 그대로 등록 (Production/Preview 둘 다).
3. Deploy.

## 제품 데이터 갱신하기

`src/data/groups.ts`, `metrics.ts`, `official.ts`, `phrases.ts`, `guides.ts`는 `login-demo.html` 원본에서 **타이핑 없이 스크립트로 추출**해 생성했습니다. 원본 아티팩트(`login-demo.html`)를 새 버전으로 교체한 뒤:

```bash
node scripts/extract-data.mjs
node scripts/gen-ts.mjs
```

을 실행하면 위 데이터 파일들이 다시 생성됩니다 (가격·스펙처럼 손으로 옮기면 실수하기 쉬운 데이터라 이 방식을 씁니다).

## 수동 테스트 체크리스트

### 공통

- [ ] `npm run build` 성공
- [ ] 로그인 전 첫 화면에 관리자 계정이나 코드 힌트가 전혀 안 보임

### 직원 (staff)

- [ ] 매장 코드(yymmdd) + 포스ID(4자리)로 로그인 → 맞는 지점으로 들어감
- [ ] 포스ID를 틀리면 "포스ID가 맞지 않아요" 에러, 5번 틀리면 잠김
- [ ] 이름 비우고 로그인 → "김OO숫자" 형식 자동 이름 부여
- [ ] 오픈/기록/마감/세일즈/회고/할일 작성 → 새로고침해도 남아있음 (localStorage)
- [ ] 할일 '목록 편집'에서 항목 이름을 고칠 수 있고, '탭 바로가기'를 직접 골라 지정/해제할 수 있음
- [ ] 할일 편집 모드가 아닐 때 '오늘만/반복' 토글로 오늘 하루만 할 일을 빠르게 추가·삭제할 수 있음
- [ ] 설정 탭 '보고서 커스텀 항목'에서 텍스트 목록/금액 관리 항목을 추가하면 오픈·마감보고에 바로 나타나고, 복사한 보고서에도 포함됨
- [ ] 금액 관리 항목에 매일 사용 금액을 넣으면 남은 금액이 총 예산에서 누적 차감되어 표시됨
- [ ] 회고 '오늘 하루' 카드에 '걸리는 일 · 찜찜했던 일'을 적으면 복사한 회고에 포함됨
- [ ] 마감보고 리테일·포스 차액 사유 합계가 안 맞으면 복사 전 경고
- [ ] 오픈/마감보고 "오늘 상황" 칩을 고르면 코멘트/금일 핵심 내용/익일 계획에 추천 문장이 뜨고, "넣기"로 바로 들어감
- [ ] 마감보고 "금일 스마트폰 인사이트"에 항목을 추가하면 복사한 보고서의 [금일 핵심 내용]과 [익일 계획] 사이에 들어감
- [ ] 제품 탭에서 가격 수정 → 다른 브라우저(시크릿창 등)로 같은 매장 로그인 시 바뀐 가격이 보임
- [ ] 공유방 글 작성, 댓글, 좋아요 가능 / 전화번호·매출 금액 쓰면 막힘
- [ ] 일정 추가(행사) → 가격표 교체/원복 할 일이 자동으로 생김
- [ ] 다른 직원이 올린 글/일정은 삭제 버튼 대신 "삭제 요청"만 보임
- [ ] 로그아웃 → 확인창 없이 바로 첫 화면

### 게스트 (guest)

- [ ] 일정·공유방 탭이 아예 안 보임
- [ ] 제품 탭은 보이지만 가격 수정 버튼이 안 보임
- [ ] 오픈/기록/마감/세일즈/회고/할일은 정상적으로 쓸 수 있음 (로컬 저장)

### 관리자 (admin)

- [ ] 아이디/비번으로 로그인, 5회 틀리면 10분 잠김
- [ ] "관리" 탭이 보이고, 대기 중인 삭제 요청 수가 배지로 표시됨
- [ ] 삭제 요청 승인 → 실제로 지워짐 / 반려 → 안 지워짐
- [ ] 직원 글/일정/제품을 직접 삭제·숨김 가능
