"use client";

import { useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Loader, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface RoomUsernameGateProps {
  roomCode: string;
  deviceId: string;
  mode: "create" | "join";
  onConfirm: (username: string) => void;
}

export function RoomUsernameGate({
  roomCode,
  deviceId,
  mode,
  onConfirm,
}: RoomUsernameGateProps) {
  const [value, setValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (value.trim().length < 2) {
      setDebouncedValue("");
      setIsChecking(false);
      return;
    }
    setIsChecking(true);
    const timer = setTimeout(() => {
      setDebouncedValue(value.trim());
      setIsChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [value]);

  const isAvailable = useQuery(
    api.rooms.isUsernameAvailableInRoom,
    debouncedValue.length >= 2 && roomCode && deviceId
      ? {
          code: roomCode,
          username: debouncedValue,
          deviceId,
        }
      : "skip",
  );

  const charCount = value.trim().length;
  const showAvailable = debouncedValue.length >= 2 && isAvailable === true;
  const showTaken = debouncedValue.length >= 2 && isAvailable === false;
  const showChecking = isChecking && value.trim().length >= 2;

  const validate = (name: string): string | null => {
    const cleaned = name.trim();
    if (cleaned.length < 2) return "Must be at least 2 characters";
    if (cleaned.length > 20) return "Must be 20 characters or less";
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(cleaned)) {
      return "Only letters, numbers, spaces, _ - . allowed";
    }
    return null;
  };

  const handleConfirm = () => {
    const err = validate(value);
    if (err) {
      setError(err);
      return;
    }
    if (showTaken) {
      setError("This name is taken in this room");
      return;
    }
    if (!isAvailable) return;
    setError(null);
    onConfirm(value.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="mx-auto w-full max-w-[95vw] sm:max-w-[420px]"
    >
      <Card className="flex flex-col items-center gap-5 p-6 sm:gap-6 sm:p-8 md:p-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.15,
          }}
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#4F8EF7]/20 bg-[#4F8EF7]/10 sm:h-14 sm:w-14 sm:rounded-2xl"
        >
          <User className="h-5 w-5 text-[#4F8EF7] sm:h-6 sm:w-6" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 text-center"
        >
          <h2 className="font-serif text-xl text-white sm:text-2xl md:text-3xl">
            {mode === "create" ? "Name your presence" : "Who are you?"}
          </h2>
          <p className="mx-auto max-w-[260px] text-xs leading-relaxed text-neutral-400 sm:max-w-[300px] sm:text-sm">
            {mode === "create"
              ? "Pick a name for this room. Others will see it next to your files."
              : "Enter a name to join. Must be unique in this room."}
          </p>

          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <span className="text-[10px] text-neutral-500 sm:text-xs">Room</span>
            <span className="font-mono text-[11px] font-medium tracking-widest text-[#4F8EF7] sm:text-xs">
              {roomCode}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="w-full space-y-2"
        >
          <div
            className={`relative transition-all duration-300 ${
              isFocused ? "drop-shadow-[0_0_12px_rgba(79,142,247,0.12)]" : ""
            }`}
          >
            <Input
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="e.g. Abhi, sara99, john..."
              maxLength={20}
              autoFocus
              className={`pr-16 text-sm sm:text-base ${
                error || showTaken
                  ? "border-red-500/50 focus:border-red-500/60"
                  : showAvailable
                    ? "border-[#34D399]/40 focus:border-[#34D399]/60"
                    : ""
              }`}
            />

            <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
              {showChecking ? (
                <Loader className="h-3 w-3 animate-spin text-neutral-500" />
              ) : null}
              {showAvailable && !showChecking ? (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <Check className="h-3 w-3 text-[#34D399]" />
                </motion.div>
              ) : null}
              {showTaken && !showChecking ? (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                  <X className="h-3 w-3 text-red-400" />
                </motion.div>
              ) : null}
              <span
                className={`font-mono text-[10px] ${
                  charCount > 17 ? "text-red-400/70" : "text-neutral-600"
                }`}
              >
                {charCount}/20
              </span>
            </div>
          </div>

          <AnimatePresence>
            {error || showTaken ? (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1.5 text-xs text-red-400"
              >
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>
                  {error ?? `"${debouncedValue}" is already taken in this room`}
                </span>
              </motion.div>
            ) : null}
            {showAvailable && !showChecking && !error ? (
              <motion.div
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-1.5 text-xs text-[#34D399]"
              >
                <Check className="h-3 w-3 flex-shrink-0" />
                <span>&quot;{debouncedValue}&quot; is available in this room!</span>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <p className="text-[10px] text-neutral-600 sm:text-[11px]">
            2–20 chars · Letters, numbers, _ - . · Unique in this room only
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full"
        >
          <Button
            onClick={handleConfirm}
            disabled={
              charCount < 2 || showTaken || isChecking || isAvailable !== true
            }
            className="h-11 w-full gap-2 text-sm font-medium sm:h-12 sm:text-base"
          >
            {mode === "create" ? "Create Room" : "Join Room"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </Card>
    </motion.div>
  );
}
