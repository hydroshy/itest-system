export const CONTROL_PANEL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
  <meta http-equiv="Pragma" content="no-cache" />
  <meta http-equiv="Expires" content="0" />
  <title>Control Panel - Daviteq LoRaWAN Platform</title>
  <!-- Material Design Icons -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" />
  <!-- Vuetify 3 CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/vuetify@3.6.14/dist/vuetify.min.css" />
  <style>
    html {
      font-size: 13.5px;
    }
    body {
      background-color: #070d1e;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 0;
      color: #f1f5f9;
      overflow-x: hidden;
    }
    .custom-scroll::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }
    .custom-scroll::-webkit-scrollbar-track {
      background: #0b132b;
    }
    .custom-scroll::-webkit-scrollbar-thumb {
      background: #2a3b5c;
      border-radius: 4px;
    }
    .font-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    }
    .code-box {
      background: #040814 !important;
      border: 1px solid #1e293b !important;
      border-radius: 6px !important;
      font-family: monospace !important;
    }
    .compact-table td, .compact-table th {
      padding: 6px 12px !important;
      height: 38px !important;
    }
    .v-tab {
      letter-spacing: 0.02em !important;
      text-transform: none !important;
      font-weight: 600 !important;
      min-width: auto !important;
      padding: 0 10px !important;
      font-size: 0.8125rem !important;
    }
    .v-card {
      border-color: rgba(51, 65, 85, 0.6) !important;
    }
  </style>
