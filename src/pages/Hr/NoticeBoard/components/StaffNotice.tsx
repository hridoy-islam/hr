
import { useEffect, useState } from "react"
import moment from "moment"
import { Calendar, AlertCircle, User, Bell, Pin } from "lucide-react"
import axiosInstance from "@/lib/axios"
import { BlinkingDots } from "@/components/shared/blinking-dots"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DynamicPagination } from "@/components/shared/DynamicPagination"
import { Badge } from "@/components/ui/badge"

interface Notice {
  _id: string
  noticeType: string
  noticeDescription: string
  noticeDate: string
  noticeBy?: string
  status: string
}

export default function StaffNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchNotices = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get("/hr/notice", {
        params: {
          status: "active",
          sort: "-noticeDate",
          page: currentPage,
          limit: entriesPerPage,
        },
      })

      setNotices(res.data.data.result || [])
      setTotalPages(res.data.data.totalPages || 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotices()
  }, [currentPage, entriesPerPage])

  const getNoticeTypeStyle = (type: string) => {
    const normalizedType = type.toLowerCase()
    if (normalizedType.includes("urgent") || normalizedType.includes("important")) {
      return "bg-red-50 text-red-700 border-red-200"
    }
    if (normalizedType.includes("announcement")) {
      return "bg-blue-50 text-blue-700 border-blue-200"
    }
    if (normalizedType.includes("reminder")) {
      return "bg-amber-50 text-amber-700 border-amber-200"
    }
    return "bg-slate-50 text-slate-700 border-slate-200"
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="bg-white rounded-lg border-b border-slate-200 px-6 py-4">
        <div className="">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Staff Notice Board</h1>
              
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <BlinkingDots size="large" color="bg-supperagent" />
            
          </div>
        ) : notices.length === 0 ? (
          <Card className="py-16 text-center border-0 shadow-sm bg-white">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No notices available</h3>
              <p className="text-slate-600 max-w-md">
                There are currently no active notices to display. Check back later for updates.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {notices.map((notice) => (
              <Card
                key={notice._id}
                className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={`font-medium ${getNoticeTypeStyle(notice.noticeType)}`}>
                        {notice.noticeType}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{moment(notice.noticeDate).format("MMM D, YYYY")}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-5">
                  <p className="text-slate-700 leading-relaxed text-base">{notice.noticeDescription}</p>
                </div>

                {notice.noticeBy && (
                  <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Posted by</span>
                      <span className="font-medium text-slate-900">{notice.noticeBy}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {notices.length > 6 && (
              <div className="mt-8 pt-6  border-slate-200">
                <DynamicPagination
                  pageSize={entriesPerPage}
                  setPageSize={setEntriesPerPage}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
