import dotenv from 'dotenv'
import defaultSql from 'mssql'

dotenv.config()

const useWindowsAuth = `${process.env.DB_USE_WINDOWS_AUTH || 'true'}`.toLowerCase() === 'true'
const trustServerCertificate = `${process.env.DB_TRUST_SERVER_CERTIFICATE || 'true'}`.toLowerCase() === 'true'
const encrypt = `${process.env.DB_ENCRYPT || 'true'}`.toLowerCase() === 'true'
const server = process.env.DB_SERVER || 'localhost'
const database = process.env.DB_NAME || 'BloodChainDB'

let sql
let config
let poolPromise

async function getSqlConfig() {
  if (sql && config) return { sql, config }

  if (useWindowsAuth) {
    const trustedSql = await import('mssql/msnodesqlv8.js')
    sql = trustedSql.default || trustedSql
    config = {
      connectionString: [
        `Driver={${process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server'}}`,
        `Server=${server}`,
        `Database=${database}`,
        'Trusted_Connection=Yes',
        `Encrypt=${encrypt ? 'Yes' : 'No'}`,
        `TrustServerCertificate=${trustServerCertificate ? 'Yes' : 'No'}`,
      ].join(';'),
    }
  } else {
    sql = defaultSql
    config = {
      server,
      database,
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      options: {
        encrypt,
        trustServerCertificate,
      },
    }
  }

  return { sql, config }
}

export async function getPool() {
  if (!poolPromise) {
    const resolved = await getSqlConfig()
    poolPromise = resolved.sql.connect(resolved.config)
  }
  return poolPromise
}

export { sql }
