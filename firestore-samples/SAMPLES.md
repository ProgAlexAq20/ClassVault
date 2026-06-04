# Firestore sample documents for ClassVault

Below are example documents showing the recommended Firestore shape (use `userId`, `subjectId`, etc.). Replace placeholder IDs with real Auth UIDs and auto-generated doc IDs.

## users/{userId}

{
  "userId": "USER_UID_abc123",
  "email": "student@example.com",
  "displayName": "Alice Student",
  "photoUrl": "https://...",
  "createdAt": "2026-06-04T12:00:00Z (Firestore Timestamp)",
  "updatedAt": "2026-06-04T12:00:00Z (Firestore Timestamp)"
}

## subjects/{subjectId}

{
  "subjectId": "SUBJ_001",
  "userId": "USER_UID_abc123",
  "name": "Matemática",
  "color": "#E53E3E",
  "icon": "calculator",
  "createdAt": "(Timestamp)",
  "updatedAt": "(Timestamp)"
}

## tasks/{taskId}

{
  "taskId": "TASK_001",
  "userId": "USER_UID_abc123",
  "subjectId": "SUBJ_001",
  "subjectName": "Matemática", // denormalized for fast reads
  "title": "Estudo capítulo 4",
  "description": "Resolver exercícios 1-10",
  "dueDate": "2026-06-10T00:00:00Z (Timestamp)",
  "dueTime": "18:00",
  "status": "open",
  "progress": 0,
  "priority": "medium",
  "createdAt": "(Timestamp)",
  "updatedAt": "(Timestamp)"
}

## assignments/{assignmentId}

{
  "assignmentId": "ASSIGN_001",
  "userId": "USER_UID_abc123",
  "subjectId": "SUBJ_001",
  "title": "Trabalho final",
  "description": "Apresentação sobre números primos",
  "dueDate": "2026-06-20T00:00:00Z (Timestamp)",
  "status": "todo",
  "grade": 8.5,
  "createdAt": "(Timestamp)",
  "updatedAt": "(Timestamp)"
}

## files/{fileId}

{
  "fileId": "FILE_001",
  "userId": "USER_UID_abc123",
  "subjectId": "SUBJ_001",
  "assignmentId": "ASSIGN_001",
  "name": "slides.pdf",
  "originalName": "Trabalho_Alice.pdf",
  "storagePath": "user_uploads/USER_UID_abc123/slides.pdf",
  "downloadUrl": "https://firebasestorage.googleapis.com/...",
  "fileType": "application/pdf",
  "extension": "pdf",
  "sizeBytes": 123456,
  "category": "assignment",
  "status": "available",
  "createdAt": "(Timestamp)",
  "updatedAt": "(Timestamp)"
}

## aiConversations/{conversationId}

{
  "aiConversationId": "CONV_001",
  "userId": "USER_UID_abc123",
  "title": "Ajuda com prova",
  "model": "gpt-4o-mini",
  "createdAt": "(Timestamp)",
  "updatedAt": "(Timestamp)"
}

## aiMessages/{messageId}

{
  "messageId": "MSG_001",
  "aiConversationId": "CONV_001",
  "userId": "USER_UID_abc123",
  "role": "user",
  "content": "Me explique o teorema X",
  "createdAt": "(Timestamp)"
}

Notes:
- Use Firestore `Timestamp` values: set `createdAt`/`updatedAt` via `FieldValue.serverTimestamp()` on writes.
- Prefer `userId` (Auth UID) for ownership and security rules.
- Denormalize small read-heavy fields like `subjectName` to avoid multi-query joins.
