// services/silksongSave.ts
import CryptoJS from "crypto-js";

const CSHARP_HEADER = new Uint8Array([0, 1, 0, 0, 0, 255, 255, 255, 255, 1, 0, 0, 0, 0, 0, 0, 0, 6, 1, 0, 0, 0]);
const AES_KEY_STRING = "UKu52ePUBwetZ9wNX88o54dnfKRu0T1l";

function removeHeader(bytes: Uint8Array): Uint8Array {
    let withoutHeader = bytes.subarray(CSHARP_HEADER.length, bytes.length - 1);

    let lengthCount = 0;
    for (let i = 0; i < 5; i++) {
        lengthCount++;
        if ((withoutHeader[i] & 0x80) === 0) break;
    }
    return withoutHeader.subarray(lengthCount);
}

function addHeader(b64Bytes: Uint8Array): Uint8Array {
    const lenBytes: number[] = [];
    let length = Math.min(0x7FFFFFFF, b64Bytes.length);
    for (let i = 0; i < 4; i++) {
        if (length >> 7 !== 0) {
            lenBytes.push((length & 0x7F) | 0x80);
            length >>= 7;
        } else {
            lenBytes.push(length & 0x7F);
            break;
        }
    }

    const newBytes = new Uint8Array(CSHARP_HEADER.length + lenBytes.length + b64Bytes.length + 1);
    newBytes.set(CSHARP_HEADER);
    newBytes.set(lenBytes, CSHARP_HEADER.length);
    newBytes.set(b64Bytes, CSHARP_HEADER.length + lenBytes.length);
    newBytes[newBytes.length - 1] = 0x0B;
    return newBytes;
}

export function decodeSave(fileBytes: Uint8Array): string {
    const noHeader = removeHeader(fileBytes);

    // Convert the `noHeader` byte array into a Base64 string in chunks
    let b64String = "";
    const CHUNK_SIZE = 65536; // Process in chunks of 64 KB
    for (let i = 0; i < noHeader.length; i += CHUNK_SIZE) {
        b64String += String.fromCharCode(...noHeader.slice(i, i + CHUNK_SIZE));
    }

    // Base64 decode to encrypted bytes
    const encryptedWords = CryptoJS.enc.Base64.parse(b64String);

    // Wrap in CipherParams
    const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: encryptedWords,
    });

    // AES-ECB decrypt
    const key = CryptoJS.enc.Utf8.parse(AES_KEY_STRING);
    const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7,
    });

    // Return JSON as string
    return CryptoJS.enc.Utf8.stringify(decrypted);
}

export function encodeSave(jsonString: string): Uint8Array {
    const key = CryptoJS.enc.Utf8.parse(AES_KEY_STRING);
    const jsonWords = CryptoJS.enc.Utf8.parse(jsonString);

    // AES encrypt → Base64 string
    const encrypted = CryptoJS.AES.encrypt(jsonWords, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    });
    const b64String = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    // Convert Base64 string to byte codes
    const b64Bytes = new Uint8Array(b64String.length);
    for (let i = 0; i < b64String.length; i++) {
        b64Bytes[i] = b64String.charCodeAt(i);
    }

    // Wrap with headers
    return addHeader(b64Bytes);
}

export function downloadFile(data: Uint8Array | string, filename: string) {
    const blob = typeof data === "string"
        ? new Blob([data], { type: "application/json" })
        : new Blob([new Uint8Array(data)], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export function hashString(str: string): number {
    return str.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
}

// Search for a specific key anywhere in the nested object
function deepSearch(obj: any, targetKey: string): boolean {
    if (obj === null || typeof obj !== "object") return false;

    if (targetKey in obj) return true;

    for (const key in obj) {
        if (deepSearch(obj[key], targetKey)) return true;
    }

    return false;
}

// Detect game type based on key existence in flattened or nested JSON
export function detectGameType(jsonString: string): "Silksong" | "Classic" | "Unknown" | "Error" {
    try {
        const data = JSON.parse(jsonString);

        // Updated detection rules for nested keys
        if (deepSearch(data, "silkMax") || deepSearch(data, "gillyMet")) {
            return "Silksong";
        }
        if (deepSearch(data, "shadeScene") || deepSearch(data, "killedHollowKnight")) {
            return "Classic";
        }
    } catch {
        return "Error";
    }

    return "Unknown";
}