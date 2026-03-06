import { supabase } from '@/lib/SupabaseClient';

export type PropertyTypeRow = {
  propertytypeid: number;
  propertytypename: string;
};

/**
 * Fetch all active property types with fallback error handling
 * Handles both successful queries and various failure scenarios gracefully
 */
export const fetchPropertyTypes = async (): Promise<PropertyTypeRow[]> => {
  try {
    const { data, error } = await supabase
      .from('propertytype')
      .select('propertytypeid, propertytypename')
      .eq('propertyisactive', true)
      .order('propertytypename', { ascending: true });

    if (error) {
      console.error('Error fetching property types:', error);
      return [];
    }

    return (data ?? []) as PropertyTypeRow[];
  } catch (error) {
    console.error('Failed to fetch property types:', error);
    return [];
  }
};
