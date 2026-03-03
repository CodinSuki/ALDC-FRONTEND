import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
	const availableSupabaseKeys = Object.keys(import.meta.env)
		.filter((key) => key.includes('SUPABASE') || key.startsWith('VITE_'))
		.sort()

	throw new Error(
		`Missing required client environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. ` +
			`Available env keys at build/runtime: ${availableSupabaseKeys.join(', ') || 'none'}`
	)
}

export const supabase = createClient(supabaseUrl, supabaseKey)