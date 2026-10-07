"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubsystemLogger = void 0;
exports.createSubsystemLogger = createSubsystemLogger;
const common_1 = require("@nestjs/common");
let SubsystemLogger = class SubsystemLogger {
    constructor(subsystem) {
        this.subsystem = subsystem;
    }
    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const domainTag = `[${this.subsystem}]`;
        const contextTag = context ? ` [${context}]` : '';
        const content = typeof message === 'object' ? JSON.stringify(message) : message;
        return `${timestamp} ${level.toUpperCase().padEnd(5)} ${domainTag}${contextTag} ${content}`;
    }
    log(message, context) {
        console.log(this.formatMessage('info', message, context));
    }
    error(message, trace, context) {
        console.error(this.formatMessage('error', message, context));
        if (trace) {
            console.error(`  ↳ Trace: ${trace}`);
        }
    }
    warn(message, context) {
        console.warn(this.formatMessage('warn', message, context));
    }
    debug(message, context) {
        console.debug(this.formatMessage('debug', message, context));
    }
    verbose(message, context) {
        console.log(this.formatMessage('verbose', message, context));
    }
};
exports.SubsystemLogger = SubsystemLogger;
exports.SubsystemLogger = SubsystemLogger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [String])
], SubsystemLogger);
function createSubsystemLogger(subsystem) {
    return new SubsystemLogger(subsystem);
}
//# sourceMappingURL=subsystem-logger.service.js.map