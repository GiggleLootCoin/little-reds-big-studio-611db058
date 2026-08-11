const DB_NAME = "little-reds-big-studio-vault";
const STORE = "assets";
const VERSION = 1;

type VaultAsset = { id: string; name: string; type: string; createdAt: number; blob: Blob };

function openVault() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Studio Vault could not open."));
  });
}

export async function saveToStudioVault(url: string, name: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("The generated file could not be saved to Studio Vault.");
  const blob = await response.blob();
  const asset: VaultAsset = {
    id: crypto.randomUUID(),
    name,
    type: blob.type || "application/octet-stream",
    createdAt: Date.now(),
    blob,
  };
  const db = await openVault();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(asset);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Studio Vault save failed."));
  });
  db.close();
  return asset.id;
}

export async function listStudioVault() {
  const db = await openVault();
  const assets = await new Promise<VaultAsset[]>((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as VaultAsset[]);
    request.onerror = () => reject(request.error ?? new Error("Studio Vault could not be read."));
  });
  db.close();
  return assets.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteFromStudioVault(id: string) {
  const db = await openVault();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error("Studio Vault delete failed."));
  });
  db.close();
}
