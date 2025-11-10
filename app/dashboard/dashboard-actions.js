"use server";

import { createServerClient } from "@/lib/supabaseServer";
import { embedText } from "@/lib/openai";

export async function fetchCandidatesForDashboard(params) {
  const supabase = createServerClient();

  const pageSize = Number(params.pageSize || 20);
  const page = Number(params.page || 1);
  const offset = (page - 1) * pageSize;

  try {
    // Generate embedding for search term (or default)
    const queryEmbedding = await embedText(params.search || "general candidate profile");

    // ✅ Call the updated RPC function (match_candidates1)
    const { data, error } = await supabase.rpc("search_candidates_fast", {
      q_embedding: queryEmbedding,
      keywords: params.search || null,
      f_country: params.country || null,
      f_status: params.status || null,
      f_job_roles: params.job_roles || null,
      f_accent: params.accent || null,
      f_industry: params.industry || null,
      f_has_resume: params.has_resume === "true" ? true : null,
      limit_count: pageSize,
      offset_count: offset,
    });

    if (error) {
      console.error("RPC function error:", error);
      return { candidates: [], totalCount: 0 };
    }

    // ✅ Get total count (same RPC, no filters changed)
    const { data: countData, error: countError } = await supabase.rpc("search_candidates_fast", {
      q_embedding: queryEmbedding,
      keywords: params.search || null,
      f_country: params.country || null,
      f_status: params.status || null,
      f_job_roles: params.job_roles || null,
      f_accent: params.accent || null,
      f_industry: params.industry || null,
      f_has_resume: params.has_resume === "true" ? true : null,
      limit_count: 500, // large number for full count
      offset_count: 0,
    });

    const totalCount = countError ? 0 : (countData?.length || 0);

    return {
      candidates: data || [],
      totalCount,
    };
  } catch (error) {
    console.error("Error in fetchCandidatesForDashboard:", error);
    return { candidates: [], totalCount: 0 };
  }
}

export async function fetchFilterOptionsForDashboard() {
  const supabase = createServerClient();

  try {
    // Fetch distinct filter options from candidates table
    const { data: candidates, error } = await supabase
      .from("candidates")
      .select("country, candidate_status, english_accent, industry");

    if (error) {
      console.error("Error fetching filter options:", error);
      return {
        countries: [],
        statuses: [],
        accents: [],
        industries: [],
      };
    }

    const countries = [...new Set(candidates.map(c => c.country).filter(Boolean))].sort();
    const statuses = [...new Set(candidates.map(c => c.candidate_status).filter(Boolean))].sort();
    const accents = [...new Set(candidates.map(c => c.english_accent).filter(Boolean))].sort();
    const industries = [...new Set(candidates.map(c => c.industry).filter(Boolean))].sort();

    return {
      countries,
      statuses,
      accents,
      industries,
    };
  } catch (error) {
    console.error("Error in fetchFilterOptionsForDashboard:", error);
    return {
      countries: [],
      statuses: [],
      accents: [],
      industries: [],
    };
  }
}
