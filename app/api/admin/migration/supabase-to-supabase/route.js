import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserRole } from '@/lib/actions/users';

const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL,
  serviceKey: process.env.SUPABASE_SERVICE_KEY
};

// Field mapping: candidates_column -> airtable_candidates_column
const FIELD_MAPPING = {
  'persons_name': 'name',
  'resume_link': 'resume_link', 
  'email': 'email',
  'content': 'resume_text',
  'talent_id': 'airtable_id',
  'country': 'country',
  'desired_rate': 'rate',
  'candidate_bio': 'candidate_summary',
  'candidate_job_title': 'job_title_originally_applied_to',
  'job_applying_to': 'job_title_originally_applied_to',
  'resume_text': 'resume_text',
  'voice_link': 'voice_link',
  'linkedin_link': 'linkedin_url'
};

function transformForCandidatesTable(airtableRecord) {
  const transformed = {};
  
  // Map each field according to FIELD_MAPPING
  Object.entries(FIELD_MAPPING).forEach(([candidatesField, airtableField]) => {
    transformed[candidatesField] = airtableRecord[airtableField] || null;
  });
  
  // Add system fields
  transformed.created_at = new Date().toISOString();
  transformed.last_updated = new Date().toISOString();
  
  return transformed;
}

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
          // Get existing emails to check for duplicates
          const { data: existingCandidates } = await supabase
            .from('candidates_airtable')
            .select('email')
            .not('email', 'is', null);

          const existingEmails = new Set(
            existingCandidates.map(row => row.email?.toLowerCase()).filter(Boolean)
          );

          // Get records from airtable_candidates table within date range
          const start = new Date(dateRange.startDate).toISOString();
          const end = new Date(dateRange.endDate + 'T23:59:59').toISOString();

          const { data: airtableRecords, error: fetchError } = await supabase
            .from('airtable_candidates')
            .select('*')
            .gte('created_time', start)
            .lte('created_time', end)
            .order('id', { ascending: true });

          if (fetchError) {
            throw new Error(`Failed to fetch airtable_candidates: ${fetchError.message}`);
          }

          const totalRecords = airtableRecords.length;
          let processed = 0;
          let inserted = 0;
          let skipped = 0;

          // Process in batches
          const batchSize = 100;
          
          for (let i = 0; i < airtableRecords.length; i += batchSize) {
            const batch = airtableRecords.slice(i, i + batchSize);
            const recordsToInsert = [];
            let batchSkipped = 0;

            for (const record of batch) {
              // Check for email duplicates
              if (record.email) {
                const emailLower = record.email.toLowerCase();
                if (existingEmails.has(emailLower)) {
                  batchSkipped++;
                  continue;
                }
                // Add this email to our set to avoid duplicates within this batch
                existingEmails.add(emailLower);
              }

              // Transform record for candidates table
              const transformedRecord = transformForCandidatesTable(record);
              recordsToInsert.push(transformedRecord);
            }

            // Insert records if any
            if (recordsToInsert.length > 0) {
              const { error: insertError } = await supabase
                .from('candidates_airtable')
                .insert(recordsToInsert);

              if (insertError) {
                throw new Error(`Failed to insert batch: ${insertError.message}`);
              }

              inserted += recordsToInsert.length;
            }

            processed += batch.length;
            skipped += batchSkipped;

            // Send progress update
            const progressData = JSON.stringify({
              type: 'progress',
              completed: processed,
              total: totalRecords,
              inserted,
              skipped,
              currentBatch: Math.floor(i / batchSize) + 1,
              totalBatches: Math.ceil(totalRecords / batchSize)
            }) + '\n';

            controller.enqueue(encoder.encode(progressData));

            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // Send completion
          const completeData = JSON.stringify({
            type: 'complete',
            totalProcessed: processed,
            totalInserted: inserted,
            totalSkipped: skipped
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
    console.error('Supabase to Supabase migration error:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}