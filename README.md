# CSV 기반 Explore Gallery

Midjourney Explore 화면의 핵심 UX를 참고해 만든 독립형 갤러리입니다.

## 실행

가장 간단한 방법은 VS Code의 Live Server 같은 로컬 웹서버로 `index.html`을 실행하는 것입니다.

또는 Python이 설치되어 있다면:

```bash
python -m http.server 8000
```

그 후 `http://localhost:8000` 접속.

## CSV 형식

필수 열은 `image_url`입니다. 아래 열은 선택입니다.

```csv
id,image_url,title,prompt,author,likes,type,created_at
1,https://example.com/a.jpg,제목,이미지 프롬프트,artist01,120,image,2026-09-18
2,https://example.com/b.jpg,제목2,두 번째 프롬프트,artist02,98,video,2026-09-17
```

지원하는 열 별칭:
- `image_url` / `image` / `url`
- `author` / `username`
- `likes` / `like_count`
- `title` / `name`
- `created_at` / `date`

## 포함 기능

- CSV 업로드
- 이미지 URL 기반 Masonry 스타일 갤러리
- 반응형 5/4/3/2열
- Top Day / Likes / Latest 정렬
- All / Images / Videos 필터
- 프롬프트·작가 검색
- 카드 hover 정보
- 좋아요 상태 localStorage 저장
- 클릭 시 큰 이미지 + 프롬프트 상세 모달
- 프롬프트 복사

## 로컬 이미지

브라우저에서 CSV만 선택하는 방식에서는 보안 정책 때문에 PC의 임의 경로를 직접 읽을 수 없습니다. 로컬 이미지를 쓰려면 이미지 파일을 프로젝트의 폴더에 넣고 웹서버로 실행한 뒤 CSV에 상대경로를 넣는 방식을 권장합니다.

예:

```csv
1,images/001.jpg,My Image,my prompt,user,50,image,2026-09-18
```
