import { NextResponse } from 'next/server';
import Airtable from "airtable";
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserRole } from '@/lib/actions/users';

const AIRTABLE_CONFIG = {
  apiKey: process.env.AIRTABLE_API_KEY,
  baseId: process.env.AIRTABLE_BASE_ID,
  tableName: process.env.AIRTABLE_TABLE_NAME
};

const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_KEY
};

// function transformRecord(airtableRecord) {
//   const fields = airtableRecord.fields || {};
//   const getField = (fieldName) => fields[fieldName] || null;
  
//   const parseNumeric = (value) => {
//     if (value === null || value === undefined || value === '') return null;
//     const parsed = parseFloat(value);
//     return isNaN(parsed) ? null : parsed;
//   };
  
//   const fullName = getField('Name') || getField('Your Full Name') || '';
//   const nameParts = fullName.split(' ');
//   const firstName = nameParts[0] || null;
//   const lastName = nameParts.slice(1).join(' ') || null;
  
//   return {
//     airtable_id: airtableRecord.id,
//     created_time: airtableRecord._rawJson?.createdTime,
//     name: getField('Name'),
//     full_name: fullName,
//     first_name: firstName,
//     last_name: lastName,
//     email: getField('Candidate Email'),
//     phone_number: getField('Your Phone number'),
//     country: getField('Candidate Country') || getField('Your Country of Residence'),
//     rate: parseNumeric(getField('Rate')),
//     linkedin_url: getField('LinkedIn URL') || getField('Put in Your LinkedIn Profile if You Have One'),
//     job_number_originally_applied_to: getField('Job Number Originally Applied To'),
//     job_title_originally_applied_to: getField('Job Title Originally Applied To'),
//     candidate_job_match_score_a: parseNumeric(getField('Candidate Job Match % (Score A)')),
//     candidate_job_match_score_b: parseNumeric(getField('Candidate Job Match % (Score B)')),
//     candidate_job_match_score_c: parseNumeric(getField('Candidate Job Match % (0 - 100) (Score C)')),
//     average_score: parseNumeric(getField('Average Score')),
//     voice_link: getField('Voice Link Field'),
//     resume_link: getField('Resume Link'),
//     portfolio_link: getField('Copy & Paste your Portfolio Link Here (if available)'),
//     job_description_originally_applied_to: getField('Job Description Originally Applied To'),
//     your_full_name: getField('Your Full Name'),
//     your_email: getField('Your Email'),
//     your_country_of_residence: getField('Your Country of Residence'),
//     your_phone_number: getField('Your Phone number'),
//     resume_text: getField('Text Resume'),
//     your_story: getField('Your story (150–200 words, plain English):tell us what shaped you. Aim for three parts: • Early influences • Key turning point • What drives you now Finish with a one-line goal.'),
//     shop_fabrication_experience: getField('Talk about your experience creating shop or fabrication drawings for metal or architectural projects.'),
//     software_experience: getField("Describe how you've used AutoCAD, Revit, Rhino, SolidWorks, or Inventor in your past work."),
//     point_cloud_experience: getField('Share your experience working with point cloud data or scan-to-BIM in design or modeling.'),
//     fabrication_tolerances_experience: getField('Explain how you make sure your drawings meet fabrication tolerances and accuracy standards.'),
//     architectural_metals_experience: getField('Briefly describe any experience you have with architectural metals, cladding, or curtain wall systems.'),
//     current_work_conflict: getField('Are you currently engaged in any other full-time or part-time work that could conflict with this role?'),
//     contract_type: getField('What type of contract are you currently working under?'),
//     current_monthly_compensation: getField('What is your current monthly compensation (base + variable, if any)?'),
//     target_monthly_compensation: getField('What is your target monthly compensation for your next role?'),
//     source_of_application: getField('Where did you find or hear about this job?'),
//     everything_field: getField('Everything Field'),
//     accent_grading: getField('Accent Grading'),
//     candidate_summary: getField('Candidate Summary'),
//     created_at: new Date().toISOString(),
//     updated_at: new Date().toISOString()
//   };
// }

function transformRecord(airtableRecord) {
  const fields = airtableRecord.fields || {};
  const getField = (fieldName) => fields[fieldName] || null;
  
  const parseNumeric = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };
  
  const fullName = getField('Name') || getField('Your Full Name') || '';
  const nameParts = fullName.split(' ');
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;
  
  return {

    persons_name: fullName,
    content: getField('Text Resume'),
    talent_id: airtableRecord.id,
    country: getField('Candidate Country'),
    desired_rate: getField('Rate'),
    resume_link: getField('Resume Link'),
    candidate_bio: getField('Candidate Summary'),
    job_applying_to: getField('Job Title Originally Applied To'),
    candidate_job_title: getField('Job Title Originally Applied To'),
    everything_field: getField('Everything Field'),

   everything_field: getField('Everything Field'),
  email: getField('Candidate Email'),
  resume_text: getField('Text Resume'),
  linkedin_link: getField('LinkedIn URL'),
video_link: getField('Video Introduction Google Drive'),
    voice_link: getField('Voice Link Field'),
   
  };
}

export async function POST(request) {
  try {
    // Check if user is admin
    const userRole = await getCurrentUserRole();
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { startDate, endDate } = await request.json();

    // Initialize clients
    Airtable.configure({ apiKey: AIRTABLE_CONFIG.apiKey });
    const airtableBase = Airtable.base(AIRTABLE_CONFIG.baseId);
    
    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Convert dates for filtering
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate + 'T23:59:59').toISOString();

    // Set up streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Fetch filtered records from Airtable
          const records = await airtableBase(AIRTABLE_CONFIG.tableName)
            .select({
              filterByFormula: `AND(
                DATETIME_PARSE({Created Time}) >= DATETIME_PARSE("${start}"),
                DATETIME_PARSE({Created Time}) <= DATETIME_PARSE("${end}")
              )`
            })
            .all();

          const totalRecords = records.length;
          
          // Process in batches
          const batchSize = 25;
          let processed = 0;
          
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            
            try {
              // Transform batch
              const transformedBatch = batch.map(record => transformRecord(record));
              
              // Insert to Supabase
              const { error } = await supabase
                .from('candidates')
                .upsert(transformedBatch, { 
                  onConflict: 'talent_id',
                  ignoreDuplicates: false 
                });
              
              if (error) {
                throw error;
              }
              
              processed += batch.length;
              
              // Send progress update
              const progressData = JSON.stringify({
                type: 'progress',
                completed: processed,
                total: totalRecords,
                currentBatch: Math.floor(i / batchSize) + 1,
                totalBatches: Math.ceil(totalRecords / batchSize)
              }) + '\n';
              
              controller.enqueue(encoder.encode(progressData));
              
              // Small delay between batches
              await new Promise(resolve => setTimeout(resolve, 500));
              
            } catch (error) {
              const errorData = JSON.stringify({
                type: 'error',
                message: `Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`
              }) + '\n';
              controller.enqueue(encoder.encode(errorData));
            }
          }
          
          // Send completion
          const completeData = JSON.stringify({
            type: 'complete',
            totalProcessed: processed,
            totalRecords
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
    console.error('Airtable to Supabase migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}