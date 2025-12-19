# Disable Email Confirmation in Supabase

To allow users to sign up and immediately use the app without email confirmation, follow these steps:

## Steps in Supabase Dashboard:

1. **Go to your Supabase project dashboard**
   - Navigate to https://supabase.com/dashboard

2. **Open Authentication settings**
   - Click on "Authentication" in the left sidebar
   - Click on "Providers" tab

3. **Configure Email Provider**
   - Find "Email" in the list of providers
   - Click on "Email" to open settings

4. **Disable Email Confirmation**
   - Find the setting "Confirm email"
   - **Toggle it OFF** (disable it)
   - This allows users to sign up without email verification

5. **Save Changes**
   - Click "Save" button at the bottom

## What This Changes:

- ✅ Users can sign up and immediately use the app
- ✅ No email confirmation link needed
- ✅ Faster onboarding experience
- ⚠️ Note: Users can sign up with any email (even invalid ones)

## Alternative: Email Confirmation Without Redirect

If you want to keep email confirmation but don't have hosting:
1. You can use Supabase's default confirmation page
2. Or configure a simple static page URL

## After Making This Change:

Your app is now ready to work! Users will:
1. Enter email and password on the auth screen
2. Tap "Sign Up"
3. See a loading spinner while account is created
4. Automatically sign in and see the Events screen

No email confirmation needed! 🎉
