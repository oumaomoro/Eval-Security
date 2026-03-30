import { supabase } from './supabase.service.js';

/**
 * Enterprise Report Generator
 * Dynamically resolves Local vs Global legal frameworks based on tenant configuration.
 */
export const ReporterService = {
  
  /**
   * Resolves the customized AI evaluation prompt mapped to the specific Region Code.
   * If a user is based in Dubai ('AE'), the system retrieves PDPL frameworks context.
   */
  async getRegionalPromptContext(regionCode) {
    if (!regionCode) return "Verify compliance against standard Global GDPR baselines.";

    try {
      const { data, error } = await supabase
        .from('regions')
        .select('custom_ai_prompt')
        .eq('country_code', regionCode.toUpperCase())
        .single();
        
      if (error || !data) {
         return "Verify compliance against standard Global protections.";
      }
      
      return data.custom_ai_prompt;
    } catch (error) {
      console.warn("Region Lookup Error. Safely falling back to global standard.");
      return "Verify general compliance protocols.";
    }
  },

  /**
   * Format the final exported Compliance PDF utilizing contextual translations.
   */
  async generateRegionalExportPayload(analysisJson, targetLanguage = 'en') {
     // Stub wrapper bridging PDF formatting logic ensuring localization.
     // Will inject precise i18n buffers parsing analysisJson fields natively.
     return {
        headers: targetLanguage === 'ar' ? 'تقرير الامتثال المتقدم' : 'Executive Compliance Report',
        metadata: analysisJson,
        timestamp: new Date().toISOString()
     };
  }
};
