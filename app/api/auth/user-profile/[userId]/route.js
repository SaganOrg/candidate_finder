import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if the requesting user is authenticated
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try to get user profile from profiles table first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile && !profileError) {
      return NextResponse.json({
        success: true,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        }
      });
    }

    // If not found in profiles, try auth.users table (admin access needed)
    // This requires RLS policies or service role access
    const { data: authUser, error: authUserError } = await supabase.auth.admin.getUserById(userId);

    if (authUserError) {
      console.error('Error fetching user from auth:', authUserError);
      
      // Fallback: return partial information
      return NextResponse.json({
        success: true,
        user: {
          id: userId,
          email: 'User not found',
          name: null,
          created_at: null,
          updated_at: null,
        }
      });
    }

    if (authUser && authUser.user) {
      return NextResponse.json({
        success: true,
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          name: authUser.user.user_metadata?.name || authUser.user.user_metadata?.full_name || null,
          created_at: authUser.user.created_at,
          updated_at: authUser.user.updated_at,
        }
      });
    }

    // User not found
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: 'User not found',
        name: null,
        created_at: null,
        updated_at: null,
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}