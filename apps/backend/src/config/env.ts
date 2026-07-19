import 'dotenv/config';
import * as v from 'valibot';

const envSchema = v.object({
  DATABASE_URL: v.pipe(v.string('DATABASE_URL is required'), v.nonEmpty('DATABASE_URL must not be empty')),
  JWT_SECRET: v.pipe(v.string('JWT_SECRET is required'), v.nonEmpty('JWT_SECRET must not be empty')),
  PORT: v.optional(v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(1)), '3001'),
  APIPERU_TOKEN: v.optional(v.string()),
});

const result = v.safeParse(envSchema, process.env);

if (!result.success) {
  const issues = result.issues
    .map((issue) => `- ${issue.path?.map((p) => String(p.key)).join('.') ?? 'env'}: ${issue.message}`)
    .join('\n');
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = result.output;
