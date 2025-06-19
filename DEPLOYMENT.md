# Deployment Guide: Genesis Web App

## 1. Prerequisites
- GitHub repository with your code
- Supabase project with schema applied (see schema.sql)

## 2. Vercel/Netlify Setup
1. Go to [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/)
2. Create a new project and connect your GitHub repo
3. Set the following environment variables in the dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy the project

## 3. Post-Deploy Checklist
- Visit your deployed site
- Sign up, login, and test all features
- Check browser console for errors
- Check Supabase dashboard for new user data

## 4. Troubleshooting
- If you see 'Missing Supabase configuration', check your environment variables
- If features are missing, ensure your Supabase schema is up to date
- For help, see the QA_CHECKLIST.md file

## Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- Git
- Access to your deployment platform (e.g., Vercel, Netlify, or your own server)

## Environment Setup

1. Copy `.env.example` to `.env` and fill in your environment variables:
   ```bash
   cp .env.example .env
   ```

2. Required environment variables:
   - `VITE_APP_URL`: Your production domain
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `VITE_SENTRY_DSN`: Your Sentry DSN for error tracking
   - `VITE_POSTHOG_KEY`: Your PostHog key for analytics

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm run test        # Unit tests
   npm run test:e2e    # E2E tests
   npm run test:lighthouse  # Performance tests
   ```

## Building for Production

1. Generate sitemap and build:
   ```bash
   npm run build
   ```

2. Preview production build:
   ```bash
   npm run preview
   ```

## Deployment

### GitHub Actions (CI/CD)

1. Add the following secrets to your GitHub repository:
   - `VITE_SENTRY_DSN`
   - `VITE_APP_URL`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_POSTHOG_KEY`
   - `DEPLOY_KEY` (if using SSH deployment)

2. Push to main branch to trigger deployment:
   ```bash
   git push origin main
   ```

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy the `dist` directory to your hosting provider.

## Monitoring

- **Error Tracking**: Check [Sentry](https://sentry.io) for error reports
- **Analytics**: View user analytics in [PostHog](https://app.posthog.com)
- **Performance**: Monitor Web Vitals in Google Search Console

## Security Checklist

- [ ] All environment variables are properly set
- [ ] CSP headers are configured
- [ ] Rate limiting is enabled
- [ ] SSL/TLS is properly configured
- [ ] Dependencies are up to date
- [ ] Security headers are in place
- [ ] Error tracking is working
- [ ] Analytics are properly configured

## Troubleshooting

### Common Issues

1. **Build fails**
   - Check Node.js version
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules && npm install`

2. **Environment variables not loading**
   - Ensure `.env` file exists
   - Check variable names match `.env.example`
   - Restart development server

3. **Deployment fails**
   - Check GitHub Actions logs
   - Verify all required secrets are set
   - Ensure build succeeds locally

### Support

For additional support:
1. Check the [documentation](https://your-docs-url)
2. Open an issue on GitHub
3. Contact the development team 