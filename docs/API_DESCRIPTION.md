# VDCD Backend — API Description

> **Base URL:** `http://localhost:3001/api/v1`
> **Framework:** NestJS (TypeScript) · **Database:** PostgreSQL 15+ · **Auth:** JWT (HttpOnly Cookies)
> **Swagger UI:** `http://localhost:3001/api/docs` *(only enabled in development environment)*

---

## Table of Contents

- [1. Response Format](#1-response-format)
- [2. Authentication & Authorization](#2-authentication--authorization)
- [3. Pagination](#3-pagination)
- [4. Auth](#4-auth)
- [5. Admin Users](#5-admin-users)
- [6. Organization](#6-organization)
- [7. Slides](#7-slides)
- [8. Provinces](#8-provinces)
- [9. Partners](#9-partners)
- [10. Operation Fields](#10-operation-fields)
- [11. Programs](#11-programs)
- [12. Solutions](#12-solutions)
- [13. Projects](#13-projects)
- [14. Articles](#14-articles)
- [15. Jobs](#15-jobs)
- [16. Leads](#16-leads)
- [17. Upload](#17-upload)
- [18. Health](#18-health)

---

## 1. Response Format

### ✅ Success Response

All successful responses are wrapped by `TransformInterceptor`:

```json
{
  "statusCode": 200,
  "data": { ... }
}
```

### ❌ Error Response

```json
{
  "statusCode": 400,
  "message": "Error description or validation messages",
  "timestamp": "2026-07-26T12:00:00.000Z",
  "path": "/api/v1/..."
}
```

### Validation Error (400)

```json
{
  "statusCode": 400,
  "message": [
    "title must be a string",
    "email must be an email"
  ],
  "timestamp": "...",
  "path": "..."
}
```

---

## 2. Authentication & Authorization

### Mechanism

- Uses **JWT tokens** stored in **HttpOnly Cookies** (`accessToken`, `refreshToken`)
- `accessToken` is used to authenticate each request
- `refreshToken` is used to reissue `accessToken` when it expires

### Roles

| Role | Permissions |
| --- | --- |
| `superadmin` | Full access: CRUD all resources, delete, manage admin users |
| `editor` | Create, edit, toggle publish/active. Cannot delete, cannot manage admins |
| `viewer` | View only (no dedicated admin endpoints) |

### Legend

| Icon | Description |
| --- | --- |
| 🔓 | Public — no login required |
| 🔐 | Login required (JWT) |
| 👑 | `superadmin` only |
| ✏️ | `superadmin` + `editor` |

### Rate Limiting

- Default: **100 requests / 60 seconds** (app-wide)
- Login: **5 requests / 60 seconds** (endpoint-specific)

---

## 3. Pagination

List endpoints support pagination using common query params:

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| `page` | integer | `1` | Current page (min: 1) |
| `limit` | integer | `10` | Items per page (min: 1, max: 100) |

**Response format:**

```json
{
  "statusCode": 200,
  "data": {
    "items": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## 4. Auth

**Prefix:** `/api/v1/auth`

### 4.1. 🔓 POST `/auth/login`

Login to the system. Sets `accessToken` and `refreshToken` in HttpOnly Cookies.

**Rate Limit:** 5 req / 60s

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `email` | string (email) | ✅ | Login email |
| `password` | string | ✅ | Password |

```json
{
  "email": "admin@vdcd.vn",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "statusCode": 201,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": "uuid",
      "username": "admin_user",
      "email": "admin@vdcd.vn",
      "role": "superadmin"
    }
  }
}
```

**Errors:** `401` — Invalid email or password · `403` — Account locked

---

### 4.2. 🔓 POST `/auth/refresh`

Refresh access token. Reads `refreshToken` from cookies, sets new `accessToken` in cookies.

**Response (201):**

```json
{
  "statusCode": 201,
  "data": { "success": true }
}
```

**Errors:** `401` — Refresh token missing / invalid / expired

---

### 4.3. 🔐 POST `/auth/logout`

Logout, revoke session on Redis, clear both cookies.

**Response (201):**

```json
{
  "statusCode": 201,
  "data": { "message": "Logged out successfully" }
}
```

**Errors:** `401` — Unauthorized

---

### 4.4. 🔐 GET `/auth/me`

Get the currently logged-in account information.

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "username": "admin_user",
    "email": "admin@vdcd.vn",
    "role": "superadmin",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors:** `401` — Unauthorized

---

## 5. Admin Users

**Prefix:** `/api/v1/admin/users`
**Auth:** 🔐 All endpoints · 👑 `superadmin` only

### 5.1. 👑 GET `/admin/users`

Get list of admin users (with pagination + filter).

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | integer | ❌ | Page (default: 1) |
| `limit` | integer | ❌ | Items per page (default: 10) |
| `role` | string | ❌ | Filter by role: `superadmin`, `editor`, `viewer` |

**Response (200):** Paginated list of admin users

---

### 5.2. 👑 POST `/admin/users`

Create a new admin user.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | ✅ | Username |
| `email` | string (email) | ✅ | Email |
| `password` | string | ✅ | Password |
| `role` | string | ✅ | `superadmin` / `editor` / `viewer` |

**Response (201):** Admin user object
**Errors:** `409` — Email already exists

---

### 5.3. 👑 PATCH `/admin/users/:id`

Update an admin user.

**Path Params:** `id` (UUID)

**Request Body (all optional):**

| Field | Type | Description |
| --- | --- | --- |
| `username` | string | New username |
| `email` | string (email) | New email |
| `role` | string | New role |
| `password` | string | New password |
| `isActive` | boolean | Account status |

**Response (200):** Updated admin user object
**Errors:** `404` — Not found · `409` — Email already exists

---

### 5.4. 👑 DELETE `/admin/users/:id`

Permanently delete an admin user.

**Path Params:** `id` (UUID)

**Response (200):**

```json
{ "statusCode": 200, "data": { "message": "Deleted successfully" } }
```

**Errors:** `404` — Not found

---

## 6. Organization

**Prefix:** `/api/v1/organization`
**Description:** Single-row config — stores VDCD organization information.

### 6.1. 🔓 GET `/organization`

Get organization information (public).

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "VDCD",
    "tagline": "Elevating Vietnamese Values",
    "description": "...",
    "mission": "...",
    "vision": "...",
    "coreValues": "...",
    "foundedYear": 2015,
    "stats": { "provinces": 10, "centers": 5, "projects": 120, "staff": 45 },
    "socialLinks": { "facebook": "...", "zalo": "...", "youtube": "..." },
    "updatedAt": "..."
  }
}
```

---

### 6.2. ✏️ PUT `/organization`

Update organization information.

**Request Body (all optional):**

| Field | Type | Description |
| --- | --- | --- |
| `name` | string | Organization name |
| `tagline` | string | Slogan |
| `description` | string | Description (rich text) |
| `mission` | string | Mission |
| `vision` | string | Vision |
| `coreValues` | string | Core values |
| `foundedYear` | integer | Year founded |
| `stats` | object | Statistics `{ provinces, centers, projects, staff }` |
| `socialLinks` | object | Social networks `{ facebook, zalo, youtube, ... }` |

**Response (200):** Updated organization object

---

## 7. Slides

**Prefix:** `/api/v1/slides`
**Description:** Manage homepage slideshow.

### 7.1. 🔓 GET `/slides`

Get list of active slides, sorted by `order`.

**Response (200):** Array of active Slide objects

---

### 7.2. ✏️ GET `/slides/all`

Get all slides (including inactive), used for admin.

**Response (200):** Array of all Slide objects

---

### 7.3. ✏️ POST `/slides`

Create a new slide.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✅ | Slide title (max 255) |
| `description` | string | ❌ | Short description |
| `ctaText` | string | ❌ | CTA button text (max 100) |
| `ctaUrl` | string | ❌ | CTA link |
| `imageUrl` | string | ✅ | Slide background image URL |
| `imageFileId` | string | ❌ | Image file ID on ImageKit |
| `order` | integer | ❌ | Display order |
| `isActive` | boolean | ❌ | Active status |

**Response (201):** Created Slide object

---

### 7.4. ✏️ PATCH `/slides/reorder`

Reorder slides.

**Request Body:**

```json
{
  "items": [
    { "id": "uuid-1", "order": 0 },
    { "id": "uuid-2", "order": 1 }
  ]
}
```

**Response (200):** Success

---

### 7.5. ✏️ PATCH `/slides/:id`

Update a slide by ID. Body is the same as `POST` but all fields are optional.

**Path Params:** `id` (UUID)
**Response (200):** Updated Slide object
**Errors:** `404` — Slide not found

---

### 7.6. ✏️ PATCH `/slides/:id/toggle`

Toggle slide active status.

**Path Params:** `id` (UUID)

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `isActive` | boolean | ✅ | Active status |

**Response (200):** Success
**Errors:** `404` — Slide not found

---

### 7.7. 👑 DELETE `/slides/:id`

Permanently delete a slide.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Slide not found

---

## 8. Provinces

**Prefix:** `/api/v1/provinces`
**Description:** List of Vietnamese provinces/cities.

### 8.1. 🔓 GET `/provinces`

Get all provinces/cities, sorted by name.

**Response (200):** Array of Province objects

---

### 8.2. 🔓 GET `/provinces/:code`

Get province information by code.

**Path Params:** `code` (string) — e.g.: `GL`, `HN`
**Response (200):** Province object
**Errors:** `404` — Province not found

---

### 8.3. ✏️ POST `/provinces`

Create a new province/city.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✅ | Province name (max 100) |
| `code` | string | ✅ | Province code (max 10, unique) |
| `hasProject` | boolean | ❌ | Has projects or not |
| `centerCount` | integer | ❌ | Number of centers (min: 0) |

**Response (201):** Created Province object
**Errors:** `409` — Province code already exists

---

### 8.4. ✏️ PATCH `/provinces/:id`

Update province information.

**Path Params:** `id` (UUID)

**Request Body (all optional):**

| Field | Type | Description |
| --- | --- | --- |
| `hasProject` | boolean | Has projects or not |
| `centerCount` | integer | Number of centers (min: 0) |

**Response (200):** Updated Province object
**Errors:** `404` — Province not found

---

### 8.5. ✏️ DELETE `/provinces/:id`

Delete a province/city.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Province not found

---

## 9. Partners

**Prefix:** `/api/v1/partners`
**Description:** Manage partners & logos.

### 9.1. 🔓 GET `/partners`

Get list of active partners, sorted by `order`.

**Response (200):** Array of active Partner objects

---

### 9.2. ✏️ GET `/partners/all`

Get all partners (including inactive), used for admin.

**Response (200):** Array of all Partner objects

---

### 9.3. ✏️ POST `/partners`

Create a new partner.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✅ | Partner name (max 255) |
| `logo` | string | ✅ | Logo URL |
| `logoFileId` | string | ❌ | Logo file ID on ImageKit |
| `websiteUrl` | string | ❌ | Website URL |
| `order` | integer | ❌ | Display order |

**Response (201):** Created Partner object

---

### 9.4. ✏️ PATCH `/partners/reorder`

Reorder partners.

**Request Body:**

```json
{
  "items": [
    { "id": "uuid-1", "order": 0 },
    { "id": "uuid-2", "order": 1 }
  ]
}
```

**Response (200):** Success

---

### 9.5. ✏️ PATCH `/partners/:id`

Update a partner. Body is the same as `POST` but all fields are optional.

**Path Params:** `id` (UUID)
**Response (200):** Updated Partner object
**Errors:** `404` — Partner not found

---

### 9.6. ✏️ PATCH `/partners/:id/toggle`

Toggle partner active status.

**Path Params:** `id` (UUID)

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `isActive` | boolean | ✅ | Active status |

**Response (200):** Success
**Errors:** `404` — Partner not found

---

### 9.7. 👑 DELETE `/partners/:id`

Permanently delete a partner.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Partner not found

---

## 10. Operation Fields

**Prefix:** `/api/v1/operation-fields`
**Description:** Operation fields (categories for programs, solutions, projects).

### 10.1. 🔓 GET `/operation-fields`

Get all operation fields, sorted by `order`.

**Response (200):** Array of OperationField objects

---

### 10.2. 🔓 GET `/operation-fields/:slug`

Get an operation field by slug.

**Path Params:** `slug` (string)
**Response (200):** OperationField object
**Errors:** `404` — Operation field not found

---

### 10.3. ✏️ POST `/operation-fields`

Create a new operation field.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | string | ✅ | Field name (max 100) |
| `slug` | string | ❌ | URL slug (auto-generated if empty) |
| `icon` | string | ❌ | Representative icon (e.g.: `mdi:solar-power`) |
| `shortDescription` | string | ❌ | Short description |
| `order` | integer | ❌ | Display order |

**Response (201):** Created OperationField object

---

### 10.4. ✏️ PATCH `/operation-fields/:id`

Update an operation field. Body is the same as `POST` but all fields are optional.

**Path Params:** `id` (UUID)
**Response (200):** Updated OperationField object
**Errors:** `404` — Operation field not found

---

### 10.5. 👑 DELETE `/operation-fields/:id`

Permanently delete an operation field.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Operation field not found

---

## 11. Programs

**Prefix:** `/api/v1/programs`
**Description:** Manage programs.

### 11.1. 🔓 GET `/programs`

Get list of published programs (with pagination).

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | integer | ❌ | Page (default: 1) |
| `limit` | integer | ❌ | Items per page (default: 10) |
| `fieldId` | UUID | ❌ | Filter by operation field |
| `isPublished` | boolean | ❌ | Filter by published status |

**Response (200):** Paginated list of programs

---

### 11.2. ✏️ GET `/programs/all`

Get all programs (including unpublished), used for admin.

**Query Params:** Same as `GET /programs`

**Response (200):** Paginated list of all programs

---

### 11.3. 🔓 GET `/programs/:slug`

Get program details by slug (includes related articles).

**Path Params:** `slug` (string)
**Response (200):** Program detail + related articles
**Errors:** `404` — Program not found

---

### 11.4. ✏️ POST `/programs`

Create a new program.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✅ | Title (max 255) |
| `slug` | string | ❌ | URL slug (auto-generated if empty) |
| `shortDescription` | string | ❌ | Short description |
| `content` | string | ❌ | Detailed content (rich text) |
| `thumbnail` | string | ❌ | Thumbnail URL |
| `thumbnailFileId` | string | ❌ | Thumbnail file ID on ImageKit |
| `fieldId` | UUID | ❌ | Operation field ID |
| `metaTitle` | string | ❌ | SEO meta title (max 255) |
| `metaDescription` | string | ❌ | SEO meta description (max 255) |
| `isPublished` | boolean | ❌ | Published status |

**Response (201):** Created Program object

---

### 11.5. ✏️ PATCH `/programs/:id`

Update a program. Body is the same as `POST` but all fields are optional.

**Path Params:** `id` (UUID)
**Response (200):** Updated Program object
**Errors:** `404` — Program not found

---

### 11.6. ✏️ PATCH `/programs/:id/publish`

Toggle publish status.

**Path Params:** `id` (UUID)

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `isPublished` | boolean | ✅ | Published status |

**Response (200):** Success
**Errors:** `404` — Program not found

---

### 11.7. 👑 DELETE `/programs/:id`

Permanently delete a program.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Program not found

---

## 12. Solutions

**Prefix:** `/api/v1/solutions`
**Description:** Manage solutions.

### 12.1. 🔓 GET `/solutions`

Get list of published solutions (with pagination).

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | integer | ❌ | Page (default: 1) |
| `limit` | integer | ❌ | Items per page (default: 10) |
| `fieldId` | UUID | ❌ | Filter by operation field |
| `isPublished` | boolean | ❌ | Filter by published status |

**Response (200):** Paginated list of solutions

---

### 12.2. ✏️ GET `/solutions/all`

Get all solutions (including unpublished), used for admin.

**Query Params:** Same as `GET /solutions`
**Response (200):** Paginated list of all solutions

---

### 12.3. 🔓 GET `/solutions/:slug`

Get solution details by slug (includes related articles).

**Path Params:** `slug` (string)
**Response (200):** Solution detail + related articles
**Errors:** `404` — Solution not found

---

### 12.4. ✏️ POST `/solutions`

Create a new solution.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✅ | Title (max 255) |
| `slug` | string | ❌ | URL slug (auto-generated if empty) |
| `shortDescription` | string | ❌ | Short description |
| `content` | string | ❌ | Detailed content (rich text) |
| `thumbnail` | string | ❌ | Thumbnail URL |
| `thumbnailFileId` | string | ❌ | Thumbnail file ID on ImageKit |
| `fieldId` | UUID | ❌ | Operation field ID |
| `metaTitle` | string | ❌ | SEO meta title (max 255) |
| `metaDescription` | string | ❌ | SEO meta description (max 255) |
| `isPublished` | boolean | ❌ | Published status |

**Response (201):** Created Solution object

---

### 12.5. ✏️ PATCH `/solutions/:id`

Update a solution. Body is the same as `POST` but all fields are optional.

**Path Params:** `id` (UUID)
**Response (200):** Updated Solution object
**Errors:** `404` — Solution not found

---

### 12.6. ✏️ PATCH `/solutions/:id/publish`

Toggle publish status.

**Path Params:** `id` (UUID)

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `isPublished` | boolean | ✅ | Published status |

**Response (200):** Success
**Errors:** `404` — Solution not found

---

### 12.7. 👑 DELETE `/solutions/:id`

Permanently delete a solution.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Solution not found

---

## 13. Projects

**Prefix:** `/api/v1/projects`
**Description:** Manage projects (including image gallery).

### 13.1. 🔓 GET `/projects`

Get list of published projects (with pagination + filter).

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | integer | ❌ | Page (default: 1) |
| `limit` | integer | ❌ | Items per page (default: 10) |
| `fieldId` | UUID | ❌ | Filter by operation field |
| `provinceId` | UUID | ❌ | Filter by province/city |
| `year` | integer | ❌ | Filter by year |
| `isPublished` | boolean | ❌ | Filter by published status |

**Response (200):** Paginated list of projects

---

### 13.2. ✏️ GET `/projects/all`

Get all projects (including unpublished), used for admin.

**Query Params:** Same as `GET /projects`
**Response (200):** Paginated list of all projects

---

### 13.3. 🔓 GET `/projects/:slug`

Get project details by slug (includes image gallery, related articles, projects in the same field).

**Path Params:** `slug` (string)
**Response (200):** Project detail + images + related articles + related projects
**Errors:** `404` — Project not found

---

### 13.4. ✏️ POST `/projects`

Create a new project.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✅ | Project name (max 255) |
| `slug` | string | ❌ | URL slug (auto-generated if empty) |
| `overview` | string | ❌ | Project overview (rich text) |
| `thumbnail` | string | ❌ | Thumbnail URL |
| `thumbnailFileId` | string | ❌ | Thumbnail file ID |
| `fieldId` | UUID | ❌ | Operation field ID |
| `provinceId` | UUID | ❌ | Province/city ID |
| `year` | integer | ❌ | Implementation year (1990–2100) |
| `metaTitle` | string | ❌ | SEO meta title (max 255) |
| `metaDescription` | string | ❌ | SEO meta description (max 255) |
| `isPublished` | boolean | ❌ | Published status |

**Response (201):** Created Project object
**Errors:** `409` — Slug already exists

---

### 13.5. ✏️ PATCH `/projects/:id`

Update a project. Body is the same as `POST` but all fields are optional.

**Path Params:** `id` (UUID)
**Response (200):** Updated Project object
**Errors:** `404` — Project not found

---

### 13.6. ✏️ PATCH `/projects/:id/publish`

Toggle publish status.

**Path Params:** `id` (UUID)

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `isPublished` | boolean | ✅ | Published status |

**Response (200):** Success

---

### 13.7. 👑 DELETE `/projects/:id`

Permanently delete a project.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Project not found

---

### 13.8. ✏️ POST `/projects/:id/images`

Add images to the project gallery (direct upload via multipart).

**Path Params:** `id` (UUID)
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `files` | File[] | ✅ | Up to 20 image files |
| `captions` | string (JSON) | ❌ | Array of captions for each image `["Caption 1", "Caption 2"]` |

**Response (201):** Array of created ProjectImage objects
**Errors:** `404` — Project not found

---

### 13.9. ✏️ PATCH `/projects/:id/images/reorder`

Reorder gallery images.

**Path Params:** `id` (UUID)

**Request Body:**

```json
{
  "items": [
    { "id": "image-uuid-1", "order": 0 },
    { "id": "image-uuid-2", "order": 1 }
  ]
}
```

**Response (200):** Success

---

### 13.10. ✏️ DELETE `/projects/:id/images/:imageId`

Delete an image from the project gallery.

**Path Params:** `id` (UUID), `imageId` (UUID)
**Response (200):** Success
**Errors:** `404` — Image not found

---

## 14. Articles

**Prefix:** `/api/v1/articles`
**Description:** Manage articles / news (can be linked to projects, programs, solutions for SEO purposes).

### 14.1. 🔓 GET `/articles`

Get list of published articles (with pagination + filter).

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | integer | ❌ | Page (default: 1) |
| `limit` | integer | ❌ | Items per page (default: 10) |
| `category` | string | ❌ | Filter by category |
| `tags` | string | ❌ | Filter by tag (substring match, case-insensitive) |
| `isPublished` | boolean | ❌ | Filter by published status |

**Response (200):** Paginated list of articles

---

### 14.2. ✏️ GET `/articles/all`

Get all articles (including drafts), used for admin.

**Query Params:** Same as `GET /articles`
**Response (200):** Paginated list of all articles

---

### 14.3. 🔓 GET `/articles/:slug`

Get article details by slug.

**Path Params:** `slug` (string)
**Response (200):** Article object
**Errors:** `404` — Article not found

---

### 14.4. ✏️ POST `/articles`

Create a new article.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✅ | Title (max 255) |
| `slug` | string | ❌ | URL slug (auto-generated if empty) |
| `content` | string | ❌ | Content (rich text/HTML) |
| `thumbnail` | string | ❌ | Thumbnail URL |
| `thumbnailFileId` | string | ❌ | Thumbnail file ID |
| `category` | string | ❌ | Category |
| `tags` | string | ❌ | Tags separated by commas |
| `projectId` | UUID | ❌ | Link to a project |
| `programId` | UUID | ❌ | Link to a program |
| `solutionId` | UUID | ❌ | Link to a solution |
| `metaTitle` | string | ❌ | SEO meta title (max 255) |
| `metaDescription` | string | ❌ | SEO meta description (max 255) |
| `isPublished` | boolean | ❌ | Published status (default: false) |
| `publishedAt` | datetime | ❌ | Published timestamp (auto-set if published without one) |

**Response (201):** Created Article object
**Errors:** `409` — Slug already exists

---

### 14.5. ✏️ PATCH `/articles/:id`

Update an article. Body is the same as `POST` but all fields are optional.

**Path Params:** `id` (UUID)
**Response (200):** Updated Article object
**Errors:** `404` — Not found · `409` — Slug already exists

---

### 14.6. ✏️ PATCH `/articles/:id/publish`

Toggle publish status.

**Path Params:** `id` (UUID)

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `isPublished` | boolean | ✅ | Published status |

**Response (200):** Updated Article object
**Errors:** `404` — Article not found

---

### 14.7. 👑 DELETE `/articles/:id`

Permanently delete an article.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Article not found

---

## 15. Jobs

**Prefix:** `/api/v1/jobs`
**Description:** Manage job positions.

### 15.1. 🔓 GET `/jobs`

Get list of active jobs (with pagination + filter). Sorting: urgent first → newest.

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | integer | ❌ | Page (default: 1) |
| `limit` | integer | ❌ | Items per page (default: 10) |
| `type` | string | ❌ | Filter by type: `full-time`, `part-time`, `intern` |
| `location` | string | ❌ | Filter by location (substring match) |
| `isActive` | boolean | ❌ | Filter by active status |

**Response (200):** Paginated list of jobs

---

### 15.2. ✏️ GET `/jobs/all`

Get all jobs (including inactive), used for admin.

**Query Params:** Same as `GET /jobs`
**Response (200):** Paginated list of all jobs

---

### 15.3. 🔓 GET `/jobs/:slug`

Get job position details by slug.

**Path Params:** `slug` (string)
**Response (200):** Job object
**Errors:** `404` — Job opening not found

---

### 15.4. ✏️ POST `/jobs`

Create a new job position.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | string | ✅ | Position title (max 255) |
| `slug` | string | ❌ | URL slug (auto-generated if empty) |
| `department` | string | ❌ | Department |
| `location` | string | ❌ | Work location |
| `type` | string | ✅ | Employment type: `full-time` / `part-time` / `intern` |
| `salaryRange` | string | ❌ | Salary range (e.g.: "15–25 million") |
| `deadline` | date (YYYY-MM-DD) | ❌ | Application deadline |
| `description` | string | ❌ | Job description (rich text) |
| `requirements` | string | ❌ | Candidate requirements (rich text) |
| `benefits` | string | ❌ | Benefits (rich text) |
| `isUrgent` | boolean | ❌ | Display "Urgent" badge (default: false) |
| `isActive` | boolean | ❌ | Active status (default: true) |

**Response (201):** Created Job object
**Errors:** `409` — Slug already exists

---

### 15.5. ✏️ PATCH `/jobs/:id`

Update a job position. Body is the same as `POST` but all fields are optional.

**Path Params:** `id` (UUID)
**Response (200):** Updated Job object
**Errors:** `404` — Not found · `409` — Slug already exists

---

### 15.6. ✏️ PATCH `/jobs/:id/toggle`

Toggle active status.

**Path Params:** `id` (UUID)

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `isActive` | boolean | ✅ | Active status |

**Response (200):** Success
**Errors:** `404` — Job posting not found

---

### 15.7. 👑 DELETE `/jobs/:id`

Permanently delete a job position.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Job posting not found

---

## 16. Leads

**Prefix:** `/api/v1/leads`
**Description:** Contact form submissions.

### 16.1. 🔓 POST `/leads`

Submit a contact form (public). Has a honeypot field `website` for bot prevention.

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `fullName` | string | ✅ | Full name (max 255) |
| `email` | string (email) | ✅ | Contact email |
| `phone` | string | ❌ | Phone number (max 20) |
| `subject` | string | ❌ | Subject |
| `message` | string | ❌ | Message content |
| `attachment` | string | ❌ | Attachment file URL |
| `website` | string | ❌ | ⚠️ Honeypot — must be left empty |

**Response (201):** Created Lead object

---

### 16.2. 🔐 GET `/leads`

Get list of leads (with pagination + filter). For admin use.

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | integer | ❌ | Page (default: 1) |
| `limit` | integer | ❌ | Items per page (default: 10) |
| `isRead` | boolean | ❌ | Filter by read status |

**Response (200):** Paginated list of leads

---

### 16.3. 👑 GET `/leads/export`

Export leads to a CSV file.

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `from` | string (YYYY-MM-DD) | ❌ | Start date |
| `to` | string (YYYY-MM-DD) | ❌ | End date |

**Response (200):** CSV file download
**Headers:** `Content-Type: text/csv; charset=utf-8`

---

### 16.4. 🔐 GET `/leads/:id`

Get lead details and automatically mark as read.

**Path Params:** `id` (UUID)
**Response (200):** Lead object
**Errors:** `404` — Lead not found

---

### 16.5. 🔐 PATCH `/leads/:id/read`

Update read/unread status.

**Path Params:** `id` (UUID)

**Request Body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `isRead` | boolean | ✅ | Read status |

**Response (200):** Success

---

### 16.6. 👑 DELETE `/leads/:id`

Permanently delete a lead.

**Path Params:** `id` (UUID)
**Response (200):** Success
**Errors:** `404` — Lead not found

---

## 17. Upload

**Prefix:** `/api/v1/upload`
**Description:** Upload files to ImageKit CDN. Supports image upload by folder and file attachments.

### 17.1. ✏️ POST `/upload/image`

Upload a general image to the `images/` folder.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | File | ✅ | Image file to upload |

**Response (201):**

```json
{
  "statusCode": 201,
  "data": {
    "url": "https://ik.imagekit.io/.../image.jpg",
    "fileId": "file_id_abc123",
    "name": "image.jpg"
  }
}
```

**Errors:** `400` — Invalid file format or size

---

### 17.2. ✏️ POST `/upload/image/thumbnail`

Upload a thumbnail image to the `thumbnails/` folder.

**Content-Type:** `multipart/form-data`
**Request / Response:** Same as `POST /upload/image`

---

### 17.3. ✏️ POST `/upload/image/project`

Upload a project image to the `projects/` folder.

**Content-Type:** `multipart/form-data`
**Request / Response:** Same as `POST /upload/image`

---

### 17.4. ✏️ POST `/upload/image/slide`

Upload a slide image to the `slides/` folder.

**Content-Type:** `multipart/form-data`
**Request / Response:** Same as `POST /upload/image`

---

### 17.5. ✏️ POST `/upload/image/partner`

Upload a partner logo to the `partners/` folder.

**Content-Type:** `multipart/form-data`
**Request / Response:** Same as `POST /upload/image`

---

### 17.6. 🔓 POST `/upload/file`

Upload an attachment file (PDF, DOC, DOCX) — used for guests submitting CVs.

**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | File | ✅ | Attachment file (PDF/DOC/DOCX) |

**Response (201):** Upload response object
**Errors:** `400` — Invalid file format or size

---

### 17.7. 👑 DELETE `/upload/:fileId`

Delete a file on ImageKit by file ID.

**Path Params:** `fileId` (string) — ImageKit file ID
**Response (200):** Success

---

### 17.8. 🔓 GET `/upload/transform`

Generate a transformed image URL (resize on-the-fly).

**Query Params:**

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `path` | string | ✅ | ImageKit file path |
| `w` | integer | ❌ | Width (pixels) |
| `h` | integer | ❌ | Height (pixels) |
| `q` | integer | ❌ | Quality (1–100, default: 80) |
| `f` | string | ❌ | Format: `webp`, `jpg`, `png`, `auto` |

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "url": "https://ik.imagekit.io/tr:w-300,h-200,q-80,f-webp/.../image.jpg"
  }
}
```

---

### 17.9. ✏️ GET `/upload/auth`

Get auth params for client-side upload (token, signature, expiration).

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "token": "...",
    "expire": 1234567890,
    "signature": "..."
  }
}
```

---

## 18. Health

**Prefix:** `/api/v1/health`
**Description:** System health check.

### 18.1. 🔓 GET `/health`

Check database, Redis, and uptime status.

**Response (200):**

```json
{
  "statusCode": 200,
  "data": {
    "status": "ok",
    "timestamp": "2026-07-26T12:00:00.000Z",
    "uptime": 3600,
    "services": {
      "database": "connected",
      "redis": "connected"
    }
  }
}
```

| Status | Description |
| --- | --- |
| `ok` | All services are operating normally |
| `degraded` | One or more services have errors |

---

## Endpoints Overview

| # | Module | Method | Endpoint | Auth | Description |
| --- | --- | --- | --- | --- | --- |
| 1 | Auth | POST | `/auth/login` | 🔓 | Login |
| 2 | Auth | POST | `/auth/refresh` | 🔓 | Refresh token |
| 3 | Auth | POST | `/auth/logout` | 🔐 | Logout |
| 4 | Auth | GET | `/auth/me` | 🔐 | Get profile |
| 5 | Admin Users | GET | `/admin/users` | 👑 | List admins |
| 6 | Admin Users | POST | `/admin/users` | 👑 | Create admin |
| 7 | Admin Users | PATCH | `/admin/users/:id` | 👑 | Update admin |
| 8 | Admin Users | DELETE | `/admin/users/:id` | 👑 | Delete admin |
| 9 | Organization | GET | `/organization` | 🔓 | Get organization info |
| 10 | Organization | PUT | `/organization` | ✏️ | Update organization |
| 11 | Slides | GET | `/slides` | 🔓 | Active slides |
| 12 | Slides | GET | `/slides/all` | ✏️ | All slides |
| 13 | Slides | POST | `/slides` | ✏️ | Create slide |
| 14 | Slides | PATCH | `/slides/reorder` | ✏️ | Reorder slides |
| 15 | Slides | PATCH | `/slides/:id` | ✏️ | Update slide |
| 16 | Slides | PATCH | `/slides/:id/toggle` | ✏️ | Toggle active |
| 17 | Slides | DELETE | `/slides/:id` | 👑 | Delete slide |
| 18 | Provinces | GET | `/provinces` | 🔓 | All provinces/cities |
| 19 | Provinces | GET | `/provinces/:code` | 🔓 | Province by code |
| 20 | Provinces | POST | `/provinces` | ✏️ | Create province |
| 21 | Provinces | PATCH | `/provinces/:id` | ✏️ | Update province |
| 22 | Provinces | DELETE | `/provinces/:id` | ✏️ | Delete province |
| 23 | Partners | GET | `/partners` | 🔓 | Active partners |
| 24 | Partners | GET | `/partners/all` | ✏️ | All partners |
| 25 | Partners | POST | `/partners` | ✏️ | Create partner |
| 26 | Partners | PATCH | `/partners/reorder` | ✏️ | Reorder partners |
| 27 | Partners | PATCH | `/partners/:id` | ✏️ | Update partner |
| 28 | Partners | PATCH | `/partners/:id/toggle` | ✏️ | Toggle active |
| 29 | Partners | DELETE | `/partners/:id` | 👑 | Delete partner |
| 30 | Op. Fields | GET | `/operation-fields` | 🔓 | All operation fields |
| 31 | Op. Fields | GET | `/operation-fields/:slug` | 🔓 | Field by slug |
| 32 | Op. Fields | POST | `/operation-fields` | ✏️ | Create field |
| 33 | Op. Fields | PATCH | `/operation-fields/:id` | ✏️ | Update field |
| 34 | Op. Fields | DELETE | `/operation-fields/:id` | 👑 | Delete field |
| 35 | Programs | GET | `/programs` | 🔓 | Published programs |
| 36 | Programs | GET | `/programs/all` | ✏️ | All programs |
| 37 | Programs | GET | `/programs/:slug` | 🔓 | Program details |
| 38 | Programs | POST | `/programs` | ✏️ | Create program |
| 39 | Programs | PATCH | `/programs/:id` | ✏️ | Update program |
| 40 | Programs | PATCH | `/programs/:id/publish` | ✏️ | Toggle publish |
| 41 | Programs | DELETE | `/programs/:id` | 👑 | Delete program |
| 42 | Solutions | GET | `/solutions` | 🔓 | Published solutions |
| 43 | Solutions | GET | `/solutions/all` | ✏️ | All solutions |
| 44 | Solutions | GET | `/solutions/:slug` | 🔓 | Solution details |
| 45 | Solutions | POST | `/solutions` | ✏️ | Create solution |
| 46 | Solutions | PATCH | `/solutions/:id` | ✏️ | Update solution |
| 47 | Solutions | PATCH | `/solutions/:id/publish` | ✏️ | Toggle publish |
| 48 | Solutions | DELETE | `/solutions/:id` | 👑 | Delete solution |
| 49 | Projects | GET | `/projects` | 🔓 | Published projects |
| 50 | Projects | GET | `/projects/all` | ✏️ | All projects |
| 51 | Projects | GET | `/projects/:slug` | 🔓 | Project details |
| 52 | Projects | POST | `/projects` | ✏️ | Create project |
| 53 | Projects | PATCH | `/projects/:id` | ✏️ | Update project |
| 54 | Projects | PATCH | `/projects/:id/publish` | ✏️ | Toggle publish |
| 55 | Projects | DELETE | `/projects/:id` | 👑 | Delete project |
| 56 | Projects | POST | `/projects/:id/images` | ✏️ | Add gallery images |
| 57 | Projects | PATCH | `/projects/:id/images/reorder` | ✏️ | Reorder images |
| 58 | Projects | DELETE | `/projects/:id/images/:imageId` | ✏️ | Delete image |
| 59 | Articles | GET | `/articles` | 🔓 | Published articles |
| 60 | Articles | GET | `/articles/all` | ✏️ | All articles |
| 61 | Articles | GET | `/articles/:slug` | 🔓 | Article details |
| 62 | Articles | POST | `/articles` | ✏️ | Create article |
| 63 | Articles | PATCH | `/articles/:id` | ✏️ | Update article |
| 64 | Articles | PATCH | `/articles/:id/publish` | ✏️ | Toggle publish |
| 65 | Articles | DELETE | `/articles/:id` | 👑 | Delete article |
| 66 | Jobs | GET | `/jobs` | 🔓 | Active jobs |
| 67 | Jobs | GET | `/jobs/all` | ✏️ | All jobs |
| 68 | Jobs | GET | `/jobs/:slug` | 🔓 | Job details |
| 69 | Jobs | POST | `/jobs` | ✏️ | Create job |
| 70 | Jobs | PATCH | `/jobs/:id` | ✏️ | Update job |
| 71 | Jobs | PATCH | `/jobs/:id/toggle` | ✏️ | Toggle active |
| 72 | Jobs | DELETE | `/jobs/:id` | 👑 | Delete job |
| 73 | Leads | POST | `/leads` | 🔓 | Submit contact form |
| 74 | Leads | GET | `/leads` | 🔐 | List leads |
| 75 | Leads | GET | `/leads/export` | 👑 | Export CSV |
| 76 | Leads | GET | `/leads/:id` | 🔐 | Lead details |
| 77 | Leads | PATCH | `/leads/:id/read` | 🔐 | Mark as read |
| 78 | Leads | DELETE | `/leads/:id` | 👑 | Delete lead |
| 79 | Upload | POST | `/upload/image` | ✏️ | Upload general image |
| 80 | Upload | POST | `/upload/image/thumbnail` | ✏️ | Upload thumbnail |
| 81 | Upload | POST | `/upload/image/project` | ✏️ | Upload project image |
| 82 | Upload | POST | `/upload/image/slide` | ✏️ | Upload slide image |
| 83 | Upload | POST | `/upload/image/partner` | ✏️ | Upload partner logo |
| 84 | Upload | POST | `/upload/file` | 🔓 | Upload attachment |
| 85 | Upload | DELETE | `/upload/:fileId` | 👑 | Delete file |
| 86 | Upload | GET | `/upload/transform` | 🔓 | Transform image URL |
| 87 | Upload | GET | `/upload/auth` | ✏️ | Auth params client upload |
| 88 | Health | GET | `/health` | 🔓 | System health check |

---

> **Total: 88 endpoints** · **13 main modules** + Auth + Upload + Health
