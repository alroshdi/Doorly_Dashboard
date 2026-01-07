# Instagram Insights Refresh Setup

This guide explains how to set up automatic daily refresh of Instagram insights data.

## Overview

The system fetches Instagram insights (engagement, impressions, reach, saved) from the Instagram Graph API for each media_id in your Google Sheet and updates the sheet with the latest data.

## Prerequisites

1. Instagram Business or Creator Account
2. Instagram Graph API Access Token
3. Google Sheet with "insta" tab containing media_id column

## Setup Steps

### 1. Get Instagram Access Token

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add "Instagram Graph API" product
4. Generate a Long-Lived Access Token:
   - Go to Graph API Explorer
   - Select your app
   - Generate User Token with permissions: `instagram_basic`, `instagram_manage_insights`
   - Exchange for Long-Lived Token (valid for 60 days)

### 2. Add Environment Variable

Add to your `.env.local` and Vercel environment variables:

```
INSTAGRAM_ACCESS_TOKEN=your_long_lived_access_token_here
```

### 3. Google Sheet Structure

Your "insta" sheet should have these columns:
- `media_id` (required) - Instagram media ID
- `likes` (will be updated)
- `comments` (will be updated)
- `saves` (will be updated)
- `reach` (will be updated)

Example:
```
| media_id          | likes | comments | saves | reach |
|-------------------|-------|----------|-------|-------|
| 12345678901234567 | 100   | 5        | 10    | 500   |
```

### 4. Manual Refresh

To manually trigger a refresh, call:

```bash
POST /api/instagram/refresh
```

Or via browser:
```
GET https://your-domain.vercel.app/api/instagram/refresh
```

### 5. Automatic Daily Refresh

The system is configured to automatically refresh insights daily at 2:00 AM UTC via Vercel Cron.

The cron job is configured in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/instagram/refresh",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## API Response

Success response:
```json
{
  "success": true,
  "message": "Refreshed insights for 10 posts",
  "updated": 10,
  "total": 10,
  "errors": []
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message",
  "updated": 5,
  "total": 10,
  "errors": [
    {
      "mediaId": "123456789",
      "error": "Invalid media ID"
    }
  ]
}
```

## Rate Limiting

The system includes rate limiting (1 second delay between requests) to avoid Instagram API rate limits.

## Notes

- The system calculates `likes` and `comments` from `engagement` metric
- `engagement` = likes + comments + saves
- If `engagement` is available, `likes` = engagement - saves, `comments` = engagement * 0.1
- The refresh process updates existing rows in the sheet, it does not create new rows

## Troubleshooting

### "INSTAGRAM_ACCESS_TOKEN environment variable is required"
- Make sure you've added the token to your environment variables

### "media_id column not found in sheet"
- Ensure your sheet has a column named `media_id`, `mediaid`, or `id`

### "Instagram API error: Invalid OAuth access token"
- Your access token may have expired (Long-Lived tokens last 60 days)
- Regenerate a new token and update the environment variable

### Rate Limit Errors
- The system includes rate limiting, but if you have many posts, you may need to increase the delay
- Instagram API allows ~200 requests per hour per user

