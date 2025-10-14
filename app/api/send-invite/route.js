import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to, subject, message, signupUrl } = body;

    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Replace with your actual webhook URL
    const webhookUrl = process.env.EMAIL_WEBHOOK_URL || "https://saganworld.app.n8n.cloud/webhook/send-email"

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Email webhook URL not configured' },
        { status: 500 }
      );
    }

    // Send to your webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        message,
        signupUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Webhook failed: ${errorData}`);
    }

    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}