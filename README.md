# Doorly Dashboard

A modern, bilingual (Arabic/English) admin dashboard for Doorly with Google Sheets integration and LinkedIn Insights analytics, built with Next.js 14, TypeScript, TailwindCSS, and shadcn/ui.

## Features

- 🔐 **Authentication**: Simple login system with localStorage
- 📊 **Analytics Dashboard**: Real-time KPIs, charts, and data visualization
- 📈 **Google Sheets Integration**: Automatic data fetching from Google Sheets
- 💼 **LinkedIn Insights**: Comprehensive LinkedIn analytics with Excel file parsing
- 🌍 **Bilingual Support**: Arabic (RTL) and English (LTR) with language toggle
- 🎨 **Theme Toggle**: Light/Dark mode support
- 📱 **Responsive Design**: Works on all screen sizes
- 🔍 **Advanced Filtering**: Filter by date range, area, property type, source, and status
- 📉 **Interactive Charts**: Line, bar, pie, and donut charts using Recharts
- ✨ **Smooth Animations**: Beautiful animations and transitions throughout
- 📄 **PDF Export**: Admin report PDF via `GET /api/reports/admin-pdf` (structured tables from Google Sheet requests). Optional Laravel + DomPDF templates live in `laravel-pdf-reporting/`.

## LinkedIn Insights Features

- 📊 **Content Analytics**: Posts, impressions, engagements, likes, comments, shares, clicks
- 👥 **Follower Analytics**: Total followers, growth, distribution by country/industry/source
- 👀 **Visitor Analytics**: Total visitors, unique visitors, page views, time spent
- 🏢 **Competitor Analysis**: Compare with competitors
- ⏱️ **Time Metrics**: Average time spent, time distribution
- 📍 **Source Tracking**: Where users and followers come from
- 🎯 **Top Content**: Best performing content by engagement

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Data Processing**: xlsx (Excel parsing)
- **PDF Export**: jsPDF + jspdf-autotable (server report); jsPDF + html2canvas (legacy full-page capture in `lib/pdf-export.ts`)
- **Date Handling**: date-fns
- **Icons**: lucide-react
- **Theme**: next-themes

## Prerequisites

- Node.js 18+ and npm/yarn
- Google Service Account credentials (for Google Sheets integration)
- LinkedIn Excel files in the `linkedin` folder

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Configuration

### Google Sheets Setup

Create a `.env.local` file in the root directory:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----"
GOOGLE_SHEET_ID=your-google-sheet-id
GOOGLE_SHEET_RANGE=requests!A:Z
```

### LinkedIn Data Files

Place your LinkedIn Excel files in the `linkedin` folder:
- `دورلي-doorly_content_1767085154803.xls` - Content analytics
- `دورلي-doorly_visitors_1767085157484.xls` - Visitor analytics
- `دورلي-doorly_followers_1767085160414.xls` - Follower analytics
- `دورلي - doorly_competitor_analytics_1767085167105.xlsx` - Competitor analytics

## Login Credentials

- **Email**: `admin@admin.com`
- **Password**: `admin123`

## Project Structure

```
DoorlyDashboard_/
├── app/
│   ├── api/
│   │   ├── linkedin/          # LinkedIn data API
│   │   └── requests/          # Google Sheets API
│   ├── dashboard/
│   │   ├── linkedin/         # LinkedIn Insights page
│   │   ├── customers/         # Customer analysis
│   │   └── settings/          # Settings page
│   ├── login/                 # Login page
│   └── globals.css            # Global styles & animations
├── components/
│   ├── charts/                # Chart components
│   ├── ui/                    # UI components
│   ├── linkedin-kpi-cards.tsx # LinkedIn KPIs
│   └── ...
├── lib/
│   ├── linkedin-analytics.ts  # LinkedIn data processing
│   ├── pdf-export.ts          # PDF export functionality
│   └── ...
└── linkedin/                  # LinkedIn Excel files
```

## Features in Detail

### Dashboard Analytics
- Total requests, new requests, verified, active, pending, cancelled
- Requests over time (daily/weekly/monthly)
- Distribution by area, source, property type, usage type
- Advanced filtering and search

### LinkedIn Insights
- 12+ KPI metrics with animated counters
- User source tracking (where visitors/followers come from)
- Time spent analytics
- Top performing content
- Engagement breakdown by type
- Competitor comparison

### Animations & UI
- Smooth page transitions
- Staggered card animations
- Hover effects and micro-interactions
- Loading states with animations
- Responsive design

## Deployment

### GitHub Pages (Static Export)

```bash
# Update next.config.mjs for static export
# Then build and export
npm run build
npm run export
```

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## License

Private project for Doorly.

## Support

For issues or questions, please contact the development team.
