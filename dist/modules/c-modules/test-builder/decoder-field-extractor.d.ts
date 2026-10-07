export interface DiscoveredField {
    name: string;
    label: string;
    type: 'number' | 'string' | 'boolean' | 'object';
    unit?: string;
    sampleValue?: any;
}
export declare const IGNORED_PROTOCOL_KEYS: Set<string>;
export declare const STANDARD_FIELD_LABELS: Record<string, string>;
export declare function formatFieldLabel(name: string): string;
export declare function inferUnit(name: string): string | undefined;
export declare function inferSampleValue(name: string, type?: string): any;
export declare function extractFieldsWithVm(code: string, timeoutMs?: number): DiscoveredField[];
export declare function extractFieldsWithAst(code: string): DiscoveredField[];
export declare function extractDecoderFields(code: string): DiscoveredField[];
