import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface CanvasConfig {
  width: number;
  height: number;
  background: string;
  grid: number;
  showGrid?: boolean;
}

export interface HmiWidgetBinding {
  devEUI?: string;
  field?: string;
  formula?: string; // e.g. "val * 1.0"
  decimalPlaces?: number;
}

export interface HmiWidgetStateCondition {
  condition: string; // e.g. "val < 20", "val >= 80"
  color?: string;
  label?: string;
  alarmText?: string;
  blink?: boolean;
}

export interface HmiWidgetAction {
  type: 'downlink' | 'navigate' | 'toggle';
  devEUI?: string;
  fPort?: number;
  payloadHex?: string;
  confirmMessage?: string;
}

export interface HmiWidget {
  id: string;
  type:
    | 'bit-lamp'
    | 'multi-state-lamp'
    | 'alarm-banner'
    | 'linear-tank'
    | 'silo-vessel'
    | 'dial-gauge'
    | 'led-numeric'
    | 'mono-box'
    | 'static-label'
    | 'toggle-switch'
    | 'action-button'
    | 'realtime-trend';
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  props: Record<string, any>;
  bindings?: Record<string, HmiWidgetBinding>;
  states?: HmiWidgetStateCondition[];
  action?: HmiWidgetAction;
}

@Entity('hmi_screens')
export class HmiScreenEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'jsonb',
    default: () =>
      `'{"width": 1280, "height": 720, "background": "#0b0f19", "grid": 10, "showGrid": true}'`,
  })
  canvasConfig: CanvasConfig;

  @Column({
    type: 'jsonb',
    default: () => `'[]'`,
  })
  widgets: HmiWidget[];

  @Column({ type: 'boolean', default: false })
  isPublished: boolean;

  @Column({
    type: 'jsonb',
    default: () => `'["ADMIN", "SUPER_ADMIN", "OPERATOR", "VIEWER"]'`,
  })
  allowedRoles: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  author?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
