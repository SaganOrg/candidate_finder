import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserRole } from '@/lib/actions/users';

const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_KEY};

// You'll need to set your OpenAI API key as an environment variable
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ============================================================================
// METADATA EXTRACTION FUNCTIONS (from your edge function)
// ============================================================================
function extractYearsOfExperience(content) {
  const patterns = [
    /(\d+)\s*\+?\s*years?\s+(?:of\s+)?experience/gi,
    /experience:\s*(\d+)\s*\+?\s*years?/gi,
    /(\d+)\s*\+?\s*years?\s+in/gi,
    /over\s+(\d+)\s*years?/gi,
    /more\s+than\s+(\d+)\s*years?/gi
  ];
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const years = parseInt(match[1]);
      if (years >= 0 && years <= 50) {
        return years;
      }
    }
  }
  return null;
}

function extractSkillsList(content) {
  const skills = new Set();
  // Technical skills patterns
  const skillPatterns = [
    /skills?:\s*([^\n]+)/gi,
    /proficient\s+(?:in|with):\s*([^\n]+)/gi,
    /experience\s+(?:in|with):\s*([^\n]+)/gi,
    /knowledge\s+of:\s*([^\n]+)/gi,
    /familiar\s+with:\s*([^\n]+)/gi
  ];
  for (const pattern of skillPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const skillsText = match[1];
      const skillItems = skillsText.split(/[,;|•·\n]/).map((skill) => skill.trim()).filter((skill) => skill.length > 2 && skill.length < 50);
      skillItems.forEach((skill) => skills.add(skill));
    }
  }
  // Common technical tools and software
  const techTools = [
    'Excel', 'PowerPoint', 'Word', 'Outlook', 'Power BI', 'Tableau', 'SAP', 'Oracle', 'Salesforce', 'QuickBooks',
    'SQL', 'Python', 'R', 'SPSS', 'Alteryx', 'SAS', 'Adobe', 'Photoshop', 'AutoCAD', 'Revit', 'MATLAB',
    'JavaScript', 'HTML', 'CSS', 'CRM', 'ERP', 'ServiceTitan', 'Jira', 'Trello', 'Slack', 'Teams', 'Zoom'
  ];
  for (const tool of techTools) {
    const regex = new RegExp(`\\b${tool}\\b`, 'gi');
    if (regex.test(content)) {
      skills.add(tool);
    }
  }
  return Array.from(skills).slice(0, 20);
}

function extractAvailability(content) {
  const availabilityPatterns = [
    /availability:\s*([^\n]+)/gi,
    /available:\s*([^\n]+)/gi,
    /start\s+date:\s*([^\n]+)/gi,
    /can\s+start:\s*([^\n]+)/gi,
    /notice\s+period:\s*([^\n]+)/gi
  ];
  for (const pattern of availabilityPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const availability = match[1].trim();
      if (availability.length > 3 && availability.length < 100) {
        return availability;
      }
    }
  }
  // Check for common availability terms
  const commonTerms = [
    'immediate', 'immediately', 'asap', 'available now', 'ready to start',
    '2 weeks notice', 'one month notice', 'flexible', 'negotiable'
  ];
  for (const term of commonTerms) {
    const regex = new RegExp(term, 'gi');
    if (regex.test(content)) {
      return term;
    }
  }
  return null;
}

function extractCertifications(content) {
  const certifications = new Set();
  const certPatterns = [
    /certification[s]?:\s*([^\n]+)/gi,
    /certified\s+in:\s*([^\n]+)/gi,
    /license[s]?:\s*([^\n]+)/gi,
    /credential[s]?:\s*([^\n]+)/gi
  ];
  for (const pattern of certPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const certsText = match[1];
      const certItems = certsText.split(/[,;|•·\n]/).map((cert) => cert.trim()).filter((cert) => cert.length > 3 && cert.length < 100);
      certItems.forEach((cert) => certifications.add(cert));
    }
  }
  // Common certification keywords
  const commonCerts = [
    'PMP', 'CPA', 'CFA', 'CISSP', 'CISA', 'AWS', 'Azure', 'Google Cloud', 'Salesforce',
    'Microsoft', 'Oracle', 'Cisco', 'CompTIA', 'ITIL', 'Scrum Master', 'Agile', 'Six Sigma', 'Lean', 'Project Management'
  ];
  for (const cert of commonCerts) {
    const regex = new RegExp(`\\b${cert}\\b`, 'gi');
    if (regex.test(content)) {
      certifications.add(cert);
    }
  }
  return Array.from(certifications).slice(0, 10);
}

