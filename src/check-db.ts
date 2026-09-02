import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { ALL_DATABASE_ENTITIES, DbRoutingConfig } from './modules/database/dynamic-database.service';
import { User, UserType } from './modules/users/entities/user.entity';
import { Role } from './modules/roles-permissions/entities/role.entity';
import { Permission } from './modules/roles-permissions/entities/permission.entity';

async function runDatabaseDiagnostics() {
  console.log('🔍 ========================================================');
  console.log('🔍 DAVITEQ LoRaWAN PLATFORM - DATABASE & USER DIAGNOSTIC TOOL');
  console.log('🔍 ========================================================\n');

  const configPath = process.env.DB_ROUTING_CONFIG_PATH || path.join(process.cwd(), 'config', 'db-routing.config.json');
  console.log(`📁 Reading DB routing config: ${configPath}`);

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found at: ${configPath}`);
    process.exit(1);
  }

  const rawConfig: DbRoutingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const connKey = rawConfig.default_connection || 'core_db';
  const connConfig = rawConfig.connections[connKey];

  if (!connConfig) {
    console.error(`❌ Connection [${connKey}] not found in config file!`);
    process.exit(1);
  }

  const host = process.env.DB_HOST || connConfig.host;
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : connConfig.port;
  const username = process.env.DB_USERNAME || connConfig.username;
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : connConfig.password;
  const database = process.env.DB_NAME || connConfig.database;

  console.log(`🌐 Target PostgreSQL Host : ${host}`);
  console.log(`🌐 Target PostgreSQL Port : ${port}`);
  console.log(`🌐 Target Database        : ${database}`);
  console.log(`🌐 Target Username        : ${username}\n`);

  const dataSource = new DataSource({
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: ALL_DATABASE_ENTITIES,
    synchronize: false,
    logging: false,
  });

  try {
    console.log('⏳ Connecting to PostgreSQL database...');
    await dataSource.initialize();
    console.log('✅ PostgreSQL connection initialized successfully!\n');

    // 1. Inspect Tables in PostgreSQL public schema
    console.log('📋 [1/4] Checking PostgreSQL tables in database:');
    const tableQueryResult = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC;
    `);

    const existingTables: string[] = tableQueryResult.map((r: any) => r.table_name);
    console.log(`Found ${existingTables.length} tables in schema public:`);
    existingTables.forEach((t) => {
      console.log(`   ✓ ${t}`);
    });

    const expectedTables = [
      'users',
      'user_role',
      'roles',
      'role_permissions',
      'permission',
      'applications',
      'devices',
      'gateways',
      'uplink_telemetry',
    ];

    const missingTables = expectedTables.filter((t) => !existingTables.includes(t));
    if (missingTables.length > 0) {
      console.warn(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
    } else {
      console.log('\n✅ All 9 core tables exist: users, user_role, roles, role_permissions, permission, applications, devices, gateways, uplink_telemetry.');
    }

    // 2. Check Permissions
    console.log('\n📋 [2/4] Verifying default system permissions in `permission` table:');
    const permRepo = dataSource.getRepository(Permission);
    let permCount = await permRepo.count();

    if (permCount === 0) {
      console.log('⏳ Seeding default permissions into `permission` table...');
      const defaultPerms = [
        { name: 'users:read', module: 'users', action: 'read', description: 'View user list' },
        { name: 'users:create', module: 'users', action: 'create', description: 'Create user or subadmin' },
        { name: 'users:permissions:update', module: 'users', action: 'update', description: 'Update permissions' },
        { name: 'users:delete', module: 'users', action: 'delete', description: 'Delete user' },
        { name: 'lorawan:app:read', module: 'lorawan', action: 'read', description: 'Read applications' },
        { name: 'lorawan:app:manage', module: 'lorawan', action: 'manage', description: 'Create/edit applications' },
        { name: 'lorawan:device:read', module: 'lorawan', action: 'read', description: 'Read devices' },
        { name: 'lorawan:device:manage', module: 'lorawan', action: 'manage', description: 'Create/edit devices' },
        { name: 'lorawan:gateway:read', module: 'lorawan', action: 'read', description: 'Read gateways' },
        { name: 'lorawan:gateway:manage', module: 'lorawan', action: 'manage', description: 'Create/edit gateways' },
        { name: 'lorawan:telemetry:read', module: 'lorawan', action: 'read', description: 'View decoded telemetry' },
      ];
      await permRepo.save(permRepo.create(defaultPerms));
      permCount = await permRepo.count();
      console.log(`✅ Seeded ${permCount} permissions.`);
    } else {
      console.log(`✅ Found ${permCount} permissions in \`permission\` table.`);
    }

    // 3. Check Roles & Seed if needed
    console.log('\n📋 [3/4] Verifying system roles in `roles` and `role_permissions` tables:');
    const roleRepo = dataSource.getRepository(Role);
    let roleCount = await roleRepo.count();

    if (roleCount === 0) {
      console.log('⏳ Seeding default roles...');
      const allPerms = await permRepo.find();
      const subAdminPerms = allPerms.filter((p) => !p.name.includes('users:permissions:update'));

      const defaultRoles = [
        {
          code: 'SUPER_ADMIN',
          name: 'Super Administrator',
          description: 'Full unhindered system access',
          permissions: allPerms,
        },
        {
          code: 'SUB_ADMIN',
          name: 'Sub-Administrator',
          description: 'Delegated administrative privileges',
          permissions: subAdminPerms,
        },
        {
          code: 'LORAWAN_OPERATOR',
          name: 'LoRaWAN Operator',
          description: 'Manage applications, devices, and gateways',
          permissions: allPerms.filter((p) => p.module === 'lorawan'),
        },
      ];
      await roleRepo.save(roleRepo.create(defaultRoles));
      roleCount = await roleRepo.count();
      console.log(`✅ Seeded ${roleCount} roles.`);
    } else {
      console.log(`✅ Found ${roleCount} roles in database.`);
    }

    // 4. Check & Verify Super Admin Account in `users` and `user_role`
    console.log('\n📋 [4/4] Verifying default Super Admin account (admin / Dvt@123):');
    const userRepo = dataSource.getRepository(User);
    const superAdminRole = await roleRepo.findOne({ where: { code: 'SUPER_ADMIN' } });

    let admin = await userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.username = :val OR user.email = :val', { val: 'admin' })
      .getOne();

    const targetPassword = 'Dvt@123';
    const passwordHash = await bcrypt.hash(targetPassword, 10);

    if (!admin) {
      console.log('⏳ Admin account not found. Creating admin / Dvt@123...');
      admin = userRepo.create({
        username: 'admin',
        email: 'admin@daviteq.com',
        passwordHash,
        fullName: 'Daviteq Super Administrator',
        userType: UserType.ADMIN,
        isActive: true,
        roles: superAdminRole ? [superAdminRole] : [],
      });
      await userRepo.save(admin);
      console.log('✅ Admin user created successfully in `users` & `user_role`!');
    } else {
      console.log(`Found existing user: ID=${admin.id}, username=${admin.username}, email=${admin.email}, type=${admin.userType}`);
      const isPasswordValid = await bcrypt.compare(targetPassword, admin.passwordHash);
      console.log(`Password verification for '${targetPassword}': ${isPasswordValid ? '✅ VALID' : '⚠️ MISMATCH (Will update)'}`);

      if (!isPasswordValid || admin.userType !== UserType.ADMIN || !admin.isActive) {
        admin.passwordHash = passwordHash;
        admin.userType = UserType.ADMIN;
        admin.isActive = true;
        if (superAdminRole && (!admin.roles || !admin.roles.some((r) => r.code === 'SUPER_ADMIN'))) {
          admin.roles = [superAdminRole];
        }
        await userRepo.save(admin);
        console.log('✅ Synced password hash to Dvt@123 and restored SUPER_ADMIN role.');
      }
    }

    console.log('\n🎉 ========================================================');
    console.log('🎉 DIAGNOSTIC SUMMARY:');
    console.log(`   - Host: ${host}:${port}/${database}`);
    console.log(`   - Admin Username : admin`);
    console.log(`   - Admin Password : ${targetPassword}`);
    console.log(`   - User Type      : ${admin.userType}`);
    console.log(`   - Assigned Roles : ${admin.roles?.map((r) => r.code).join(', ') || 'SUPER_ADMIN'}`);
    console.log('🎉 ========================================================\n');

    await dataSource.destroy();
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Database Diagnostic Error:', error.message);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

runDatabaseDiagnostics();
