import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'https://social-listener-adjadi-two.vercel.app/api/auth/linkedin/callback';

export async function GET(request: NextRequest) {
  const scopes = 'r_liteprofile r_emailaddress w_member_social';
  const state = 'social_listener_' + Date.now();

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', scopes);

  return NextResponse.redirect(authUrl.toString());
}
