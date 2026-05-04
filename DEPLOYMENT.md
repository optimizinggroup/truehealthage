# TrueHealthAge React App - Deployment Guide

## Prerequisites

1. **Node.js** 18+ installed
2. **Supabase Project** set up (database with schema already deployed)
3. **Resend API Key** from resend.com
4. **Make.com Webhook URLs** (one for Phase 1, one for Phase 2)
5. **Vercel Account** for hosting (optional, can use any provider)

## Local Development

### 1. Install Dependencies

```bash
cd TrueHealthAge/app
npm install
```

### 2. Create .env.local File

Copy `.env.example` to `.env.local` and fill in actual values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
VITE_SUPABASE_URL=https://ssckphhvxftbhpylhfmy.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_L8xNBMNQwu-cDtolW5b6IA_9SeR65Kb
VITE_MAKE_WEBHOOK_PHASE1=https://hook.us2.make.com/YOUR_PHASE1_WEBHOOK_ID
VITE_MAKE_WEBHOOK_PHASE2=https://hook.us2.make.com/YOUR_PHASE2_WEBHOOK_ID
```

### 3. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## Build for Production

```bash
npm run build
```

This creates a `dist/` folder with the production build.

## Deploy to Vercel (Recommended)

### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

Follow the prompts to deploy. When asked about build settings, use:
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Root Directory:** `app`

### Option B: Using GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Connect your GitHub repo
4. Import the project, set the Root Directory to `app`
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_MAKE_WEBHOOK_PHASE1`
   - `VITE_MAKE_WEBHOOK_PHASE2`
6. Deploy

## Getting Make Webhook URLs

After importing the blueprints into Make.com:

1. Go to **Make Dashboard** → Your Scenario
2. Click on **Module 1** (CustomWebHook)
3. Copy the **Webhook URL**
4. For Phase 1, paste into `VITE_MAKE_WEBHOOK_PHASE1`
5. For Phase 2, paste into `VITE_MAKE_WEBHOOK_PHASE2`

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://ssckphhvxftbhpylhfmy.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `sb_publishable_...` |
| `VITE_MAKE_WEBHOOK_PHASE1` | Make webhook URL for Phase 1 quiz completion | `https://hook.us2.make.com/...` |
| `VITE_MAKE_WEBHOOK_PHASE2` | Make webhook URL for Phase 2 completion | `https://hook.us2.make.com/...` |

## Testing the Deployment

1. Visit your deployed app
2. Sign up with test email
3. Complete Phase 1 quiz (26 questions)
4. Check Supabase dashboard → users & quiz_results tables
5. Check your email for welcome email from Resend
6. Complete Phase 2 (10-area selection)
7. Verify Phase 2 data in Supabase & Beehiiv tags

## Troubleshooting

### "Webhook URL not found"
- Ensure Make scenarios are properly configured and saved
- Copy the correct webhook URL from Module 1

### "Cannot POST to Supabase"
- Check SUPABASE_URL is correct
- Verify SUPABASE_ANON_KEY matches your project
- Ensure database schema is deployed

### "Email not sending"
- Verify Resend API key in Make.com Module 5
- Check Resend dashboard for failed deliveries
- Ensure fallback Google Workspace connection is configured

## Performance Notes

- Phase 1 quiz data is calculated client-side
- Phase 2 recommendations are generated client-side
- All data is posted to Supabase via Make webhook
- Email delivery is handled asynchronously by Resend

## Security Notes

- SUPABASE_ANON_KEY is used only for auth & basic queries
- Row-Level Security (RLS) is enabled on Supabase
- Service Role Key is only used in Make.com (not in frontend)
- API keys in environment variables are only accessible server-side in Vercel
