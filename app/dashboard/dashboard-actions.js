"use server";

import { createServerClient } from "@/lib/supabaseServer";
import { embedText } from "@/lib/openai";

export async function fetchCandidatesForDashboard(params) {
  const supabase = createServerClient();

  const pageSize = Number(params.pageSize || 20);
  const page = Number(params.page || 1);
  const offset = (page - 1) * pageSize;

  try {
    // Check if user is searching
    const hasSearch = params.search && params.search.trim();
    
    if (hasSearch) {
      // 🔍 USER IS SEARCHING - Use vector search
      const queryEmbedding = await embedText(params.search);

      const { data, error } = await supabase.rpc("search_candidates_fast", {
        q_embedding: queryEmbedding,
        keywords: params.search,
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

      // Get total count for search
      const { data: countData, error: countError } = await supabase.rpc("search_candidates_fast", {
        q_embedding: queryEmbedding,
        keywords: params.search,
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
    } else {
      // 📋 NO SEARCH - Show last uploaded candidates with optional filters
      let query = supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false }); // Latest first

      // Apply filters if present (but no search)
      if (params.country) {
        query = query.eq("country", params.country);
      }
      if (params.status) {
        query = query.eq("candidate_status", params.status);
      }
      if (params.job_roles) {
        query = query.ilike("job_roles", `%${params.job_roles}%`);
      }
      if (params.accent) {
        query = query.eq("english_accent", params.accent);
      }
      if (params.industry) {
        query = query.eq("industry", params.industry);
      }
      if (params.has_resume === "true") {
        query = query.not("resume_text", "is", null);
      }

      // Limit to last 1000 candidates and apply pagination
      const { data, error } = await query
        .limit(pageSize)
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error("Database query error:", error);
        return { candidates: [], totalCount: 0 };
      }

      // Get total count for filters (but limited to last 1000)
      let countQuery = supabase
        .from("candidates")
        .select("id", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(1000); // Only count from last 1000

      // Apply same filters for count
      if (params.country) countQuery = countQuery.eq("country", params.country);
      if (params.status) countQuery = countQuery.eq("candidate_status", params.status);
      if (params.job_roles) countQuery = countQuery.ilike("job_roles", `%${params.job_roles}%`);
      if (params.accent) countQuery = countQuery.eq("english_accent", params.accent);
      if (params.industry) countQuery = countQuery.eq("industry", params.industry);
      if (params.has_resume === "true") countQuery = countQuery.not("resume_text", "is", null);

      const { count, error: countError } = await countQuery;
      const totalCount = countError ? 0 : count;

      return {
        candidates: data || [],
        totalCount,
      };
    }
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