import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { candidateId, isHired } = await request.json();

    if (!candidateId) {
      return NextResponse.json(
        { error: 'Candidate ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Prepare update data
    const updateData = {
      hired: isHired
    };

    // If hiring the candidate, also remove from blacklist and set as not available
    if (isHired) {
      updateData.blacklist = false;
      updateData.candidate_status = 'Not Available';
    }

    // Update the candidate in the database
    const { data, error } = await supabase
      .from('candidates')
      .update(updateData)
      .eq('id', candidateId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update candidate hired status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Candidate ${isHired ? 'hired' : 'unhired'} successfully`,
      data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}