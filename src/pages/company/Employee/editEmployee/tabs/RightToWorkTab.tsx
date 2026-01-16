
import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Calendar, FileText, Download, Eye, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import axiosInstance from "@/lib/axios"
import { useParams } from "react-router-dom"
import { useToast } from "@/components/ui/use-toast"
import { useSelector } from "react-redux"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import moment from "moment"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface HistoryEntry {
  _id: string
  title: string
  date: string
  updatedBy: string | { firstName: string; lastName: string }
}

interface RTWDocument {
  id: string
  name: string
  type: string
  uploadDate: string
  size: string
}

interface RTWData {
  _id: string
  startDate: string | null
  expiryDate: string | null
  status: "active" | "expired" | "needs-check"
  nextCheckDate: string | null
  employeeId: string
  logs?: Array<{
    _id: string
    title: string
    date: string
    updatedBy: { firstName: string; lastName: string }
  }>
}

function RightToWorkTab() {
  const { id } = useParams()
  const { user } = useSelector((state: any) => state.auth)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [visaStatus, setVisaStatus] = useState<"active" | "expired">("active")
  const [complianceStatus, setComplianceStatus] = useState<"active" | "expired">("active")
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [nextCheckDate, setNextCheckDate] = useState<Date | null>(null)
  const [rtwId, setRtwId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // const [documents, setDocuments] = useState<RTWDocument[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Modal states
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateType, setUpdateType] = useState<"visa" | "compliance" | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Track original values
  const [originalData, setOriginalData] = useState<{
    startDate: string | null
    expiryDate: string | null
    nextCheckDate: string | null
  } | null>(null)

  const [visaFormChanged, setVisaFormChanged] = useState(false)
  const [complianceFormChanged, setComplianceFormChanged] = useState(false)

  const recalculateStatus = (expiryStr: string | null, nextCheckStr: string | null) => {
    const now = moment()
    setVisaStatus(!expiryStr || !moment(expiryStr).isValid() || now.isAfter(moment(expiryStr)) ? "expired" : "active")
    setComplianceStatus(!nextCheckStr || !moment(nextCheckStr).isValid() || now.isAfter(moment(nextCheckStr)) ? "expired" : "active")
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?._id) return

    // Validate file
    const validTypes = ["application/pdf", "image/jpeg", "image/png"]
    if (!validTypes.includes(file.type)) {
      setUploadError("Only PDF, JPEG, or PNG files are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be less than 5MB.")
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setSelectedFileName(file.name)

    const formData = new FormData()
    formData.append("entityId", user._id)
    formData.append("file_type", "document")
    formData.append("file", file)

    try {
      const res = await axiosInstance.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      const fileUrl = res.data?.data?.fileUrl
      if (!fileUrl) throw new Error("No file URL returned")
      setUploadedFileUrl(fileUrl)
    } catch (err) {
      console.error("Upload failed:", err)
      setUploadError("Failed to upload document. Please try again.")
      setUploadedFileUrl(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveFile = () => {
    setUploadedFileUrl(null)
    setSelectedFileName(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const fetchData = async () => {
    if (!id) return
    try {
      const rtwRes = await axiosInstance.get(`/hr/right-to-work?employeeId=${id}`)
      const rtwList: RTWData[] = rtwRes.data.data.result

      if (rtwList.length > 0) {
        const rtwData = rtwList[0]
        setRtwId(rtwData._id)
        setStartDate(rtwData.startDate ? new Date(rtwData.startDate) : null)
        setExpiryDate(rtwData.expiryDate ? new Date(rtwData.expiryDate) : null)
        setNextCheckDate(rtwData.nextCheckDate ? new Date(rtwData.nextCheckDate) : null)
        setHistory(rtwData.logs || [])

        console.log(rtwData.logs)

        setOriginalData({
          startDate: rtwData.startDate,
          expiryDate: rtwData.expiryDate,
          nextCheckDate: rtwData.nextCheckDate,
        })

//         const fetchedDocs = (rtwData.logs || [])
//   .filter((log) => log.document && log.document.trim() !== "")
//   .map((log) => ({
//     id: log._id,
//     name: log.document.split("/").pop()?.split("?")[0] || "RTW Document",
//     type: log.document.endsWith(".pdf") ? "PDF" : "Image",
//     uploadDate: moment(log.date).format("DD-MMM-YYYY"),
//   }));

// setDocuments(fetchedDocs);


        recalculateStatus(rtwData.expiryDate, rtwData.nextCheckDate)
      } else {
        setRtwId(null)
        setStartDate(null)
        setExpiryDate(null)
        setNextCheckDate(null)
        setHistory([])
        // setDocuments([])
        setOriginalData({ startDate: null, expiryDate: null, nextCheckDate: null })
        recalculateStatus(null, null)
      }
    } catch (err) {
      console.error("Error fetching RTW data:", err)
      toast({ title: "Failed to load RTW data.", className: "bg-destructive text-white" })
      recalculateStatus(null, null)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    const expiryISO = expiryDate ? moment(expiryDate).format("YYYY-MM-DD") : null
    const nextCheckISO = nextCheckDate ? moment(nextCheckDate).format("YYYY-MM-DD") : null
    recalculateStatus(expiryISO, nextCheckISO)
  }, [expiryDate, nextCheckDate])

  useEffect(() => {
    if (!originalData) return
    const currentStart = startDate ? moment(startDate).format("YYYY-MM-DD") : null
    const currentExpiry = expiryDate ? moment(expiryDate).format("YYYY-MM-DD") : null
    setVisaFormChanged(currentStart !== originalData.startDate || currentExpiry !== originalData.expiryDate)
  }, [startDate, expiryDate, originalData])

  useEffect(() => {
    if (!originalData) return
    const currentNextCheck = nextCheckDate ? moment(nextCheckDate).format("YYYY-MM-DD") : null
    setComplianceFormChanged(currentNextCheck !== originalData.nextCheckDate)
  }, [nextCheckDate, originalData])

  const handleUpdateClick = (type: "visa" | "compliance") => {
    setUploadedFileUrl(null)
    setSelectedFileName(null)
    setUploadError(null)
    setUpdateType(type)
    setShowUpdateModal(true)
  }

  const handleSubmitUpdate = async () => {
    if (!user?._id) {
      toast({ title: "User not authenticated", className: "bg-destructive text-white" })
      return
    }
    if (!uploadedFileUrl) {
      toast({ title: "Please upload a document first.", className: "bg-destructive text-white" })
      return
    }

    setIsSubmitting(true)

    const payload: any = {
      updatedBy: user._id,
      document: uploadedFileUrl,
    }

    if (updateType === "visa") {
      if (startDate) payload.startDate = moment(startDate).toISOString()
      if (expiryDate) payload.expiryDate = moment(expiryDate).toISOString()
    } else if (updateType === "compliance") {
      if (nextCheckDate) payload.nextCheckDate = moment(nextCheckDate).toISOString()
    }

    try {
      const url = rtwId ? `/hr/right-to-work/${rtwId}` : `/hr/right-to-work`
      const method = rtwId ? "patch" : "post"
      const config = rtwId
        ? {}
        : { params: { employeeId: id } }

      await axiosInstance[method](url, payload, config)

      await fetchData()
      toast({ title: "RTW updated successfully!", className: "bg-supperagent text-white" })
      setShowUpdateModal(false)
      setUpdateType(null)
      setUploadedFileUrl(null)
      setSelectedFileName(null)
    } catch (err: any) {
      console.error("Error updating RTW:", err)
      toast({
        title: err.response?.data?.message || "Update failed.",
        className: "bg-destructive text-white",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Combined Visa Info & Documents */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-3 text-xl font-semibold text-gray-900">
            <Calendar className="h-6 w-6 text-supperagent" />
            Right to Work Verification
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Visa Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-800">Visa Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-row items-center gap-4">
                  <Label className="text-sm font-medium text-gray-700">Visa Start Date</Label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select start date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
                <div className="flex flex-row items-center gap-4">
                  <Label className="text-sm font-medium text-gray-700">Visa Expiry Date</Label>
                  <DatePicker
                    selected={expiryDate}
                    onChange={(date) => setExpiryDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Select expiry date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
                <div className="flex flex-row items-center gap-4">
                  <Label className="text-sm font-medium text-gray-700">Visa Status</Label>
                  <Badge variant={visaStatus === "active" ? "default" : "destructive"}>
                    {visaStatus === "active" ? "Active" : "Expired"}
                  </Badge>
                </div>
                {visaFormChanged && (
                  <div className="mt-2">
                    <Button
                      onClick={() => handleUpdateClick("visa")}
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                    >
                      Update Visa Information
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Compliance Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-800">Compliance Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-row items-center gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">RTW Check Date</Label>
                    <p className="mt-1 text-xs text-gray-500">(Every 3 months)</p>
                  </div>
                  <DatePicker
                    selected={nextCheckDate}
                    onChange={(date) => setNextCheckDate(date)}
                    dateFormat="dd-MM-yyyy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    placeholderText="Next check date"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                  />
                </div>
                <div className="flex flex-row items-center gap-4">
                  <Label className="text-sm font-medium text-gray-700">Compliance Status</Label>
                  <Badge variant={complianceStatus === "active" ? "default" : "destructive"}>
                    {complianceStatus === "active" ? "Active" : "Expired"}
                  </Badge>
                </div>
                {complianceFormChanged && (
                  <div className="mt-2">
                    <Button
                      onClick={() => handleUpdateClick("compliance")}
                      className="bg-supperagent text-white hover:bg-supperagent/90"
                    >
                      Update Compliance
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="mb-4 flex items-center gap-2 text-lg font-medium text-gray-800">
              <FileText className="h-5 w-5 text-supperagent" />
              Uploaded Documents
            </h3>
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              {history && history.length > 0 ? (
                (() => {
                  // Filter logs that have a document URL
                  const docLogs = history.filter(
                    (log) => log.document && typeof log.document === 'string' && log.document.trim() !== ''
                  );

                  return docLogs.length > 0 ? (
                    <ul className="space-y-3">
                      {docLogs.map((log) => {
                        const url = log.document.trim(); // ✅ Trim whitespace
                        const fileName = url
                          ? url.split('/').pop()?.split('?')[0] || "RTW Document"
                          : "Unknown Document";

                        return (
                          <li
                            key={log._id}
                            className="flex items-center justify-between rounded border border-gray-100 bg-white p-3 shadow-sm hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <FileText className="h-4 w-4 text-gray-600" />
                              <div className="truncate text-sm">
                                <p className="font-medium text-gray-900">{fileName}</p>
                                <p className="text-gray-500">
                                  {moment(log.date).format("DD-MMM-YYYY")}
                                  {typeof log.updatedBy === 'object' && (
                                    <> • {log.updatedBy.firstName} {log.updatedBy.lastName}</>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => window.open(url, "_blank")}
                                className="bg-supperagent text-white hover:bg-supperagent"
                                title="View document"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Document
                              </Button>

                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-center text-sm italic text-gray-500">No documents uploaded</p>
                  );
                })()
              ) : (
                <p className="text-center text-sm italic text-gray-500">No documents uploaded</p>
              )}
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="max-h-96 overflow-auto rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">History</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Action Taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <TableRow key={entry._id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-900">{entry.title}</TableCell>
                      <TableCell className="text-right text-gray-600">
                        {typeof entry.updatedBy === "object"
                          ? `${entry.updatedBy.firstName} ${entry.updatedBy.lastName}`
                          : entry.updatedBy}{" "}
                        - {moment(entry.date).format("DD MMM YYYY")}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {showUpdateModal && (
        <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {updateType === "visa" ? "Update Visa Information" : "Update Compliance Check"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                {updateType === "visa"
                  ? "Upload a supporting visa document."
                  : "Upload a supporting compliance document."}
              </p>

              <div
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                  uploadedFileUrl
                    ? "border-green-500 bg-green-50"
                    : isUploading
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-gray-50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-sm text-blue-600">Uploading...</p>
                  </div>
                ) : uploadedFileUrl ? (
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Uploaded successfully</p>
                        {selectedFileName && <p className="text-xs text-gray-600">{selectedFileName}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile()
                      }}
                      className="hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <div className="text-sm font-medium text-gray-700">Click to Upload Document</div>
                    <div className="text-xs text-gray-500">PDF or Image (max. 5MB)</div>
                  </div>
                )}

                {uploadError && <p className="mt-2 text-sm text-destructive">{uploadError}</p>}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateModal(false)
                  setUpdateType(null)
                  setUploadedFileUrl(null)
                  setSelectedFileName(null)
                  setUploadError(null)
                }}
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button
                className="bg-supperagent text-white hover:bg-supperagent/90"
                onClick={handleSubmitUpdate}
                disabled={isSubmitting || isUploading || !uploadedFileUrl}
              >
                {isSubmitting ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default RightToWorkTab