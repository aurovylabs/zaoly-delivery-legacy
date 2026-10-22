# API — Scene Versions & Checkpoints — CREATION v3 (P116)

**Status:** Accepted · **Date:** 2026-09-08  
**Parent:** `specs/domain/editor-version-history.md`  
**Contracts:** `packages/contracts` (`SceneVersionSummary`, `SceneVersionCheckpoint`, `CreateSceneVersionInput`)

---

## 1. Overview

The Scene Versions API provides endpoints for listing, creating, previewing, and restoring named version checkpoints of a `CompositionScene`.

---

## 2. Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/scenes/:id/versions` | Session / Service required | Lists all version summaries for a scene (lightweight, no snapshot body) |
| `POST` | `/api/scenes/:id/versions` | Session required | Creates a new named checkpoint snapshot from the current scene state |
| `GET` | `/api/scenes/:id/versions/:versionId` | Session / Service required | Retrieves the full `CompositionScene` snapshot for a specific checkpoint |
| `POST` | `/api/scenes/:id/versions/:versionId/restore` | Session required | Restores the scene to this checkpoint (with safety pre-snapshot) |

---

## 3. Schemas

### `GET /api/scenes/:id/versions`

**Response (`200 OK`):**
```json
{
  "sceneId": "scene-demo",
  "totalVersions": 2,
  "versions": [
    {
      "id": "ver_9a8f2c",
      "sceneId": "scene-demo",
      "versionNumber": 2,
      "name": "Sprint 42 Final Review",
      "description": "Approved by Brand Design Team with updated CTA buttons.",
      "isAutoSave": false,
      "author": {
        "id": "usr_948192a",
        "name": "Sarah Miller",
        "avatarUrl": "https://avatars.zaoly.internal/sarah.png"
      },
      "pageCount": 3,
      "nodeCount": 48,
      "createdAt": "2026-09-08T07:45:00.000Z"
    },
    {
      "id": "ver_1b7e4d",
      "sceneId": "scene-demo",
      "versionNumber": 1,
      "name": "Initial Import",
      "isAutoSave": true,
      "author": {
        "id": "usr_system",
        "name": "System Importer"
      },
      "pageCount": 2,
      "nodeCount": 32,
      "createdAt": "2026-09-07T18:20:00.000Z"
    }
  ]
}
```

### `POST /api/scenes/:id/versions`

**Request Body:**
```json
{
  "name": "Before Rebranding Experiment",
  "description": "Snapshot taken prior to switching Brandion token pack."
}
```

**Response (`201 Created`):**
```json
{
  "ok": true,
  "version": {
    "id": "ver_3c8d1e",
    "sceneId": "scene-demo",
    "versionNumber": 3,
    "name": "Before Rebranding Experiment",
    "description": "Snapshot taken prior to switching Brandion token pack.",
    "isAutoSave": false,
    "author": {
      "id": "usr_948192a",
      "name": "Sarah Miller"
    },
    "pageCount": 3,
    "nodeCount": 48,
    "createdAt": "2026-09-08T08:35:00.000Z"
  }
}
```

### `POST /api/scenes/:id/versions/:versionId/restore`

**Response (`200 OK`):**
```json
{
  "ok": true,
  "restoredVersionId": "ver_1b7e4d",
  "safetyBackupVersionId": "ver_4f9a0b",
  "scene": {
    "id": "scene-demo",
    "name": "Home Page",
    "updatedAt": "2026-09-08T08:36:00.000Z"
  }
}
```
