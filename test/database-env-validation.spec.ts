import 'reflect-metadata';
import * as assert from 'assert';
import { DynamicDatabaseService } from '../src/backend/database/dynamic-database.service';

async function runDatabaseEnvValidationTests() {
  console.log('--- Starting Database Environment & Mockdata Guard Tests ---');

  const originalEnv = { ...process.env };

  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_NAME',
    'DB_SCHEMA',
  ];

  try {
    // Test 1: Each required variable missing must throw an error
    for (const varName of requiredVars) {
      // Setup complete dummy env
      process.env.DB_HOST = 'test.db.internal';
      process.env.DB_PORT = '5432';
      process.env.DB_USERNAME = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_NAME = 'test_db';
      process.env.DB_SCHEMA = 'test_schema';

      delete process.env[varName];

      const service = new DynamicDatabaseService();
      let threw = false;
      try {
        service.validateDatabaseEnv();
      } catch (err: any) {
        threw = true;
        assert.ok(
          err.message.includes(varName),
          `Error message should mention missing variable ${varName}, got: ${err.message}`,
        );
        assert.ok(
          err.message.includes('mockdata'),
          `Error message should mention not using mockdata, got: ${err.message}`,
        );
      }
      assert.strictEqual(threw, true, `Should have thrown error when ${varName} is missing`);
      console.log(`✔ Verified missing ${varName} correctly throws fatal configuration error.`);
    }

    // Test 2: Invalid DB_PORT must throw
    {
      process.env.DB_HOST = 'test.db.internal';
      process.env.DB_PORT = 'invalid-port';
      process.env.DB_USERNAME = 'test_user';
      process.env.DB_PASSWORD = 'test_password';
      process.env.DB_NAME = 'test_db';
      process.env.DB_SCHEMA = 'test_schema';

      const service = new DynamicDatabaseService();
      let threw = false;
      try {
        service.validateDatabaseEnv();
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('DB_PORT'), 'Error message should mention invalid DB_PORT');
      }
      assert.strictEqual(threw, true, 'Should have thrown error when DB_PORT is not a valid number');
      console.log('✔ Verified invalid DB_PORT throws fatal configuration error.');
    }

    // Test 3: Valid database env variables pass validateDatabaseEnv()
    {
      process.env.DB_HOST = 'db.production.local';
      process.env.DB_PORT = '5432';
      process.env.DB_USERNAME = 'prod_user';
      process.env.DB_PASSWORD = 'prod_secret_password';
      process.env.DB_NAME = 'prod_db';
      process.env.DB_SCHEMA = 'prod_schema';

      const service = new DynamicDatabaseService();
      assert.doesNotThrow(() => {
        service.validateDatabaseEnv();
      }, 'Valid env variables should pass validation without error');
      console.log('✔ Verified valid database environment variables pass validation.');
    }

    // Test 4: loadConfigAndInitializeDataSources fails fast when env is missing
    {
      delete process.env.DB_HOST;
      delete process.env.DB_USERNAME;
      const service = new DynamicDatabaseService();
      let threw = false;
      try {
        await service.loadConfigAndInitializeDataSources();
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('FATAL CONFIG ERROR'), 'Should reject initialization immediately');
      }
      assert.strictEqual(threw, true, 'loadConfigAndInitializeDataSources must reject when env is missing');
      console.log('✔ Verified loadConfigAndInitializeDataSources halts system when env vars are missing.');
    }

    // Test 5: JwtStrategy fails fast without JWT_SECRET
    {
      delete process.env.JWT_SECRET;
      const { JwtStrategy } = await import('../src/backend/identity/modules/auth/jwt.strategy');
      let threw = false;
      try {
        new JwtStrategy({ getRepositoryForTable: () => null } as any);
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('JWT_SECRET'), 'Should mention missing JWT_SECRET');
        assert.ok(err.message.includes('mockdata'), 'Should mention mockdata fallback prohibited');
      }
      assert.strictEqual(threw, true, 'JwtStrategy must throw when JWT_SECRET is missing');
      console.log('✔ Verified JwtStrategy halts immediately when JWT_SECRET is missing (no mockdata).');
    }

    console.log('--- ALL DATABASE & SECURITY ENVIRONMENT VALIDATION TESTS PASSED 100% ---');
  } finally {
    // Restore original env
    process.env = originalEnv;
  }
}

runDatabaseEnvValidationTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
