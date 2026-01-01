# Environment Variables for Vercel

Copy these from your `.env.local` file and add them to Vercel:

## 📋 Required Variables

### 1. GOOGLE_SERVICE_ACCOUNT_EMAIL
```
Your Google Service Account email address
Example: doorly-service@your-project.iam.gserviceaccount.com
```

### 2. GOOGLE_SERVICE_ACCOUNT_KEY
```
Your complete private key (keep the \n characters!)
Example:
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
...your key here...
-----END PRIVATE KEY-----

⚠️ IMPORTANT: Keep the \n characters in the key!
```

### 3. GOOGLE_SHEET_ID
```
Your Google Sheets spreadsheet ID
Example: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
```

## 📋 Optional Variables

### 4. GOOGLE_SHEET_RANGE
```
Sheet range (default: requests!A:Z)
Example: requests!A:Z
```

---

## 🔧 How to Add in Vercel

1. Go to your project in Vercel dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter the variable name
5. Paste the value
6. Select environments: **Production**, **Preview**, **Development**
7. Click **Save**
8. Repeat for each variable

---

## ✅ Checklist

- [ ] GOOGLE_SERVICE_ACCOUNT_EMAIL added
- [ ] GOOGLE_SERVICE_ACCOUNT_KEY added (with `\n` characters)
- [ ] GOOGLE_SHEET_ID added
- [ ] GOOGLE_SHEET_RANGE added (optional)

---

## 🔍 Where to Find These Values

### Google Service Account Email & Key
1. Go to Google Cloud Console
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Click on your service account
4. Go to **Keys** tab
5. Create new key (JSON format)
6. Open the JSON file:
   - `client_email` = GOOGLE_SERVICE_ACCOUNT_EMAIL
   - `private_key` = GOOGLE_SERVICE_ACCOUNT_KEY

### Google Sheet ID
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
3. The `[SHEET_ID]` is your GOOGLE_SHEET_ID




