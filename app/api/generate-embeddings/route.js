import { createServerClient } from '@/lib/supabaseServer';
import { embedText } from '@/lib/openai';

export async function POST() {
  const supabase = createServerClient();
  
  try {
    // Fetch candidates without embeddings (batch of 10)
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .is('embedding', null)
      .limit(10);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    let processed = 0;
    let successful = 0;
    let failed = 0;
    const errors = [];

    for (const candidate of candidates) {
      try {
        // Create text from candidate data for embedding
        const text = [
          candidate.persons_name,
          candidate.candidate_job_title,
          candidate.candidate_bio,
          candidate.job_roles,
          candidate.Skills_Technical,
          candidate.Experience_Role,
          candidate.Communication_Skills,
          candidate.industry,
          candidate.country
        ].filter(Boolean).join(' ');

        // Generate embedding
        const embedding = await embedText(text);

        // Update candidate with embedding
        const { error: updateError } = await supabase
          .from('candidates')
          .update({ embedding_vec: embedding })
          .eq('id', candidate.id);

        if (updateError) {
          failed++;
          errors.push({ candidateId: candidate.id, error: updateError.message });
        } else {
          successful++;
        }

        processed++;
        
        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        failed++;
        errors.push({ candidateId: candidate.id, error: error.message });
        processed++;
      }
    }

    return Response.json({
      message: 'Batch processing completed',
      results: { processed, successful, failed, errors }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}