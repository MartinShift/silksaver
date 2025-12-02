import { useState, useEffect } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { decodeSave, encodeSave, downloadFile, hashString, detectGameType } from "./services/silksongSave";
import { incrementVisits, incrementEdits, getStats } from "./services/firebase";
interface HistoryItem {
  name: string;
  json: string;
  hash: number;
  date: string;
}

export default function App() {
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState<Uint8Array | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [search, setSearch] = useState("");
  const [decrypted, setDecrypted] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [stats, setStats] = useState<{ visits: number; edits: number } | null>(null);
  // Load history on mount
  useEffect(() => {
    const stored = localStorage.getItem("silksong-history");
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const saveHistory = (item: HistoryItem) => {
    // Only exclude identical saves with the same hash
    const updated = [item, ...history.filter(h => h.hash !== item.hash)];
    const trimmedHistory = updated.slice(0, 10); // Limit to last 10
    setHistory(trimmedHistory);
    localStorage.setItem("silksong-history", JSON.stringify(trimmedHistory));
  };

  const handleFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      if (e.target?.result) {
        setFileData(new Uint8Array(e.target.result as ArrayBuffer));
        setDecrypted(false);
        setJsonText("");
      }
    };
    reader.readAsArrayBuffer(file);
  };

    const handleCopyPath = () => {
    const savePath = "%userprofile%\\appdata\\LocalLow\\Team Cherry\\Hollow Knight Silksong";
    navigator.clipboard.writeText(savePath); // Copy path to clipboard

    // Show the toast and hide it after 3 seconds
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  };
  const onDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();

  useEffect(() => {
  incrementVisits();
  
  // Load stats
  getStats().then(setStats);
}, []);

  const decryptFile = () => {
    if (!fileData) return;
    try {
      const json = decodeSave(fileData);
      const pretty = JSON.stringify(JSON.parse(json), null, 2);
      const gameType = detectGameType(pretty); // Silksong vs Classic

      // Create new history entry
      saveHistory({
        name: `${fileName} - ${gameType}`,
        json: pretty,
        hash: hashString(pretty), // Unique hash ensures backups with same name are tracked
        date: new Date().toISOString() // Timestamp for sorting
      });
      setJsonText(pretty);
      setDecrypted(true);
    } catch (e) {
      alert("Failed to decode file");
      console.error(e);
    }
  };

  const saveEncrypted = () => {
    const encoded = encodeSave(jsonText);
    incrementEdits();
    getStats().then(setStats);
    downloadFile(encoded, fileName || "save.dat");
  };

  const savePlain = () =>
    downloadFile(jsonText, fileName.replace(/\.[^/.]+$/, "") + ".json");

  const filteredJson = search
    ? jsonText
      .split("\n")
      .filter(line => line.toLowerCase().includes(search.toLowerCase()))
      .join("\n")
    : jsonText;

  return (
    <div className="min-h-screen flex justify-center items-start bg-[#0d1b2a] p-4">
      <div className="w-full max-w-2xl bg-[#1b263b] rounded-lg shadow-lg p-5 mt-12 space-y-5">
        <h1 className="text-2xl font-bold text-white text-center">
          Silksong Save Editor
        </h1>
        <h4 className="text-1xl font-bold text-white text-center">
          works for regular hollow knight as well
        </h4>
         <div className="text-center text-sm">
      <p className="font-bold text-white">
        Save files are located at&nbsp;
        <span
          className="text-green-500 hover:underline cursor-pointer"
          onClick={handleCopyPath}
        >
          %userprofile%\appdata\LocalLow\Team Cherry\Hollow Knight Silksong
        </span>
      </p>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
          Path copied to clipboard!
        </div>
      )}
    </div>

        {/* File Upload Box */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => document.getElementById("fileInput")?.click()}
          className="border-2 border-dashed border-blue-400 rounded-lg p-5 text-center cursor-pointer hover:bg-[#24344d] text-white"
        >
          {fileName ? (
            <p>📄 {fileName} selected</p>
          ) : (
            <p>Drag & drop file here, or click to browse</p>
          )}
          <input
            id="fileInput"
            type="file"
            className="hidden"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              if (e.target.files?.length) handleFile(e.target.files[0]);
            }}
          />
        </div>

        {/* Decrypt Button */}
        <button
          onClick={decryptFile}
          disabled={!fileData}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded w-full transition-colors"
        >
          Decrypt
        </button>

        {/* Search */}
        {decrypted && (
          <input
            type="text"
            placeholder="Search JSON..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2 rounded bg-[#24344d] text-white border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )}

        {/* JSON Editor */}
        {decrypted && (
          <textarea
            className="w-full h-96 p-3 rounded bg-[#0d1b2a] text-white font-mono overflow-auto resize-none"
            value={filteredJson}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
        )}

        {/* Save Buttons */}
        {decrypted && (
          <div className="flex flex-col md:flex-row gap-2">
            <button
              onClick={saveEncrypted}
              className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded flex-1"
            >
              💾 Save Encrypted (.dat)
            </button>
            <button
              onClick={savePlain}
              className="bg-yellow-500 hover:bg-yellow-400 text-white font-semibold py-2 px-4 rounded flex-1"
            >
              📄 Save Plain (.json)
            </button>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-white mb-2">History</h2>
            <div className="space-y-2">
              {history.map(item => (
                <div
                  key={item.hash}
                  className="border border-blue-400 rounded p-2 cursor-pointer hover:bg-[#24344d]"
                  onClick={() => {
                    setJsonText(item.json);
                    setFileName(item.name);
                    setDecrypted(true);
                  }}
                >
                  <div className="text-blue-300 font-semibold hover:underline">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(item.date).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}