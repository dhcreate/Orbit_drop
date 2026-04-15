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
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { api } from "convex/_generated/api";
import { UserAvatar, getUserColorForName } from "@/components/UserAvatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useCloseRoomWhenCreatorOffline } from "@/hooks/useCloseRoomWhenCreatorOffline";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useSession } from "@/hooks/useSession";
import { formatBytes } from "@/lib/utils";

interface DropZoneViewProps {
  roomCode: string;
  isHost: boolean;
  currentUsername: string;
  currentDeviceId: string;
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

type RoomFile = {
  storageId: string;
  name: string;
  size: number;
  type?: string;
  uploadedAt?: number;
  url?: string;
  uploaderName?: string;
  uploaderDeviceId?: string;
};

export function DropZoneView({
  roomCode,
  isHost,
  currentUsername,
  currentDeviceId,
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

  const members = useQuery(
    api.rooms.getRoomMembers,
    code.length >= 6 ? { code } : "skip",
  );

  const { uploadFile, isUploading, error, clearError } = useFileUpload(
    code,
    currentUsername,
    currentDeviceId,
  );

  useEffect(() => {
    const sid = sessionId.trim();
    const did = currentDeviceId.trim();
    if (!code || !sid || !did || !currentUsername.trim()) {
      return;
    }
    void enterRoom({
      code,
      sessionId: sid,
      username: currentUsername.trim(),
      deviceId: did,
    });
    return () => {
      void leaveRoom({ code, sessionId: sid });
    };
  }, [
    code,
    sessionId,
    currentUsername,
    currentDeviceId,
    enterRoom,
    leaveRoom,
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadRows, setUploadRows] = useState<UploadRow[]>([]);
  const [isLeaving, setIsLeaving] = useState(false);
  const leaveInFlight = useRef(false);
  const [maxAvatars, setMaxAvatars] = useState(4);

  useLayoutEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      if (w < 640) setMaxAvatars(2);
      else if (w < 1024) setMaxAvatars(3);
      else setMaxAvatars(4);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

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

  const serverFiles = (room?.files ?? []) as RoomFile[];
  const pendingNames = new Set(uploadRows.map((r) => r.name));
  const serverFilesVisible = serverFiles.filter(
    (f) => !pendingNames.has(f.name),
  );

  const myFiles = serverFilesVisible.filter(
    (f) => f.uploaderDeviceId === currentDeviceId,
  );
  const otherFiles = serverFilesVisible.filter(
    (f) => f.uploaderDeviceId !== currentDeviceId,
  );

  const filesBySender = otherFiles.reduce<Record<string, RoomFile[]>>(
    (acc, file) => {
      const sender = file.uploaderName?.trim() || "Unknown";
      if (!acc[sender]) acc[sender] = [];
      acc[sender].push(file);
      return acc;
    },
    {},
  );

  const senderNames = Object.keys(filesBySender);

  const myCount = uploadRows.length + myFiles.length;
  const hasAnyFile =
    uploadRows.length > 0 ||
    myFiles.length > 0 ||
    otherFiles.length > 0;

  const myColor = getUserColorForName(currentUsername);

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

  const memberList = members ?? [];

  const roomBody = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: "spring", stiffness: 90, damping: 20 }}
      className="mx-auto w-full max-w-[95vw] space-y-3 px-0 sm:max-w-xl sm:space-y-4 md:max-w-2xl md:space-y-5"
    >
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-2 md:px-4">
        <div className="min-w-0 text-left">
          <h2 className="font-serif text-base tracking-wide text-white sm:text-lg md:text-xl">
            Room{" "}
            <span className="ml-1 font-mono text-base text-[#4F8EF7] sm:ml-2 sm:text-lg md:text-xl">
              {roomCode}
            </span>
          </h2>
          <span className="text-[10px] uppercase tracking-wider text-neutral-500 sm:text-xs sm:tracking-widest">
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
          <div className="flex items-center space-x-1.5 self-start rounded-full border border-white/10 bg-white/5 px-2 py-1 shadow-lg backdrop-blur-md sm:space-x-2 sm:self-auto sm:px-3 sm:py-1.5">
            <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] sm:h-2 sm:w-2" />
            <div className="flex items-center -space-x-1 sm:-space-x-1.5">
              {memberList.slice(0, maxAvatars).map((m) => (
                <div
                  key={m.deviceId}
                  className="rounded-full ring-1 ring-[#0a0a0a]"
                >
                  <UserAvatar username={m.username} size="xs" />
                </div>
              ))}
            </div>
            <span className="text-[11px] font-medium text-neutral-300 sm:text-sm">
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
        className={`flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 sm:h-48 sm:rounded-2xl md:h-64 md:rounded-3xl ${
          isDragging
            ? "scale-[1.02] border-[#4F8EF7] bg-[#4F8EF7]/5 shadow-[0_0_40px_rgba(79,142,247,0.2)]"
            : "border-white/20 bg-black/20"
        }`}
      >
        <UploadCloud
          className={`mb-2 h-7 w-7 transition-colors duration-300 sm:mb-3 sm:h-10 sm:w-10 md:mb-4 md:h-12 md:w-12 ${
            isDragging ? "text-[#4F8EF7]" : "text-neutral-500"
          }`}
        />
        <p className="mb-0.5 text-center text-sm font-medium text-white max-sm:px-2 sm:mb-1 sm:text-base md:text-lg">
          {isDragging ? "Drop to transport" : "Drag files payload here"}
        </p>
        <p className="text-center text-[11px] text-neutral-500 max-sm:px-3 sm:text-xs md:text-sm">
          or click to browse local filesystem
        </p>
        {isUploading ? (
          <p className="mt-3 text-xs text-neutral-500">Uploading…</p>
        ) : null}
        {error ? (
          <p className="mt-3 text-sm text-red-400">{error}</p>
        ) : null}
      </div>

