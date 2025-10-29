'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// export async function getCandidates(page = 1, pageSize = 50, filters = {}, search = '') {
//   try {
//     const supabase = await createClient();
//     const offset = (page - 1) * pageSize;

//     // Set statement timeout to 4 minutes using the custom function
//     await supabase.rpc('set_statement_timeout', { 
//       timeout_duration: '4min' 
//     });

//     // Parse comma-separated search keywords
//     const searchKeywords = search
//       .split(',')
//       .map(keyword => keyword.trim())
//       .filter(keyword => keyword.length > 0);

//     // Start building the query
//     let query = supabase
//       .from('candidates')
//       .select('*', { count: 'exact' });

//     // Apply multi-column keyword search
//     if (searchKeywords.length > 0) {
//       const searchColumns = [
//         'country',
//         'region',
//         'desired_rate',
//         'candidate_bio',
//         'candidate_job_title',
//         'job_roles',
//         'english_accent',
//         'industry',
//         'email',
//         'Work_Style',
//         'Education_Certifications',
//         'Location_Timezone',
//         'Communication_Skills',
//         'Language_Proficiency',
//         'Experience_Role',
//         'Skills_Technical'
//       ];

//       // Build OR condition for each keyword across all columns
//       const orConditions = searchKeywords.map(keyword => {
//         const columnConditions = searchColumns
//           .map(column => `${column}.ilike.%${keyword}%`)
//           .join(',');
//         return `or(${columnConditions})`;
//       }).join(',');

//       // Apply the search filter
//       query = query.or(orConditions);
//     }

//     // Apply additional filters
//     if (filters.country) {
//       query = query.eq('country', filters.country);
//     }
//     if (filters.candidate_status) {
//       query = query.eq('candidate_status', filters.candidate_status);
//     }
//     if (filters.job_roles) {
//       query = query.ilike('job_roles', `%${filters.job_roles}%`);
//     }
//     if (filters.english_accent) {
//       query = query.eq('english_accent', filters.english_accent);
//     }
//     if (filters.industry) {
//       query = query.eq('industry', filters.industry);
//     }
//     // NEW: Resume link filter
//     if (filters.has_resume) {
//       query = query.not('resume_link', 'is', null).neq('resume_link', '');
//     }

//     // Apply pagination and sorting
//     query = query
//       .order('created_at', { ascending: false })
//       .range(offset, offset + pageSize - 1);

//     const { data, error, count } = await query;

//     if (error) {
//       console.error('Error fetching candidates:', error);
//       return { data: [], count: 0, error: error.message };
//     }

//     return { data: data || [], count: count || 0, error: null };
//   } catch (error) {
//     console.error('Unexpected error:', error);
//     return { data: [], count: 0, error: error.message };
//   }
// }

// Alternative approach using AND logic (all keywords must match)
// export async function getCandidatesANDSearch(page = 1, pageSize = 50, filters = {}, search = '') {
//   try {
//     const supabase = await createClient();
//     const offset = (page - 1) * pageSize;

//     // Set statement timeout to 4 minutes
//     await supabase.rpc('exec_sql', { 
//       sql: "SET statement_timeout = '4min'" 
//     }).catch(() => {
//       console.log('Could not set statement_timeout via RPC');
//     });

//     const searchKeywords = search
//       .split(',')
//       .map(keyword => keyword.trim())
//       .filter(keyword => keyword.length > 0);

//     let query = supabase
//       .from('candidates')
//       .select('*', { count: 'exact' });

//     // Each keyword must match at least one column (AND logic between keywords)
//     if (searchKeywords.length > 0) {
//       const searchColumns = [
//         'country', 'region', 'desired_rate', 'candidate_bio', 
//         'candidate_job_title', 'job_roles', 'english_accent', 
//         'industry', 'email', 'Work_Style', 'Education_Certifications',
//         'Location_Timezone', 'Communication_Skills', 'Language_Proficiency',
//         'Experience_Role', 'Skills_Technical'
//       ];

//       searchKeywords.forEach(keyword => {
//         const columnConditions = searchColumns
//           .map(column => `${column}.ilike.%${keyword}%`)
//           .join(',');
//         query = query.or(columnConditions);
//       });
//     }

//     // Apply filters and pagination
//     if (filters.country) query = query.eq('country', filters.country);
//     if (filters.candidate_status) query = query.eq('candidate_status', filters.candidate_status);
//     if (filters.job_roles) query = query.ilike('job_roles', `%${filters.job_roles}%`);
//     if (filters.english_accent) query = query.eq('english_accent', filters.english_accent);
//     if (filters.industry) query = query.eq('industry', filters.industry);
//     // NEW: Resume link filter for AND search as well
//     if (filters.has_resume) {
//       query = query.not('resume_link', 'is', null).neq('resume_link', '');
//     }

//     query = query
//       .order('created_at', { ascending: false })
//       .range(offset, offset + pageSize - 1);

//     const { data, error, count } = await query;

//     if (error) {
//       console.error('Error fetching candidates:', error);
//       return { data: [], count: 0, error: error.message };
//     }

//     return { data: data || [], count: count || 0, error: null };
//   } catch (error) {
//     console.error('Unexpected error:', error);
//     return { data: [], count: 0, error: error.message };
//   }
// }

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

export async function toggleBlacklist(id, currentStatus) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('candidates')
    .update({ blacklist: !currentStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, data, error: null };
}

export async function toggleAvailability(id, currentStatus) {
  const supabase = await createClient();

  const newStatus = currentStatus === 'Available' ? 'Not Available' : 'Available';

  const { data, error } = await supabase
    .from('candidates')
    .update({ candidate_status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, data, error: null };
}


// You can also create a helper function to get current user
export async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}