function extractDesiredSalary(content) {
  const salaryPatterns = [
    /salary\s+expectation[s]?:\s*([^\n]+)/gi,
    /desired\s+salary:\s*([^\n]+)/gi,
    /expected\s+salary:\s*([^\n]+)/gi,
    /salary\s+range:\s*([^\n]+)/gi,
    /compensation:\s*([^\n]+)/gi,
    /rate:\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:per\s+)?(?:hour|hr|annual|yearly|month)?/gi
  ];
  for (const pattern of salaryPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const salary = match[1].trim();
      if (salary.length > 1 && salary.length < 50) {
        return salary;
      }
    }
  }
  return null;
}

function extractPreferredIndustries(content) {
  const industries = new Set();
  const industryPatterns = [
    /industry\s+preference[s]?:\s*([^\n]+)/gi,
    /interested\s+in:\s*([^\n]+)/gi,
    /looking\s+for:\s*([^\n]+)/gi,
    /seeking\s+opportunities\s+in:\s*([^\n]+)/gi
  ];
  for (const pattern of industryPatterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      const industriesText = match[1];
      const industryItems = industriesText.split(/[,;|•·\n]/).map((industry) => industry.trim()).filter((industry) => industry.length > 3 && industry.length < 50);
      industryItems.forEach((industry) => industries.add(industry));
    }
  }
  // Common industries
  const commonIndustries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Consulting',
    'Real Estate', 'Construction', 'Logistics', 'Marketing', 'Sales', 'HR', 'Accounting',
    'Legal', 'Media', 'Telecommunications', 'Automotive', 'Aerospace', 'Energy'
  ];
  for (const industry of commonIndustries) {
    const regex = new RegExp(`\\b${industry}\\b`, 'gi');
    if (regex.test(content)) {
      industries.add(industry);
    }
  }
  return Array.from(industries).slice(0, 10);
}

function extractWorkPreferences(content) {
  const preferences = {};
  // Remote work preference
  const remotePatterns = [
    /remote\s+work/gi,
    /work\s+from\s+home/gi,
    /telecommute/gi,
    /distributed\s+team/gi
  ];
  preferences.remote_work = remotePatterns.some((pattern) => pattern.test(content));
  
  // Work schedule preference
  const schedulePatterns = [
    /full.?time/gi,
    /part.?time/gi,
    /contract/gi,
    /freelance/gi,
    /temporary/gi,
    /permanent/gi
  ];
  for (const pattern of schedulePatterns) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      if (match) {
        preferences.work_schedule = match[0].toLowerCase().replace(/[^\w]/g, '');
        break;
      }
    }
  }
  
  // Travel willingness
  const travelPatterns = [
    /willing\s+to\s+travel/gi,
    /travel\s+up\s+to/gi,
    /no\s+travel/gi,
    /minimal\s+travel/gi,
    /extensive\s+travel/gi
  ];
  for (const pattern of travelPatterns) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      if (match) {
        preferences.travel_preference = match[0];
        break;
      }
    }
  }
  return preferences;
}

