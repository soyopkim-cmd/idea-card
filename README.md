# Idea Card

React + Vite로 만든 아이디어 보드입니다. 아이디어 텍스트와 YouTube 링크를 카드로 저장하고 수정/삭제할 수 있습니다.

## Local

```bash
npm install
npm run dev
```

## Supabase 연결

1. Supabase에서 새 프로젝트를 만듭니다.
2. Supabase SQL Editor에서 `supabase-schema.sql` 내용을 실행합니다.
3. `.env.example`을 복사해 `.env.local`을 만들고 값을 채웁니다.

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. 개발 서버를 다시 시작합니다.

```bash
npm run dev
```

환경변수가 없으면 앱은 localStorage를 사용합니다. 환경변수가 있으면 Supabase의 `ideas` 테이블을 사용합니다.

