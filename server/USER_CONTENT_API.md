# User Content API Documentation

## Overview
APIs for fetching user posts and clips with privacy controls, pagination, and filtering options.

## Authentication
All endpoints require authentication via Bearer token in the Authorization header.

---

## Post Endpoints

### 1. Get User Posts
**Endpoint:** `GET /api/posts/get-user-posts/:userId?`

**Description:** Fetch all posts for a user with pagination and privacy checks.

**Parameters:**
- `userId` (optional, path): Target user ID. If omitted, returns current user's posts
- `page` (optional, query): Page number (default: 1)
- `limit` (optional, query): Items per page (default: 10)

**Privacy Rules:**
- Returns empty array if account is private and requester is not following
- Only shows public posts
- Account owner can always see their own posts

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "posts": [
      {
        "id": "postId",
        "text": "Post content",
        "views": 150,
        "createdAt": "2024-01-01T00:00:00Z",
        "media": [
          {
            "id": "mediaId",
            "url": "https://example.com/image.jpg",
            "type": "Image"
          }
        ],
        "user": {
          "userId": "userId",
          "username": "username",
          "profilePic": "https://example.com/avatar.jpg"
        },
        "_count": {
          "likes": 25,
          "comments": 8
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 42,
      "hasNext": true,
      "hasPrev": false,
      "limit": 10
    }
  }
}
```

**Example Requests:**
```bash
# Get own posts
GET /api/posts/get-user-posts?page=1&limit=10

# Get other user's posts
GET /api/posts/get-user-posts/64a7b8c9d1e2f3g4h5i6j7k8?page=2&limit=5
```

### 2. Get User Photos
**Endpoint:** `GET /api/posts/get-user-photos/:userId?`

**Description:** Fetch posts that contain images only.

**Parameters:** Same as Get User Posts

**Filter Logic:** Only returns posts that have at least one media item with type "Image"

**Response:** Same structure as Get User Posts

**Example:**
```bash
GET /api/posts/get-user-photos/64a7b8c9d1e2f3g4h5i6j7k8?page=1&limit=12
```

### 3. Get User Text Posts
**Endpoint:** `GET /api/posts/get-user-text-posts/:userId?`

**Description:** Fetch text-only posts (posts with text content but no images/videos).

**Parameters:** Same as Get User Posts

**Filter Logic:** 
- Post must have non-empty text content
- Post must have no media OR only non-image/video media

**Response:** Same structure as Get User Posts

**Example:**
```bash
GET /api/posts/get-user-text-posts?page=1&limit=15
```

---

## Clip Endpoints

### 4. Get User Clips
**Endpoint:** `GET /api/clips/get-user-clips/:userId?`

**Description:** Fetch all clips for a user with pagination and privacy checks.

**Parameters:**
- `userId` (optional, path): Target user ID. If omitted, returns current user's clips
- `page` (optional, query): Page number (default: 1)
- `limit` (optional, query): Items per page (default: 10)

**Privacy Rules:** Same as post endpoints

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "clips": [
      {
        "id": "clipId",
        "video": "https://example.com/video.mp4",
        "text": "Clip description",
        "views": 320,
        "createdAt": "2024-01-01T00:00:00Z",
        "user": {
          "userId": "userId",
          "username": "username",
          "profilePic": "https://example.com/avatar.jpg"
        },
        "_count": {
          "likes": 45,
          "comments": 12
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 28,
      "hasNext": true,
      "hasPrev": false,
      "limit": 10
    }
  }
}
```

**Example:**
```bash
GET /api/clips/get-user-clips/64a7b8c9d1e2f3g4h5i6j7k8?page=1&limit=20
```

---

## Privacy & Access Control

### Account Types
- **Public**: Content visible to all authenticated users
- **Private**: Content only visible to approved followers and account owner

### Access Rules
1. **Account Owner**: Can always access their own content
2. **Public Accounts**: Any authenticated user can access content
3. **Private Accounts**: 
   - Non-followers receive empty array (not an error)
   - Only accepted followers can access content
   - Pending follow requests don't grant access

### Follow Status Check
The API automatically checks if the requesting user:
- Is the account owner (full access)
- Is following the target user with "Accepted" status
- Has no relationship (empty response for private accounts)

---

## Error Handling

### Common Error Responses

**400 Bad Request - Invalid User ID:**
```json
{
  "success": false,
  "message": "Invalid userId"
}
```

**404 Not Found - User Not Found:**
```json
{
  "success": false,
  "message": "User not found"
}
```

**401 Unauthorized - No Auth Token:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Private Account Response
For private accounts where user is not following:
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "posts": [], // or "clips": []
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalCount": 0,
      "hasNext": false,
      "hasPrev": false,
      "limit": 10
    }
  }
}
```

---

## Implementation Notes

### Pagination
- Uses offset-based pagination (`skip` and `take`)
- Sorted by `createdAt` in descending order (newest first)
- Efficient parallel queries for data and count

### Performance Optimizations
- Parallel execution of data fetch and count queries using `Promise.all()`
- Selective field inclusion to reduce payload size
- Indexed queries on `userId`, `visibility`, and `createdAt`

### Data Consistency
- Only returns posts/clips with `visibility: 'Public'`
- Includes user information and engagement metrics
- Media URLs are fully qualified for direct access

### Security Features
- User ID validation using `isValidObjectId()`
- Privacy checks before data retrieval
- No sensitive user data exposure
- Authentication required for all endpoints