function generateMetadata(content) {
  if (!content || typeof content !== 'string') {
    return {};
  }
  const metadata = {};
  
  const yearsExp = extractYearsOfExperience(content);
  if (yearsExp !== null) {
    metadata.years_of_experience = yearsExp;
  }
  
  const skillsList = extractSkillsList(content);
  if (skillsList.length > 0) {
    metadata.skills_list = skillsList;
  }
  
  const availability = extractAvailability(content);
  if (availability) {
    metadata.availability = availability;
  }
  
  const certifications = extractCertifications(content);
  if (certifications.length > 0) {
    metadata.certifications = certifications;
  }
  
  const desiredSalary = extractDesiredSalary(content);
  if (desiredSalary) {
    metadata.desired_salary = desiredSalary;
  }
  
  const preferredIndustries = extractPreferredIndustries(content);
  if (preferredIndustries.length > 0) {
    metadata.preferred_industries = preferredIndustries;
  }
  
  const workPreferences = extractWorkPreferences(content);
  if (Object.keys(workPreferences).length > 0) {
    metadata.work_preferences = workPreferences;
  }
  
  metadata.metadata_extracted_at = new Date().toISOString();
  return metadata;
}

// ============================================================================
// OPENAI EXTRACTION FUNCTIONS
// ============================================================================
async function extractColumnDataWithOpenAI(content) {
  try {
    const maxChunkSize = 15000;
    if (content.length <= maxChunkSize) {
      return await processContentChunk(content);
    } else {
      const chunks = [];
      for (let i = 0; i < content.length; i += maxChunkSize) {
        chunks.push(content.slice(i, i + maxChunkSize));
      }
      console.log(`Content split into ${chunks.length} chunks for processing`);
      const allResults = [];
      for (let i = 0; i < chunks.length; i++) {
        console.log(`Processing chunk ${i + 1}/${chunks.length}`);
        const chunkResult = await processContentChunk(chunks[i]);
        allResults.push(chunkResult);
      }
      return combineChunkResults(allResults);
    }
  } catch (error) {
    console.error('Error extracting with OpenAI:', error);
    return {
      Skills_Technical: null,
      Experience_Role: null,
      Language_Proficiency: null,
      Communication_Skills: null,
      Industry_Background: null,
      Location_Timezone: null,
      Education_Certifications: null,
      Work_Style: null
    };
  }
}

async function processContentChunk(contentChunk) {
  const prompt = `
You are analyzing a candidate's resume content. Extract information for these 8 specific categories. Look through the ENTIRE content and find ALL relevant items for each category.

Content to analyze:
${contentChunk}

Extract the following 8 categories and return as pipe-separated values (|):

1. Skills_Technical: Find ALL technical skills, software, tools, systems, platforms
2. Experience_Role: Find ALL job titles, positions, years of experience, roles
3. Language_Proficiency: Find ALL languages mentioned with proficiency levels
4. Communication_Skills: Find ALL communication-related skills
5. Industry_Background: Find ALL industries, sectors, business areas
6. Location_Timezone: Find ALL location information
7. Education_Certifications: Find ALL educational qualifications, certifications, courses
8. Work_Style: Find ALL work preferences, availability, work arrangements

CRITICAL INSTRUCTIONS:
- Extract EVERY item you find for each category, separated by commas within each field
- Use pipe (|) to separate the 8 categories
- If no information found for a category, write "null"
- Be comprehensive - include everything relevant you find

Your response:`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const result = data.choices[0].message.content.trim();
  const values = result.split('|').map((v) => v.trim());

  // Ensure we have exactly 8 values
  while (values.length < 8) {
    values.push("null");
  }
  const finalValues = values.slice(0, 8);
  const processedValues = finalValues.map((v) => v.toLowerCase() === "null" || v === "" ? null : v);

  return {
    Skills_Technical: processedValues[0],
    Experience_Role: processedValues[1],
    Language_Proficiency: processedValues[2],
    Communication_Skills: processedValues[3],
    Industry_Background: processedValues[4],
    Location_Timezone: processedValues[5],
    Education_Certifications: processedValues[6],
    Work_Style: processedValues[7]
  };
}

function combineChunkResults(allResults) {
  const combined = {
    Skills_Technical: [],
    Experience_Role: [],
    Language_Proficiency: [],
    Communication_Skills: [],
    Industry_Background: [],
    Location_Timezone: [],
    Education_Certifications: [],
    Work_Style: []
  };

  for (const result of allResults) {
    for (const [key, value] of Object.entries(result)) {
      if (value && value.toLowerCase() !== "null") {
        const items = value.split(',').map((item) => item.trim()).filter((item) => item);
        combined[key].push(...items);
      }
    }
  }

  const finalResult = {};
  for (const [key, values] of Object.entries(combined)) {
    if (values.length > 0) {
      const uniqueItems = [...new Set(values)];
      finalResult[key] = uniqueItems.join(", ");
    } else {
      finalResult[key] = null;
    }
  }
  return finalResult;
}

