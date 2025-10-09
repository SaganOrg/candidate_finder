import { NextResponse } from 'next/server';

// Convert plain text message to HTML template
function convertToHtmlTemplate(message) {
  // Split message into paragraphs
  const paragraphs = message.split('\n\n').filter(p => p.trim());
  
  // Create HTML paragraphs
  const htmlParagraphs = paragraphs
    .map(p => {
      // Handle line breaks within paragraphs
      const lines = p.split('\n').filter(line => line.trim());
      return `<p style="margin: 0 0 16px 0; line-height: 1.6;">${lines.join('<br>')}</p>`;
    })
    .join('');

  // Return full HTML email template
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Email Content -->
          <tr>
            <td style="padding: 40px;">
              ${htmlParagraphs}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #6c757d; line-height: 1.5;">
                This email was sent from Sagan Command Center
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, subject, message } = body;

    console.log('Send email request:', { email, subject, messageLength: message?.length });

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Convert message to HTML template
    const htmlMessage = convertToHtmlTemplate(message);

    console.log('Sending request to n8n webhook...');

    // Send to n8n webhook
    const response = await fetch('https://saganworld.app.n8n.cloud/webhook/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        subject: subject,
        message: htmlMessage,
      }),
    });

    console.log('n8n webhook response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error:', errorText);
      throw new Error(`Failed to send email: ${response.status} ${response.statusText}`);
    }

    // Try to parse JSON response, but handle cases where it might not be JSON
    let result;
    const responseText = await response.text();
    console.log('n8n webhook raw response:', responseText);

    try {
      result = responseText ? JSON.parse(responseText) : { success: true };
    } catch (parseError) {
      console.log('Response is not JSON, treating as success');
      result = { success: true, rawResponse: responseText };
    }

    console.log('Email sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error in send-candidate-email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}