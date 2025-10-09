import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
    const { candidateId, isBlacklisted } = body;

    console.log('Toggle blacklist request:', { candidateId, isBlacklisted });

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // When blacklisting: set blacklist=true AND candidate_status='Not Available'
    // When un-blacklisting: set blacklist=false (keep candidate_status as is)
    const updateData = {
      blacklist: isBlacklisted,
    };

    if (isBlacklisted) {
      updateData.candidate_status = 'Not Available';
    }

    console.log('Updating candidate with data:', updateData);

    const { data, error } = await supabase
      .from('candidates')
      .update(updateData)
      .eq('id', candidateId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating blacklist status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update blacklist status' },
        { status: 500 }
      );
    }

    console.log('Successfully updated candidate:', data);

    return NextResponse.json({
      success: true,
      data,
      message: isBlacklisted ? 'Candidate blacklisted and set to Not Available' : 'Candidate removed from blacklist',
    });
  } catch (error) {
    console.error('Error in toggle-blacklist API:', error);
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