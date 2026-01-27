# Instagram Insights Sync Script

This script synchronizes Instagram analytics data between Google Sheets and Meta Graph API.

## Overview

The script:
1. Reads Instagram analytics data from Google Sheets (`insta_insights_daily` sheet)
2. Fetches missing metrics (likes, comments) from Meta Graph API
3. Merges and updates the Google Sheet with complete data

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Google Service Account** with access to your Google Sheet
3. **Meta Access Token** with Instagram Graph API permissions
4. **dotenv** package (for environment variables)

## Installation

Install required dependencies:

```bash
npm install dotenv googleapis
```

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
SHEET_NAME=insta_insights_daily

# Meta Graph API Configuration
META_ACCESS_TOKEN=your_meta_access_token
GRAPH_VERSION=v19.0
```

### Important Notes:

1. **GOOGLE_PRIVATE_KEY**: Must include `\n` characters properly. In `.env.local`, use double quotes and actual newlines, or use `\\n` which the script will convert.

2. **SHEET_NAME**: Defaults to `insta_insights_daily` if not specified.

3. **GRAPH_VERSION**: Defaults to `v19.0` if not specified.

## Google Sheet Structure

Your Google Sheet should have the following columns (at minimum):

- `media_id` (required): Instagram media ID
- `reach` (optional): Reach metric from Instagram Insights
- `total_interactions` (optional): Total interactions metric
- `likes` (optional): Will be populated by the script
- `comments` (optional): Will be populated by the script
- `permalink` (optional): Will be populated by the script
- `timestamp` (optional): Post timestamp

## Usage

### Manual Execution

Run the script directly:

```bash
node scripts/syncInstagramInsights.js
```

Or using npm script (if added to package.json):

```bash
npm run sync:instagram
```

### Scheduled Execution (Cron Job)

#### Linux/macOS

Add to crontab to run daily at 2 AM:

```bash
crontab -e
```

Add this line:

```
0 2 * * * cd /path/to/DoorlyDashboard_ && /usr/bin/node scripts/syncInstagramInsights.js >> /var/log/instagram-sync.log 2>&1
```

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2:00 AM)
4. Set action: Start a program
5. Program: `node.exe`
6. Arguments: `C:\path\to\DoorlyDashboard_\scripts\syncInstagramInsights.js`
7. Start in: `C:\path\to\DoorlyDashboard_`

#### Using PM2 (Recommended for Production)

Install PM2:

```bash
npm install -g pm2
```

Create a PM2 ecosystem file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: 'instagram-sync',
      script: 'scripts/syncInstagramInsights.js',
      cron_restart: '0 2 * * *', // Daily at 2 AM
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
```

## Features

- **Rate Limiting**: Maximum 5 concurrent API requests to avoid rate limits
- **Retry Logic**: Automatically retries failed requests (up to 3 attempts)
- **Error Handling**: Gracefully handles permission errors and network issues
- **Incremental Updates**: Only updates rows where data has changed
- **Logging**: Comprehensive console output for monitoring

## Output

The script provides detailed console output:

```
🚀 Starting Instagram Insights Sync...

📖 Reading data from Google Sheets...
✅ Found 50 rows

📱 Found 50 rows with media_id

🌐 Fetching metrics from Meta Graph API...
📊 Processing batch 1/10
📊 Processing batch 2/10
...

📊 Results:
   ✅ Successfully fetched: 45
   ⚠️  Permission denied: 3
   ❌ Errors: 2
   📝 Updates needed: 40

💾 Updating Google Sheets...
✅ Updated 120 cells in Google Sheets
✅ Sync completed successfully!

✨ Done!
```

## Error Handling

The script handles various error scenarios:

1. **Permission Denied**: If the Meta token doesn't have permission to access likes/comments, the script sets values to `null` and continues.

2. **Network Errors**: Automatically retries up to 3 times with exponential backoff.

3. **Missing Data**: Skips rows without `media_id`.

4. **API Rate Limits**: Uses concurrency control (max 5 simultaneous requests) to avoid rate limits.

## Troubleshooting

### "Missing Google Sheets credentials"
- Check that all Google Sheets environment variables are set in `.env.local`
- Verify the service account email and private key are correct

### "Missing META_ACCESS_TOKEN"
- Ensure `META_ACCESS_TOKEN` is set in `.env.local`
- Verify the token is valid and has required permissions

### "Permission denied" errors
- Check that your Meta access token has the following permissions:
  - `instagram_basic`
  - `instagram_manage_insights`
  - `pages_read_engagement`

### "Failed to update Google Sheets"
- Verify the service account has write access to the Google Sheet
- Check that the sheet name matches `SHEET_NAME` environment variable

## API Endpoint

After syncing data, you can access it via the API endpoint:

```
GET /api/instagram/analytics
```

This endpoint returns:
- All merged post data
- KPI totals (Reach, Interactions, Likes, Comments)
- Top posts (by reach and interactions)
- Time trends (last 7 days)

## Support

For issues or questions, check:
1. Console output for specific error messages
2. Meta Graph API documentation: https://developers.facebook.com/docs/instagram-api
3. Google Sheets API documentation: https://developers.google.com/sheets/api


