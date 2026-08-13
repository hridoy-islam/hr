import { useState, useRef, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Folder,
  FolderOpen,
  FileText,
  FileImage,
  File,
  MoreVertical,
  Plus,
  Upload,
  ChevronRight,
  Home,
  Pencil,
  Trash2,
  Download,
  Eye,
  Camera,
  X,
  FolderPlus,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { BlinkingDots } from "@/components/shared/blinking-dots";
import { useToast } from "@/components/ui/use-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuditType = "folder" | "file";

interface TAudit {
  _id: string;
  companyId: string;
  documentTitle: string;
  title: string[];
  type: AuditType;
  parentId: string | null;
  ancestors: string[];
  documentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface BreadcrumbItem {
  _id: string | null;
  name: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFileIcon(url?: string) {
  if (!url) return <File className="h28 w-28 text-gray-400" />;
  const lower = url.toLowerCase();
  if (lower.match(/\.(jpeg|jpg|gif|png|webp)/))
    return <FileImage className="h-28 w-28 text-blue-400" />;
  if (lower.match(/\.(pdf)/))
    return <FileText className="h-28 w-28 text-red-400" />;
  if (lower.match(/\.(docx|doc)/))
    return <FileText className="h-28 w-28 text-blue-600" />;
  return <File className="h-28 w-28 text-gray-400" />;
}

function getFileIconForList(url?: string) {
  if (!url) return <File className="h-10 w-10 text-gray-400" />;
  const lower = url.toLowerCase();
  if (lower.match(/\.(jpeg|jpg|gif|png|webp)/))
    return <FileImage className="h-10 w-10 text-blue-400" />;
  if (lower.match(/\.(pdf)/))
    return <FileText className="h-10 w-10 text-red-400" />;
  if (lower.match(/\.(docx|doc)/))
    return <FileText className="h-10 w-10 text-blue-600" />;
  return <File className="h-10 w-10 text-gray-400" />;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CompanyAuditPage() {
  const { id: companyId } = useParams<{ id: string }>();
  const { toast } = useToast(); // 🌟 Initialized Custom Hook

  // ── State ──
  const [items, setItems] = useState<TAudit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { _id: null, name: "Audit" },
  ]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // ── Create Folder Dialog ──
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  // ── Upload File Dialog ──
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // ── Camera ──
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImageFile, setCapturedImageFile] = useState<File | null>(null);
  const [capturedImagePreview, setCapturedImagePreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Rename ──
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renamingItem, setRenamingItem] = useState<TAudit | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  // ── Delete ──
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<TAudit | null>(null);

  // ── Preview ──
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ─── Fetch Items ─────────────────────────────────────────────────────────
  const fetchItems = useCallback(
    async (folderId: string | null) => {
      setIsLoading(true);
      try {
        const params: Record<string, string> = {
          companyId: companyId!,
          parentId: folderId || "null",
        };
        const res = await axiosInstance.get("/audit?limit=all", { params });
        setItems(res.data?.data?.result || []);
      } catch {
        toast({ title: "Error", description: "Failed to load files", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [companyId, toast]
  );

  useEffect(() => {
    fetchItems(currentFolderId);
  }, [currentFolderId, fetchItems]);

  // ─── Camera Cleanup ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUploadDialogOpen) {
      stopCamera();
      clearCaptureState();
    }
    return () => {
      stopCamera();
      if (capturedImagePreview) URL.revokeObjectURL(capturedImagePreview);
    };
  }, [isUploadDialogOpen]);

  // ─── Camera Helpers ───────────────────────────────────────────────────────
  const clearCaptureState = () => {
    setCapturedImageFile(null);
    if (capturedImagePreview) URL.revokeObjectURL(capturedImagePreview);
    setCapturedImagePreview(null);
  };

  const startCamera = async () => {
    clearCaptureState();
    setUploadError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch {
      setUploadError("Camera access denied. Please check your browser permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
            setCapturedImageFile(file);
            setCapturedImagePreview(URL.createObjectURL(blob));
            stopCamera();
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  const retakePhoto = () => {
    clearCaptureState();
    startCamera();
  };

  const acceptPhoto = () => {
    if (capturedImageFile) {
      uploadFiles([capturedImageFile]);
      clearCaptureState();
    }
  };

  // ─── Upload Files Loop ─────────────────────────────────────────────────────
  const uploadFiles = async (files: File[]) => {
    if (!companyId) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: "File too large", description: `"${file.name}" exceeds 20MB limit.`, variant: "destructive" });
        failCount++;
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("entityId", companyId);
        formData.append("file_type", "auditDoc");
        formData.append("file", file);

        const res = await axiosInstance.post("/documents", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) {
              const currentFileProgress = (e.loaded / e.total) * 100;
              const totalProgress = Math.round(
                ((i / files.length) * 100) + (currentFileProgress / files.length)
              );
              setUploadProgress(totalProgress);
            }
          },
        });

        const url = res.data?.data?.fileUrl;
        if (!url) throw new Error("No file URL returned");

        await axiosInstance.post("/audit", {
          companyId,
          documentTitle: file.name,
          title: [file.name],
          type: "file",
          parentId: currentFolderId || null,
          documentUrl: url,
        });

        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsUploading(false);
    setUploadProgress(0);

    if (successCount > 0) {
      toast({ title: `Successfully uploaded ${successCount} file(s)` });
      fetchItems(currentFolderId);
      setIsUploadDialogOpen(false);
    }
    if (failCount > 0) {
      setUploadError(`Failed to upload ${failCount} file(s).`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) uploadFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isUploading) setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  };

  // ─── Create Folder ────────────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    if (!folderName.trim() || !companyId) return;
    setIsCreatingFolder(true);
    try {
      await axiosInstance.post("/audit", {
        companyId,
        documentTitle: folderName.trim(),
        title: [folderName.trim()],
        type: "folder",
        parentId: currentFolderId || null,
      });
      toast({ title: "Folder created successfully" });
      setIsFolderDialogOpen(false);
      setFolderName("");
      fetchItems(currentFolderId);
    } catch {
      toast({ title: "Error", description: "Failed to create folder", variant: "destructive" });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // ─── Navigate into folder ─────────────────────────────────────────────────
  const handleOpenFolder = (folder: TAudit) => {
    setCurrentFolderId(folder._id);
    setBreadcrumbs((prev) => [...prev, { _id: folder._id, name: folder.documentTitle }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    const crumb = breadcrumbs[index];
    setCurrentFolderId(crumb._id);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  // ─── Rename ───────────────────────────────────────────────────────────────
  const openRename = (item: TAudit) => {
    setRenamingItem(item);
    setRenameValue(item.documentTitle);
    setIsRenameDialogOpen(true);
  };

  const handleRename = async () => {
    if (!renamingItem || !renameValue.trim()) return;
    setIsRenaming(true);
    try {
      await axiosInstance.patch(`/audit/${renamingItem._id}`, {
        documentTitle: renameValue.trim(),
        title: [renameValue.trim()],
      });
      toast({ title: "Renamed successfully" });
      setIsRenameDialogOpen(false);
      fetchItems(currentFolderId);
    } catch {
      toast({ title: "Error", description: "Failed to rename", variant: "destructive" });
    } finally {
      setIsRenaming(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (item: TAudit) => {
    // 🌟 Optimistic UI update: Immediately slice from local state layout, bypassing loading variables
    setItems((prev) => prev.filter((i) => i._id !== item._id));
    setDeleteConfirmItem(null);

    try {
      await axiosInstance.delete(`/audit/${item._id}`);
      toast({ title: "Deleted", description: `"${item.documentTitle}" deleted successfully` });
    } catch {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
      // Re-fetch fallback structure if database rejection occurs
      fetchItems(currentFolderId);
    }
  };

  // ─── Download ─────────────────────────────────────────────────────────────
  const handleDownload = async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  // ─── Preview Renderer ─────────────────────────────────────────────────────
  const renderPreview = () => {
    if (!previewUrl) return null;
    const lower = previewUrl.toLowerCase();
    if (lower.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/)) {
      return (
        <img
          src={previewUrl}
          alt="Preview"
          className="max-h-full max-w-full rounded object-contain"
        />
      );
    }
    if (lower.match(/\.(pdf)(\?|$)/)) {
      return (
        <iframe
          src={`${previewUrl}#toolbar=0`}
          className="h-full w-full rounded border-0"
          title="PDF"
        />
      );
    }
    if (lower.match(/\.(docx|doc)(\?|$)/)) {
      return (
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(previewUrl)}`}
          className="h-full w-full rounded border-0"
          title="Word Document"
        />
      );
    }
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <FileText className="h-16 w-16 text-gray-300" />
        <p className="text-sm text-gray-500">Preview not available for this file type.</p>
        <Button onClick={() => handleDownload(previewUrl, "document")} size="sm">
          <Download className="mr-2 h-4 w-4" /> Download to View
        </Button>
      </div>
    );
  };

  const openUploadDialog = () => {
    setUploadError(null);
    setUploadProgress(0);
    clearCaptureState();
    setIsUploadDialogOpen(true);
  };

  // ─── Item Context Menu ────────────────────────────────────────────────────
  const ItemMenu = ({ item }: { item: TAudit }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-0 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {item.type === "file" && item.documentUrl && (
          <>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setPreviewUrl(item.documentUrl!);
                setIsPreviewOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDownload(item.documentUrl!, item.documentTitle);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            openRename(item);
          }}
        >
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 hover:text-white focus:bg-red-500"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirmItem(item);
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // ─── Grid Item ────────────────────────────────────────────────────────────
  const GridItem = ({ item }: { item: TAudit }) => {
    // Check if the current object contains an image file reference
    const isImageFile = item.type === "file" && item.documentUrl?.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/);

    return (
      <div
        className="group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        onDoubleClick={() => item.type === "folder" && handleOpenFolder(item)}
        onClick={() => {
          if (item.type === "file" && item.documentUrl) {
            setPreviewUrl(item.documentUrl);
            setIsPreviewOpen(true);
          }
        }}
      >
        <div className="absolute right-1 top-1 sm:right-2 sm:top-2 z-10">
          <ItemMenu item={item} />
        </div>
        <div className="mt-2 flex h-20 w-20 sm:h-32 sm:w-32 items-center justify-center overflow-hidden rounded">
          {item.type === "folder" ? (
            <Folder className="h-16 w-16 sm:h-28 sm:w-28 text-amber-400 drop-shadow-sm" />
          ) : isImageFile ? (
            /* 🌟 Dynamically rendering image directly in the grid view card frame */
            <img 
              src={item.documentUrl} 
              alt={item.documentTitle} 
              className="h-full w-full object-cover rounded-md"
            />
          ) : (
            getFileIcon(item.documentUrl)
          )}
        </div>
        <p className="w-full truncate text-center text-xs font-medium text-gray-700">
          {item.documentTitle}
        </p>
        <p className="text-[10px] text-gray-600">{formatDate(item.createdAt)}</p>
      </div>
    );
  };

  // ─── List Item ────────────────────────────────────────────────────────────
  const ListItem = ({ item }: { item: TAudit }) => (
    <div
      className="group flex cursor-pointer items-center gap-2 sm:gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 sm:px-4 sm:py-3 transition-all hover:border-blue-200 hover:shadow-sm"
      onDoubleClick={() => item.type === "folder" && handleOpenFolder(item)}
      onClick={() => {
        if (item.type === "file" && item.documentUrl) {
          setPreviewUrl(item.documentUrl);
          setIsPreviewOpen(true);
        }
      }}
    >
      <div className="flex-shrink-0">
        {item.type === "folder" ? (
          <Folder className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
        ) : (
          <div className="scale-50 origin-left">{getFileIconForList(item.documentUrl)}</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-medium ">{item.documentTitle}</p>
      </div>
      <p className="flex-shrink-0 text-[10px] sm:text-xs text-gray-700">{formatDate(item.createdAt)}</p>
      <div className="flex-shrink-0">
        <ItemMenu item={item} />
      </div>
    </div>
  );

  // ─── Empty State ──────────────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-4">
      <div className="mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-gray-50">
        <FolderOpen className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-gray-700">This folder is empty</h3>
      <p className="mt-1 text-xs sm:text-sm text-gray-400">
        Create a folder or upload a file to get started.
      </p>
      {/* <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFolderDialogOpen(true)}
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
        <Button size="sm" onClick={openUploadDialog}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div> */}
    </div>
  );

  // ─── Main Content Render ──────────────────────────────────────────────────
  return (
    <div className="flex h-full min-h-screen flex-col bg-gray-50">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-3 sm:px-6 py-3 sm:py-4 shadow-sm rounded-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1 flex-shrink-0">
                {idx > 0 && <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300" />}
                <button
                  className={`flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-gray-100 whitespace-nowrap ${
                    idx === breadcrumbs.length - 1
                      ? "font-semibold text-gray-900"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                  onClick={() => handleBreadcrumbClick(idx)}
                >
                  {idx === 0 && <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                  {crumb.name}
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Controls */}
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              <button
                className={`rounded-md p-1.5 text-xs transition-colors ${
                  viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"
                }`}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              >
                ⊞
              </button>
              <button
                className={`rounded-md p-1.5 text-xs transition-colors ${
                  viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-400"
                }`}
                onClick={() => setViewMode("list")}
                title="List view"
              >
                ≡
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFolderDialogOpen(true)}
              className="text-xs sm:text-sm"
            >
              <FolderPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              New Folder
            </Button>
            <Button size="sm" onClick={openUploadDialog} className="text-xs sm:text-sm">
              <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Upload File
            </Button>
          </div>
        </div>

        {currentFolderId && (
          <button
            className="mt-2 flex items-center gap-1 text-xs text-theme hover:underline"
            onClick={() => {
              const newCrumbs = breadcrumbs.slice(0, -1);
              setBreadcrumbs(newCrumbs);
              setCurrentFolderId(newCrumbs[newCrumbs.length - 1]._id);
            }}
          >
            <ArrowLeft className="h-3 w-3" /> <span className="font-semibold">
            Back
            </span>
          </button>
        )}
      </div>

      {/* ── Content Body ── */}
      <div className="flex-1  py-4 sm:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <BlinkingDots color="bg-theme"/>
          </div>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {items
              .filter((i) => i.type === "folder")
              .map((item) => (
                <GridItem key={item._id} item={item} />
              ))}
            {items
              .filter((i) => i.type === "file")
              .map((item) => (
                <GridItem key={item._id} item={item} />
              ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1 sm:gap-2">
            {items
              .filter((i) => i.type === "folder")
              .map((item) => (
                <ListItem key={item._id} item={item} />
              ))}
            {items
              .filter((i) => i.type === "file")
              .map((item) => (
                <ListItem key={item._id} item={item} />
              ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          CREATE FOLDER DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent className="sm:max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-amber-400" />
              New Folder
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="folder-name" className="text-sm font-medium">
              Folder name
            </Label>
            <Input
              id="folder-name"
              className="mt-1.5"
              placeholder="Untitled folder"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsFolderDialogOpen(false)}
              disabled={isCreatingFolder}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!folderName.trim() || isCreatingFolder}
            >
              {isCreatingFolder ? (
                <BlinkingDots color="bg-theme"/>
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          UPLOAD FILE DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-lg mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-theme" />
              Upload Files
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isCameraOpen && (
              <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 sm:gap-3">
                  <Button size="sm" variant="secondary" onClick={stopCamera}>
                    <X className="mr-1 h-4 w-4" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={capturePhoto}>
                    <Camera className="mr-1 h-4 w-4" />
                    Capture
                  </Button>
                </div>
              </div>
            )}

            {capturedImagePreview && !isCameraOpen && (
              <div className="relative overflow-hidden rounded-lg border border-gray-200">
                <img
                  src={capturedImagePreview}
                  alt="Captured"
                  className="w-full object-cover"
                />
                <div className="flex justify-center gap-2 sm:gap-3 p-2 sm:p-3">
                  <Button size="sm" variant="outline" onClick={retakePhoto}>
                    Retake
                  </Button>
                  <Button size="sm" onClick={acceptPhoto}>
                    Use Photo
                  </Button>
                </div>
              </div>
            )}

            {!isCameraOpen && !capturedImagePreview && (
              <div
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 sm:px-6 py-8 sm:py-10 text-center transition-colors ${
                  isDragging
                    ? "border-theme bg-theme/50"
                    : "border-gray-200 bg-gray-50 hover:border-blue-300"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {isUploading ? (
                  <>
                    <BlinkingDots color="bg-theme"/>
                    <p className="text-sm text-gray-500">Processing... {uploadProgress}%</p>
                    <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-theme transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-300" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Drag & drop files here
                      </p>
                      <p className="text-xs text-gray-400">or choose an option below</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileSelect}
                          multiple
                        />
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                          <Upload className="h-3.5 w-3.5" />
                          Browse Files
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        Camera
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">Max 20MB per file</p>
                  </>
                )}
              </div>
            )}

            {uploadError && (
              <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {uploadError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          RENAME DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-sm mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Rename
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenameDialogOpen(false)}
              disabled={isRenaming}
            >
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim() || isRenaming}>
              {isRenaming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════
          DELETE CONFIRM DIALOG
      ══════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={!!deleteConfirmItem}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <AlertDialogContent className="mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteConfirmItem?.documentTitle}"?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmItem?.type === "folder"
                ? "This will permanently delete this folder and everything inside it. This action cannot be undone."
                : "This will permanently delete this file. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem)}
            >
              {/* 🌟 Removed loading variable conditional states completely from inside the action block */}
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════════════════════════════════════════════════════
          PREVIEW DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col p-0 mx-2 sm:mx-4">
          <DialogHeader className="flex-shrink-0 px-4 sm:px-5 py-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-medium">Preview</DialogTitle>
              {previewUrl && (
                <Button
                  size="sm"
                  className="mr-8"
                  onClick={() => handleDownload(previewUrl, "document")}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </DialogHeader>
          <div className="flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-4">
            {renderPreview()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}