// ============================================================================
// CONTENT REFINEMENT FUNCTIONS
// ============================================================================
function cleanUnicodeString(text) {
  if (typeof text !== 'string') return text;
  let cleaned = text.replace(/\u0000/g, '').replace(/\x00/g, '');
  return cleaned.trim();
}

function refineContentColumn(originalContent) {
  if (!originalContent) return "";
  
  // Extract career goals, experience, achievements, etc. (simplified version)
  const lines = originalContent.split('\n');
  const valuableContent = lines
    .filter(line => line.trim().length > 20)
    .filter(line => !line.match(/^(Name|Title|Country|Role|Industry|Bio|Rate|Status|English|Eligibility|Email|Phone|Address|Linkedin):\s*/i))
    .slice(0, 20) // Limit to first 20 valuable lines
    .join('\n');
  
  return cleanUnicodeString(valuableContent);
}

// ============================================================================
// EMBEDDING FUNCTIONS
// ============================================================================
function createEmbeddingContent(record) {
  const fieldMappings = {
    candidate_job_title: 'Job Title',
    job_roles: 'Job Roles',
    candidate_bio: 'Bio',
    Industry_Background: 'Industry Background',
    Skills_Technical: 'Technical Skills',
    Experience_Role: 'Experience',
    Communication_Skills: 'Communication Skills',
    Education_Certifications: 'Education & Certifications',
    Work_Style: 'Work Style',
    Language_Proficiency: 'Language Proficiency',
    industry: 'Industry',
    desired_rate: 'Desired Rate',
    country: 'Country',
    region: 'Region',
    english_accent: 'English Proficiency',
    Location_Timezone: 'Location & Timezone'
  };

  const contentParts = [];
  for (const [fieldKey, fieldLabel] of Object.entries(fieldMappings)) {
    const value = record[fieldKey];
    if (value && typeof value === 'string' && value.trim() && value.trim().toLowerCase() !== 'none') {
      contentParts.push(`${fieldLabel}: ${value}`);
    }
  }

  // Check metadata for additional fields
  if (record.metadata) {
    try {
      const metadataDict = typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata;
      if (metadataDict.years_of_experience) {
        contentParts.push(`Years of Experience: ${metadataDict.years_of_experience}`);
      }
      if (metadataDict.skills_list && Array.isArray(metadataDict.skills_list) && metadataDict.skills_list.length > 0) {
        const skillsStr = metadataDict.skills_list.filter((s) => s && s.trim()).join(', ');
        if (skillsStr) {
          contentParts.push(`Skills: ${skillsStr}`);
        }
      }
      if (metadataDict.availability) {
        contentParts.push(`Availability: ${metadataDict.availability}`);
      }
      if (metadataDict.certifications) {
        contentParts.push(`Certifications: ${metadataDict.certifications}`);
      }
    } catch (error) {
      console.error('Error parsing metadata:', error);
    }
  }

  if (contentParts.length === 0) return null;
  return contentParts.join("\n");
}

