# ARCHITECTURE.md

## Overview

Nexty Content Planner adalah modular monolith berbasis feature untuk workflow konten internal dan ide publik.

## Structure

```text
src/
├── app/
│   ├── (auth)/
│   ├── (workspace)/
│   └── api/
├── components/
│   ├── layout/
│   └── shared/
├── features/
│   ├── activities/
│   ├── assets/
│   ├── comments/
│   ├── contents/
│   ├── ideas/
│   ├── master-data/
│   └── users/
└── lib/
    ├── auth/
    ├── cloudinary/
    ├── firebase/
    ├── permissions/
    └── utils/

tools/
└── migration/
```

## Dependency Flow

```text
UI / Page
↓
Server Action / API Route
↓
Auth / Permission
↓
Schema Validation
↓
Service
↓
Repository
↓
Firestore / Cloudinary
```

Feature repository adalah persistence boundary untuk domain terkait. Generic infrastructure tetap berada di `src/lib/`.

## Public Idea Boundary

Endpoint ide publik adalah exception yang tidak membutuhkan login, tetapi harus mempertahankan:
- Zod validation;
- honeypot;
- server-side IP hashing/rate limit;
- no direct browser Firestore write.

## Architecture Rule

Jangan membuat layer/folder baru tanpa responsibility konkret. Refactor dilakukan untuk memperjelas boundary, bukan demi jumlah folder.
