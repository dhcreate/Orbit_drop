"use client";

import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { useCloseRoomWhenCreatorOffline } from "@/hooks/useCloseRoomWhenCreatorOffline";
import { useSession } from "@/hooks/useSession";

interface RoomLogicViewProps {
  onJoinRoom: (code: string, isHost: boolean) => void;
}

export function RoomLogicView({ onJoinRoom }: RoomLogicViewProps) {
  const { sessionId } = useSession();
  const [activeTab, setActiveTab] = useState("create");

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="mx-auto w-full max-w-md"
    >
      <Card className="flex flex-col space-y-8 p-8 pb-10">
        <div className="space-y-2 text-center">
          <h2 className="font-serif text-2xl text-white">Join the Fabric</h2>
          <p className="text-sm text-neutral-400">
            Create a secure drop or enter a code.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: "create", label: "Create" },
            { id: "join", label: "Join" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="min-h-[160px]">
          <AnimatePresence mode="wait">
            {activeTab === "create" ? (
              <motion.div key="create">{renderCreate()}</motion.div>
            ) : (
              <motion.div key="join">{renderJoin()}</motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