</head>
<body>
  <div id="app">
    <v-app theme="dark" style="background: #070d1e;">
      <!-- NAVIGATION DRAWER -->
      <v-navigation-drawer v-model="drawer" color="#050a17" width="230" border="right">
        <!-- Brand Header -->
        <div class="pa-3 d-flex align-center gap-2 border-b border-slate-800">
          <v-avatar color="cyan-darken-3" rounded="lg" size="32">
            <v-icon icon="mdi-transmission-tower" color="cyan-lighten-2" size="20"></v-icon>
          </v-avatar>
          <div>
            <div class="text-caption font-weight-bold text-white d-flex align-center gap-1">
              <span class="text-cyan-lighten-2">DAVITEQ</span> IoT
              <v-chip size="x-small" color="cyan" variant="tonal" class="font-weight-bold px-1 py-0" style="font-size: 8px; height: 16px;">v1.0</v-chip>
            </div>
            <div class="text-caption text-medium-emphasis" style="font-size: 10px;">LoRaWAN Server</div>
          </div>
        </div>

        <!-- Navigation List -->
        <v-list density="compact" nav class="pa-2 custom-scroll">
          <v-list-subheader class="text-uppercase font-weight-bold text-caption text-slate-400 py-1" style="font-size: 10px;">Monitoring</v-list-subheader>
          
          <v-list-item
            value="overview"
            :active="tab === 'overview'"
            @click="tab = 'overview'"
            prepend-icon="mdi-view-dashboard-outline"
            title="Overview"
            rounded="lg"
            color="cyan-lighten-2"
            density="compact"
          ></v-list-item>

          <v-list-item
            value="telemetry"
            :active="tab === 'telemetry'"
            @click="tab = 'telemetry'"
            prepend-icon="mdi-sine-wave"
            title="Live Telemetry"
            rounded="lg"
            color="indigo-lighten-2"
            density="compact"
          ></v-list-item>

          <v-list-item
            value="database"
            :active="tab === 'database'"
            @click="tab = 'database'"
            prepend-icon="mdi-database-eye-outline"
            title="Database Health"
            rounded="lg"
            color="amber-lighten-2"
            density="compact"
          ></v-list-item>

          <v-list-subheader class="text-uppercase font-weight-bold text-caption text-slate-400 mt-2 py-1" style="font-size: 10px;">LoRaWAN Fleet</v-list-subheader>
          
          <v-list-item
            value="devices"
            :active="tab === 'devices'"
            @click="tab = 'devices'"
            prepend-icon="mdi-chip"
            title="LoRaWAN Devices"
            rounded="lg"
            color="cyan-lighten-2"
            density="compact"
          ></v-list-item>

          <v-list-item
            value="webhooks"
            :active="tab === 'webhooks'"
            @click="tab = 'webhooks'"
            prepend-icon="mdi-webhook"
            title="Webhooks Ingest"
            rounded="lg"
            color="emerald-lighten-2"
            density="compact"
          ></v-list-item>

          <v-list-item
            value="decoder"
            :active="tab === 'decoder'"
            @click="tab = 'decoder'"
            prepend-icon="mdi-code-braces"
            title="Decoder Sandbox"
            rounded="lg"
            color="purple-lighten-2"
            density="compact"
          ></v-list-item>

          <v-list-subheader class="text-uppercase font-weight-bold text-caption text-slate-400 mt-2 py-1" style="font-size: 10px;">Security & RBAC</v-list-subheader>
          
          <v-list-item
            value="users"
            :active="tab === 'users'"
            @click="tab = 'users'"
            prepend-icon="mdi-account-multiple-outline"
            title="User Directory"
            rounded="lg"
            color="cyan-lighten-2"
            density="compact"
          ></v-list-item>

          <v-list-item
            value="roles"
            :active="tab === 'roles'"
            @click="tab = 'roles'"
            prepend-icon="mdi-shield-account-outline"
            title="Role Matrix"
            rounded="lg"
            color="yellow-lighten-2"
            density="compact"
          ></v-list-item>
        </v-list>

        <!-- Drawer Footer Profile -->
        <template v-slot:append>
          <div class="pa-2 border-t border-slate-800 bg-slate-950">
            <div class="d-flex align-center justify-space-between mb-1">
              <v-chip size="x-small" color="success" variant="tonal" class="font-weight-bold" style="font-size: 9px; height: 18px;">
                <v-badge dot color="success" inline class="mr-1"></v-badge>
                core_db : ONLINE
              </v-chip>
              <a href="/api/docs" target="_blank" class="text-caption text-cyan-lighten-2 text-decoration-none" style="font-size: 10px;">API &rarr;</a>
            </div>

            <v-card color="#0d1527" rounded="lg" class="pa-2 d-flex align-center justify-space-between" variant="outlined">
              <div class="text-truncate mr-1">
                <div class="text-caption font-weight-bold text-white text-truncate" style="font-size: 11px;">{{ currentUser.fullName || currentUser.username || 'Admin User' }}</div>
                <div class="text-caption text-cyan-lighten-2 font-mono font-weight-bold" style="font-size: 9px;">{{ currentUser.userType || 'ADMIN' }}</div>
              </div>
              <v-btn icon="mdi-power" size="x-small" color="error" variant="text" @click="handleLogout" title="Logout"></v-btn>
            </v-card>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- TOP APP BAR -->
      <v-app-bar color="#070d1e" density="compact" elevation="1" border="bottom">
        <v-app-bar-nav-icon size="small" @click="drawer = !drawer"></v-app-bar-nav-icon>

        <v-app-bar-title class="text-caption font-weight-bold d-flex align-center gap-1" style="font-size: 13px !important;">
          <span>{{ tabTitles[tab] || 'Control Panel' }}</span>
          <v-chip size="x-small" color="cyan" variant="tonal" class="ml-1 font-weight-bold" style="height: 18px; font-size: 9px;">{{ tabCategories[tab] || 'LoRaWAN' }}</v-chip>
        </v-app-bar-title>

        <!-- Horizontal Tabs with Zero Slide -->
        <v-tabs v-model="tab" color="cyan-lighten-2" density="compact" class="d-none d-md-flex">
          <v-tab value="overview"><v-icon icon="mdi-view-dashboard-outline" start size="x-small"></v-icon>Overview</v-tab>
          <v-tab value="users"><v-icon icon="mdi-account-multiple-outline" start size="x-small"></v-icon>Users</v-tab>
          <v-tab value="roles"><v-icon icon="mdi-shield-account-outline" start size="x-small"></v-icon>Roles</v-tab>
          <v-tab value="database"><v-icon icon="mdi-database-eye-outline" start size="x-small"></v-icon>Database</v-tab>
          <v-tab value="devices"><v-icon icon="mdi-chip" start size="x-small"></v-icon>Devices</v-tab>
          <v-tab value="telemetry"><v-icon icon="mdi-sine-wave" start size="x-small"></v-icon>Telemetry</v-tab>
          <v-tab value="webhooks"><v-icon icon="mdi-webhook" start size="x-small"></v-icon>Webhooks</v-tab>
          <v-tab value="decoder"><v-icon icon="mdi-code-braces" start size="x-small"></v-icon>Decoder</v-tab>
        </v-tabs>

        <v-spacer></v-spacer>

        <!-- Top Right Actions -->
        <v-btn
          variant="outlined"
          color="slate-400"
          size="x-small"
          rounded="lg"
          class="mr-1 text-none"
          @click="forceCleanSession"
        >
          <v-icon icon="mdi-cached" start size="small"></v-icon>
          Reset Session
        </v-btn>

        <v-btn
          href="/api/docs"
          target="_blank"
          variant="flat"
          color="cyan-darken-3"
          size="x-small"
          rounded="lg"
          class="mr-1 d-none d-sm-inline-flex text-none"
        >
          <v-icon icon="mdi-book-open-outline" start size="small"></v-icon>
          Swagger
        </v-btn>

        <v-btn
          variant="tonal"
          color="error"
          size="x-small"
          rounded="lg"
          class="text-none"
          @click="handleLogout"
        >
          <v-icon icon="mdi-logout" start size="small"></v-icon>
          Logout
        </v-btn>
      </v-app-bar>

      <!-- MAIN CONTENT VIEWPORT (Zero swipe / Instant transition) -->
      <v-main class="pa-3 pa-sm-4 custom-scroll" style="background: #070d1e;">
        <div style="max-width: 1350px; margin: 0 auto; width: 100%;">
          
          <!-- TAB 1: OVERVIEW -->
          <div v-show="tab === 'overview'">
            <v-row dense>
              <v-col cols="6" sm="6" md="3">
                <v-card color="#0e172e" rounded="lg" class="pa-3" variant="outlined">
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>System Status</span>
                    <v-icon icon="mdi-server" color="cyan-lighten-2" size="small"></v-icon>
                  </div>
                  <div class="text-subtitle-1 font-weight-bold text-white mt-1 d-flex align-center gap-1">
                    <v-badge dot color="success" inline class="mr-1"></v-badge> ONLINE
                  </div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10px;">NestJS Core Platform</div>
                </v-card>
              </v-col>

              <v-col cols="6" sm="6" md="3">
                <v-card color="#0e172e" rounded="lg" class="pa-3" variant="outlined">
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Total Accounts</span>
                    <v-icon icon="mdi-account-group" color="emerald-lighten-2" size="small"></v-icon>
                  </div>
                  <div class="text-subtitle-1 font-weight-bold text-white mt-1">{{ usersList.length || '--' }}</div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10px;">Super Admins & Users</div>
                </v-card>
              </v-col>

              <v-col cols="6" sm="6" md="3">
                <v-card color="#0e172e" rounded="lg" class="pa-3" variant="outlined">
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Configured Roles</span>
                    <v-icon icon="mdi-shield-check" color="amber-lighten-2" size="small"></v-icon>
                  </div>
                  <div class="text-subtitle-1 font-weight-bold text-white mt-1">{{ rolesList.length || '--' }}</div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10px;">RBAC Role Matrix</div>
                </v-card>
              </v-col>

              <v-col cols="6" sm="6" md="3">
                <v-card color="#0e172e" rounded="lg" class="pa-3" variant="outlined">
                  <div class="d-flex justify-space-between text-caption text-medium-emphasis">
                    <span>Database Pool</span>
                    <v-icon icon="mdi-database" color="indigo-lighten-2" size="small"></v-icon>
                  </div>
                  <div class="text-subtitle-1 font-weight-bold text-white mt-1">{{ dbHealth.totalConnections || 1 }}</div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10px;">core_db (mas.local:5432)</div>
                </v-card>
              </v-col>
            </v-row>

            <v-row dense class="mt-2">
              <v-col cols="12" md="6">
                <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
                  <div class="text-subtitle-2 font-weight-bold text-white mb-1 d-flex align-center gap-1">
                    <v-icon icon="mdi-lightning-bolt" color="cyan-lighten-2" size="small"></v-icon>
                    System Architecture
                  </div>
                  <p class="text-caption text-medium-emphasis" style="line-height: 1.5; font-size: 11.5px;">
                    Daviteq LoRaWAN Application Server provides enterprise-grade telemetry ingestion, dynamic PostgreSQL single/multi-pool table routing, and granular 5-table role-based access control.
                  </p>
                  <v-row dense class="mt-2">
                    <v-col cols="6">
                      <v-card color="#050a17" rounded="lg" class="pa-2" variant="outlined">
                        <div class="text-caption text-medium-emphasis" style="font-size: 10px;">Access Control</div>
                        <div class="text-caption font-weight-bold text-emerald-lighten-2 mt-0.5">5-Table RBAC Model</div>
                      </v-card>
                    </v-col>
                    <v-col cols="6">
                      <v-card color="#050a17" rounded="lg" class="pa-2" variant="outlined">
                        <div class="text-caption text-medium-emphasis" style="font-size: 10px;">Database Routing</div>
                        <div class="text-caption font-weight-bold text-cyan-lighten-2 mt-0.5">core_db (dvt) Active</div>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
                  <div class="text-subtitle-2 font-weight-bold text-white mb-2 d-flex align-center gap-1">
                    <v-icon icon="mdi-link-variant" color="emerald-lighten-2" size="small"></v-icon>
                    Quick Navigation Shortcuts
                  </div>
                  <div class="d-flex flex-column gap-1">
                    <v-btn color="#050a17" variant="outlined" block class="justify-start text-none mb-1 text-caption" rounded="lg" density="compact" @click="tab = 'devices'">
                      <v-icon icon="mdi-chip" color="cyan-lighten-2" start size="small"></v-icon> Manage LoRaWAN Device Fleet
                    </v-btn>
                    <v-btn color="#050a17" variant="outlined" block class="justify-start text-none mb-1 text-caption" rounded="lg" density="compact" @click="tab = 'telemetry'">
                      <v-icon icon="mdi-sine-wave" color="indigo-lighten-2" start size="small"></v-icon> Inspect Incoming Telemetry Stream
                    </v-btn>
                    <v-btn color="#050a17" variant="outlined" block class="justify-start text-none text-caption" rounded="lg" density="compact" @click="tab = 'database'">
                      <v-icon icon="mdi-database-eye-outline" color="amber-lighten-2" start size="small"></v-icon> Visual Database Health & Metrics
                    </v-btn>
                  </div>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- TAB 2: USERS -->
          <div v-show="tab === 'users'">
            <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
              <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
                <div>
                  <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center gap-1">
                    <v-icon icon="mdi-account-multiple" color="cyan-lighten-2" size="small"></v-icon> User Directory
                  </div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10.5px;">Manage administrative and operator accounts</div>
                </div>
                <div class="d-flex gap-1">
                  <v-btn color="slate-700" variant="outlined" size="x-small" rounded="lg" class="text-none" @click="fetchUsers" :loading="loadingUsers">
                    <v-icon icon="mdi-refresh" start size="small"></v-icon> Refresh
                  </v-btn>
                  <v-btn color="cyan-darken-3" variant="flat" size="x-small" rounded="lg" class="text-none" @click="openCreateUserDialog">
                    <v-icon icon="mdi-account-plus" start size="small"></v-icon> Create User
                  </v-btn>
                </div>
              </div>

              <v-table hover class="bg-transparent rounded-lg border compact-table">
                <thead>
                  <tr class="bg-slate-950">
                    <th class="text-caption font-weight-bold text-slate-400">Username</th>
                    <th class="text-caption font-weight-bold text-slate-400">Full Name</th>
                    <th class="text-caption font-weight-bold text-slate-400">Email</th>
                    <th class="text-caption font-weight-bold text-slate-400">Type</th>
                    <th class="text-caption font-weight-bold text-slate-400">Roles</th>
                    <th class="text-caption font-weight-bold text-slate-400">Status</th>
                    <th class="text-caption font-weight-bold text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="usersList.length === 0">
                    <td colspan="7" class="text-center py-4 text-medium-emphasis text-caption">No user accounts found.</td>
                  </tr>
                  <tr v-for="u in usersList" :key="u.id">
                    <td class="font-mono font-weight-bold text-white text-caption">{{ u.username }}</td>
                    <td class="text-caption">{{ u.fullName || '--' }}</td>
                    <td class="text-medium-emphasis text-caption">{{ u.email }}</td>
                    <td>
                      <v-chip size="x-small" :color="u.userType === 'ADMIN' ? 'success' : 'cyan'" variant="tonal" class="font-weight-bold" style="height: 18px; font-size: 9px;">
                        {{ u.userType }}
                      </v-chip>
                    </td>
                    <td>
                      <span v-if="!u.roles || u.roles.length === 0" class="text-medium-emphasis text-caption" style="font-size: 10px;">None</span>
                      <v-chip v-for="r in u.roles" :key="r.id || r" size="x-small" color="cyan" variant="tonal" class="mr-1" style="height: 18px; font-size: 9px;">
                        {{ r.name || r.code || r }}
                      </v-chip>
                    </td>
                    <td>
                      <v-chip size="x-small" :color="u.isActive ? 'success' : 'error'" variant="tonal" style="height: 18px; font-size: 9px;">
                        {{ u.isActive ? 'Active' : 'Suspended' }}
                      </v-chip>
                    </td>
                    <td class="text-right">
                      <v-btn size="x-small" variant="tonal" color="cyan" class="mr-1 text-none" density="compact" @click="openEditUserDialog(u)">Edit</v-btn>
                      <v-btn size="x-small" variant="tonal" color="error" class="text-none" density="compact" @click="deleteUser(u.id)" :disabled="u.username === 'admin'">Delete</v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>

          <!-- TAB 3: ROLES -->
          <div v-show="tab === 'roles'">
            <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
              <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
                <div>
                  <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center gap-1">
                    <v-icon icon="mdi-shield-account" color="amber-lighten-2" size="small"></v-icon> Role Matrix & Permissions
                  </div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10.5px;">Configure RBAC roles and granular access privileges</div>
                </div>
                <div class="d-flex gap-1">
                  <v-btn color="slate-700" variant="outlined" size="x-small" rounded="lg" class="text-none" @click="fetchRoles" :loading="loadingRoles">
                    <v-icon icon="mdi-refresh" start size="small"></v-icon> Refresh
                  </v-btn>
                  <v-btn color="amber-darken-3" variant="flat" size="x-small" rounded="lg" class="text-none" @click="openCreateRoleDialog">
                    <v-icon icon="mdi-plus" start size="small"></v-icon> Create Role
                  </v-btn>
                </div>
              </div>

              <!-- Roles Cards Grid -->
              <v-row dense class="mb-3">
                <v-col v-for="r in rolesList" :key="r.id" cols="12" sm="6" md="4">
                  <v-card color="#050a17" rounded="lg" class="pa-3" variant="outlined">
                    <div class="d-flex justify-space-between align-center">
                      <span class="font-weight-bold text-caption" :class="r.code === 'SUPER_ADMIN' ? 'text-emerald-lighten-2' : 'text-cyan-lighten-2'">
                        <v-icon :icon="r.code === 'SUPER_ADMIN' ? 'mdi-crown' : 'mdi-shield-check'" size="x-small" start></v-icon>
                        {{ r.name }}
                      </span>
                      <v-chip size="x-small" :color="r.code === 'SUPER_ADMIN' ? 'success' : 'cyan'" variant="tonal" class="font-mono" style="height: 18px; font-size: 9px;">
                        {{ r.code }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis my-1" style="font-size: 10.5px;">{{ r.description || 'No description provided' }}</div>
                    <div class="d-flex justify-space-between align-center text-caption text-medium-emphasis pt-1 border-t border-slate-800" style="font-size: 10px;">
                      <span>{{ r.permissions ? r.permissions.length : 0 }} privileges</span>
                      <v-btn v-if="r.code !== 'SUPER_ADMIN'" size="x-small" variant="text" color="cyan" density="compact" class="text-none" @click="openEditRoleDialog(r)">Edit</v-btn>
                      <span v-else class="text-caption text-slate-500 font-mono" style="font-size: 9px;">Protected</span>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Roles Table Details -->
              <v-table hover class="bg-transparent rounded-lg border compact-table">
                <thead>
                  <tr class="bg-slate-950">
                    <th class="text-caption font-weight-bold text-slate-400">Role Code</th>
                    <th class="text-caption font-weight-bold text-slate-400">Name</th>
                    <th class="text-caption font-weight-bold text-slate-400">Description</th>
                    <th class="text-caption font-weight-bold text-slate-400">Assigned Permissions</th>
                    <th class="text-caption font-weight-bold text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="r in rolesList" :key="r.id">
                    <td class="font-mono font-weight-bold text-caption" :class="r.code === 'SUPER_ADMIN' ? 'text-emerald-lighten-2' : 'text-cyan-lighten-2'">{{ r.code }}</td>
                    <td class="font-weight-bold text-white text-caption">{{ r.name }}</td>
                    <td class="text-medium-emphasis text-caption">{{ r.description || '--' }}</td>
                    <td>
                      <v-chip v-for="p in (r.permissions || [])" :key="p.id" size="x-small" color="slate-700" variant="tonal" class="mr-1 mb-1 font-mono" style="height: 18px; font-size: 9px;">
                        {{ p.name }}
                      </v-chip>
                    </td>
                    <td class="text-right">
                      <template v-if="r.code !== 'SUPER_ADMIN'">
                        <v-btn size="x-small" variant="tonal" color="cyan" class="mr-1 text-none" density="compact" @click="openEditRoleDialog(r)">Edit</v-btn>
                        <v-btn size="x-small" variant="tonal" color="error" class="text-none" density="compact" @click="deleteRole(r.id)">Delete</v-btn>
                      </template>
                      <span v-else class="text-caption text-slate-500 font-mono" style="font-size: 9px;">Immutable</span>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>

          <!-- TAB 4: DATABASE HEALTH -->
          <div v-show="tab === 'database'">
            <v-card color="#0e172e" rounded="lg" class="pa-4 mb-3" variant="outlined">
              <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
                <div>
                  <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center gap-1">
                    <v-icon icon="mdi-heart-pulse" color="emerald-lighten-2" size="small"></v-icon> Visual Database Health
                  </div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10.5px;">Real-time status of PostgreSQL connection pools</div>
                </div>
                <div class="d-flex gap-1">
                  <v-btn color="slate-700" variant="outlined" size="x-small" rounded="lg" class="text-none" @click="fetchDbHealth">
                    <v-icon icon="mdi-refresh" start size="small"></v-icon> Refresh
                  </v-btn>
                  <v-btn color="cyan-darken-3" variant="flat" size="x-small" rounded="lg" class="text-none" @click="reloadDbConfig">
                    <v-icon icon="mdi-cog-refresh" start size="small"></v-icon> Hot-Reload Config
                  </v-btn>
                </div>
              </div>

              <v-row dense>
                <v-col v-for="(conn, key) in dbHealth.connections" :key="key" cols="12" sm="6" md="4">
                  <v-card color="#050a17" rounded="lg" class="pa-3" variant="outlined">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="font-mono font-weight-bold text-white text-caption">{{ conn.name }}</span>
                      <v-chip size="x-small" :color="conn.isAlive ? 'success' : 'error'" variant="tonal" class="font-weight-bold" style="height: 18px; font-size: 9px;">
                        {{ conn.isAlive ? 'CONNECTED' : 'OFFLINE' }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-medium-emphasis font-mono" style="line-height: 1.6; font-size: 10.5px;">
                      <div>Host: <strong class="text-white">{{ conn.host }}:{{ conn.port }}</strong></div>
                      <div>Database: <strong class="text-white">{{ conn.database }}</strong></div>
                      <div>Ping Latency: <strong :class="conn.latencyMs < 50 ? 'text-emerald-lighten-2' : 'text-amber-lighten-2'">{{ conn.latencyMs !== null ? conn.latencyMs + ' ms' : 'N/A' }}</strong></div>
                      <div>Pool Size: <strong class="text-slate-300">{{ conn.poolSize }} connections</strong></div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card>

            <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
              <div class="text-caption font-weight-bold text-white mb-2">Active Table Routing & Live Record Counts</div>
              <v-table hover class="bg-transparent rounded-lg border compact-table">
                <thead>
                  <tr class="bg-slate-950">
                    <th class="text-caption font-weight-bold text-slate-400">Table / Entity</th>
                    <th class="text-caption font-weight-bold text-slate-400">Assigned Database Pool</th>
                    <th class="text-caption font-weight-bold text-slate-400">Record Count</th>
                    <th class="text-caption font-weight-bold text-slate-400">Table Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(stat, tableName) in dbHealth.tableStats" :key="tableName">
                    <td class="font-mono font-weight-bold text-white text-caption">{{ tableName }}</td>
                    <td class="font-mono text-cyan-lighten-2 text-caption">{{ stat.routedTo }}</td>
                    <td class="font-weight-bold text-emerald-lighten-2 text-caption">{{ Number(stat.recordCount).toLocaleString() }} rows</td>
                    <td><v-chip size="x-small" color="success" variant="tonal" style="height: 18px; font-size: 9px;">{{ stat.status }}</v-chip></td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>

          <!-- TAB 5: DEVICES -->
          <div v-show="tab === 'devices'">
            <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
              <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
                <div>
                  <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center gap-1">
                    <v-icon icon="mdi-chip" color="cyan-lighten-2" size="small"></v-icon> LoRaWAN Device Fleet
                  </div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10.5px;">Registered End Devices and decoder bindings</div>
                </div>
                <div class="d-flex gap-1">
                  <v-btn color="slate-700" variant="outlined" size="x-small" rounded="lg" class="text-none" @click="fetchDevices">
                    <v-icon icon="mdi-refresh" start size="small"></v-icon> Refresh
                  </v-btn>
                  <v-btn color="cyan-darken-3" variant="flat" size="x-small" rounded="lg" class="text-none" @click="openRegisterDeviceDialog">
                    <v-icon icon="mdi-plus" start size="small"></v-icon> Register Device
                  </v-btn>
                </div>
              </div>

              <v-table hover class="bg-transparent rounded-lg border compact-table">
                <thead>
                  <tr class="bg-slate-950">
                    <th class="text-caption font-weight-bold text-slate-400">DevEUI</th>
                    <th class="text-caption font-weight-bold text-slate-400">Device Name</th>
                    <th class="text-caption font-weight-bold text-slate-400">Activation</th>
                    <th class="text-caption font-weight-bold text-slate-400">Decoder Script</th>
                    <th class="text-caption font-weight-bold text-slate-400">Status</th>
                    <th class="text-caption font-weight-bold text-slate-400 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="devicesList.length === 0">
                    <td colspan="6" class="text-center py-4 text-medium-emphasis text-caption">No LoRaWAN devices registered. Click "+ Register Device" to add one.</td>
                  </tr>
                  <tr v-for="d in devicesList" :key="d.id || d.devEUI">
                    <td class="font-mono font-weight-bold text-cyan-lighten-2 text-caption">{{ d.devEUI }}</td>
                    <td class="font-weight-bold text-white text-caption">{{ d.name || '--' }}</td>
                    <td><v-chip size="x-small" color="amber" variant="tonal" style="height: 18px; font-size: 9px;">{{ d.activationType || 'OTAA' }}</v-chip></td>
                    <td>
                      <v-chip size="x-small" :color="d.payloadFormatterScript ? 'success' : 'slate-700'" variant="tonal" style="height: 18px; font-size: 9px;">
                        {{ d.payloadFormatterScript ? 'Configured' : 'None' }}
                      </v-chip>
                    </td>
                    <td>
                      <v-chip size="x-small" :color="d.isActive ? 'success' : 'error'" variant="tonal" style="height: 18px; font-size: 9px;">
                        {{ d.isActive ? 'ACTIVE' : 'INACTIVE' }}
                      </v-chip>
                    </td>
                    <td class="text-right">
                      <v-btn size="x-small" variant="tonal" color="cyan" class="text-none" density="compact" @click="testDevice(d)">Test Payload</v-btn>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>

          <!-- TAB 6: TELEMETRY -->
          <div v-show="tab === 'telemetry'">
            <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
              <div class="d-flex justify-space-between align-center mb-3 flex-wrap gap-2">
                <div>
                  <div class="text-subtitle-2 font-weight-bold text-white d-flex align-center gap-1">
                    <v-icon icon="mdi-sine-wave" color="indigo-lighten-2" size="small"></v-icon> Live Telemetry Stream
                  </div>
                  <div class="text-caption text-medium-emphasis" style="font-size: 10.5px;">Real-time stream of incoming LoRaWAN uplink packets</div>
                </div>
                <div class="d-flex align-center gap-1">
                  <v-btn color="slate-700" variant="outlined" size="x-small" rounded="lg" class="text-none" @click="fetchTelemetry">
                    <v-icon icon="mdi-refresh" start size="small"></v-icon> Refresh
                  </v-btn>
                </div>
              </div>

              <v-table hover class="bg-transparent rounded-lg border compact-table">
                <thead>
                  <tr class="bg-slate-950">
                    <th class="text-caption font-weight-bold text-slate-400">Timestamp</th>
                    <th class="text-caption font-weight-bold text-slate-400">DevEUI</th>
                    <th class="text-caption font-weight-bold text-slate-400">Port / FCnt</th>
                    <th class="text-caption font-weight-bold text-slate-400">Raw Hex</th>
                    <th class="text-caption font-weight-bold text-slate-400">Decoded JSON</th>
                    <th class="text-caption font-weight-bold text-slate-400">RSSI / SNR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="telemetryList.length === 0">
                    <td colspan="6" class="text-center py-4 text-medium-emphasis text-caption">No incoming telemetry packets yet. Send a webhook to see live data.</td>
                  </tr>
                  <tr v-for="t in telemetryList" :key="t.id">
                    <td class="text-caption text-medium-emphasis">{{ formatTime(t.timestamp || t.createdAt) }}</td>
                    <td class="font-mono font-weight-bold text-cyan-lighten-2 text-caption">{{ t.devEUI }}</td>
                    <td class="font-mono text-amber-lighten-2 text-caption">p:{{ t.fPort || 1 }} / c:{{ t.fCnt || 0 }}</td>
                    <td class="font-mono text-slate-300 text-caption">{{ t.payloadHex || '--' }}</td>
                    <td class="font-mono text-emerald-lighten-2 text-caption">{{ formatDecoded(t.decodedPayload) }}</td>
                    <td class="text-caption text-medium-emphasis">{{ t.rssi !== undefined ? t.rssi + ' dBm' : '--' }} / {{ t.snr !== undefined ? t.snr + ' dB' : '--' }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </div>

          <!-- TAB 7: WEBHOOKS -->
          <div v-show="tab === 'webhooks'">
            <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
              <div class="text-subtitle-2 font-weight-bold text-white mb-1 d-flex align-center gap-1">
                <v-icon icon="mdi-webhook" color="emerald-lighten-2" size="small"></v-icon> Network Server Webhooks
              </div>
              <p class="text-caption text-medium-emphasis mb-3" style="font-size: 11px;">Configure these HTTP endpoints on your Network Server (ChirpStack v4 or ThingPark Wireless):</p>

              <v-row dense>
                <v-col cols="12" md="6">
                  <v-card color="#050a17" rounded="lg" class="pa-3" variant="outlined">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="text-caption font-weight-bold text-cyan-lighten-2">ChirpStack v4 Ingestion</span>
                      <v-chip size="x-small" color="cyan" variant="tonal" style="height: 18px; font-size: 9px;">POST / JSON</v-chip>
                    </div>
                    <div class="code-box pa-2 d-flex justify-space-between align-center my-1 text-caption font-mono" style="font-size: 11px;">
                      <span>POST /lorawan/webhook/chirpstack</span>
                      <v-btn size="x-small" variant="text" color="cyan" density="compact" class="text-none" @click="copyUrl('/lorawan/webhook/chirpstack')">Copy</v-btn>
                    </div>
                    <div class="text-caption text-medium-emphasis" style="font-size: 10px;">Supports ChirpStack uplink events, deduplication, and payload parsing.</div>
                  </v-card>
                </v-col>

                <v-col cols="12" md="6">
                  <v-card color="#050a17" rounded="lg" class="pa-3" variant="outlined">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span class="text-caption font-weight-bold text-emerald-lighten-2">ThingPark Wireless Ingestion</span>
                      <v-chip size="x-small" color="success" variant="tonal" style="height: 18px; font-size: 9px;">POST / JSON</v-chip>
                    </div>
                    <div class="code-box pa-2 d-flex justify-space-between align-center my-1 text-caption font-mono" style="font-size: 11px;">
                      <span>POST /lorawan/webhook/thingpark</span>
                      <v-btn size="x-small" variant="text" color="emerald" density="compact" class="text-none" @click="copyUrl('/lorawan/webhook/thingpark')">Copy</v-btn>
                    </div>
                    <div class="text-caption text-medium-emphasis" style="font-size: 10px;">Supports Actility ThingPark Wireless DX packets and hex payloads.</div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card>
          </div>

          <!-- TAB 8: DECODER SANDBOX -->
          <div v-show="tab === 'decoder'">
            <v-card color="#0e172e" rounded="lg" class="pa-4" variant="outlined">
              <div class="text-subtitle-2 font-weight-bold text-white mb-1 d-flex align-center gap-1">
                <v-icon icon="mdi-code-braces" color="purple-lighten-2" size="small"></v-icon> Payload Formatter Sandbox
              </div>
              <p class="text-caption text-medium-emphasis mb-3" style="font-size: 11px;">Test JavaScript decoder functions on raw hex bytes in a secure sandbox:</p>

              <v-row dense>
                <v-col cols="12" md="6">
                  <div class="text-caption font-weight-bold text-white mb-1">JavaScript Decoder Function</div>
                  <v-textarea
                    v-model="sandboxCode"
                    rows="8"
                    variant="outlined"
                    class="font-mono text-caption"
                    density="compact"
                    color="purple-lighten-2"
                  ></v-textarea>
                </v-col>

                <v-col cols="12" md="6">
                  <div class="text-caption font-weight-bold text-white mb-1">Test Hex String</div>
                  <div class="d-flex gap-2 mb-2">
                    <v-text-field
                      v-model="sandboxHex"
                      variant="outlined"
                      density="compact"
                      class="font-mono text-caption"
                      color="purple-lighten-2"
                      hide-details
                    ></v-text-field>
                    <v-btn color="purple-darken-3" size="small" class="text-none" @click="runSandboxDecode">Decode</v-btn>
                  </div>

                  <div class="text-caption font-weight-bold text-white mb-1">Decoded Output</div>
                  <pre class="code-box pa-2 text-emerald-lighten-2 font-mono text-caption" style="height: 155px; overflow: auto; font-size: 11px;">{{ sandboxResult }}</pre>
                </v-col>
              </v-row>
            </v-card>
          </div>

        </div>
      </v-main>

      <!-- DIALOG: CREATE USER -->
      <v-dialog v-model="createUserDialog" max-width="450">
        <v-card color="#0e172e" rounded="lg" class="pa-4">
          <v-card-title class="text-subtitle-1 font-weight-bold text-white">Create User Account</v-card-title>
          <v-card-text class="pa-0 mt-2">
            <v-form @submit.prevent="submitCreateUser">
              <v-text-field v-model="newUser.username" label="Username" required variant="outlined" density="compact" class="mb-2"></v-text-field>
              <v-text-field v-model="newUser.fullName" label="Full Name" required variant="outlined" density="compact" class="mb-2"></v-text-field>
              <v-text-field v-model="newUser.email" label="Email" type="email" required variant="outlined" density="compact" class="mb-2"></v-text-field>
              <v-text-field v-model="newUser.password" label="Password" type="password" required minlength="6" variant="outlined" density="compact" class="mb-2"></v-text-field>
              <v-select
                v-model="newUser.userType"
                :items="['USER', 'SUB_ADMIN', 'ADMIN']"
                label="User Type"
                variant="outlined"
                density="compact"
                class="mb-2"
              ></v-select>
              <v-select
                v-model="newUser.roleId"
                :items="roleSelectItems"
                label="Assign Role"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-form>
          </v-card-text>
          <v-card-actions class="justify-end pa-0 mt-3">
            <v-btn variant="text" size="small" class="text-none" @click="createUserDialog = false">Cancel</v-btn>
            <v-btn color="cyan-darken-3" variant="flat" size="small" class="text-none" @click="submitCreateUser" :loading="savingUser">Save User</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- DIALOG: EDIT USER -->
      <v-dialog v-model="editUserDialog" max-width="450">
        <v-card color="#0e172e" rounded="lg" class="pa-4">
          <v-card-title class="text-subtitle-1 font-weight-bold text-white">Edit User</v-card-title>
          <v-card-text class="pa-0 mt-2">
            <v-text-field v-model="editUser.username" label="Username" disabled variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-select
              v-model="editUser.roleId"
              :items="roleSelectItems"
              label="Assign Role"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
              class="mb-2"
            ></v-select>
            <v-select
              v-model="editUser.isActive"
              :items="[{ title: 'Active', value: true }, { title: 'Suspended', value: false }]"
              label="Account Status"
              item-title="title"
              item-value="value"
              variant="outlined"
              density="compact"
            ></v-select>
          </v-card-text>
          <v-card-actions class="justify-end pa-0 mt-3">
            <v-btn variant="text" size="small" class="text-none" @click="editUserDialog = false">Cancel</v-btn>
            <v-btn color="cyan-darken-3" variant="flat" size="small" class="text-none" @click="submitEditUser" :loading="savingUser">Update User</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- DIALOG: CREATE ROLE -->
      <v-dialog v-model="createRoleDialog" max-width="500">
        <v-card color="#0e172e" rounded="lg" class="pa-4">
          <v-card-title class="text-subtitle-1 font-weight-bold text-white">Create New Role</v-card-title>
          <v-card-text class="pa-0 mt-2">
            <v-text-field v-model="newRole.code" label="Role Code (e.g. AUDITOR)" required variant="outlined" density="compact" class="mb-2 font-mono"></v-text-field>
            <v-text-field v-model="newRole.name" label="Display Name" required variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-text-field v-model="newRole.description" label="Description" variant="outlined" density="compact" class="mb-2"></v-text-field>
            <div class="text-caption font-weight-bold text-white mb-1">Assign Permissions:</div>
            <div style="max-height: 150px; overflow-y: auto;" class="code-box pa-2">
              <v-checkbox
                v-for="p in allPermissions"
                :key="p.id"
                v-model="newRole.permissions"
                :value="p.id"
                :label="p.name + ' (' + (p.description || p.module) + ')'"
                density="compact"
                hide-details
                color="amber"
              ></v-checkbox>
            </div>
          </v-card-text>
          <v-card-actions class="justify-end pa-0 mt-3">
            <v-btn variant="text" size="small" class="text-none" @click="createRoleDialog = false">Cancel</v-btn>
            <v-btn color="amber-darken-3" variant="flat" size="small" class="text-none" @click="submitCreateRole" :loading="savingRole">Create Role</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- DIALOG: EDIT ROLE -->
      <v-dialog v-model="editRoleDialog" max-width="500">
        <v-card color="#0e172e" rounded="lg" class="pa-4">
          <v-card-title class="text-subtitle-1 font-weight-bold text-white">Edit Role</v-card-title>
          <v-card-text class="pa-0 mt-2">
            <v-text-field v-model="editingRole.code" label="Role Code" disabled variant="outlined" density="compact" class="mb-2 font-mono"></v-text-field>
            <v-text-field v-model="editingRole.name" label="Display Name" required variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-text-field v-model="editingRole.description" label="Description" variant="outlined" density="compact" class="mb-2"></v-text-field>
            <div class="text-caption font-weight-bold text-white mb-1">Permissions Matrix:</div>
            <div style="max-height: 150px; overflow-y: auto;" class="code-box pa-2">
              <v-checkbox
                v-for="p in allPermissions"
                :key="p.id"
                v-model="editingRole.permissions"
                :value="p.id"
                :label="p.name + ' (' + (p.description || p.module) + ')'"
                density="compact"
                hide-details
                color="cyan"
              ></v-checkbox>
            </div>
          </v-card-text>
          <v-card-actions class="justify-end pa-0 mt-3">
            <v-btn variant="text" size="small" class="text-none" @click="editRoleDialog = false">Cancel</v-btn>
            <v-btn color="cyan-darken-3" variant="flat" size="small" class="text-none" @click="submitEditRole" :loading="savingRole">Update Role</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- DIALOG: REGISTER DEVICE -->
      <v-dialog v-model="registerDeviceDialog" max-width="450">
        <v-card color="#0e172e" rounded="lg" class="pa-4">
          <v-card-title class="text-subtitle-1 font-weight-bold text-white">Register LoRaWAN Device</v-card-title>
          <v-card-text class="pa-0 mt-2">
            <v-text-field v-model="newDevice.devEUI" label="DevEUI (16 Hex Characters)" maxlength="16" required variant="outlined" density="compact" class="mb-2 font-mono"></v-text-field>
            <v-text-field v-model="newDevice.name" label="Device Name" required variant="outlined" density="compact" class="mb-2"></v-text-field>
            <v-select v-model="newDevice.activationType" :items="['OTAA', 'ABP']" label="Activation Mode" variant="outlined" density="compact" class="mb-2"></v-select>
            <v-text-field v-model="newDevice.appKey" label="AppKey (Optional)" variant="outlined" density="compact" class="font-mono"></v-text-field>
          </v-card-text>
          <v-card-actions class="justify-end pa-0 mt-3">
            <v-btn variant="text" size="small" class="text-none" @click="registerDeviceDialog = false">Cancel</v-btn>
            <v-btn color="cyan-darken-3" variant="flat" size="small" class="text-none" @click="submitRegisterDevice" :loading="savingDevice">Register</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- SNACKBAR TOAST -->
      <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3500" location="top right">
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn variant="text" size="small" @click="snackbar.show = false">Close</v-btn>
        </template>
      </v-snackbar>
    </v-app>
  </div>

  <!-- Vue 3 and Vuetify 3 CDN -->
  <script src="https://cdn.jsdelivr.net/npm/vue@3.4.31/dist/vue.global.prod.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vuetify@3.6.14/dist/vuetify.min.js"></script>
  <script>
    const { createApp, ref, computed, onMounted, watch } = Vue;
    const { createVuetify } = Vuetify;

    const vuetify = createVuetify({
      theme: { defaultTheme: 'dark' }
    });

    const app = createApp({
      setup() {
        const drawer = ref(true);
        const tab = ref('overview');

        const tabTitles = {
          overview: 'Overview Dashboard',
          users: 'User Directory',
          roles: 'Role Matrix & Permissions',
          database: 'Database Health & Routing',
          devices: 'LoRaWAN Device Fleet',
          telemetry: 'Live Telemetry Uplinks',
          webhooks: 'Webhook Ingestion Endpoints',
          decoder: 'Payload Formatter Sandbox'
        };

        const tabCategories = {
          overview: 'Real-time',
          users: 'RBAC Security',
          roles: 'RBAC Matrix',
          database: 'Infrastructure',
          devices: 'Fleet Management',
          telemetry: 'Uplink Stream',
          webhooks: 'Integration',
          decoder: 'JS Engine'
        };

        const snackbar = ref({ show: false, text: '', color: 'info' });
        const showToast = (text, color = 'info') => {
          snackbar.value = { show: true, text, color: color === 'error' ? 'error' : (color === 'success' ? 'success' : 'info') };
        };

        const currentUser = ref({});
        const usersList = ref([]);
        const rolesList = ref([]);
        const allPermissions = ref([]);
        const dbHealth = ref({ totalConnections: 1, connections: {}, tableStats: {} });
        const devicesList = ref([]);
        const telemetryList = ref([]);

        const loadingUsers = ref(false);
        const loadingRoles = ref(false);

        // Dialogs
        const createUserDialog = ref(false);
        const editUserDialog = ref(false);
        const createRoleDialog = ref(false);
        const editRoleDialog = ref(false);
        const registerDeviceDialog = ref(false);

        const savingUser = ref(false);
        const savingRole = ref(false);
        const savingDevice = ref(false);

        const newUser = ref({ username: '', fullName: '', email: '', password: '', userType: 'USER', roleId: '' });
        const editUser = ref({ id: '', username: '', roleId: '', isActive: true });
        const newRole = ref({ code: '', name: '', description: '', permissions: [] });
        const editingRole = ref({ id: '', code: '', name: '', description: '', permissions: [] });
        const newDevice = ref({ devEUI: '', name: '', activationType: 'OTAA', appKey: '' });

        // Decoder Sandbox
        const sandboxCode = ref("function decodeUplink(bytes, fPort) {\\n  var temperature = ((bytes[0] << 8) | bytes[1]) / 100;\\n  var humidity = bytes[2];\\n  return { temperature, humidity };\\n}");
        const sandboxHex = ref("09C441");
        const sandboxResult = ref('{\\n  "ready": true\\n}');

        const roleSelectItems = computed(() => {
          return [
            { title: 'No role assigned', value: '' },
            ...rolesList.value.map(r => ({ title: r.name + ' (' + r.code + ')', value: r.id }))
          ];
        });

        const getAuthToken = () => {
          let token = localStorage.getItem('lorawan_token');
          if (!token || token === 'undefined' || token === 'null') {
            const match = document.cookie.match(/(?:^|;\\s*)access_token=([^;]*)/);
            if (match && match[1] && match[1] !== 'undefined') {
              token = decodeURIComponent(match[1]);
            }
          }
          return token;
        };

        const authHeaders = () => {
          const headers = { 'Content-Type': 'application/json' };
          const token = getAuthToken();
          if (token) headers['Authorization'] = 'Bearer ' + token;
          return headers;
        };

        const forceCleanSession = () => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch(e) {}
          const cookies = ["access_token", "lorawan_token", "session_id", "connect.sid"];
          cookies.forEach(c => {
            document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0; SameSite=Lax;";
            document.cookie = c + "=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0;";
          });
          window.location.replace('/login?cleared=1');
        };

        const handleLogout = async () => {
          try {
            await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
          } catch(e) {}
          forceCleanSession();
        };

        const copyUrl = (path) => {
          const full = window.location.origin + path;
          navigator.clipboard.writeText(full).then(() => {
            showToast("Copied endpoint URL to clipboard!", "success");
          });
        };

        const formatTime = (ts) => {
          if (!ts) return '--';
          return new Date(ts).toLocaleTimeString();
        };

        const formatDecoded = (payload) => {
          if (!payload) return '--';
          if (typeof payload === 'object') return JSON.stringify(payload);
          return String(payload);
        };

        // Fetchers
        const fetchUsers = async () => {
          loadingUsers.value = true;
          try {
            const res = await fetch('/users', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              usersList.value = await res.json();
            }
          } catch(e) {
            console.error(e);
          } finally {
            loadingUsers.value = false;
          }
        };

        const fetchRoles = async () => {
          loadingRoles.value = true;
          try {
            const [rolesRes, permsRes] = await Promise.all([
              fetch('/roles', { headers: authHeaders(), credentials: 'include' }),
              fetch('/roles/permissions', { headers: authHeaders(), credentials: 'include' })
            ]);
            if (rolesRes.ok) rolesList.value = await rolesRes.json();
            if (permsRes.ok) allPermissions.value = await permsRes.json();
          } catch(e) {
            console.error(e);
          } finally {
            loadingRoles.value = false;
          }
        };

        const fetchDbHealth = async () => {
          try {
            const res = await fetch('/database/health', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) dbHealth.value = await res.json();
          } catch(e) {
            console.error(e);
          }
        };

        const reloadDbConfig = async () => {
          try {
            const res = await fetch('/database/reload', { method: 'POST', headers: authHeaders(), credentials: 'include' });
            const data = await res.json();
            showToast(data.message || "Database configuration reloaded", "success");
            fetchDbHealth();
          } catch(e) {
            showToast("Reload failed: " + e.message, "error");
          }
        };

        const fetchDevices = async () => {
          try {
            const res = await fetch('/lorawan/devices', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) devicesList.value = await res.json();
          } catch(e) {
            console.error(e);
          }
        };

        const fetchTelemetry = async () => {
          try {
            const res = await fetch('/lorawan/telemetry?limit=25', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) telemetryList.value = await res.json();
          } catch(e) {
            console.error(e);
          }
        };

        const fetchSession = async () => {
          try {
            const res = await fetch('/auth/session', { headers: authHeaders(), credentials: 'include' });
            if (res.ok) {
              currentUser.value = await res.json();
            }
          } catch(e) {}
        };

        // User Actions
        const openCreateUserDialog = () => {
          newUser.value = { username: '', fullName: '', email: '', password: '', userType: 'USER', roleId: '' };
          createUserDialog.value = true;
        };

        const submitCreateUser = async () => {
          savingUser.value = true;
          try {
            const res = await fetch('/users', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                username: newUser.value.username.trim(),
                fullName: newUser.value.fullName.trim(),
                email: newUser.value.email.trim(),
                password: newUser.value.password,
                userType: newUser.value.userType,
                roleIds: newUser.value.roleId ? [newUser.value.roleId] : []
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create user");
            showToast("User created successfully!", "success");
            createUserDialog.value = false;
            fetchUsers();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingUser.value = false;
          }
        };

        const openEditUserDialog = (u) => {
          editUser.value = {
            id: u.id,
            username: u.username,
            roleId: u.roles && u.roles[0] ? (u.roles[0].id || u.roles[0]) : '',
            isActive: u.isActive
          };
          editUserDialog.value = true;
        };

        const submitEditUser = async () => {
          savingUser.value = true;
          try {
            const res = await fetch('/users/' + editUser.value.id + '/permissions', {
              method: 'PUT',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                isActive: editUser.value.isActive,
                roleIds: editUser.value.roleId ? [editUser.value.roleId] : []
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update user");
            showToast("User updated successfully!", "success");
            editUserDialog.value = false;
            fetchUsers();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingUser.value = false;
          }
        };

        const deleteUser = async (id) => {
          if (!confirm("Are you sure you want to delete this user?")) return;
          try {
            const res = await fetch('/users/' + id, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error("Delete failed");
            showToast("User removed successfully", "success");
            fetchUsers();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        // Role Actions
        const openCreateRoleDialog = () => {
          newRole.value = { code: '', name: '', description: '', permissions: [] };
          createRoleDialog.value = true;
        };

        const submitCreateRole = async () => {
          savingRole.value = true;
          try {
            const res = await fetch('/roles', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                code: newRole.value.code.trim().toUpperCase(),
                name: newRole.value.name.trim(),
                description: newRole.value.description.trim(),
                permissionIds: newRole.value.permissions
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create role");
            showToast("Role created successfully!", "success");
            createRoleDialog.value = false;
            fetchRoles();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingRole.value = false;
          }
        };

        const openEditRoleDialog = (r) => {
          editingRole.value = {
            id: r.id,
            code: r.code,
            name: r.name,
            description: r.description || '',
            permissions: (r.permissions || []).map(p => p.id)
          };
          editRoleDialog.value = true;
        };

        const submitEditRole = async () => {
          savingRole.value = true;
          try {
            const res = await fetch('/roles/' + editingRole.value.id, {
              method: 'PUT',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                name: editingRole.value.name.trim(),
                description: editingRole.value.description.trim(),
                permissionIds: editingRole.value.permissions
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to update role");
            showToast("Role updated successfully!", "success");
            editRoleDialog.value = false;
            fetchRoles();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingRole.value = false;
          }
        };

        const deleteRole = async (id) => {
          if (!confirm("Are you sure you want to delete this role?")) return;
          try {
            const res = await fetch('/roles/' + id, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error("Delete failed");
            showToast("Role deleted successfully", "success");
            fetchRoles();
          } catch(e) {
            showToast(e.message, "error");
          }
        };

        // Device Actions
        const openRegisterDeviceDialog = () => {
          newDevice.value = { devEUI: '', name: '', activationType: 'OTAA', appKey: '' };
          registerDeviceDialog.value = true;
        };

        const submitRegisterDevice = async () => {
          savingDevice.value = true;
          try {
            const res = await fetch('/lorawan/devices', {
              method: 'POST',
              headers: authHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                devEUI: newDevice.value.devEUI.trim().toUpperCase(),
                name: newDevice.value.name.trim(),
                activationType: newDevice.value.activationType,
                appKey: newDevice.value.appKey ? newDevice.value.appKey.trim() : undefined
              })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to register device");
            showToast("Device registered successfully!", "success");
            registerDeviceDialog.value = false;
            fetchDevices();
          } catch(e) {
            showToast(e.message, "error");
          } finally {
            savingDevice.value = false;
          }
        };

        const testDevice = (d) => {
          tab.value = 'decoder';
        };

        const runSandboxDecode = () => {
          try {
            const hex = sandboxHex.value.trim().replace(/\\s+/g, "");
            const bytes = [];
            for (let c = 0; c < hex.length; c += 2) {
              bytes.push(parseInt(hex.substr(c, 2), 16));
            }
            const fn = new Function("bytes", "fPort", sandboxCode.value + "; return decodeUplink(bytes, fPort);");
            const output = fn(bytes, 1);
            sandboxResult.value = JSON.stringify(output, null, 2);
            showToast("Decoder executed successfully!", "success");
          } catch(e) {
            sandboxResult.value = "Decoder Error: " + e.message;
            showToast("Decoder Error: " + e.message, "error");
          }
        };

        watch(tab, (newTab) => {
          try {
            window.history.replaceState(null, null, '#' + newTab);
          } catch(e) {}
          if (newTab === 'users') fetchUsers();
          if (newTab === 'roles') fetchRoles();
          if (newTab === 'database') fetchDbHealth();
          if (newTab === 'devices') fetchDevices();
          if (newTab === 'telemetry') fetchTelemetry();
        });

        onMounted(() => {
          const hash = window.location.hash.replace('#', '').trim();
          if (hash && tabTitles[hash]) {
            tab.value = hash;
          }
          fetchSession();
          fetchUsers();
          fetchRoles();
          fetchDbHealth();
          fetchDevices();
        });

        return {
          drawer,
          tab,
          tabTitles,
          tabCategories,
          snackbar,
          currentUser,
          usersList,
          rolesList,
          allPermissions,
          dbHealth,
          devicesList,
          telemetryList,
          loadingUsers,
          loadingRoles,
          createUserDialog,
          editUserDialog,
          createRoleDialog,
          editRoleDialog,
          registerDeviceDialog,
          savingUser,
          savingRole,
          savingDevice,
          newUser,
          editUser,
          newRole,
          editingRole,
          newDevice,
          sandboxCode,
          sandboxHex,
          sandboxResult,
          roleSelectItems,
          forceCleanSession,
          handleLogout,
          copyUrl,
          formatTime,
          formatDecoded,
          fetchUsers,
          fetchRoles,
          fetchDbHealth,
          reloadDbConfig,
          fetchDevices,
          fetchTelemetry,
          openCreateUserDialog,
          submitCreateUser,
          openEditUserDialog,
          submitEditUser,
          deleteUser,
          openCreateRoleDialog,
          submitCreateRole,
          openEditRoleDialog,
          submitEditRole,
          deleteRole,
          openRegisterDeviceDialog,
          submitRegisterDevice,
          testDevice,
          runSandboxDecode
        };
      }
    });

    app.use(vuetify).mount('#app');
  </script>
</body>
</html>
`;
