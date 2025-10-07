'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getCandidates(page = 1, pageSize = 50, filters = {}, searchTerm = '') {
  const supabase = await createClient();
  
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('candidates')
    .select('*', { count: 'exact' });

  // Apply search
  if (searchTerm && searchTerm.trim()) {
    query = query.or(`persons_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,candidate_job_title.ilike.%${searchTerm}%`);
  }

  // Apply filters
  if (filters.country && filters.country.trim()) {
    query = query.eq('country', filters.country);
  }
  if (filters.candidate_status && filters.candidate_status.trim()) {
    query = query.eq('candidate_status', filters.candidate_status);
  }
  if (filters.job_roles && filters.job_roles.trim()) {
    query = query.ilike('job_roles', `%${filters.job_roles}%`);
  }
  if (filters.english_accent && filters.english_accent.trim()) {
    query = query.eq('english_accent', filters.english_accent);
  }
  if (filters.industry && filters.industry.trim()) {
    query = query.eq('industry', filters.industry);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching candidates:', error);
    return { data: [], count: 0, error: error.message };
  }

  return { data: data || [], count: count || 0, error: null };
}

export async function getCandidateById(id) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function createCandidate(candidateData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('candidates')
    .insert([candidateData])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard');
  return { data, error: null };
}

export async function updateCandidate(id, candidateData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('candidates')
    .update(candidateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  revalidatePath('/dashboard');
  return { data, error: null };
}

export async function deleteCandidate(id) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, error: null };
}

export async function getFilterOptions() {
  const supabase = await createClient();

  try {
    // Use parallel queries with limit to prevent timeout
    const [countriesResult, statusesResult, accentsResult, industriesResult] = await Promise.all([
      supabase
        .from('candidates')
        .select('country')
        .not('country', 'is', null)
        .limit(1000),
      supabase
        .from('candidates')
        .select('candidate_status')
        .not('candidate_status', 'is', null)
        .limit(1000),
      supabase
        .from('candidates')
        .select('english_accent')
        .not('english_accent', 'is', null)
        .limit(1000),
      supabase
        .from('candidates')
        .select('industry')
        .not('industry', 'is', null)
        .limit(1000),
    ]);

    // Extract unique values
    const countries = [...new Set(countriesResult.data?.map(item => item.country) || [])].filter(Boolean).sort();
    const statuses = [...new Set(statusesResult.data?.map(item => item.candidate_status) || [])].filter(Boolean).sort();
    const accents = [...new Set(accentsResult.data?.map(item => item.english_accent) || [])].filter(Boolean).sort();
    const industries = [...new Set(industriesResult.data?.map(item => item.industry) || [])].filter(Boolean).sort();

    return {
      countries: countries.slice(0, 200),
      statuses: statuses.slice(0, 50),
      accents: accents.slice(0, 50),
      industries: industries.slice(0, 200),
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      countries: [],
      statuses: [],
      accents: [],
      industries: [],
    };
  }
}