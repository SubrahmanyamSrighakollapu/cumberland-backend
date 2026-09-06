const config = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",

  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "cumberland_motor_inn",
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    charset: "utf8mb4_unicode_ci",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "default_jwt_secret_change_in_prod",
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  },

  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),
  },

  admin: {
    defaultEmail: process.env.ADMIN_DEFAULT_EMAIL || "admin@cumberlandmotorinn.com",
    defaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || "Admin@12345",
  },

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
};

export default config;
