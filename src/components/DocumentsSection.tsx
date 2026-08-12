"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, Trash2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

type Doc = { id: string; type: string; fileName: string; fileUrl: string; uploadedAt: string | Date };

export function DocumentsSection({
  customerId,
  documents,
  blobConfigured,
}: {
  customerId: string;
  documents: Doc[];
  blobConfigured: boolean;
}) {
  const router = useRouter();
  const [type, setType] = useState<(typeof DOCUMENT_TYPES)[number]>("PASSPORT");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const res = await fetch(`/api/customers/${customerId}/documents`, { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed");
      return;
    }
    setFile(null);
    router.refresh();
  }

  async function handleDelete(documentId: string) {
    await fetch(`/api/customers/${customerId}/documents/${documentId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-stone-900">
        <FileText size={15} className="text-teal-600" />
        Documents
      </h2>

      {!blobConfigured && (
        <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          File storage isn&apos;t configured yet — set BLOB_READ_WRITE_TOKEN to enable uploads.
        </p>
      )}

      {blobConfigured && (
        <form onSubmit={handleUpload} className="mb-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as (typeof DOCUMENT_TYPES)[number])}
              className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-stone-600">File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs file:mr-2 file:rounded-md file:border-0 file:bg-stone-100 file:px-2 file:py-1 file:text-xs"
            />
          </div>
          <Button type="submit" size="sm" disabled={uploading || !file}>
            <Upload size={13} />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </form>
      )}

      {error && <p className="mb-2 text-xs text-rose-600">{error}</p>}

      <ul className="space-y-1.5">
        {documents.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 text-sm">
            <div className="min-w-0">
              <p className="truncate font-medium text-stone-900">{d.fileName}</p>
              <p className="text-xs text-stone-400">
                {d.type.replace("_", " ")} · {format(new Date(d.uploadedAt), "MMM d, yyyy")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={d.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-teal-700"
                title="Open"
              >
                <ExternalLink size={14} />
              </a>
              <button
                onClick={() => handleDelete(d.id)}
                className="rounded-md p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
        {documents.length === 0 && <li className="text-xs text-stone-400">No documents uploaded yet.</li>}
      </ul>
    </div>
  );
}