async function generateEmbedding(text) {
  try {
    if (!text || !text.trim()) return [];
    const truncatedText = text.slice(0, 25000);
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: truncatedText,
        dimensions: 1536
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

// ============================================================================
// MAIN PROCESSING FUNCTION
// ============================================================================
async function processCandidateAllSteps(candidateRecord) {
  try {
    const candidateId = candidateRecord.id;
    const candidateName = candidateRecord.persons_name || 'Unknown';
    const resumeText = candidateRecord.resume_text || '';
    
    console.log(`Processing: ${candidateName} (ID: ${candidateId})`);
    const updateData = {};

    // STEP 1: Extract 8 column categories with OpenAI from resume_text
    if (resumeText) {
      console.log(`  [Step 1] Extracting column data from resume_text...`);
      const extractedData = await extractColumnDataWithOpenAI(resumeText);
      Object.assign(updateData, extractedData);
    }

    // STEP 2: Refine resume_text content and update content column
    if (resumeText) {
      console.log(`  [Step 2] Refining resume_text...`);
      const refinedContent = refineContentColumn(resumeText);
      if (refinedContent) {
        updateData.content = refinedContent;
        console.log(`    Content column updated with refined data`);
      }
    }

    // STEP 3: Generate metadata from resume_text
    if (resumeText) {
      console.log(`  [Step 3] Generating metadata from resume_text...`);
      const metadata = generateMetadata(resumeText);
      if (Object.keys(metadata).length > 0) {
        updateData.metadata = metadata;
        console.log(`    Metadata generated with ${Object.keys(metadata).length} fields`);
      }
    }

    // STEP 4: Generate embedding using multiple database fields
    console.log(`  [Step 4] Generating embedding from database fields...`);
    const updatedRecord = { ...candidateRecord, ...updateData };
    const embeddingContent = createEmbeddingContent(updatedRecord);
    if (embeddingContent) {
      const embedding = await generateEmbedding(embeddingContent);
      if (embedding.length > 0) {
        updateData.embedding = embedding;
        console.log(`    Embedding generated successfully`);
      }
    }

    return Object.keys(updateData).length > 0 ? {
      id: candidateId,
      update_data: updateData
    } : null;
  } catch (error) {
    console.error(`Error processing candidate ${candidateRecord.id}:`, error);
    return null;
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================
export async function POST(request) {
  try {
    // Check if user is admin
    const userRole = await getCurrentUserRole();
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { dateRange } = await request.json();

    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get candidates without embeddings within date range
          const start = new Date(dateRange.startDate).toISOString();
          const end = new Date(dateRange.endDate + 'T23:59:59').toISOString();

          const { data: candidates, error: fetchError } = await supabase
            .from('candidates_airtable')
            .select('*')
            .gte('created_at', start)
            .lte('created_at', end)
            .is('embedding', null)
            .order('id', { ascending: true });

          if (fetchError) {
            throw new Error(`Failed to fetch candidates: ${fetchError.message}`);
          }

          const totalCandidates = candidates.length;
          let processed = 0;
          let successful = 0;

          for (const candidate of candidates) {
            try {
              console.log(`Processing candidate ${candidate.id}: ${candidate.persons_name}`);
              
              const processResult = await processCandidateAllSteps(candidate);
              
              if (processResult && processResult.update_data) {
                // Update the candidate record in the database
                const { error: updateError } = await supabase
                  .from('candidates')
                  .update(processResult.update_data)
                  .eq('id', processResult.id);

                if (updateError) {
                  throw new Error(`Failed to update candidate: ${updateError.message}`);
                }
                
                successful++;
                console.log(`Successfully processed candidate ${candidate.id}`);
              }

              processed++;

              // Send progress update
              const progressData = JSON.stringify({
                type: 'progress',
                completed: processed,
                total: totalCandidates,
                successful,
                currentCandidate: candidate.persons_name
              }) + '\n';

              controller.enqueue(encoder.encode(progressData));

              // Small delay to prevent overwhelming OpenAI API
              await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
              processed++;
              console.error(`Failed to process candidate ${candidate.id}:`, error.message);
              
              const errorData = JSON.stringify({
                type: 'error',
                message: `Failed to process ${candidate.persons_name}: ${error.message}`
              }) + '\n';
              controller.enqueue(encoder.encode(errorData));
            }
          }

          // Send completion
          const completeData = JSON.stringify({
            type: 'complete',
            totalProcessed: processed,
            totalSuccessful: successful,
            totalFailed: processed - successful
          }) + '\n';

          controller.enqueue(encoder.encode(completeData));
          controller.close();

        } catch (error) {
          const errorData = JSON.stringify({
            type: 'error',
            message: error.message
          }) + '\n';
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Embedding generation error:', error);
    return NextResponse.json(
      { error: 'Embedding generation failed', details: error.message },
      { status: 500 }
    );
  }
}