      {hasAnyFile ? (
        <div className="space-y-3 sm:space-y-4 md:space-y-5">
          {/* My files */}
          <div>
            <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
              <UserAvatar username={currentUsername} size="sm" />
              <span
                className="text-[9px] font-medium uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.12em] md:text-[11px] md:tracking-[0.15em]"
                style={{ color: `${myColor}B3` }}
              >
                {currentUsername}
              </span>
              <span className="text-[10px] normal-case tracking-normal text-neutral-600">
                (you)
              </span>
              <span
                className="ml-auto rounded-full px-1.5 py-0.5 font-mono text-[9px] sm:px-2 sm:text-[10px]"
                style={{
                  background: `${myColor}26`,
                  color: `${myColor}99`,
                  border: `1px solid ${myColor}4D`,
                }}
              >
                {myCount}
              </span>
            </div>
            <div
              className="space-y-1.5 rounded-xl p-2 sm:space-y-2 sm:rounded-2xl sm:p-3 md:p-4"
              style={{
                border: `1px solid ${myColor}2E`,
                background: `${myColor}0A`,
              }}
            >
              {myCount === 0 ? (
                <div
                  className="flex items-center justify-center rounded-xl border border-dashed py-4 sm:py-5 md:py-7"
                  style={{ borderColor: `${myColor}33` }}
                >
                  <p
                    className="text-center text-[10px] sm:text-xs"
                    style={{ color: `${myColor}66` }}
                  >
                    Files you drop will appear here
                  </p>
                </div>
              ) : (
                <>
                  {uploadRows.map((file, i) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className="flex items-center space-x-2 border-white/5 bg-black/40 p-2 sm:space-x-2 sm:p-3 md:space-x-3 md:p-4"
                        style={{
                          borderLeft: `2px solid ${myColor}80`,
                        }}
                      >
                        <div
                          className="flex-shrink-0 rounded-md p-1.5 sm:rounded-lg sm:p-2"
                          style={{
                            background: `${myColor}26`,
                            border: `1px solid ${myColor}40`,
                          }}
                        >
                          <FileText
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5"
                            style={{ color: `${myColor}B3` }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center justify-between">
                            <p className="max-w-[45%] truncate text-[11px] font-medium text-white sm:max-w-[55%] sm:text-xs md:max-w-[70%] md:text-sm">
                              {file.name}
                            </p>
                            <span className="text-[9px] text-neutral-500 sm:text-[10px] md:text-xs">
                              {formatBytes(file.size)}
                            </span>
                          </div>
                          {file.status === "uploading" ? (
                            <div className="h-[3px] w-full overflow-hidden rounded-full border border-white/5 bg-black/60 sm:h-1 md:h-1.5">
                              <motion.div
                                className="h-full"
                                style={{
                                  background: myColor,
                                  boxShadow: `0 0 10px ${myColor}CC`,
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${file.progress}%` }}
                                transition={{ ease: "easeOut" }}
                              />
                            </div>
                          ) : null}
                        </div>
                        {file.status === "done" ? (
                          <CheckCircle2
                            className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5"
                            style={{ color: myColor }}
                          />
                        ) : null}
                      </Card>
                    </motion.div>
                  ))}
                  {myFiles.map((f, i) => (
                    <motion.div
                      key={f.storageId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: (uploadRows.length + i) * 0.05,
                      }}
                    >
                      <Card
                        className="flex items-center space-x-2 border-white/5 bg-black/40 p-2 sm:space-x-2 sm:p-3 md:space-x-3 md:p-4"
                        style={{
                          borderLeft: `2px solid ${myColor}80`,
                        }}
                      >
                        <div
                          className="flex-shrink-0 rounded-md p-1.5 sm:rounded-lg sm:p-2"
                          style={{
                            background: `${myColor}26`,
                            border: `1px solid ${myColor}40`,
                          }}
                        >
                          <FileText
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5"
                            style={{ color: `${myColor}B3` }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="max-w-[45%] truncate text-[11px] font-medium text-white sm:max-w-[55%] sm:text-xs md:max-w-[70%] md:text-sm">
                              {f.name}
                            </p>
                            <span className="text-[9px] text-neutral-500 sm:text-[10px] md:text-xs">
                              {formatBytes(f.size)}
                            </span>
                          </div>
                        </div>
                        <CheckCircle2
                          className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5"
                          style={{ color: myColor }}
                        />
                      </Card>
                    </motion.div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Other senders */}
          {senderNames.map((senderName) => {
            const senderFiles = filesBySender[senderName]!;
            const senderColor = getUserColorForName(senderName);

            return (
              <div key={senderName}>
                <div className="mb-2 flex items-center gap-1.5 sm:mb-3 sm:gap-2">
                  <UserAvatar username={senderName} size="sm" />
                  <span
                    className="text-[9px] font-medium uppercase tracking-[0.08em] sm:text-[10px] sm:tracking-[0.12em] md:text-[11px] md:tracking-[0.15em]"
                    style={{ color: `${senderColor}B3` }}
                  >
                    {senderName}
                  </span>
                  <span
                    className="ml-auto rounded-full px-1.5 py-0.5 font-mono text-[9px] sm:px-2 sm:text-[10px]"
                    style={{
                      background: `${senderColor}26`,
                      color: `${senderColor}99`,
                      border: `1px solid ${senderColor}4D`,
                    }}
                  >
                    {senderFiles.length}
                  </span>
                </div>

                <div
                  className="space-y-1.5 rounded-xl p-2 sm:space-y-2 sm:rounded-2xl sm:p-3 md:p-4"
                  style={{
                    border: `1px solid ${senderColor}2E`,
                    background: `${senderColor}0A`,
                  }}
                >
                  {senderFiles.map((file, i) => (
                    <motion.div
                      key={file.storageId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className="flex items-center space-x-2 border-white/5 bg-black/40 p-2 sm:space-x-2 sm:p-3 md:space-x-3 md:p-4"
                        style={{
                          borderLeft: `2px solid ${senderColor}80`,
                        }}
                      >
                        <div
                          className="flex-shrink-0 rounded-md p-1.5 sm:rounded-lg sm:p-2"
                          style={{
                            background: `${senderColor}26`,
                            border: `1px solid ${senderColor}40`,
                          }}
                        >
                          <FileText
                            className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5"
                            style={{ color: `${senderColor}B3` }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="max-w-[45%] truncate text-[11px] font-medium text-white sm:max-w-[55%] sm:text-xs md:max-w-[70%] md:text-sm">
                              {file.name}
                            </p>
                            <span className="text-[9px] text-neutral-500 sm:text-[10px] md:text-xs">
                              {formatBytes(file.size)}
                            </span>
                          </div>
                          <p className="mt-0.5 hidden text-[9px] text-neutral-600 sm:block sm:text-[10px]">
                            {file.uploadedAt
                              ? new Date(file.uploadedAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )
                              : ""}
                          </p>
                        </div>
                        {file.url ? (
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-medium transition-all duration-200 sm:rounded-lg sm:px-2 sm:py-1 sm:text-[10px] md:px-3 md:py-1.5 md:text-xs"
                            style={{
                              background: `${senderColor}26`,
                              color: `${senderColor}CC`,
                              border: `1px solid ${senderColor}40`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = `${senderColor}40`;
                              e.currentTarget.style.color = senderColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = `${senderColor}26`;
                              e.currentTarget.style.color = `${senderColor}CC`;
                            }}
                          >
                            <Download className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            <span className="hidden sm:inline">Save</span>
                          </a>
                        ) : (
                          <CheckCircle2
                            className="h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4 md:h-5 md:w-5"
                            style={{ color: senderColor }}
                          />
                        )}
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {senderNames.length === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-white/10 py-4 sm:py-5 md:py-7">
              <p className="text-center text-[10px] text-neutral-600 sm:text-xs">
                Waiting for others to drop files...
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-neutral-600">
          Drop a file to get started
        </p>
      )}
    </motion.div>
  );

  if (fullPage) {
    return <div className={fullPageScroll}>{roomBody}</div>;
  }
  return roomBody;
}
