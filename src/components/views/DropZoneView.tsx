"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/Card"
import { UploadCloud, FileText, CheckCircle2, User } from "lucide-react"

interface DropZoneViewProps {
  roomCode: string
  isHost: boolean
}

interface FileItem {
  name: string
  size: number
  progress: number
  status: "uploading" | "done"
}

export function DropZoneView({ roomCode, isHost }: DropZoneViewProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [presenceCount, setPresenceCount] = useState(1)

  useEffect(() => {
    // // TODO: WebSocket Presence mock integration
    setPresenceCount(2)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map(f => ({
         name: f.name,
         size: f.size,
         progress: 0,
         status: "uploading" as const
      }))
      
      setFiles(prev => [...prev, ...newFiles])
      
      // Simulate Upload sequence
      newFiles.forEach((file, index) => {
        let p = 0
        const interval = setInterval(() => {
          p += Math.random() * 20
          if (p >= 100) {
            p = 100
            clearInterval(interval)
            setFiles(current => current.map(c => c.name === file.name ? { ...c, progress: 100, status: "done" } : c))
          } else {
            setFiles(current => current.map(c => c.name === file.name ? { ...c, progress: p } : c))
          }
        }, 150)
      })
    }
  }, [])

  // Human readable size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ type: "spring", stiffness: 90, damping: 20 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      <div className="flex justify-between items-center px-4">
        <div>
          <h2 className="text-xl font-serif text-white tracking-wide">
            Room <span className="font-mono text-[#4F8EF7] ml-2">{roomCode}</span>
          </h2>
          <span className="text-xs text-neutral-500 uppercase tracking-widest">{isHost ? "Host" : "Guest"}</span>
        </div>
        <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <User className="w-4 h-4 text-neutral-300" />
          <span className="text-sm text-neutral-300 font-medium">{presenceCount} connected</span>
        </div>
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging ? "border-[#4F8EF7] bg-[#4F8EF7]/5 shadow-[0_0_40px_rgba(79,142,247,0.2)] scale-[1.02]" : "border-white/20 bg-black/20"
        }`}
      >
        <UploadCloud className={`w-12 h-12 mb-4 transition-colors duration-300 ${isDragging ? "text-[#4F8EF7]" : "text-neutral-500"}`} />
        <p className="text-lg text-white font-medium mb-1">
          {isDragging ? "Drop to transport" : "Drag files payload here"}
        </p>
        <p className="text-sm text-neutral-500">
          or click to browse local filesystem
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-400 pl-2">Transfer Session Logs</h3>
          <div className="space-y-2">
            {files.map((file, i) => (
              <Card key={i} className="p-4 bg-black/40 border-white/5 flex items-center space-x-4">
                <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                  <FileText className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-white truncate max-w-[70%]">{file.name}</p>
                    <span className="text-xs text-neutral-500">{formatBytes(file.size)}</span>
                  </div>
                  <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-[#4F8EF7] shadow-[0_0_10px_rgba(79,142,247,0.8)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${file.progress}%` }}
                      transition={{ ease: "easeOut" }}
                    />
                  </div>
                </div>
                {file.status === "done" && (
                  <CheckCircle2 className="w-5 h-5 text-[#4F8EF7]" />
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}
