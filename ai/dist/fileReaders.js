"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.smartParseFile = void 0;
const fs_1 = __importDefault(require("fs"));
const readFile = (path) => {
    if (!fs_1.default.existsSync(path)) {
        throw new Error(`File ${path} does not exist`);
    }
    return fs_1.default.readFileSync(path, 'utf8');
};
const smartParseFile = (path) => {
    const content = readFile(path);
    try {
        return JSON.parse(content);
    }
    catch (e) {
        // otherwise return the raw content
        return content;
    }
};
exports.smartParseFile = smartParseFile;
