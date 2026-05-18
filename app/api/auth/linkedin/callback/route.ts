import { NextRequest, NextResponse } from 'next/server';

const CLIENT_ID = process.env.LINKEDIN_CLIENT_ID || '';
const CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.LINKEDIN_REDIRECT_URI || 'https://social-listener-adjadi-two.vercel.app/api/auth/linkedin/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.json({ error: 'LinkedIn OAuth error', details: error }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({ error: 'No authorization code received' }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      return NextResponse.json({ error: 'Token exchange failed', details: tokenData }, { status: 500 });
    }

    const accessToken = tokenData.access_token;
    const expiresIn = tokenData.expires_in;

    // Return the token info - user should copy this to Vercel env var LINKEDIN_ACCESS_TOKEN
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px;max-width:600px;margin:auto">
        <h2>LinkedIn OAuth Success!</h2>
        <p>Copy the access token below and set it as the <code>LINKEDIN_ACCESS_TOKEN</code> environment variable in Vercel.</p>
        <textarea style="width:100%;height:120px;font-family:monospace;font-size:12px">${accessToken}</textarea>
        <p><strong>Expires in:</strong> ${expiresIn} seconds (~${Math.round(expiresIn/86400)} days)</p>
        <p>After setting the env var, redeploy your Vercel project.</p>
      </body></html>`,
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    return NextResponse.json({ error: 'Internal error', details: String(err) }, { status: 500 });
  }
}
