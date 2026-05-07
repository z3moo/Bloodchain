import dotenv from 'dotenv'
import defaultSql from 'mssql'
import trustedSql from 'mssql/msnodesqlv8.js'

dotenv.config()

const useWindowsAuth = `${process.env.DB_USE_WINDOWS_AUTH || 'true'}`.toLowerCase() === 'true'
const sql = useWindowsAuth ? trustedSql : defaultSql
const trustServerCertificate = `${process.env.DB_TRUST_SERVER_CERTIFICATE || 'true'}`.toLowerCase() === 'true'
const encrypt = `${process.env.DB_ENCRYPT || 'true'}`.toLowerCase() === 'true'
const server = process.env.DB_SERVER || 'localhost'
const database = process.env.DB_NAME || 'BloodChainDB'

const config = useWindowsAuth
  ? {
      connectionString: [
        `Driver={${process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server'}}`,
        `Server=${server}`,
        `Database=${database}`,
        'Trusted_Connection=Yes',
        `Encrypt=${encrypt ? 'Yes' : 'No'}`,
        `TrustServerCertificate=${trustServerCertificate ? 'Yes' : 'No'}`,
      ].join(';'),
    }
  : {
      server,
      database,
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
      options: {
        encrypt,
        trustServerCertificate,
      },
    }

let poolPromise

export async function getPool() {
  if (!poolPromise) poolPromise = sql.connect(config)
  return poolPromise
}

export { sql }
