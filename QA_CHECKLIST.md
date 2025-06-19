# QA Checklist for Genesis Web App

## Authentication
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google
- [ ] Sign out
- [ ] Session persists on refresh

## Dashboard & Features
- [ ] Dashboard loads after login
- [ ] All main features are accessible (search, AI, user profile, etc.)
- [ ] Data is created in Supabase (check user_data, etc.)
- [ ] No console errors in browser

## Error & Loading States
- [ ] Missing/invalid credentials show clear error
- [ ] Loading spinners are visible during async actions
- [ ] Backend errors are surfaced to the user

## Mobile & Desktop
- [ ] App is responsive on mobile
- [ ] App is usable on desktop

## Edge Cases
- [ ] Try logging in with wrong password
- [ ] Try signing up with an existing email
- [ ] Try accessing dashboard when not logged in (should redirect to login)

## Deployment
- [ ] App loads on production URL
- [ ] Environment variables are set in deployment platform
- [ ] All features work in production 