<img src="https://martinshift.github.io/silksaver/logo.png" alt="Silksaver logo" width="140" />

## Silksaver

Decrypt, edit, and re‑encrypt Hollow Knight: Silksong save files — right in your browser.

### Open the app

➡️ [Launch Silksaver](https://martinshift.github.io/silksaver)

### What you can do

- **Decrypt Silksong saves**: Load your `.dat` save file and view it as readable JSON.
- **Edit with confidence**: Make targeted changes using the built‑in JSON editor and quick search.
- **Re‑encrypt for the game**: Save your edits back to `.dat` format to continue playing.
- **Export backups**: Download a `.json` copy for safekeeping or versioning.
- **Built‑in history**: Silksaver remembers your last 10 edited saves locally so you can jump back quickly.

### Quick start (no install)
> [!WARNING]
> 
> Always make a backup of your save before editing.
1. Open the app.
2. Drag & drop your Silksong `save.dat` into the drop zone.
3. Click "Decrypt" to reveal JSON.
4. Optionally search and edit fields.
5. Click "Save Encrypted (.dat)" to continue your run, or "Save Plain (.json)" to keep a human‑readable backup.


### How it works (at a glance)

Silksaver decodes the Unity/C# serialized save payload, decrypts it, and renders it as JSON for editing. When you’re done, it re‑encrypts and re‑wraps the data back into the expected game format so the file can be used by Silksong again.

### Links

- **Live app**: https://martinshift.github.io/silksaver
- **Repository**: https://github.com/MartinShift/silksaver
- **Hollow Knight: Silksong on Steam**: https://store.steampowered.com/app/1030300/Hollow_Knight_Silksong/

