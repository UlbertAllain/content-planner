# ENGINEERING_STANDARD.md

## Principles

Clean Code, Separation of Concerns, SRP, DRY, KISS, YAGNI, strict TypeScript, runtime validation, dan security-first design.

## Feature Convention

Feature boleh memiliki:
- actions;
- service;
- repository;
- schema;
- types;
- feature-specific UI.

Tidak semua file wajib ada.

## Server Authority

Business mutation harus memvalidasi authentication, authorization, input, ownership, dan transition di server.

## Firestore

Browser tidak menjadi authoritative source untuk business data. Repository bertanggung jawab terhadap query/persistence dan service bertanggung jawab terhadap business rule.

## Cloudinary

Upload harus authenticated/authorized, folder/path dibatasi, dan secret tidak boleh terekspos ke client.

## Public Input

Input publik harus dianggap hostile. Pertahankan validation, spam control, rate limit, dan safe error response.

## Quality Gate

```bash
npm run check
```

CI menggunakan deterministic install dan menolak high/critical dependency vulnerability.
