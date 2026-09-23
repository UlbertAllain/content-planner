# AGENTS.md

## Purpose

Aturan kerja untuk developer dan coding agent pada Nexty Content Planner.

Baca sebelum coding:
- `ARCHITECTURE.md`
- `ENGINEERING_STANDARD.md`

## Stack

- Next.js 16 + TypeScript
- Firebase Authentication
- Firestore melalui Firebase Admin SDK
- Cloudinary
- Zod
- Tailwind CSS 4

## Source Structure

```text
src/
├── app/
├── components/
├── features/
└── lib/

tools/
```

`src/app/` hanya untuk routing/composition dan HTTP boundary. Business logic berada di feature service/repository.

## Request Flow

```text
Page / UI
↓
Server Action / API Route
↓
Authentication / Authorization
↓
Zod Validation
↓
Feature Service
↓
Feature Repository
↓
Firestore / Cloudinary
```

## Security

- Firestore business access server-side.
- Jangan percaya role, ownerId, status, atau schedule dari browser.
- Public idea endpoint wajib mempertahankan validation, honeypot, dan rate limit.
- Cloudinary secret hanya server-side.
- Session/auth mutation harus same-origin bila applicable.
- Jangan commit credential atau migration export.

## Verification

```bash
npm run check
```

CI harus memblokir dependency vulnerability level high/critical.
