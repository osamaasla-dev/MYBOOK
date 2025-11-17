/* eslint-disable @typescript-eslint/no-require-imports */
// Polyfills that must run before any test files are loaded
// Keep this file in plain JS because Jest's setupFiles are not transformed by ts-jest

const { TextEncoder, TextDecoder } = require("util");

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

// Ensure Web Streams are available before loading undici
(() => {
  try {
    // Prefer Node 18+ native streams
    const {
      ReadableStream,
      WritableStream,
      TransformStream,
    } = require("stream/web");
    if (typeof global.ReadableStream === "undefined" && ReadableStream) {
      global.ReadableStream = ReadableStream;
    }
    if (typeof global.WritableStream === "undefined" && WritableStream) {
      global.WritableStream = WritableStream;
    }
    if (typeof global.TransformStream === "undefined" && TransformStream) {
      global.TransformStream = TransformStream;
    }
  } catch {
    try {
      // Fallback polyfill for Node < 18
      const streams = require("web-streams-polyfill/ponyfill");
      if (
        typeof global.ReadableStream === "undefined" &&
        streams.ReadableStream
      ) {
        global.ReadableStream = streams.ReadableStream;
      }
      if (
        typeof global.WritableStream === "undefined" &&
        streams.WritableStream
      ) {
        global.WritableStream = streams.WritableStream;
      }
      if (
        typeof global.TransformStream === "undefined" &&
        streams.TransformStream
      ) {
        global.TransformStream = streams.TransformStream;
      }
    } catch {
      // noop
    }
  }
})();

// Ensure MessageChannel/MessagePort exist for environments where they are not global (Node/Jest)
(() => {
  try {
    const { MessageChannel, MessagePort } = require("worker_threads");
    if (typeof global.MessageChannel === "undefined" && MessageChannel) {
      global.MessageChannel = MessageChannel;
    }
    if (typeof global.MessagePort === "undefined" && MessagePort) {
      global.MessagePort = MessagePort;
    }
  } catch {
    // worker_threads not available; ignore
  }
})();

// Ensure fetch APIs exist (Next/undici compatibility) - set unconditionally
const undici = require("undici");
global.fetch = undici.fetch;
global.Headers = undici.Headers;
global.Request = undici.Request;
global.Response = undici.Response;
if (undici.FormData) global.FormData = undici.FormData;
if (undici.File) global.File = undici.File;
if (undici.Blob) global.Blob = undici.Blob;

// URLPattern polyfill (used by Next in some environments)
if (typeof global.URLPattern === "undefined") {
  try {
    require("urlpattern-polyfill");
  } catch {
    // noop
  }
}
