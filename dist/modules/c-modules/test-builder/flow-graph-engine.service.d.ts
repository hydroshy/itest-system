export interface FlowNode {
    id: string;
    type: 'trigger' | 'packet_in' | 'lora_in' | 'extractor' | 'function' | 'script' | 'reference_device' | 'golden_unit' | 'moving_average' | 'aggregation' | 'comparator' | 'counter' | 'assertion_out' | 'output' | string;
    label?: string;
    params?: Record<string, any>;
    wires?: string[][] | string[];
    position?: {
        x: number;
        y: number;
    };
}
export interface FlowEdge {
    id?: string;
    from?: string;
    source?: string;
    to?: string;
    target?: string;
    fromPort?: number | string;
    sourceHandle?: string;
    toPort?: number | string;
    targetHandle?: string;
}
export interface FlowConfig {
    nodes: FlowNode[];
    edges?: FlowEdge[];
    wires?: Record<string, string[][]>;
    settings?: {
        timeoutMs?: number;
        failFast?: boolean;
        maxIterations?: number;
    };
}
export interface FlowAssertionResult {
    nodeId: string;
    nodeType: string;
    nodeLabel: string;
    fieldName?: string;
    operator?: string;
    expectedValue?: any;
    actualValue?: any;
    tolerance?: number;
    pass: boolean;
    severity: 'ERROR' | 'WARNING';
    message: string;
    details?: Record<string, any>;
}
export interface FlowMessage {
    msgId: string;
    topic?: string;
    payload: any;
    packet: {
        fPort?: number;
        fCnt?: number;
        rssi?: number;
        snr?: number;
        payloadHex?: string;
        decoded?: Record<string, any>;
        decodedData?: Record<string, any>;
        [key: string]: any;
    };
    context: {
        packetCount?: number;
        minPackets?: number;
        durationSeconds?: number;
        buffer?: Record<string, number[]>;
        referenceDevices?: Record<string, any>;
        goldenUnit?: Record<string, any>;
        [key: string]: any;
    };
    metadata?: Record<string, any>;
    assertions: FlowAssertionResult[];
    _port?: number;
}
export interface NodeExecutionResult {
    nodeId: string;
    nodeType: string;
    nodeLabel: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'ERROR';
    inputMessage?: any;
    outputMessages?: any[];
    assertions?: FlowAssertionResult[];
    logs?: string[];
    executionTimeMs: number;
    errorMessage?: string;
}
export interface FlowExecutionSummary {
    pass: boolean;
    executionTimeMs: number;
    totalNodes: number;
    executedNodes: number;
    assertionResults: FlowAssertionResult[];
    nodeExecutions: NodeExecutionResult[];
    finalMessages: FlowMessage[];
    summary: string;
    error?: string;
}
export interface FlowValidationResult {
    valid: boolean;
    errors: string[];
    warnings?: string[];
    cycleDetected?: boolean;
    entryNodeIds?: string[];
    topologicalOrder?: string[];
}
export declare class FlowGraphEngineService {
    private readonly logger;
    validateFlow(flowConfig: FlowConfig): FlowValidationResult;
    executeFlow(flowConfig: FlowConfig, packet?: Record<string, any>, context?: Record<string, any>): Promise<FlowExecutionSummary>;
    private executeSingleNode;
    private evaluateCondition;
    private buildAdjacency;
    private extractPath;
    private cloneMessage;
    private normalizeOutputMessage;
    private formatLogArg;
    private safeInspectValue;
}
