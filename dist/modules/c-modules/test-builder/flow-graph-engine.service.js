"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FlowGraphEngineService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlowGraphEngineService = void 0;
const common_1 = require("@nestjs/common");
const vm = require("vm");
let FlowGraphEngineService = FlowGraphEngineService_1 = class FlowGraphEngineService {
    constructor() {
        this.logger = new common_1.Logger(FlowGraphEngineService_1.name);
    }
    validateFlow(flowConfig) {
        const errors = [];
        const warnings = [];
        if (!flowConfig || !Array.isArray(flowConfig.nodes) || flowConfig.nodes.length === 0) {
            return {
                valid: false,
                errors: ['Flow configuration must contain at least one node.'],
            };
        }
        const nodeIds = new Set();
        for (const node of flowConfig.nodes) {
            if (!node.id) {
                errors.push('All nodes must have a unique "id" property.');
            }
            else if (nodeIds.has(node.id)) {
                errors.push(`Duplicate node id detected: '${node.id}'`);
            }
            else {
                nodeIds.add(node.id);
            }
        }
        const { adjacencyMap, inDegreeMap } = this.buildAdjacency(flowConfig);
        for (const [sourceId, targets] of adjacencyMap.entries()) {
            for (const target of targets) {
                if (!nodeIds.has(target.targetId)) {
                    errors.push(`Connection from node '${sourceId}' points to unknown target node '${target.targetId}'`);
                }
            }
        }
        const inDegreeCopy = new Map();
        for (const id of nodeIds) {
            inDegreeCopy.set(id, inDegreeMap.get(id) || 0);
        }
        const queue = [];
        const topologicalOrder = [];
        const entryNodeIds = [];
        for (const id of nodeIds) {
            if ((inDegreeCopy.get(id) || 0) === 0) {
                queue.push(id);
                entryNodeIds.push(id);
            }
        }
        if (entryNodeIds.length === 0 && nodeIds.size > 0) {
            errors.push('Loop/cycle detected in flow configuration (Cycle): No entry node found (all nodes have incoming edges).');
            return {
                valid: false,
                errors,
                cycleDetected: true,
            };
        }
        while (queue.length > 0) {
            const current = queue.shift();
            topologicalOrder.push(current);
            const neighbors = adjacencyMap.get(current) || [];
            for (const edge of neighbors) {
                const currentIn = inDegreeCopy.get(edge.targetId) || 0;
                const newIn = currentIn - 1;
                inDegreeCopy.set(edge.targetId, newIn);
                if (newIn === 0) {
                    queue.push(edge.targetId);
                }
            }
        }
        const cycleDetected = topologicalOrder.length !== nodeIds.size;
        if (cycleDetected) {
            errors.push('Loop/cycle detected in flow configuration (Cycle): Flow must be a directed acyclic graph (DAG).');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            cycleDetected,
            entryNodeIds,
            topologicalOrder: cycleDetected ? undefined : topologicalOrder,
        };
    }
    async executeFlow(flowConfig, packet = {}, context = {}) {
        const startTime = Date.now();
        const validation = this.validateFlow(flowConfig);
        if (!validation.valid) {
            return {
                pass: false,
                executionTimeMs: Date.now() - startTime,
                totalNodes: flowConfig.nodes?.length || 0,
                executedNodes: 0,
                assertionResults: [],
                nodeExecutions: [],
                finalMessages: [],
                summary: `Flow configuration error: ${validation.errors.join('; ')}`,
                error: validation.errors.join('; '),
            };
        }
        const nodesMap = new Map();
        for (const node of flowConfig.nodes) {
            nodesMap.set(node.id, node);
        }
        const { adjacencyMap } = this.buildAdjacency(flowConfig);
        const sharedContext = {
            packetCount: context.packetCount || 1,
            minPackets: context.minPackets || 1,
            durationSeconds: context.durationSeconds || 10,
            buffer: context.buffer || {},
            referenceDevices: context.referenceDevices || {},
            goldenUnit: context.goldenUnit || {},
            ...context,
        };
        const initialPayload = packet.decoded || packet.decodedData || packet;
        const fPortVal = packet.FPORT !== undefined ? packet.FPORT : (packet.fPort !== undefined ? packet.fPort : (packet.fport !== undefined ? packet.fport : 1));
        const fCntVal = packet.FCNT !== undefined ? packet.FCNT : (packet.fCnt !== undefined ? packet.fCnt : (packet.fcnt !== undefined ? packet.fcnt : 1));
        const rssiVal = packet.RSSI !== undefined ? packet.RSSI : (packet.rssi !== undefined ? packet.rssi : -80);
        const snrVal = packet.SNR !== undefined ? packet.SNR : (packet.snr !== undefined ? packet.snr : 8.0);
        const baseMessage = {
            msgId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            payload: initialPayload,
            packet: {
                ...packet,
                RSSI: rssiVal,
                SNR: snrVal,
                FPORT: fPortVal,
                FCNT: fCntVal,
                fPort: fPortVal,
                fport: fPortVal,
                fCnt: fCntVal,
                fcnt: fCntVal,
                rssi: rssiVal,
                snr: snrVal,
                payloadHex: packet.payloadHex || '',
                decoded: packet.decoded || packet.decodedData || {},
            },
            context: sharedContext,
            metadata: {},
            assertions: [],
        };
        const nodeExecutions = [];
        const allAssertions = [];
        const finalMessages = [];
        const queue = [];
        for (const entryId of validation.entryNodeIds || []) {
            queue.push({
                nodeId: entryId,
                inputMessage: this.cloneMessage(baseMessage),
            });
        }
        const executedNodeIds = new Set();
        const maxIterations = flowConfig.settings?.maxIterations || 1000;
        let iterationCount = 0;
        const failFast = flowConfig.settings?.failFast || false;
        let stoppedByFailFast = false;
        while (queue.length > 0) {
            iterationCount++;
            if (iterationCount > maxIterations) {
                return {
                    pass: false,
                    executionTimeMs: Date.now() - startTime,
                    totalNodes: flowConfig.nodes.length,
                    executedNodes: executedNodeIds.size,
                    assertionResults: allAssertions,
                    nodeExecutions,
                    finalMessages,
                    summary: `Maximum iteration limit exceeded (${maxIterations} steps)`,
                    error: 'Max iterations exceeded in DAG runner',
                };
            }
            const { nodeId, inputMessage } = queue.shift();
            const node = nodesMap.get(nodeId);
            if (!node)
                continue;
            executedNodeIds.add(nodeId);
            const nodeStart = Date.now();
            const execResult = {
                nodeId,
                nodeType: node.type,
                nodeLabel: node.label || node.id,
                status: 'SUCCESS',
                inputMessage: this.safeInspectValue(inputMessage.payload),
                logs: [],
                executionTimeMs: 0,
            };
            try {
                const { outputs, assertions, logs } = await this.executeSingleNode(node, inputMessage, sharedContext, flowConfig.settings?.timeoutMs || 500);
                execResult.executionTimeMs = Date.now() - nodeStart;
                execResult.logs = logs;
                execResult.assertions = assertions;
                if (assertions && assertions.length > 0) {
                    allAssertions.push(...assertions);
                    inputMessage.assertions.push(...assertions);
                }
                if (failFast) {
                    const hasFatalError = assertions?.some((a) => !a.pass && a.severity === 'ERROR');
                    if (hasFatalError) {
                        stoppedByFailFast = true;
                    }
                }
                const outgoingEdges = adjacencyMap.get(nodeId) || [];
                if (outgoingEdges.length === 0 || outputs.length === 0) {
                    for (const outMsg of outputs) {
                        finalMessages.push(outMsg);
                    }
                }
                else {
                    for (const outMsg of outputs) {
                        const outPort = outMsg._port !== undefined ? outMsg._port : 0;
                        const targetEdges = outgoingEdges.filter((e) => e.fromPort === outPort || e.fromPort === 0);
                        for (const edge of targetEdges) {
                            queue.push({
                                nodeId: edge.targetId,
                                inputMessage: this.cloneMessage(outMsg),
                            });
                        }
                    }
                }
                execResult.outputMessages = outputs.map((o) => this.safeInspectValue(o.payload));
                nodeExecutions.push(execResult);
                if (stoppedByFailFast) {
                    break;
                }
            }
            catch (err) {
                execResult.status = 'ERROR';
                execResult.executionTimeMs = Date.now() - nodeStart;
                execResult.errorMessage = err.message || String(err);
                nodeExecutions.push(execResult);
                const errorAssertion = {
                    nodeId,
                    nodeType: node.type,
                    nodeLabel: node.label || node.id,
                    pass: false,
                    severity: 'ERROR',
                    message: `Execution error at Node '${node.label || node.id}': ${err.message}`,
                };
                allAssertions.push(errorAssertion);
                if (failFast) {
                    break;
                }
            }
        }
        const totalDuration = Date.now() - startTime;
        const hasErrorFailures = allAssertions.some((a) => !a.pass && a.severity === 'ERROR');
        const overallPass = !hasErrorFailures;
        let summaryText = '';
        if (stoppedByFailFast) {
            summaryText = `Test execution STOPPED EARLY (Fail-Fast) due to fatal error (${totalDuration}ms)`;
        }
        else if (overallPass) {
            summaryText = `Flow test PASSED: ${allAssertions.length} assertions passed (${executedNodeIds.size}/${flowConfig.nodes.length} nodes, ${totalDuration}ms)`;
        }
        else {
            const failCount = allAssertions.filter((a) => !a.pass && a.severity === 'ERROR').length;
            summaryText = `Test FAILED: Detected ${failCount} assertion violations (${totalDuration}ms)`;
        }
        return {
            pass: overallPass,
            executionTimeMs: totalDuration,
            totalNodes: flowConfig.nodes.length,
            executedNodes: executedNodeIds.size,
            assertionResults: allAssertions,
            nodeExecutions,
            finalMessages,
            summary: summaryText,
        };
    }
    async executeSingleNode(node, message, context, timeoutMs) {
        const logs = [];
        const assertions = [];
        const params = node.params || {};
        const nodeTypeNormalized = (node.type || '').toLowerCase().replace(/[-_]/g, '');
        switch (nodeTypeNormalized) {
            case 'trigger':
            case 'packetin':
            case 'lorain': {
                const payload = message.packet.decoded && Object.keys(message.packet.decoded).length > 0
                    ? message.packet.decoded
                    : message.packet;
                message.payload = payload;
                return { outputs: [message], assertions: [], logs };
            }
            case 'extractor': {
                const fieldPath = params.field || params.fieldName || '';
                let extracted = undefined;
                if (fieldPath) {
                    extracted = this.extractPath(message.payload, fieldPath);
                    if (extracted === undefined) {
                        extracted = this.extractPath(message.packet.decoded, fieldPath);
                    }
                    if (extracted === undefined) {
                        extracted = this.extractPath(message.packet, fieldPath);
                    }
                }
                else {
                    extracted = message.payload;
                }
                const outMsg = this.cloneMessage(message);
                outMsg.payload = extracted;
                if (params.outputKey) {
                    if (typeof message.payload === 'object' && message.payload !== null) {
                        outMsg.payload = { ...message.payload, [params.outputKey]: extracted };
                    }
                }
                return { outputs: [outMsg], assertions: [], logs };
            }
            case 'function':
            case 'script':
            case 'customfunction': {
                const scriptCode = params.code || params.script || params.customScript || '';
                if (!scriptCode || !scriptCode.trim()) {
                    return { outputs: [message], assertions: [], logs };
                }
                const sandboxLogs = [];
                const sandboxMsg = this.cloneMessage(message);
                const sandbox = {
                    msg: sandboxMsg,
                    context,
                    node: {
                        id: node.id,
                        type: node.type,
                        label: node.label || node.id,
                        params: { ...params },
                    },
                    console: {
                        log: (...args) => sandboxLogs.push(args.map(this.formatLogArg).join(' ')),
                        warn: (...args) => sandboxLogs.push('[WARN] ' + args.map(this.formatLogArg).join(' ')),
                        error: (...args) => sandboxLogs.push('[ERR] ' + args.map(this.formatLogArg).join(' ')),
                        info: (...args) => sandboxLogs.push('[INFO] ' + args.map(this.formatLogArg).join(' ')),
                    },
                    Math,
                    Date,
                    JSON,
                    RegExp,
                    parseInt,
                    parseFloat,
                    isNaN,
                    isFinite,
                    encodeURIComponent,
                    decodeURIComponent,
                    Array,
                    Object,
                    String,
                    Number,
                    Boolean,
                };
                const vmContext = vm.createContext(sandbox);
                const wrappedCode = `
          (function() {
            ${scriptCode}
            if (typeof evaluate === 'function') {
              return evaluate(msg.packet, msg.context);
            }
            return (function(msg, context, node) {
              ${scriptCode}
            })(msg, context, node);
          })()
        `;
                let evalResult;
                try {
                    evalResult = vm.runInContext(wrappedCode, vmContext, { timeout: timeoutMs });
                }
                catch (err) {
                    throw new Error(`JS Sandbox Function Node error: ${err.message}`);
                }
                const outputs = [];
                if (evalResult === null || evalResult === undefined) {
                    if (sandboxMsg) {
                        outputs.push(sandboxMsg);
                    }
                }
                else if (Array.isArray(evalResult)) {
                    evalResult.forEach((item, portIndex) => {
                        if (item) {
                            if (Array.isArray(item)) {
                                for (const subItem of item) {
                                    const m = this.normalizeOutputMessage(subItem, message);
                                    m._port = portIndex;
                                    outputs.push(m);
                                }
                            }
                            else {
                                const m = this.normalizeOutputMessage(item, message);
                                m._port = portIndex;
                                outputs.push(m);
                            }
                        }
                    });
                }
                else if (typeof evalResult === 'boolean') {
                    const pass = evalResult;
                    assertions.push({
                        nodeId: node.id,
                        nodeType: 'function',
                        nodeLabel: node.label || 'Function Script',
                        pass,
                        severity: params.severity || 'ERROR',
                        message: pass ? 'Function Script returned true' : 'Function Script returned false',
                        details: { evalResult },
                    });
                    const outMsg = this.cloneMessage(message);
                    outMsg.payload = { pass, original: message.payload };
                    outputs.push(outMsg);
                }
                else if (typeof evalResult === 'object') {
                    if (typeof evalResult.pass === 'boolean') {
                        const pass = evalResult.pass;
                        assertions.push({
                            nodeId: node.id,
                            nodeType: 'function',
                            nodeLabel: node.label || 'Function Script',
                            pass,
                            severity: params.severity || 'ERROR',
                            message: evalResult.reason || (pass ? 'Function Script evaluated: PASS' : 'Function Script evaluated: FAIL'),
                            details: evalResult.metrics || evalResult,
                        });
                    }
                    if (evalResult.payload !== undefined) {
                        const outMsg = this.cloneMessage(message);
                        outMsg.payload = evalResult.payload;
                        outputs.push(outMsg);
                    }
                    else {
                        const outMsg = this.cloneMessage(message);
                        outMsg.payload = evalResult;
                        outputs.push(outMsg);
                    }
                }
                else {
                    const outMsg = this.cloneMessage(message);
                    outMsg.payload = evalResult;
                    outputs.push(outMsg);
                }
                return { outputs, assertions, logs: sandboxLogs };
            }
            case 'referencedevice':
            case 'goldenunit': {
                const fieldName = params.field || params.fieldName || 'value';
                const tolerance = params.tolerance !== undefined ? Number(params.tolerance) : 1.0;
                const toleranceType = String(params.toleranceType || 'ABSOLUTE').toUpperCase();
                const severity = params.severity || 'ERROR';
                let actualValue = undefined;
                if (typeof message.payload === 'object' && message.payload !== null && message.payload[fieldName] !== undefined) {
                    actualValue = message.payload[fieldName];
                }
                else if (typeof message.payload === 'number') {
                    actualValue = message.payload;
                }
                else {
                    actualValue = this.extractPath(message.packet.decoded, fieldName);
                }
                let refValue = undefined;
                const refDeviceId = params.devEUI || params.referenceDeviceId || params.refDevEUI;
                if (refDeviceId && context.referenceDevices && context.referenceDevices[refDeviceId]) {
                    refValue = this.extractPath(context.referenceDevices[refDeviceId], fieldName);
                }
                else if (context.goldenUnit && context.goldenUnit[fieldName] !== undefined) {
                    refValue = context.goldenUnit[fieldName];
                }
                else if (params.referenceValue !== undefined) {
                    refValue = params.referenceValue;
                }
                else if (refDeviceId && context.referenceDevices && typeof context.referenceDevices === 'object') {
                    const firstKey = Object.keys(context.referenceDevices)[0];
                    if (firstKey) {
                        refValue = this.extractPath(context.referenceDevices[firstKey], fieldName);
                    }
                }
                let pass = false;
                let delta = 0;
                let deviationPercent = 0;
                let evalMessage = '';
                if (actualValue === undefined || actualValue === null) {
                    pass = false;
                    evalMessage = `DUT missing field '${fieldName}' for reference comparison`;
                }
                else if (refValue === undefined || refValue === null) {
                    pass = false;
                    evalMessage = `Reference/Golden unit value not found for field '${fieldName}'`;
                }
                else {
                    const actualNum = Number(actualValue);
                    const refNum = Number(refValue);
                    delta = Number(Math.abs(actualNum - refNum).toFixed(4));
                    deviationPercent = Math.abs(refNum) > 0 ? Number(((delta / Math.abs(refNum)) * 100).toFixed(4)) : 0;
                    if (toleranceType === 'PERCENTAGE') {
                        pass = deviationPercent <= tolerance;
                        evalMessage = pass
                            ? `DUT ${actualNum} vs Ref ${refNum}: Deviation ${deviationPercent.toFixed(2)}% is within ±${tolerance}%`
                            : `DUT ${actualNum} vs Ref ${refNum}: Deviation ${deviationPercent.toFixed(2)}% exceeds tolerance ±${tolerance}%`;
                    }
                    else {
                        pass = delta <= tolerance;
                        evalMessage = pass
                            ? `DUT ${actualNum} vs Ref ${refNum}: Delta Δ=${delta.toFixed(3)} is within tolerance ±${tolerance}`
                            : `DUT ${actualNum} vs Ref ${refNum}: Delta Δ=${delta.toFixed(3)} exceeds tolerance ±${tolerance}`;
                    }
                }
                const assertion = {
                    nodeId: node.id,
                    nodeType: 'reference_device',
                    nodeLabel: node.label || `Reference Device Comparison (${fieldName})`,
                    fieldName,
                    operator: toleranceType === 'PERCENTAGE' ? 'RELATIVE_TOLERANCE' : 'ABSOLUTE_TOLERANCE',
                    expectedValue: refValue,
                    actualValue,
                    tolerance,
                    pass,
                    severity,
                    message: evalMessage,
                    details: {
                        referenceDeviceId: refDeviceId || 'STATIC_PRESET',
                        delta,
                        deviationPercent,
                        toleranceType,
                    },
                };
                assertions.push(assertion);
                const outMsg = this.cloneMessage(message);
                outMsg.payload = {
                    field: fieldName,
                    actualValue,
                    referenceValue: refValue,
                    delta,
                    deviationPercent: Number(deviationPercent.toFixed(3)),
                    tolerance,
                    toleranceType,
                    pass,
                };
                return { outputs: [outMsg], assertions, logs };
            }
            case 'movingaverage':
            case 'aggregation':
            case 'aggregate': {
                const fieldName = params.field || params.fieldName || 'value';
                const windowSize = params.windowSize !== undefined ? Number(params.windowSize) : 5;
                const targetMean = params.targetMean !== undefined ? Number(params.targetMean) : undefined;
                const tolerance = params.tolerance !== undefined ? Number(params.tolerance) : 0;
                const maxStdDev = params.maxStdDev !== undefined ? Number(params.maxStdDev) : undefined;
                const mode = (params.mode || 'avg').toLowerCase();
                const severity = params.severity || 'ERROR';
                let currentVal = undefined;
                if (typeof message.payload === 'object' && message.payload !== null && message.payload[fieldName] !== undefined) {
                    currentVal = message.payload[fieldName];
                }
                else if (typeof message.payload === 'number') {
                    currentVal = message.payload;
                }
                else {
                    currentVal = this.extractPath(message.packet.decoded, fieldName);
                }
                if (!context.buffer)
                    context.buffer = {};
                if (!Array.isArray(context.buffer[fieldName]))
                    context.buffer[fieldName] = [];
                if (currentVal !== undefined && currentVal !== null && !isNaN(Number(currentVal))) {
                    context.buffer[fieldName].push(Number(currentVal));
                    if (windowSize > 0 && context.buffer[fieldName].length > windowSize) {
                        context.buffer[fieldName].shift();
                    }
                }
                const samples = context.buffer[fieldName];
                const count = samples.length;
                let mean = 0;
                let variance = 0;
                let stdDev = 0;
                let min = count > 0 ? samples[0] : 0;
                let max = count > 0 ? samples[0] : 0;
                let delta = 0;
                if (count > 0) {
                    const sum = samples.reduce((acc, val) => acc + val, 0);
                    mean = sum / count;
                    variance = samples.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
                    stdDev = Math.sqrt(variance);
                    min = Math.min(...samples);
                    max = Math.max(...samples);
                    delta = max - min;
                }
                let meanPass = true;
                let stdDevPass = true;
                let deltaPass = true;
                const evalReasons = [];
                if (targetMean !== undefined) {
                    meanPass = Math.abs(mean - targetMean) <= tolerance;
                    if (!meanPass) {
                        evalReasons.push(`Mean μ=${mean.toFixed(2)} deviates from target ${targetMean} (±${tolerance})`);
                    }
                }
                if (maxStdDev !== undefined && count > 1) {
                    stdDevPass = stdDev <= maxStdDev;
                    if (!stdDevPass) {
                        evalReasons.push(`Standard deviation (stdDev) σ=${stdDev.toFixed(3)} exceeds maximum jitter (${maxStdDev})`);
                    }
                }
                if (mode === 'delta' && tolerance > 0 && count > 1) {
                    deltaPass = delta <= tolerance;
                    if (!deltaPass) {
                        evalReasons.push(`Peak-to-peak delta (${delta.toFixed(2)}) exceeds tolerance ${tolerance}`);
                    }
                }
                const overallPass = count > 0 && meanPass && stdDevPass && deltaPass;
                const statusMsg = overallPass
                    ? `Stats [${mode.toUpperCase()}] ${fieldName} (n=${count}): μ=${mean.toFixed(2)}, σ=${stdDev.toFixed(3)}, Δ=${delta.toFixed(2)}, [${min}, ${max}] PASSED`
                    : `Stats [${mode.toUpperCase()}] ${fieldName} (n=${count}): ${evalReasons.join('; ') || 'FAILED'}`;
                assertions.push({
                    nodeId: node.id,
                    nodeType: 'aggregate',
                    nodeLabel: node.label || `Motion Statistics (${fieldName})`,
                    fieldName,
                    operator: 'AGGREGATION',
                    expectedValue: targetMean !== undefined ? { targetMean, maxStdDev, tolerance } : { maxStdDev, tolerance },
                    actualValue: { mode, mean: Number(mean.toFixed(3)), stdDev: Number(stdDev.toFixed(3)), delta: Number(delta.toFixed(3)), min, max, count },
                    pass: overallPass,
                    severity,
                    message: statusMsg,
                    details: {
                        mode,
                        samples: [...samples],
                        mean: Number(mean.toFixed(4)),
                        stdDev: Number(stdDev.toFixed(4)),
                        variance: Number(variance.toFixed(4)),
                        delta: Number(delta.toFixed(4)),
                        min,
                        max,
                        count,
                    },
                });
                let primaryValue = mean;
                if (mode === 'min')
                    primaryValue = min;
                else if (mode === 'max')
                    primaryValue = max;
                else if (mode === 'delta')
                    primaryValue = delta;
                else if (mode === 'stddev')
                    primaryValue = stdDev;
                const outMsg = this.cloneMessage(message);
                outMsg.payload = {
                    field: fieldName,
                    mode,
                    value: Number(primaryValue.toFixed(4)),
                    count,
                    mean: Number(mean.toFixed(4)),
                    stdDev: Number(stdDev.toFixed(4)),
                    variance: Number(variance.toFixed(4)),
                    delta: Number(delta.toFixed(4)),
                    min,
                    max,
                    pass: overallPass,
                };
                return { outputs: [outMsg], assertions, logs };
            }
            case 'comparator': {
                const fieldName = params.field || params.fieldName || '';
                let actual = undefined;
                if (typeof message.payload === 'object' && message.payload !== null && fieldName && message.payload[fieldName] !== undefined) {
                    actual = message.payload[fieldName];
                }
                else if (typeof message.payload === 'number' || typeof message.payload === 'string') {
                    actual = message.payload;
                }
                else if (fieldName) {
                    actual = this.extractPath(message.packet.decoded, fieldName);
                    if (actual === undefined && message.packet) {
                        actual = this.extractPath(message.packet, fieldName);
                    }
                }
                const operator = (params.operator || 'EQUALS').toUpperCase();
                let expected = params.value !== undefined ? params.value : params.expectedValue;
                if (params.compareMode === 'reference') {
                    const refDevId = params.devEUI || params.referenceDeviceId;
                    if (refDevId && context.referenceDevices?.[refDevId]?.[fieldName] !== undefined) {
                        expected = context.referenceDevices[refDevId][fieldName];
                    }
                    else if (context.goldenUnit?.[fieldName] !== undefined) {
                        expected = context.goldenUnit[fieldName];
                    }
                }
                if (operator === 'BETWEEN' || operator === 'IN_RANGE') {
                    expected = {
                        min: params.min !== undefined ? Number(params.min) : -Infinity,
                        max: params.max !== undefined ? Number(params.max) : Infinity,
                    };
                }
                const severity = params.severity || 'ERROR';
                const { pass, message: evalMessage } = this.evaluateCondition(actual, operator, expected, params.tolerance || 0);
                assertions.push({
                    nodeId: node.id,
                    nodeType: 'comparator',
                    nodeLabel: node.label || `Compare (${fieldName || 'payload'})`,
                    fieldName,
                    operator,
                    expectedValue: expected,
                    actualValue: actual,
                    pass,
                    severity,
                    message: evalMessage,
                });
                const outMsg = this.cloneMessage(message);
                return { outputs: [outMsg], assertions, logs };
            }
            case 'counter': {
                const minPackets = Number(params.minPackets || params.minPacketsRequired || 1);
                const actualCount = Number(context.packetCount || message.packet.fCnt || 1);
                const pass = actualCount >= minPackets;
                const severity = params.severity || 'ERROR';
                assertions.push({
                    nodeId: node.id,
                    nodeType: 'counter',
                    nodeLabel: node.label || 'Packet Counter',
                    fieldName: 'packetCount',
                    operator: 'GREATER_THAN_OR_EQUAL',
                    expectedValue: minPackets,
                    actualValue: actualCount,
                    pass,
                    severity,
                    message: pass
                        ? `Collected sufficient packets: ${actualCount}/${minPackets}`
                        : `Insufficient packets collected: ${actualCount}/${minPackets}`,
                });
                const outMsg = this.cloneMessage(message);
                return { outputs: [outMsg], assertions, logs };
            }
            case 'assertionout':
            case 'output': {
                const outMsg = this.cloneMessage(message);
                return { outputs: [outMsg], assertions: [], logs };
            }
            default: {
                return { outputs: [message], assertions: [], logs };
            }
        }
    }
    evaluateCondition(actual, operator, expected, tolerance = 0) {
        if (actual === undefined || actual === null) {
            return { pass: false, message: 'Field value does not exist or is null' };
        }
        let pass = false;
        let message = '';
        switch (operator) {
            case 'EQUALS':
                if (typeof actual === 'number' && typeof expected === 'number' && tolerance > 0) {
                    pass = Math.abs(actual - expected) <= tolerance;
                    message = pass
                        ? `${actual} == ${expected} (±${tolerance})`
                        : `${actual} deviated from ${expected} beyond tolerance ±${tolerance}`;
                }
                else {
                    pass = String(actual) === String(expected);
                    message = pass ? `${actual} == ${expected}` : `${actual} != ${expected}`;
                }
                break;
            case 'NOT_EQUALS':
                pass = String(actual) !== String(expected);
                message = pass ? `${actual} != ${expected}` : `${actual} == ${expected}`;
                break;
            case 'GREATER_THAN':
                pass = Number(actual) > Number(expected);
                message = pass ? `${actual} > ${expected}` : `${actual} is not greater than ${expected}`;
                break;
            case 'GREATER_THAN_OR_EQUAL':
                pass = Number(actual) >= Number(expected);
                message = pass ? `${actual} >= ${expected}` : `${actual} < ${expected}`;
                break;
            case 'LESS_THAN':
                pass = Number(actual) < Number(expected);
                message = pass ? `${actual} < ${expected}` : `${actual} is not less than ${expected}`;
                break;
            case 'LESS_THAN_OR_EQUAL':
                pass = Number(actual) <= Number(expected);
                message = pass ? `${actual} <= ${expected}` : `${actual} > ${expected}`;
                break;
            case 'BETWEEN':
            case 'IN_RANGE': {
                let min = -Infinity;
                let max = Infinity;
                if (expected && typeof expected === 'object') {
                    min = expected.min !== undefined ? Number(expected.min) : -Infinity;
                    max = expected.max !== undefined ? Number(expected.max) : Infinity;
                }
                else if (Array.isArray(expected) && expected.length >= 2) {
                    min = Number(expected[0]);
                    max = Number(expected[1]);
                }
                pass = Number(actual) >= min && Number(actual) <= max;
                message = pass
                    ? `${actual} is within range [${min}, ${max}]`
                    : `${actual} is outside range [${min}, ${max}]`;
                break;
            }
            case 'IS_NOT_NULL':
                pass = actual !== null && actual !== undefined && actual !== '';
                message = pass ? 'Valid value exists' : 'Value is null or empty';
                break;
            case 'CONTAINS':
                pass = String(actual).includes(String(expected));
                message = pass ? `'${actual}' contains '${expected}'` : `'${actual}' does not contain '${expected}'`;
                break;
            case 'REGEX':
                try {
                    const regex = new RegExp(String(expected));
                    pass = regex.test(String(actual));
                    message = pass ? `${actual} matches pattern` : `${actual} does not match regex ${expected}`;
                }
                catch (e) {
                    pass = false;
                    message = `Invalid regex: ${e.message}`;
                }
                break;
            default:
                pass = false;
                message = `Unsupported operator '${operator}'`;
        }
        return { pass, message };
    }
    buildAdjacency(flowConfig) {
        const adjacencyMap = new Map();
        const inDegreeMap = new Map();
        for (const node of flowConfig.nodes) {
            if (node.id) {
                if (!adjacencyMap.has(node.id))
                    adjacencyMap.set(node.id, []);
                if (!inDegreeMap.has(node.id))
                    inDegreeMap.set(node.id, 0);
            }
        }
        for (const node of flowConfig.nodes) {
            if (!node.wires || !node.id)
                continue;
            if (Array.isArray(node.wires)) {
                node.wires.forEach((wireEntry, portIndex) => {
                    if (Array.isArray(wireEntry)) {
                        for (const targetId of wireEntry) {
                            if (targetId) {
                                adjacencyMap.get(node.id)?.push({ targetId, fromPort: portIndex, toPort: 0 });
                                inDegreeMap.set(targetId, (inDegreeMap.get(targetId) || 0) + 1);
                            }
                        }
                    }
                    else if (typeof wireEntry === 'string') {
                        adjacencyMap.get(node.id)?.push({ targetId: wireEntry, fromPort: 0, toPort: 0 });
                        inDegreeMap.set(wireEntry, (inDegreeMap.get(wireEntry) || 0) + 1);
                    }
                });
            }
        }
        if (Array.isArray(flowConfig.edges)) {
            for (const edge of flowConfig.edges) {
                const sourceId = edge.from || edge.source;
                const targetId = edge.to || edge.target;
                if (sourceId && targetId) {
                    let fromPort = 0;
                    if (typeof edge.fromPort === 'number') {
                        fromPort = edge.fromPort;
                    }
                    else if (typeof edge.fromPort === 'string') {
                        const num = parseInt(edge.fromPort.replace(/\D/g, ''), 10);
                        fromPort = !isNaN(num) ? num : 0;
                    }
                    let toPort = 0;
                    if (typeof edge.toPort === 'number') {
                        toPort = edge.toPort;
                    }
                    else if (typeof edge.toPort === 'string') {
                        const num = parseInt(edge.toPort.replace(/\D/g, ''), 10);
                        toPort = !isNaN(num) ? num : 0;
                    }
                    const existing = adjacencyMap.get(sourceId)?.find((e) => e.targetId === targetId && e.fromPort === fromPort);
                    if (!existing) {
                        adjacencyMap.get(sourceId)?.push({ targetId, fromPort, toPort });
                        inDegreeMap.set(targetId, (inDegreeMap.get(targetId) || 0) + 1);
                    }
                }
            }
        }
        return { adjacencyMap, inDegreeMap };
    }
    extractPath(obj, path) {
        if (!obj || !path)
            return undefined;
        if (obj[path] !== undefined)
            return obj[path];
        const parts = path.split('.');
        let cur = obj;
        for (const part of parts) {
            if (cur === null || cur === undefined)
                return undefined;
            cur = cur[part];
        }
        return cur;
    }
    cloneMessage(msg) {
        return {
            msgId: msg.msgId,
            topic: msg.topic,
            payload: typeof msg.payload === 'object' && msg.payload !== null ? JSON.parse(JSON.stringify(msg.payload)) : msg.payload,
            packet: { ...msg.packet },
            context: msg.context,
            metadata: { ...msg.metadata },
            assertions: [...msg.assertions],
            _port: msg._port,
        };
    }
    normalizeOutputMessage(item, fallbackMsg) {
        if (item && typeof item === 'object' && ('payload' in item || 'msgId' in item)) {
            return {
                msgId: item.msgId || fallbackMsg.msgId,
                topic: item.topic || fallbackMsg.topic,
                payload: item.payload !== undefined ? item.payload : item,
                packet: item.packet || fallbackMsg.packet,
                context: item.context || fallbackMsg.context,
                metadata: item.metadata || fallbackMsg.metadata,
                assertions: item.assertions || [...fallbackMsg.assertions],
                _port: item._port,
            };
        }
        const cloned = this.cloneMessage(fallbackMsg);
        cloned.payload = item;
        return cloned;
    }
    formatLogArg(arg) {
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.stringify(arg);
            }
            catch {
                return String(arg);
            }
        }
        return String(arg);
    }
    safeInspectValue(val) {
        if (val === undefined)
            return 'undefined';
        if (val === null)
            return null;
        if (typeof val === 'object') {
            try {
                return JSON.parse(JSON.stringify(val));
            }
            catch {
                return String(val);
            }
        }
        return val;
    }
};
exports.FlowGraphEngineService = FlowGraphEngineService;
exports.FlowGraphEngineService = FlowGraphEngineService = FlowGraphEngineService_1 = __decorate([
    (0, common_1.Injectable)()
], FlowGraphEngineService);
//# sourceMappingURL=flow-graph-engine.service.js.map