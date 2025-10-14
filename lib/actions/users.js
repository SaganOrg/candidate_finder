'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function getUsers() {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { data: [], error: 'Unauthorized' };
  }

  // Get all users
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return { data: data || [], error: error?.message };
}

export async function getCurrentUserRole() {
  const supabase = await createClient();

 
  
  const { data: { user } } = await supabase.auth.getUser();
  console.log(user?.id)
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id).single()
     console.log(profile)

  return profile?.role || 'user';
}

export async function createInviteToken(email, role = 'user') {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  // Generate unique token
  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

  const { data, error } = await supabase
    .from('invite_tokens')
    .insert({
      email,
      token,
      role,
      invited_by: user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, token: data.token };
}

export async function verifyInviteToken(token) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('invite_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single();

  if (error || !data) {
    return { valid: false, error: 'Invalid or expired token' };
  }

  // Check if token is expired
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'Token has expired' };
  }

  return { valid: true, data };
}

export async function markInviteTokenAsUsed(token) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('invite_tokens')
    .update({ used: true })
    .eq('token', token);

  return { success: !error, error: error?.message };
}

export async function signupWithInvite(formData) {
  const supabase = await createClient();

  const email = formData.get('email');
  const password = formData.get('password');
  const fullName = formData.get('full_name');
  const token = formData.get('token');

  // Verify token
  const tokenResult = await verifyInviteToken(token);
  if (!tokenResult.valid) {
    return { success: false, error: tokenResult.error };
  }

  // Check if email matches token
  if (tokenResult.data.email !== email) {
    return { success: false, error: 'Email does not match invitation' };
  }

  // Sign up user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: tokenResult.data.role,
      },
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Mark token as used
  await markInviteTokenAsUsed(token);

  revalidatePath('/');
  redirect('/dashboard');
}

export async function deleteUser(userId) {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { success: false, error: 'Unauthorized' };
  }

  // Delete from profiles (this will cascade to auth.users if set up correctly)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/users');
  return { success: true };
}