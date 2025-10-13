"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageIcon, X, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import axiosInstance from "@/lib/axios"

interface FileUploaderProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUploadComplete: (data: any) => void
  entityId: string
  acceptedFileTypes?: string
  title?: string
  description?: string
}

export function FileUploader({
  open,
  onOpenChange,
  onUploadComplete,
  entityId,
  acceptedFileTypes = "image/*",
  title = "Upload Picture",
  description = "PNG, JPG or GIF (max. 5MB)",
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const handleFile = (file: File) => {
    if (file.size > MAX_SIZE) {
      setUploadError("File size exceeds the 5MB limit.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedFile(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadFile = async () => {
    if (!selectedFile) return

    setUploading(true)
    setUploadError(null)

    try {
      const file = inputRef.current?.files?.[0]
      if (!file) {
        setUploading(false)
        return
      }

      const formData = new FormData()
      formData.append("entityId", entityId)
      formData.append("file_type", "document")
      formData.append("file", file)

      const response = await axiosInstance.post("/documents", formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
          setUploadProgress(percentCompleted)
        },
      })

      if (response.status === 200) {
        onUploadComplete(response.data)
        setSelectedFile(null)
        if (inputRef.current) inputRef.current.value = ""
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setUploadError("An error occurred while uploading the file. Please try again.")
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const isImage = acceptedFileTypes.includes("image")
  const isPDF = acceptedFileTypes.includes("pdf")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div
            role="region"
            aria-labelledby="fileUploadInstructions"
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
              dragActive ? "border-primary" : "border-muted-foreground/25",
              selectedFile ? "pb-0" : "min-h-[200px]",
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={handleChange}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            {selectedFile ? (
              <div className="relative w-full max-w-[200px] overflow-hidden rounded-lg">
                {isImage ? (
                  <div className="aspect-square">
                    <img src={selectedFile || "/placeholder.svg"} alt="Preview" className="object-cover" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium">{inputRef.current?.files?.[0]?.name}</span>
                  </div>
                )}
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute right-2 top-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedFile(null)
                    if (inputRef.current) inputRef.current.value = ""
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-center">
                {isImage ? (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                )}
                <div className="text-sm font-medium">Drag & drop a file here, or click to select</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            )}
          </div>

          {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}

          {selectedFile && !uploading && (
            <Button className="w-full" onClick={uploadFile}>
              Upload File
            </Button>
          )}

          {uploading && (
            <div className="relative mx-auto h-12 w-12">
              <svg className="h-12 w-12 -rotate-90 transform" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted-foreground/20" strokeWidth="2" />
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="2"
                  strokeDasharray={100}
                  strokeDashoffset={100 - uploadProgress}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-medium">{uploadProgress}%</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
