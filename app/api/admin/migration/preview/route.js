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

export async function POST(request) {
  try {
    // Check if user is admin
    const userRole = await getCurrentUserRole();
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Configure Airtable
    Airtable.configure({ apiKey: AIRTABLE_CONFIG.apiKey });
    const base = Airtable.base(AIRTABLE_CONFIG.baseId);

    // Convert dates to ISO format for Airtable filtering
    const start = new Date(startDate).toISOString();
    const end = new Date(endDate + 'T23:59:59').toISOString();

    console.log(`Fetching records between ${start} and ${end}`);

    // Query Airtable with date range filter
    const records = await base(AIRTABLE_CONFIG.tableName)
      .select({
        filterByFormula: `AND(
          DATETIME_PARSE({Created Time}) >= DATETIME_PARSE("${start}"),
          DATETIME_PARSE({Created Time}) <= DATETIME_PARSE("${end}")
        )`,
        fields: ['Name', 'Candidate Email', 'Created Time', 'Resume Link', 'Text Resume']
      })
      .all();

    console.log(`Found ${records.length} records in Airtable date range`);

    if (records.length === 0) {
      return NextResponse.json({
        totalRecords: 0,
        validRecords: 0,
        recordsWithResume: 0,
        recordsWithEmail: 0,
        newRecords: 0,
        duplicateEmails: 0,
        duplicateAirtableIds: 0,
        estimatedTime: 0,
        dateRange: { startDate, endDate },
        sampleRecord: null
      });
    }

    // Step 1: Get existing emails from candidates table
    console.log('Checking existing emails in candidates table...');
    const { data: existingCandidates, error: candidatesError } = await supabase
      .from('candidates')
      .select('email')
      .not('email', 'is', null);

    if (candidatesError) {
      console.error('Error fetching existing candidates:', candidatesError);
      throw new Error(`Failed to fetch existing candidates: ${candidatesError.message}`);
    }

    const existingEmails = new Set(
      existingCandidates.map(row => row.email?.toLowerCase()).filter(Boolean)
    );
    console.log(`Found ${existingEmails.size} existing emails in candidates table`);

    // Step 2: Get existing airtable_ids from airtable_candidates table
    console.log('Checking existing airtable_ids in airtable_candidates table...');
    const { data: existingAirtableRecords, error: airtableError } = await supabase
      .from('airtable_candidates')
      .select('airtable_id')
      .not('airtable_id', 'is', null);

    if (airtableError) {
      console.error('Error fetching existing airtable records:', airtableError);
      throw new Error(`Failed to fetch existing airtable records: ${airtableError.message}`);
    }

    const existingAirtableIds = new Set(
      existingAirtableRecords.map(row => row.airtable_id).filter(Boolean)
    );
    console.log(`Found ${existingAirtableIds.size} existing airtable_ids in airtable_candidates table`);

    // Step 3: Analyze the records and filter out duplicates
    let totalRecords = 0;
    let validRecords = 0;
    let recordsWithResume = 0;
    let recordsWithEmail = 0;
    let newRecords = 0;
    let duplicateEmails = 0;
    let duplicateAirtableIds = 0;

    const duplicateEmailList = [];
    const duplicateAirtableIdList = [];
    const newRecordsList = [];

    records.forEach(record => {
      totalRecords++;
      const fields = record.fields;
      const airtableId = record.id;
      const email = fields['Candidate Email'];
      const hasResume = fields['Resume Link'] || fields['Text Resume'];
      const hasName = fields['Name'];

      // Check for resume
      if (hasResume) {
        recordsWithResume++;
      }

      // Check for email
      if (email) {
        recordsWithEmail++;
      }

      // Check if valid record (has email and name)
      if (email && hasName) {
        validRecords++;
      }

      // Check for duplicate airtable_id first
      if (existingAirtableIds.has(airtableId)) {
        duplicateAirtableIds++;
        duplicateAirtableIdList.push({
          airtableId,
          name: hasName,
          email: email
        });
        return; // Skip this record
      }

      // Check for duplicate email in candidates table
      if (email && existingEmails.has(email.toLowerCase())) {
        duplicateEmails++;
        duplicateEmailList.push({
          airtableId,
          name: hasName,
          email: email
        });
        return; // Skip this record
      }

      // This is a new record
      newRecords++;
      newRecordsList.push({
        airtableId,
        name: hasName,
        email: email,
        hasResume: !!hasResume,
        createdTime: fields['Created Time']
      });
    });

    // Estimate processing time for NEW records only
    // Airtable fetch: ~30 seconds per 1000 records
    // Transformation: ~10 seconds per 1000 records  
    // Embeddings: ~60 seconds per 1000 records
    const estimatedTime = Math.ceil(
      (newRecords / 1000) * (30 + 10 + 60)
    );

    console.log(`Analysis complete:`);
    console.log(`- Total records in date range: ${totalRecords}`);
    console.log(`- New records to process: ${newRecords}`);
    console.log(`- Duplicate emails: ${duplicateEmails}`);
    console.log(`- Duplicate airtable_ids: ${duplicateAirtableIds}`);

    return NextResponse.json({
      totalRecords,
      validRecords,
      recordsWithResume,
      recordsWithEmail,
      newRecords,
      duplicateEmails,
      duplicateAirtableIds,
      estimatedTime,
      dateRange: { startDate, endDate },
      
      // Sample of new records
      sampleRecord: newRecordsList.length > 0 ? {
        name: newRecordsList[0].name,
        email: newRecordsList[0].email,
        createdTime: newRecordsList[0].createdTime,
        airtableId: newRecordsList[0].airtableId
      } : null,

      // Duplicate information
      duplicateInfo: {
        emailDuplicates: duplicateEmailList.slice(0, 5), // Show first 5 duplicate emails
        airtableIdDuplicates: duplicateAirtableIdList.slice(0, 5), // Show first 5 duplicate airtable_ids
        totalEmailDuplicates: duplicateEmails,
        totalAirtableIdDuplicates: duplicateAirtableIds
      },

      // Processing summary
      summary: {
        willProcess: newRecords,
        willSkipEmailDuplicates: duplicateEmails,
        willSkipAirtableIdDuplicates: duplicateAirtableIds,
        processingEfficiency: totalRecords > 0 ? Math.round((newRecords / totalRecords) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Preview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview data', details: error.message },
      { status: 500 }
    );
  }
}