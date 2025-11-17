import "@testing-library/jest-dom";
import { webcrypto as cryptoWeb } from "crypto";
import "./jest.polyfills.js";

// Ensure Web Crypto is available (NextAuth relies on crypto.subtle)
type GlobalWithCrypto = typeof globalThis & { crypto?: Crypto };
const g = globalThis as GlobalWithCrypto;
if (!g.crypto || !("subtle" in g.crypto)) {
  g.crypto = cryptoWeb as Crypto;
}
