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
    formula?: string;
    decimalPlaces?: number;
}
export interface HmiWidgetStateCondition {
    condition: string;
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
    type: 'bit-lamp' | 'multi-state-lamp' | 'alarm-banner' | 'linear-tank' | 'silo-vessel' | 'dial-gauge' | 'led-numeric' | 'mono-box' | 'static-label' | 'toggle-switch' | 'action-button' | 'realtime-trend';
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
export declare class HmiScreenEntity {
    id: string;
    name: string;
    description?: string;
    canvasConfig: CanvasConfig;
    widgets: HmiWidget[];
    isPublished: boolean;
    allowedRoles: string[];
    author?: string;
    createdAt: Date;
    updatedAt: Date;
}
