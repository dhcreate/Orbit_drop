"use client";

import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useCloseRoomWhenCreatorOffline } from "@/hooks/useCloseRoomWhenCreatorOffline";
import { useSession } from "@/hooks/useSession";
import type { LobbyOverlay } from "@/lib/lobbyOverlay";

export interface RoomLobbyControls {
  openChoice: () => void;
  openCreate: (via: "card" | "choice") => void;
  openJoin: (via: "card" | "choice") => void;
  close: () => void;
  back: () => void;
}

interface RoomLogicViewProps {
  onJoinRoom: (code: string, isHost: boolean) => void;
  lobbyOverlay: LobbyOverlay;
  lobby: RoomLobbyControls;
}

export function RoomLogicView({
  onJoinRoom,
  lobbyOverlay,
  lobby,
}: RoomLogicViewProps) {
  const { sessionId } = useSession();

  const createRoom = useMutation(api.rooms.createRoom);
  const [isCreating, setIsCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useCloseRoomWhenCreatorOffline(
    createdCode,
    sessionId,
    Boolean(createdCode && sessionId),
    () => {
      setCreatedCode(null);
      setCreateError(null);
    },
  );

  const [joinCode, setJoinCode] = useState("");
  const [joinAttempt, setJoinAttempt] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const joinResult = useQuery(
    api.rooms.joinRoom,
    joinAttempt ? { code: joinAttempt } : "skip",
  );

  const joinHandled = useRef(false);

  useEffect(() => {
    if (!lobbyOverlay) {
      setCreatedCode(null);
      setCreateError(null);
      setJoinCode("");
      setJoinError(null);
      setJoinAttempt(null);
      setIsJoining(false);
      joinHandled.current = false;
      return;
    }
    if (lobbyOverlay.kind === "join") {
      setCreatedCode(null);
      setCreateError(null);
    }
    if (lobbyOverlay.kind === "create") {
      setJoinCode("");
      setJoinError(null);
      setJoinAttempt(null);
      setIsJoining(false);
      joinHandled.current = false;
    }
  }, [lobbyOverlay]);

  useEffect(() => {
    if (!lobbyOverlay) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lobbyOverlay]);

  const onEscapeClose = useCallback(() => {
    lobby.close();
  }, [lobby]);

  useEffect(() => {
    if (!lobbyOverlay) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscapeClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lobbyOverlay, onEscapeClose]);

  useEffect(() => {
    if (!joinAttempt) return;
    if (joinResult === undefined) return;
    if (joinResult === null) {
      setJoinError("Room not found or expired.");
      setIsJoining(false);
      setJoinAttempt(null);
      return;
    }
    if (joinHandled.current) return;
    joinHandled.current = true;
    const host =
      Boolean(sessionId) && joinResult.creatorId === sessionId;
    onJoinRoom(joinResult.code, host);
    setJoinAttempt(null);
    setIsJoining(false);
  }, [joinAttempt, joinResult, onJoinRoom, sessionId]);

  const handleCreate = async () => {
    if (!sessionId) return;
    setCreateError(null);
    setIsCreating(true);
    try {
      const code = await createRoom({ creatorSessionId: sessionId });
      setCreatedCode(code);
    } catch (e) {
      setCreateError(
        e instanceof Error ? e.message : "Could not create room.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    const normalized = joinCode.trim().toUpperCase();
    if (normalized.length !== 6) {
      setJoinError("Enter a 6-character code.");
      return;
    }
    joinHandled.current = false;
    setIsJoining(true);
    setJoinAttempt(normalized);
  };

  const renderCreate = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center space-y-6 pt-4"
    >
      {!createdCode ? (
        <Button
          onClick={() => void handleCreate()}
          disabled={isCreating || !sessionId}
          className="h-14 w-full text-lg"
        >
          {isCreating || !sessionId ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          Generate Room
        </Button>
      ) : (
        <div className="flex w-full flex-col items-center space-y-4">
          <label className="text-sm font-medium text-neutral-400">
            Your Room Code
          </label>
          <div className="flex w-full justify-center rounded-xl border border-[#4F8EF7]/30 bg-black/50 py-6 shadow-[0_0_30px_rgba(79,142,247,0.15)]">
            <span className="font-mono text-4xl tracking-[0.2em] text-[#4F8EF7] drop-shadow-[0_0_12px_rgba(79,142,247,0.8)]">
              {createdCode}
            </span>
          </div>
          <Button
            onClick={() => onJoinRoom(createdCode, true)}
            className="mt-4 h-14 w-full"
          >
            Enter Room
          </Button>
        </div>
      )}
      {createError ? (
        <p className="text-center text-sm text-red-400">{createError}</p>
      ) : null}
    </motion.div>
  );

  const renderJoin = () => (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={handleJoinSubmit}
      className="flex flex-col space-y-4 pt-4"
    >
      <div className="relative space-y-2">
        <label className="text-sm font-medium text-neutral-400">
          Enter 6-Digit Code
        </label>
        <Input
          type="text"
          value={joinCode}
          onChange={(e) => {
            setJoinCode(e.target.value.toUpperCase());
            setJoinError(null);
          }}
          maxLength={6}
          placeholder="XXXXXX"
          className="h-16 text-center font-mono text-2xl uppercase tracking-[0.2em]"
          disabled={isJoining}
        />
        {joinError ? (
          <span className="absolute -bottom-6 left-0 text-sm text-red-400">
            {joinError}
          </span>
        ) : null}
      </div>
      <Button
        type="submit"
        disabled={joinCode.length !== 6 || isJoining || !sessionId}
        className="mt-6 h-14 w-full"
      >
        {isJoining || !sessionId ? (
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        ) : null}
        Connect to Room
      </Button>
    </motion.form>
  );

  const showSubBack =
    lobbyOverlay?.kind === "create" || lobbyOverlay?.kind === "join"
      ? lobbyOverlay.via === "choice"
      : false;

  const renderOverlayInner = () => {
    if (!lobbyOverlay) return null;
    if (lobbyOverlay.kind === "choice") {
      return (
        <>
          <div className="space-y-2 text-center">
            <h2 className="font-serif text-2xl text-white">Join the Fabric</h2>
            <p className="text-sm text-neutral-400">
              Create a secure drop or enter a code.
            </p>
          </div>
          <div className="flex space-x-1 rounded-xl border border-white/5 bg-black/40 p-1">
            <button
              type="button"
              className="relative z-10 flex-1 rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 transition-colors duration-300 hover:text-neutral-300"
              onClick={() => lobby.openCreate("choice")}
            >
              Create
            </button>
            <button
              type="button"
              className="relative z-10 flex-1 rounded-lg px-4 py-2 text-sm font-medium text-neutral-500 transition-colors duration-300 hover:text-neutral-300"
              onClick={() => lobby.openJoin("choice")}
            >
              Join
            </button>
          </div>
        </>
      );
    }
    if (lobbyOverlay.kind === "create") {
      return (
        <>
          {showSubBack ? (
            <div className="flex items-start gap-2">
              <button
                type="button"
                aria-label="Back"
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
                onClick={() => lobby.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1 space-y-2 pr-6 text-center">
                <h2 className="font-serif text-2xl text-white">
                  Join the Fabric
                </h2>
                <p className="text-sm text-neutral-400">
                  Create a secure drop or enter a code.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <h2 className="font-serif text-2xl text-white">Join the Fabric</h2>
              <p className="text-sm text-neutral-400">
                Create a secure drop or enter a code.
              </p>
            </div>
          )}
          <div className="min-h-[160px]">
            <AnimatePresence mode="wait">
              <motion.div key="create-modal">{renderCreate()}</motion.div>
            </AnimatePresence>
          </div>
        </>
      );
    }
    if (lobbyOverlay.kind === "join") {
      return (
        <>
          {showSubBack ? (
            <div className="flex items-start gap-2">
              <button
                type="button"
                aria-label="Back"
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
                onClick={() => lobby.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1 space-y-2 pr-6 text-center">
                <h2 className="font-serif text-2xl text-white">
                  Join the Fabric
                </h2>
                <p className="text-sm text-neutral-400">
                  Create a secure drop or enter a code.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-center">
              <h2 className="font-serif text-2xl text-white">Join the Fabric</h2>
              <p className="text-sm text-neutral-400">
                Create a secure drop or enter a code.
              </p>
            </div>
          )}
          <div className="min-h-[160px]">
            <AnimatePresence mode="wait">
              <motion.div key="join-modal">{renderJoin()}</motion.div>
            </AnimatePresence>
          </div>
        </>
      );
    }
    return null;
  };

  return (
    <>
      <AnimatePresence>
        {lobbyOverlay ? (
          <motion.div
            role="presentation"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => lobby.close()}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="relative w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
                onClick={() => lobby.close()}
              >
                <X className="h-4 w-4" />
              </button>
              <Card className="flex flex-col space-y-8 p-8 pb-10 pr-12 pt-12">
                {renderOverlayInner()}
              </Card>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
