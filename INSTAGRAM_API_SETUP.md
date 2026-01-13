# Instagram Graph API Setup

This document explains how to set up the Instagram Graph API integration for the dashboard.

## Prerequisites

1. **Instagram Business Account**: Your Instagram account must be converted to a Business or Creator account
2. **Facebook Page**: You need a Facebook Page connected to your Instagram Business account
3. **Facebook App**: You need to create a Facebook App in the [Facebook Developers Console](https://developers.facebook.com/)

## Setup Steps

### 1. Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as the app type
4. Fill in the app details and create the app

### 2. Add Instagram Basic Display or Instagram Graph API Product

1. In your app dashboard, go to "Add Product"
2. Find "Instagram" and click "Set Up"
3. Choose "Instagram Graph API" (for Business accounts)

### 3. Get Access Token

#### Option A: Long-Lived Access Token (Recommended for Production)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Add the following permissions:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_read_engagement`
   - `pages_show_list`
4. Click "Generate Access Token"
5. Exchange for a long-lived token (valid for 60 days):
   ```
   GET /oauth/access_token?grant_type=fb_exchange_token&
   client_id={app-id}&
   client_secret={app-secret}&
   fb_exchange_token={short-lived-token}
   ```

#### Option B: System User Token (Best for Production)

1. In your app settings, go to "Roles" → "System Users"
2. Create a new system user
3. Generate a token for the system user with required permissions
4. Assign the system user to your Facebook Page

### 4. Get Instagram Business Account ID

The Instagram Business Account ID is already configured: `17841451550237400`

If you need to find your own:
```
GET /me/accounts?access_token={page-access-token}
GET /{page-id}?fields=instagram_business_account&access_token={page-access-token}
```

### 5. Set Environment Variable

Add the access token to your `.env.local` file:

```env
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
```

## API Endpoints Used

### 1. Get Media List
```
GET /{ig-business-id}/media
Fields: id, caption, media_type, timestamp, like_count, comments_count
```

### 2. Get Media Insights
For IMAGE or CAROUSEL_ALBUM:
```
GET /{media-id}/insights
Metrics: impressions, reach, engagement, saved
```

For VIDEO:
```
GET /{media-id}/insights
Metrics: impressions, reach, plays, total_interactions
```

## Data Mapping

The API response is mapped to the dashboard table as follows:

- `reach` → الوصول (Reach)
- `impressions` → الكاشن (Impressions)
- `saved` → حفظ (Saves)
- `engagement` (for images) or `total_interactions` (for videos) → التفاعل (Engagement)
- `timestamp` → تاريخ النشر (Publish Date)
- `media_type` → نوع المحتوى (Content Type)
- `engagement_rate` = (engagement / reach) * 100

## Troubleshooting

### Error: "INSTAGRAM_ACCESS_TOKEN environment variable is not set"
- Make sure you've added the token to `.env.local`
- Restart your development server after adding the variable

### Error: "Invalid OAuth access token"
- Your token may have expired
- Generate a new long-lived token or system user token
- Make sure the token has the required permissions

### Error: "User does not have permission"
- Ensure your token has `instagram_manage_insights` permission
- Verify the Instagram account is a Business account
- Check that the Facebook Page is connected to the Instagram account

### No data showing
- Verify the Instagram Business Account ID is correct
- Check that you have published posts on the account
- Ensure the access token has access to the specified business account

## Rate Limits

Instagram Graph API has rate limits:
- 200 requests per hour per user
- The dashboard caches data for 5 minutes to reduce API calls

## Security Notes

- Never commit `.env.local` to version control
- Use long-lived tokens or system user tokens in production
- Rotate tokens regularly
- Use environment-specific tokens (dev/staging/production)

