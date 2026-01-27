/**
 * Instagram Insights Sync Script
 * 
 * This script:
 * 1. Reads Instagram analytics data from Google Sheets (insta_insights_daily)
 * 2. Fetches missing metrics (likes, comments) from Meta Graph API
 * 3. Merges and updates the Google Sheet with complete data
 * 
 * Environment Variables Required:
 * - GOOGLE_SHEETS_ID
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY (with \n properly handled)
 * - SHEET_NAME=insta_insights_daily
 * - META_ACCESS_TOKEN
 * - GRAPH_VERSION=v19.0
 */

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

// Configuration
const GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SHEET_NAME = process.env.SHEET_NAME || 'insta_insights_daily';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const GRAPH_VERSION = process.env.GRAPH_VERSION || 'v19.0';

// Rate limiting configuration
const MAX_CONCURRENCY = 5;
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Validate environment variables
if (!GOOGLE_SHEETS_ID || !GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
  console.error('❌ Missing Google Sheets credentials');
  process.exit(1);
}

if (!META_ACCESS_TOKEN) {
  console.error('❌ Missing META_ACCESS_TOKEN');
  process.exit(1);
}

/**
 * Initialize Google Sheets API client
 */
function getGoogleSheetsClient() {
  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Read all rows from Google Sheets
 */
async function readSheetData(sheets) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${SHEET_NAME}!A:Z`,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('📋 No data found in sheet');
      return { headers: [], data: [] };
    }

    // First row is headers
    const headers = rows[0].map(h => String(h || '').trim());
    const data = rows.slice(1).map((row, index) => {
      const obj = {};
      headers.forEach((header, colIndex) => {
        obj[header] = row[colIndex] !== undefined ? String(row[colIndex]) : '';
      });
      obj._rowIndex = index + 2; // +2 because: 1 for header row, 1 for 0-based index
      return obj;
    });

    return { headers, data };
  } catch (error) {
    console.error('❌ Error reading Google Sheets:', error.message);
    throw error;
  }
}

/**
 * Fetch likes and comments from Meta Graph API with retry logic
 */
async function fetchMediaMetrics(mediaId, retryCount = 0) {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}`;
  const params = new URLSearchParams({
    fields: 'like_count,comments_count,permalink',
    access_token: META_ACCESS_TOKEN,
  });

  try {
    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.error) {
      // Handle permission errors gracefully
      if (data.error.code === 10 || data.error.message?.includes('permission')) {
        console.warn(`⚠️  Permission denied for media ${mediaId}: ${data.error.message}`);
        return { likes: null, comments: null, permalink: null, error: 'PERMISSION_DENIED' };
      }

      // Retry on transient errors
      if (retryCount < RETRY_ATTEMPTS && (response.status >= 500 || data.error.code === 4)) {
        console.warn(`⚠️  Retrying media ${mediaId} (attempt ${retryCount + 1}/${RETRY_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return fetchMediaMetrics(mediaId, retryCount + 1);
      }

      console.error(`❌ Error fetching media ${mediaId}:`, data.error.message);
      return { likes: null, comments: null, permalink: null, error: data.error.message };
    }

    return {
      likes: data.like_count || 0,
      comments: data.comments_count || 0,
      permalink: data.permalink || null,
      error: null,
    };
  } catch (error) {
    if (retryCount < RETRY_ATTEMPTS) {
      console.warn(`⚠️  Network error for media ${mediaId}, retrying...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      return fetchMediaMetrics(mediaId, retryCount + 1);
    }

    console.error(`❌ Network error fetching media ${mediaId}:`, error.message);
    return { likes: null, comments: null, permalink: null, error: error.message };
  }
}

/**
 * Process media IDs in batches with concurrency control
 */
async function processMediaBatch(mediaItems, sheets, headers) {
  const results = [];
  const batchSize = MAX_CONCURRENCY;

  for (let i = 0; i < mediaItems.length; i += batchSize) {
    const batch = mediaItems.slice(i, i + batchSize);
    console.log(`📊 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mediaItems.length / batchSize)}`);

    const batchPromises = batch.map(async (item) => {
      const mediaId = item.media_id || item.mediaId || item.id;
      if (!mediaId) {
        return { item, metrics: null, error: 'NO_MEDIA_ID' };
      }

      const metrics = await fetchMediaMetrics(mediaId);
      return { item, metrics };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Rate limiting: wait a bit between batches
    if (i + batchSize < mediaItems.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Update Google Sheet with merged data
 */
async function updateSheet(sheets, updates) {
  if (updates.length === 0) {
    console.log('✅ No updates needed');
    return;
  }

  try {
    // Find column indices
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEETS_ID,
      range: `${SHEET_NAME}!1:1`,
    });

    const headers = headerResponse.data.values?.[0] || [];
    const getColumnIndex = (colName) => {
      const index = headers.findIndex(h => 
        String(h || '').toLowerCase().trim() === String(colName).toLowerCase().trim()
      );
      return index >= 0 ? String.fromCharCode(65 + index) : null; // A, B, C, etc.
    };

    // Prepare batch updates
    const valueRanges = [];

    for (const update of updates) {
      const { rowIndex, likes, comments, permalink } = update;

      if (likes !== null && likes !== undefined) {
        const likesCol = getColumnIndex('likes');
        if (likesCol) {
          valueRanges.push({
            range: `${SHEET_NAME}!${likesCol}${rowIndex}`,
            values: [[likes]],
          });
        }
      }

      if (comments !== null && comments !== undefined) {
        const commentsCol = getColumnIndex('comments');
        if (commentsCol) {
          valueRanges.push({
            range: `${SHEET_NAME}!${commentsCol}${rowIndex}`,
            values: [[comments]],
          });
        }
      }

      if (permalink) {
        const permalinkCol = getColumnIndex('permalink');
        if (permalinkCol) {
          valueRanges.push({
            range: `${SHEET_NAME}!${permalinkCol}${rowIndex}`,
            values: [[permalink]],
          });
        }
      }
    }

    if (valueRanges.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: GOOGLE_SHEETS_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: valueRanges,
        },
      });

      console.log(`✅ Updated ${valueRanges.length} cells in Google Sheets`);
    }
  } catch (error) {
    console.error('❌ Error updating Google Sheets:', error.message);
    throw error;
  }
}

/**
 * Main sync function
 */
async function syncInstagramInsights() {
  console.log('🚀 Starting Instagram Insights Sync...\n');

  const sheets = getGoogleSheetsClient();

  try {
    // Step 1: Read data from Google Sheets
    console.log('📖 Reading data from Google Sheets...');
    const { headers, data } = await readSheetData(sheets);
    console.log(`✅ Found ${data.length} rows\n`);

    // Step 2: Filter rows with media_id
    const mediaItems = data.filter(item => {
      const mediaId = item.media_id || item.mediaId || item.id;
      return mediaId && String(mediaId).trim() !== '';
    });

    if (mediaItems.length === 0) {
      console.log('⚠️  No rows with media_id found');
      return;
    }

    console.log(`📱 Found ${mediaItems.length} rows with media_id\n`);

    // Step 3: Fetch missing metrics from Meta Graph API
    console.log('🌐 Fetching metrics from Meta Graph API...');
    const results = await processMediaBatch(mediaItems, sheets, headers);

    // Step 4: Prepare updates
    const updates = [];
    let successCount = 0;
    let errorCount = 0;
    let permissionDeniedCount = 0;

    for (const { item, metrics, error } of results) {
      if (error === 'NO_MEDIA_ID') {
        errorCount++;
        continue;
      }

      if (!metrics) {
        errorCount++;
        continue;
      }

      if (metrics.error === 'PERMISSION_DENIED') {
        permissionDeniedCount++;
        // Still update with null values
        updates.push({
          rowIndex: item._rowIndex,
          likes: null,
          comments: null,
          permalink: metrics.permalink,
        });
        continue;
      }

      if (metrics.error) {
        errorCount++;
        continue;
      }

      // Check if update is needed (only update if values are missing or different)
      const currentLikes = item.likes || item.like_count || '';
      const currentComments = item.comments || item.comments_count || '';

      if (
        String(currentLikes) !== String(metrics.likes) ||
        String(currentComments) !== String(metrics.comments)
      ) {
        updates.push({
          rowIndex: item._rowIndex,
          likes: metrics.likes,
          comments: metrics.comments,
          permalink: metrics.permalink,
        });
        successCount++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Successfully fetched: ${successCount}`);
    console.log(`   ⚠️  Permission denied: ${permissionDeniedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   📝 Updates needed: ${updates.length}\n`);

    // Step 5: Update Google Sheet
    if (updates.length > 0) {
      console.log('💾 Updating Google Sheets...');
      await updateSheet(sheets, updates);
      console.log('✅ Sync completed successfully!\n');
    } else {
      console.log('✅ All data is up to date!\n');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the sync
if (require.main === module) {
  syncInstagramInsights()
    .then(() => {
      console.log('✨ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { syncInstagramInsights };


