import { Injectable, Logger } from '@nestjs/common';

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxCapacity: number;
  evictions: number;
}

export interface AlarmRule {
  id: string;
  deviceId?: string; // If undefined, applies to all devices
  metricKey: string;
  condition: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  enabled: boolean;
}

@Injectable()
export class InMemoryCacheService {
  private readonly logger = new Logger(InMemoryCacheService.name);

  // Metadata cache (deviceId -> metadata map)
  private readonly metadataStore = new Map<string, CacheEntry<Record<string, any>>>();
  
  // Alarm rules cache (deviceId -> rules array)
  private readonly alarmRulesStore = new Map<string, CacheEntry<AlarmRule[]>>();
  
  // Global alarm rules (applies to all devices)
  private globalAlarmRules: CacheEntry<AlarmRule[]> | null = null;

  private readonly maxCapacity: number = 10000;
  private readonly defaultTtlMs: number = 300000; // 5 minutes

  private stats: {
    metadata: { hits: number; misses: number; evictions: number };
    alarms: { hits: number; misses: number; evictions: number };
  } = {
    metadata: { hits: 0, misses: 0, evictions: 0 },
    alarms: { hits: 0, misses: 0, evictions: 0 },
  };

  constructor() {
    // Background garbage collection every 60 seconds
    setInterval(() => this.cleanExpired(), 60000).unref();
  }

  // ==========================================
  // DEVICE METADATA CACHE
  // ==========================================

  getDeviceMetadata(deviceId: string): Record<string, any> | null {
    const entry = this.metadataStore.get(deviceId);
    if (!entry) {
      this.stats.metadata.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.metadataStore.delete(deviceId);
      this.stats.metadata.misses++;
      return null;
    }

    entry.lastAccessed = Date.now();
    this.stats.metadata.hits++;
    return entry.value;
  }

  setDeviceMetadata(deviceId: string, metadata: Record<string, any>, ttlMs: number = this.defaultTtlMs): void {
    if (this.metadataStore.size >= this.maxCapacity) {
      this.evictOldest(this.metadataStore, 'metadata');
    }

    this.metadataStore.set(deviceId, {
      value: metadata,
      expiresAt: Date.now() + ttlMs,
      lastAccessed: Date.now(),
    });
  }

  invalidateDeviceMetadata(deviceId: string): void {
    this.metadataStore.delete(deviceId);
  }

  // ==========================================
  // ACTIVE ALARM RULES CACHE
  // ==========================================

  getAlarmRules(deviceId: string): AlarmRule[] {
    const now = Date.now();
    const rules: AlarmRule[] = [];

    // 1. Check device-specific rules
    const deviceEntry = this.alarmRulesStore.get(deviceId);
    if (deviceEntry) {
      if (now <= deviceEntry.expiresAt) {
        deviceEntry.lastAccessed = now;
        this.stats.alarms.hits++;
        rules.push(...deviceEntry.value);
      } else {
        this.alarmRulesStore.delete(deviceId);
        this.stats.alarms.misses++;
      }
    } else {
      this.stats.alarms.misses++;
    }

    // 2. Check global rules
    if (this.globalAlarmRules) {
      if (now <= this.globalAlarmRules.expiresAt) {
        rules.push(...this.globalAlarmRules.value);
      } else {
        this.globalAlarmRules = null;
      }
    }

    return rules;
  }

  setDeviceAlarmRules(deviceId: string, rules: AlarmRule[], ttlMs: number = this.defaultTtlMs * 2): void {
    if (this.alarmRulesStore.size >= this.maxCapacity) {
      this.evictOldest(this.alarmRulesStore, 'alarms');
    }

    this.alarmRulesStore.set(deviceId, {
      value: rules,
      expiresAt: Date.now() + ttlMs,
      lastAccessed: Date.now(),
    });
  }

  setGlobalAlarmRules(rules: AlarmRule[], ttlMs: number = this.defaultTtlMs * 2): void {
    this.globalAlarmRules = {
      value: rules,
      expiresAt: Date.now() + ttlMs,
      lastAccessed: Date.now(),
    };
  }

  invalidateAlarmRules(deviceId?: string): void {
    if (deviceId) {
      this.alarmRulesStore.delete(deviceId);
    } else {
      this.alarmRulesStore.clear();
      this.globalAlarmRules = null;
    }
  }

  // ==========================================
  // METRICS & CACHE MANAGEMENT
  // ==========================================

  getStats(): {
    metadata: CacheStats;
    alarms: CacheStats;
  } {
    return {
      metadata: {
        hits: this.stats.metadata.hits,
        misses: this.stats.metadata.misses,
        size: this.metadataStore.size,
        maxCapacity: this.maxCapacity,
        evictions: this.stats.metadata.evictions,
      },
      alarms: {
        hits: this.stats.alarms.hits,
        misses: this.stats.alarms.misses,
        size: this.alarmRulesStore.size,
        maxCapacity: this.maxCapacity,
        evictions: this.stats.alarms.evictions,
      },
    };
  }

  clear(): void {
    this.metadataStore.clear();
    this.alarmRulesStore.clear();
    this.globalAlarmRules = null;
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.metadataStore.entries()) {
      if (now > entry.expiresAt) {
        this.metadataStore.delete(key);
      }
    }
    for (const [key, entry] of this.alarmRulesStore.entries()) {
      if (now > entry.expiresAt) {
        this.alarmRulesStore.delete(key);
      }
    }
    if (this.globalAlarmRules && now > this.globalAlarmRules.expiresAt) {
      this.globalAlarmRules = null;
    }
  }

  private evictOldest<T>(map: Map<string, CacheEntry<T>>, type: 'metadata' | 'alarms'): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of map.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      map.delete(oldestKey);
      this.stats[type].evictions++;
    }
  }
}
