import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config()

const { Client } = pg

async function run() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD

  let clientConfig = null

  if (dbUrl) {
    clientConfig = { connectionString: dbUrl, ssl: { rejectUnauthorized: false } }
  } else if (dbPassword) {
    clientConfig = {
      host: 'db.megstikozgcqazmopkcz.supabase.co',
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: dbPassword,
      ssl: { rejectUnauthorized: false },
    }
  } else {
    console.error('Please provide DATABASE_URL or SUPABASE_DB_PASSWORD to run this script.')
    console.error('Alternatively, copy and paste the SQL from backend/migrations/000_full_setup.sql into your Supabase Dashboard SQL Editor.')
    process.exit(1)
  }

  const client = new Client(clientConfig)

  try {
    console.log('Connecting to Supabase PostgreSQL database...')
    await client.connect()
    console.log('Connected!')

    const sqlFile = process.argv[2] 
      ? path.resolve(process.cwd(), process.argv[2])
      : path.resolve(__dirname, '../migrations/000_full_setup.sql')

    console.log(`Applying SQL migration from: ${sqlFile}`)
    const sql = fs.readFileSync(sqlFile, 'utf8')

    await client.query(sql)
    console.log('Migration successfully applied!')
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
