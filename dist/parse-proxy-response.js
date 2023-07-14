"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProxyResponse = void 0;
var debug_1 = require("debug");
var debug = (0, debug_1.default)('https-proxy-agent:parse-proxy-response');
function parseProxyResponse(socket) {
    return new Promise(function (resolve, reject) {
        // we need to buffer any HTTP traffic that happens with the proxy before we get
        // the CONNECT response, so that if the response is anything other than an "200"
        // response code, then we can re-play the "data" events on the socket once the
        // HTTP parser is hooked up...
        var buffersLength = 0;
        var buffers = [];
        function read() {
            var b = socket.read();
            if (b)
                ondata(b);
            else
                socket.once('readable', read);
        }
        function cleanup() {
            socket.removeListener('end', onend);
            socket.removeListener('error', onerror);
            socket.removeListener('readable', read);
        }
        function onend() {
            cleanup();
            debug('onend');
            reject(new Error('Proxy connection ended before receiving CONNECT response'));
        }
        function onerror(err) {
            cleanup();
            debug('onerror %o', err);
            reject(err);
        }
        function ondata(b) {
            buffers.push(b);
            buffersLength += b.length;
            var buffered = Buffer.concat(buffers, buffersLength);
            var endOfHeaders = buffered.indexOf('\r\n\r\n');
            if (endOfHeaders === -1) {
                // keep buffering
                debug('have not received end of HTTP headers yet...');
                read();
                return;
            }
            var headerParts = buffered.slice(0, endOfHeaders).toString('ascii').split('\r\n');
            var firstLine = headerParts.shift();
            if (!firstLine) {
                socket.destroy();
                return reject(new Error('No header received from proxy CONNECT response'));
            }
            var firstLineParts = firstLine.split(' ');
            var statusCode = +firstLineParts[1];
            var statusText = firstLineParts.slice(2).join(' ');
            var headers = {};
            for (var _i = 0, headerParts_1 = headerParts; _i < headerParts_1.length; _i++) {
                var header = headerParts_1[_i];
                if (!header)
                    continue;
                var firstColon = header.indexOf(':');
                if (firstColon === -1) {
                    socket.destroy();
                    return reject(new Error("Invalid header from proxy CONNECT response: \"".concat(header, "\"")));
                }
                var key = header.slice(0, firstColon).toLowerCase();
                var value = header.slice(firstColon + 1).trimStart();
                var current = headers[key];
                if (typeof current === 'string') {
                    headers[key] = [current, value];
                }
                else if (Array.isArray(current)) {
                    current.push(value);
                }
                else {
                    headers[key] = value;
                }
            }
            debug('got proxy server response: %o %o', firstLine, headers);
            cleanup();
            resolve({
                connect: {
                    statusCode: statusCode,
                    statusText: statusText,
                    headers: headers,
                },
                buffered: buffered,
            });
        }
        socket.on('error', onerror);
        socket.on('end', onend);
        read();
    });
}
exports.parseProxyResponse = parseProxyResponse;
