import supabase from '../src/config/database.js'

async function check() {
  console.log('Testing Supabase query for public.system_settings...')
  const { data, error } = await supabase.from('system_settings').select('*').limit(5)
  if (error) {
    console.error('Error querying system_settings:', error)
    process.exit(1)
  }
  console.log('Success! Data retrieved from system_settings:', data)
  process.exit(0)
}

check().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
