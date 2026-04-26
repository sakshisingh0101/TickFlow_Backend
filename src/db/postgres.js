import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv"
dotenv.config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const connectPostgres = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("PostgreSQL Connected");
  } catch (error) {
    console.error("Postgres Error:", error.message);
    process.exit(1);
  }
};

export default pool;