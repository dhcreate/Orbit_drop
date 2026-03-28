"use client";

import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

function uploadWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (ratio: number) => void,
): Promise<{ storageId: Id<"_storage"> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.responseType = "json";
    const mime = file.type || "application/octet-stream";
    xhr.setRequestHeader("Content-Type", mime);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        onProgress(evt.loaded / evt.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const body = xhr.response as { storageId?: string };
        if (body?.storageId) {
          resolve({ storageId: body.storageId as Id<"_storage"> });
          return;
        }
      }
      reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export function useFileUpload(roomCode: string) {
  const generateUploadUrl = useMutation(api.rooms.generateUploadUrl);
  const addFileToRoom = useMutation(api.rooms.addFileToRoom);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      opts?: { onProgress?: (ratio: number) => void },
    ) => {
      setError(null);
      setIsUploading(true);
      setProgress(0);
      const report = (r: number) => {
        setProgress(r);
        opts?.onProgress?.(r);
      };
      try {
        const postUrl = await generateUploadUrl();
        const { storageId } = await uploadWithProgress(
          postUrl,
          file,
          report,
        );
        await addFileToRoom({
          code: roomCode,
          storageId,
          name: file.name,
          size: file.size,
          type: file.type || undefined,
          uploadedAt: Date.now(),
        });
        setProgress(1);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Upload failed";
        setError(message);
        throw e;
      } finally {
        setIsUploading(false);
      }
    },
    [addFileToRoom, generateUploadUrl, roomCode],
  );

  return { uploadFile, progress, isUploading, error, clearError: () => setError(null) };
}
