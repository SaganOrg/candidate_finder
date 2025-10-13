import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { message } = await request.json();

    // Replace with your actual webhook URL
    const webhookUrl = process.env.CHAT_WEBHOOK_URL || 'https://saganworld.app.n8n.cloud/webhook/dadc0605-a390-4290-8e40-672acdb06d8a';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        // Add any other required fields for your webhook
      }),
    });

    if (!response.ok) {
      throw new Error('Webhook request failed');
    }

    // Get the raw text first
    const rawText = await response.text();
    console.log('Raw response:', rawText);
    
    // Try to parse as JSON
    let data;
    let outputText = '';
    
    try {
      data = JSON.parse(rawText);
      // If it's an array, get the first item's output
      outputText = Array.isArray(data) ? (data[0]?.output || '') : (data.output || rawText);
    } catch (parseError) {
      // If JSON parsing fails, use the raw text directly
      console.log('Response is not JSON, using raw text');
      outputText = rawText;
    }

    // Parse candidates from the markdown-formatted output
    const candidates = parseCandidatesFromOutput(outputText);

    return NextResponse.json({
      output: outputText,
      candidates: candidates
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', output: null, candidates: [] },
      { status: 500 }
    );
  }
}

function parseCandidatesFromOutput(outputText) {
  const candidates = [];
  
  // Split by candidate sections - handle both ** and * variations
  const candidateSections = outputText.split(/\*{1,2}Candidate #\d+\*{1,2}/);
  
  candidateSections.forEach((section, index) => {
    if (index === 0) return; // Skip the first empty section
    
    const candidate = {};
    
    // Extract name - handle variations with dashes and asterisks
    const nameMatch = section.match(/[-–\*\s]*Name:\s*(.+?)(?=\n|$)/m);
    if (nameMatch) candidate.name = nameMatch[1].trim();
    
    // Extract email
    const emailMatch = section.match(/[-–\*\s]*Email:\s*(.+?)(?=\n|$)/m);
    if (emailMatch) candidate.email = emailMatch[1].trim();
    
    // Extract country
    const countryMatch = section.match(/[-–\*\s]*Country:\s*(.+?)(?=\n|$)/m);
    if (countryMatch) candidate.country = countryMatch[1].trim();
    
    // Extract desired rate
    const rateMatch = section.match(/[-–\*\s]*Desired Rate:\s*(.+?)(?=\n|$)/m);
    if (rateMatch) candidate.desired_rate = rateMatch[1].trim();
    
    // Extract bio - more flexible pattern
    const bioMatch = section.match(/[-–\*\s]*Candidate Bio:\s*(.+?)(?=\n[-–\*\s]*\[|$)/s);
    if (bioMatch) candidate.candidate_bio = bioMatch[1].trim();
    
    // Extract profile link
    const profileMatch = section.match(/\[.*?View Full Profile.*?\]\((.+?)\)/);
    if (profileMatch) candidate.profile_url = profileMatch[1].trim();
    
    // Extract resume link if exists
    const resumeMatch = section.match(/[-–\*\s]*Resume Link:.*?\[.*?View Resume.*?\]\((.+?)\)/);
    if (resumeMatch) candidate.resume_link = resumeMatch[1].trim();
    
    // Extract LinkedIn if exists
    const linkedinMatch = section.match(/[-–\*\s]*LinkedIn:.*?\[.*?LinkedIn Profile.*?\]\((.+?)\)/);
    if (linkedinMatch) candidate.linkedin_link = linkedinMatch[1].trim();
    
    if (candidate.name) {
      candidates.push(candidate);
    }
  });
  
  return candidates;
}