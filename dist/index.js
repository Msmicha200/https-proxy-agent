"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpsProxyAgent = void 0;
var net = require("net");
var tls = require("tls");
var assert_1 = require("assert");
var debug_1 = require("debug");
var agent_base_1 = require("agent-base");
var parse_proxy_response_1 = require("./parse-proxy-response");
var debug = (0, debug_1.default)('https-proxy-agent');
/**
 * The `HttpsProxyAgent` implements an HTTP Agent subclass that connects to
 * the specified "HTTP(s) proxy server" in order to proxy HTTPS requests.
 *
 * Outgoing HTTP requests are first tunneled through the proxy server using the
 * `CONNECT` HTTP request method to establish a connection to the proxy server,
 * and then the proxy server connects to the destination target and issues the
 * HTTP request from the proxy server.
 *
 * `https:` requests have their socket connection upgraded to TLS once
 * the connection to the proxy server has been established.
 */
var HttpsProxyAgent = exports.HttpsProxyAgent = /** @class */ (function (_super) {
    __extends(HttpsProxyAgent, _super);
    function HttpsProxyAgent(proxy, opts) {
        var _this = this;
        var _a;
        _this = _super.call(this, opts) || this;
        _this.options = { path: undefined, rejectUnauthorized: false };
        _this.proxy = typeof proxy === 'string' ? new URL(proxy) : proxy;
        _this.proxyHeaders = (_a = opts === null || opts === void 0 ? void 0 : opts.headers) !== null && _a !== void 0 ? _a : {};
        debug('Creating new HttpsProxyAgent instance: %o', _this.proxy.href);
        // Trim off the brackets from IPv6 addresses
        var host = (_this.proxy.hostname || _this.proxy.host).replace(/^\[|\]$/g, '');
        var port = _this.proxy.port
            ? parseInt(_this.proxy.port, 10)
            : _this.proxy.protocol === 'https:'
                ? 443
                : 80;
        _this.connectOpts = __assign(__assign({ 
            // Attempt to negotiate http/1.1 for proxy servers that support http/2
            ALPNProtocols: ['http/1.1'] }, (opts ? omit(opts, 'headers') : null)), { host: host, port: port });
        return _this;
    }
    /**
     * Called when the node-core HTTP client library is creating a
     * new HTTP request.
     */
    HttpsProxyAgent.prototype.connect = function (req, opts) {
        return __awaiter(this, void 0, void 0, function () {
            var proxy, socket, headers, host, payload, auth, _i, _a, name_1, proxyResponsePromise, connect, buffered, servername, fakeSocket;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        proxy = this.proxy;
                        if (!opts.host) {
                            throw new TypeError('No "host" provided');
                        }
                        if (proxy.protocol === 'https:') {
                            debug('Creating `tls.Socket`: %o', this.connectOpts);
                            socket = tls.connect(this.connectOpts);
                        }
                        else {
                            debug('Creating `net.Socket`: %o', this.connectOpts);
                            socket = net.connect(this.connectOpts);
                        }
                        headers = typeof this.proxyHeaders === 'function'
                            ? this.proxyHeaders()
                            : __assign({}, this.proxyHeaders);
                        host = net.isIPv6(opts.host) ? "[".concat(opts.host, "]") : opts.host;
                        payload = "CONNECT ".concat(host, ":").concat(opts.port, " HTTP/1.1\r\n");
                        // Inject the `Proxy-Authorization` header if necessary.
                        if (proxy.username || proxy.password) {
                            auth = "".concat(decodeURIComponent(proxy.username), ":").concat(decodeURIComponent(proxy.password));
                            headers['Proxy-Authorization'] = "Basic ".concat(Buffer.from(auth).toString('base64'));
                        }
                        headers.Host = "".concat(host, ":").concat(opts.port);
                        if (!headers['Proxy-Connection']) {
                            headers['Proxy-Connection'] = this.keepAlive
                                ? 'Keep-Alive'
                                : 'close';
                        }
                        for (_i = 0, _a = Object.keys(headers); _i < _a.length; _i++) {
                            name_1 = _a[_i];
                            payload += "".concat(name_1, ": ").concat(headers[name_1], "\r\n");
                        }
                        proxyResponsePromise = (0, parse_proxy_response_1.parseProxyResponse)(socket);
                        socket.write("".concat(payload, "\r\n"));
                        return [4 /*yield*/, proxyResponsePromise];
                    case 1:
                        connect = (_b = _c.sent(), _b.connect), buffered = _b.buffered;
                        req.emit('proxyConnect', connect);
                        this.emit('proxyConnect', connect, req);
                        if (connect.statusCode === 200) {
                            req.once('socket', resume);
                            if (opts.secureEndpoint) {
                                // The proxy is connecting to a TLS server, so upgrade
                                // this socket connection to a TLS connection.
                                debug('Upgrading socket connection to TLS');
                                servername = opts.servername || opts.host;
                                return [2 /*return*/, tls.connect(__assign(__assign({}, omit(opts, 'host', 'path', 'port')), { socket: socket, servername: net.isIP(servername) ? undefined : servername }))];
                            }
                            return [2 /*return*/, socket];
                        }
                        // Some other status code that's not 200... need to re-play the HTTP
                        // header "data" events onto the socket once the HTTP machinery is
                        // attached so that the node core `http` can parse and handle the
                        // error status code.
                        // Close the original socket, and a new "fake" socket is returned
                        // instead, so that the proxy doesn't get the HTTP request
                        // written to it (which may contain `Authorization` headers or other
                        // sensitive data).
                        //
                        // See: https://hackerone.com/reports/541502
                        socket.destroy();
                        fakeSocket = new net.Socket({ writable: false });
                        fakeSocket.readable = true;
                        // Need to wait for the "socket" event to re-play the "data" events.
                        req.once('socket', function (s) {
                            debug('Replaying proxy buffer for failed request');
                            (0, assert_1.default)(s.listenerCount('data') > 0);
                            // Replay the "buffered" Buffer onto the fake `socket`, since at
                            // this point the HTTP module machinery has been hooked up for
                            // the user.
                            s.push(buffered);
                            s.push(null);
                        });
                        return [2 /*return*/, fakeSocket];
                }
            });
        });
    };
    HttpsProxyAgent.protocols = ['http', 'https'];
    return HttpsProxyAgent;
}(agent_base_1.Agent));
function resume(socket) {
    socket.resume();
}
function omit(obj) {
    var keys = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        keys[_i - 1] = arguments[_i];
    }
    var ret = {};
    var key;
    for (key in obj) {
        if (!keys.includes(key)) {
            ret[key] = obj[key];
        }
    }
    return ret;
}
