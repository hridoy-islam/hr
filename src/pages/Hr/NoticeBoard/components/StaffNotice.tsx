
import { useEffect, useState } from "react"
import moment from "moment"
import { Calendar, AlertCircle, UserIcon, Bell, Pin } from "lucide-react"
import axiosInstance from "@/lib/axios"
import { BlinkingDots } from "@/components/shared/blinking-dots"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DynamicPagination } from "@/components/shared/DynamicPagination"
import { Badge } from "@/components/ui/badge"
import { useSelector } from "react-redux"

// Extend Notice type to include new fields
interface Notice {
  _id: string
  noticeType: string
  noticeDescription: string
  noticeDate: string
  noticeBy?: {
    firstName: string
    lastName: string
  }
  status: string
  noticeSetting: "all" | "department" | "designation" | "individual"
  department: string[] // ObjectId array
  designation: string[] // ObjectId array
  users: string[] // ObjectId array
}

export default function StaffNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const { toast } = useToast()
  const userId = useSelector((state: any) => state.auth?.user) || null

  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const res = await axiosInstance.get(`/users/${userId._id}`)
      setCurrentUser(res.data.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      })
      throw error
    }
  }

  // Fetch notices
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

      const fetchedNotices = res.data.data.result || []
      setNotices(fetchedNotices)
      setTotalPages(res.data.data.totalPages || 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notices",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!currentUser || notices.length === 0) return

    const filtered = notices.filter((notice) => {
      switch (notice.noticeSetting) {
        case "all":
          return true

        case "department":
          return notice.department.some((d: any) => d._id === currentUser.department)

        case "designation":
          return notice.designation.some((des: any) => des._id === currentUser.designation)

        case "individual":
          return notice.users.some((u: any) => u._id === currentUser._id)

        default:
          return false
      }
    })

    setFilteredNotices(filtered)
  }, [notices, currentUser])

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchCurrentUser()
        await fetchNotices()
      } catch (error) {
        // Error already handled
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentPage, entriesPerPage])

  const getNoticeTypeStyle = (type: string) => {
    const normalizedType = type.toLowerCase()
    if (normalizedType.includes("urgent") || normalizedType.includes("important")) {
      return "bg-red-500 text-white hover:bg-red-600"
    }
    if (normalizedType.includes("announcement")) {
      return "bg-blue-500 text-white hover:bg-blue-600"
    }
    if (normalizedType.includes("reminder")) {
      return "bg-amber-500 text-white hover:bg-amber-600"
    }
    if (normalizedType.includes("new")) {
      return "bg-green-500 text-white hover:bg-green-600"
    }
    if (normalizedType.includes("comment")) {
      return "bg-purple-500 text-white hover:bg-purple-600"
    }
    if (normalizedType.includes("connect")) {
      return "bg-cyan-500 text-white hover:bg-cyan-600"
    }
    return "bg-slate-500 text-white hover:bg-slate-600"
  }

  return (
    <div className="min-h-screen bg-white p-6 rounded-xl shadow-lg">
      <div className="">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
            <Bell className="h-5 w-5" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notice Board</h1>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <BlinkingDots size="large" color="bg-supperagent" />
            </div>
          ) : filteredNotices.length === 0 ? (
            <Card className="border border-slate-200 bg-white py-16 text-center shadow-sm">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <AlertCircle className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">No notices for you</h3>
                <p className="max-w-md text-slate-600">
                  There are no notices targeted to you based on your role or department. Check back later.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {filteredNotices.map((notice) => (
                <Card
                  key={notice._id}
                  className="group overflow-hidden border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="p-5">
                    {/* Top row: Badge and Date */}
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getNoticeTypeStyle(notice.noticeType)}`}
                        >
                          {notice.noticeType}
                        </Badge>
                        {notice.noticeSetting !== "all" && (
                          <Badge
                            variant="secondary"
                            className="bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                          >
                            <Pin className="mr-1 h-3 w-3" />
                            {notice.noticeSetting}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {moment(notice.noticeDate).format("DD MMM YYYY")} at{" "}
                          {moment(notice.noticeDate).format("h:mm A")}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mb-3 text-sm leading-relaxed text-slate-600">{notice.noticeDescription}</p>

                    {/* Posted by */}
                    {notice.noticeBy && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-semibold text-supperagent">
                          {notice.noticeBy.firstName} {notice.noticeBy.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {filteredNotices.length > 6 && (
                <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <DynamicPagination
                    pageSize={entriesPerPage}
                    setPageSize={setEntriesPerPage}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
