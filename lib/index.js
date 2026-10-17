"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Version = exports.JID = exports.NeoxrApi = exports.Cooldown = exports.Spam = exports.Converter = exports.Utils = exports.Instance = exports.Config = exports.Proxy = exports.Client = exports.Chiper = exports.Security = void 0;
require("dotenv/config");
const node_fs_1 = __importDefault(require("node:fs"));
const path_1 = __importDefault(require("path"));
const CACHE_DIR = path_1.default.join(process.cwd(), '.cache');
if (!node_fs_1.default.existsSync(CACHE_DIR)) {
    node_fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
}
const security_js_1 = __importDefault(require("./utils/security.js"));
exports.Security = security_js_1.default;
const chiper_js_1 = __importDefault(require("./utils/chiper.js"));
exports.Chiper = chiper_js_1.default;
const connection_js_1 = __importDefault(require("./core/connection.js"));
exports.Client = connection_js_1.default;
const Proxy = __importStar(require("./proxy/index.js"));
exports.Proxy = Proxy;
const instance_js_1 = __importDefault(require("./core/instance.js"));
exports.Instance = instance_js_1.default;
const Functions = __importStar(require("./utils/functions.js"));
const converter_js_1 = __importDefault(require("./utils/converter.js"));
exports.Converter = converter_js_1.default;
const spam_js_1 = __importDefault(require("./utils/spam.js"));
exports.Spam = spam_js_1.default;
const cooldown_js_1 = __importDefault(require("./utils/cooldown.js"));
exports.Cooldown = cooldown_js_1.default;
const resolver_js_1 = __importDefault(require("./utils/resolver.js"));
exports.JID = resolver_js_1.default;
const index_js_1 = require("./types/index.js");
Object.defineProperty(exports, "Version", { enumerable: true, get: function () { return index_js_1.version; } });
const api_1 = __importDefault(require("@neoxr/api"));
exports.NeoxrApi = api_1.default;
const Config = node_fs_1.default.existsSync('./config.json') ? JSON.parse(node_fs_1.default.readFileSync('./config.json', 'utf-8')) : {};
exports.Config = Config;
const Utils = { ...Functions };
exports.Utils = Utils;
//# sourceMappingURL=index.js.map