"use client";

import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  LogOut,
  UploadCloud,
  User,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCloseRoomWhenCreatorOffline } from "@/hooks/useCloseRoomWhenCreatorOffline";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSession } from "@/hooks/useSession";
import { downloadFileFromUrl } from "@/lib/downloadFileFromUrl";
import { formatBytes } from "@/lib/utils";

interface DropZoneViewProps {
  roomCode: string;
  isHost: boolean;
  /** Return user to create/join (Join the Fabric) after Convex `leaveRoom`. */
  onLeaveRoom: () => void;
  /** Fill the viewport (no landing scroll); inner content scrolls if needed. */
  fullPage?: boolean;
}

type UploadRow = {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "uploading" | "done";
};

export function DropZoneView({
  roomCode,
  isHost,
  onLeaveRoom,
  fullPage = false,
}: DropZoneViewProps) {
  const code = roomCode.trim().toUpperCase();
  const { sessionId } = useSession();
  const enterRoom = useMutation(api.rooms.enterRoom);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const inputRef = useRef<HTMLInputElement>(null);

  const room = useQuery(
    api.rooms.getRoomByCode,
    code.length >= 6 ? { code } : "skip",
  );

  useEffect(() => {
    if (!code || !sessionId) return;
    void enterRoom({ code, sessionId });
    return () => {
      void leaveRoom({ code, sessionId });
    };
  }, [code, sessionId, enterRoom, leaveRoom]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadRows, setUploadRows] = useState<UploadRow[]>([]);
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveInFlight = useRef(false);
  const [downloadingStorageId, setDownloadingStorageId] = useState<
    string | null
  >(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const { uploadFile, isUploading, error, clearError } = useFileUpload(code);

  useCloseRoomWhenCreatorOffline(
    code,
    sessionId,
    Boolean(isHost && sessionId && code.length >= 6),
  );

  const handleFiles = useCallback(
    async (list: FileList | File[]) => {
      const files = Array.from(list);
      if (files.length === 0) return;
      clearError();
      for (const file of files) {
        const id = `${Date.now()}-${file.name}-${Math.random()}`;
        setUploadRows((r) => [
          ...r,
          {
            id,
            name: file.name,
            size: file.size,
            progress: 0,
            status: "uploading",
          },
        ]);
        try {
          await uploadFile(file, {
            onProgress: (p) => {
              setUploadRows((r) =>
                r.map((row) =>
                  row.id === id ? { ...row, progress: p * 100 } : row,
                ),
              );
            },
          });
          setUploadRows((r) =>
            r.map((row) =>
              row.id === id
                ? { ...row, progress: 100, status: "done" }
                : row,
            ),
          );
          setTimeout(() => {
            setUploadRows((r) => r.filter((row) => row.id !== id));
          }, 800);
        } catch {
          setUploadRows((r) => r.filter((row) => row.id !== id));
        }
      }
    },
    [clearError, uploadFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleLeaveRoom = useCallback(async () => {
    if (!sessionId || leaveInFlight.current) return;
    leaveInFlight.current = true;
    setIsLeaving(true);
    try {
      await leaveRoom({ code, sessionId });
    } catch {
      /* still return to lobby so the user is not stuck */
    } finally {
      setIsLeaving(false);
      leaveInFlight.current = false;
      onLeaveRoom();
    }
  }, [code, sessionId, leaveRoom, onLeaveRoom]);

  const handleBackToLobby = useCallback(async () => {
    if (sessionId) {
      try {
        await leaveRoom({ code, sessionId });
      } catch {
        /* room may already be gone */
      }
    }
    onLeaveRoom();
  }, [code, sessionId, leaveRoom, onLeaveRoom]);

  const loadingRoom = room === undefined && code.length >= 6;
  const invalidRoom = room === null && code.length >= 6;
  const peopleCount = room?.peopleCount ?? 0;

  const serverFiles = room?.files ?? [];
  const pendingNames = new Set(uploadRows.map((r) => r.name));
  const serverFilesVisible = serverFiles.filter(
    (f) => !pendingNames.has(f.name),
  );
  const showLogs = serverFilesVisible.length > 0 || uploadRows.length > 0;

  const fullPageScroll =
    "flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-y-contain px-6 py-8 max-sm:px-4 max-sm:py-5 md:px-12";

  if (loadingRoom) {
    const inner = (
      <div className="flex min-h-[200px] w-full max-w-2xl flex-1 items-center justify-center">
        <p className="text-neutral-400">Loading room…</p>
      </div>
    );
    if (fullPage) {
      return <div className={fullPageScroll}>{inner}</div>;
    }
    return inner;
  }

  if (invalidRoom) {
    const inner = (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <p className="text-neutral-400">
          This room has ended or is unavailable. If the host went offline, the
          room was closed for everyone.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="rounded-full px-6"
          onClick={() => void handleBackToLobby()}
        >
          Back to create or join
        </Button>
      </div>
    );
    if (fullPage) {
      return (
        <div className={`${fullPageScroll} items-center justify-center`}>
          {inner}
        </div>
      );
    }
    return inner;
  }

  const roomBody = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: "spring", stiffness: 90, damping: 20 }}
      className="mx-auto w-full max-w-2xl space-y-6 max-sm:space-y-4"
    >
      <div className="flex flex-col gap-3 px-4 max-sm:px-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 text-left">
          <h2 className="font-serif text-xl tracking-wide text-white max-sm:text-lg">
            Room{" "}
            <span className="ml-2 font-mono text-[#4F8EF7] max-sm:ml-1 max-sm:text-base">
              {roomCode}
            </span>
          </h2>
          <span className="text-xs uppercase tracking-widest text-neutral-500">
            {isHost ? "HOST" : "GUEST"}
          </span>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="ghost"
            disabled={!sessionId || isLeaving}
            className="h-9 justify-center gap-2 rounded-lg border border-white/10 text-neutral-300 hover:border-white/20 hover:text-white"
            aria-label="Leave room and return to create or join"
            onClick={() => void handleLeaveRoom()}
          >
            {isLeaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden />
            )}
            Leave room
          </Button>
          <div className="flex items-center justify-center space-x-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1.5 shadow-lg backdrop-blur-md max-sm:px-2 max-sm:py-1 sm:justify-start sm:self-auto">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <User className="h-4 w-4 text-neutral-300" />
            <span className="text-sm font-medium text-neutral-300">
              {peopleCount} connected
            </span>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          const f = e.target.files;
          if (f?.length) void handleFiles(f);
          e.target.value = "";
        }}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all duration-300 max-sm:h-48 max-sm:rounded-2xl ${
          isDragging
            ? "scale-[1.02] border-[#4F8EF7] bg-[#4F8EF7]/5 shadow-[0_0_40px_rgba(79,142,247,0.2)]"
            : "border-white/20 bg-black/20"
        }`}
      >
        <UploadCloud
          className={`mb-4 h-12 w-12 transition-colors duration-300 max-sm:mb-3 max-sm:h-9 max-sm:w-9 ${
            isDragging ? "text-[#4F8EF7]" : "text-neutral-500"
          }`}
        />
        <p className="mb-1 text-center text-lg font-medium text-white max-sm:px-2 max-sm:text-base">
          {isDragging ? "Drop to transport" : "Drag files payload here"}
        </p>
        <p className="text-center text-sm text-neutral-500 max-sm:px-3 max-sm:text-xs">
          or click to browse local filesystem
        </p>
        {isUploading ? (
          <p className="mt-3 text-xs text-neutral-500">Uploading…</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        ) : null}
        {downloadError ? (
          <p className="mt-3 text-sm text-red-400">{downloadError}</p>
        ) : null}
      </div>

      {showLogs ? (
        <div className="space-y-3">
          <h3 className="pl-2 text-sm font-medium text-neutral-400">
            Transfer Session Logs
          </h3>
          <div className="space-y-2">
            {uploadRows.map((file) => (
              <Card
                key={file.id}
                className="flex items-center space-x-4 border-white/5 bg-black/40 p-4 max-sm:space-x-2 max-sm:p-3"
              >
                <div className="rounded-lg border border-white/5 bg-white/5 p-2">
                  <FileText className="h-5 w-5 text-neutral-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="max-w-[70%] truncate text-sm font-medium text-white max-sm:max-w-[55%] max-sm:text-xs">
                      {file.name}
                    </p>
                    <span className="text-xs text-neutral-500 max-sm:text-[10px]">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-black/60 max-sm:h-1">
                    <motion.div
                      className="h-full bg-[#4F8EF7] shadow-[0_0_10px_rgba(79,142,247,0.8)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${file.progress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                </div>
                {file.status === "done" ? (
                  <CheckCircle2 className="h-5 w-5 text-[#4F8EF7]" />
                ) : null}
              </Card>
            ))}
            {serverFilesVisible.map((f, i) => (
              <Card
                key={`${f.storageId}-${i}`}
                className="flex items-center space-x-4 border-white/5 bg-black/40 p-4 max-sm:space-x-2 max-sm:p-3"
              >
                <div className="rounded-lg border border-white/5 bg-white/5 p-2">
                  <FileText className="h-5 w-5 text-neutral-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="max-w-[70%] truncate text-sm font-medium text-white max-sm:max-w-[55%] max-sm:text-xs">
                      {f.name}
                    </p>
                    <span className="text-xs text-neutral-500 max-sm:text-[10px]">
                      {formatBytes(f.size)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-black/60 max-sm:h-1">
                    <motion.div
                      className="h-full bg-[#4F8EF7] shadow-[0_0_10px_rgba(79,142,247,0.8)]"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                </div>
                {f.url ? (
                  <div className="flex shrink-0 items-center">
                    <button
                      type="button"
                      title="Download to your device"
                      aria-label={`Download ${f.name}`}
                      aria-busy={downloadingStorageId === f.storageId}
                      disabled={downloadingStorageId === f.storageId}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition-colors hover:border-[#4F8EF7]/40 hover:text-[#4F8EF7] disabled:pointer-events-none disabled:opacity-50"
                      onClick={() => {
                        setDownloadError(null);
                        void (async () => {
                          setDownloadingStorageId(f.storageId);
                          try {
                            await downloadFileFromUrl(f.url!, f.name);
                          } catch {
                            setDownloadError(
                              "Could not download the file. Try again.",
                            );
                          } finally {
                            setDownloadingStorageId(null);
                          }
                        })();
                      }}
                    >
                      {downloadingStorageId === f.storageId ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Download className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </motion.div>
  );

  if (fullPage) {
    return <div className={fullPageScroll}>{roomBody}</div>;
  }
  return roomBody;
}
