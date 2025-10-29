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
    const { candidateId, candidateStatus } = body;

    console.log('Toggle availability request:', { candidateId, candidateStatus });

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    if (!candidateStatus) {
      return NextResponse.json(
        { error: 'Candidate status is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update candidate_status, last_updated_by, and timestamp
    const updateData = {
      candidate_status: candidateStatus,
      last_updated_by: user.id, // Add the logged-in user's ID
      // updated_at: new Date().toISOString() // Update the timestamp
    };

    const { data, error } = await supabase
      .from('candidates')
      .update(updateData)
      .eq('id', candidateId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating availability status:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to update availability status' },
        { status: 500 }
      );
    }

    console.log('Successfully updated candidate status:', data);

    return NextResponse.json({
      success: true,
      data,
      message: `Candidate status updated to: ${candidateStatus}`,
    });
  } catch (error) {
    console.error('Error in toggle-availability API:', error);
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