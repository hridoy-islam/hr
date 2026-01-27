import { useEffect, useState } from "react"
import moment from "moment"
import { Calendar, AlertCircle, UserIcon, Bell, Lock, Globe } from "lucide-react"
import axiosInstance from "@/lib/axios"
import { BlinkingDots } from "@/components/shared/blinking-dots"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DynamicPagination } from "@/components/shared/DynamicPagination"
import { Badge } from "@/components/ui/badge"
import { useSelector } from "react-redux"
import { useParams } from "react-router-dom"

// Updated Interface based on new Schema
interface Notice {
  _id: string
  noticeDescription: string
  createdAt: string // Mongoose timestamp
  updatedAt: string
  status: string
  noticeSetting: "all" | "individual"
  users: any[] // Can be array of strings (IDs) or Objects depending on population
  noticeBy?: {
    firstName: string
    lastName: string
  }
}

export default function CompanyNoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [filteredNotices, setFilteredNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const { toast } = useToast()
  
  // robustly get user ID
  const authUser = useSelector((state: any) => state.auth?.user)
  const userId = authUser?._id || authUser?.id
  const {id} = useParams()
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)


  // Fetch notices
  const fetchNotices = async () => {
    try {
      setLoading(true)
      const res = await axiosInstance.get("/admin-notice", {
        params: {
          status: "active",
          page: currentPage,
          limit: entriesPerPage,
        },
      })

      const fetchedNotices = res.data.data.result || []
      setNotices(fetchedNotices)
      setTotalPages(res.data.data.meta?.totalPage || res.data.data.totalPages || 1)
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

  // Filter Logic based on new Schema
  useEffect(() => {
    if (!id || notices.length === 0) {
        setFilteredNotices([])
        return
    }

    const filtered = notices.filter((notice) => {
      // 1. Show if setting is 'all'
      if (notice.noticeSetting === "all") return true

      // 2. Show if setting is 'individual' AND user is in the list
      if (notice.noticeSetting === "individual") {
        return notice.users.some((user: any) => {
             // Handle if users are populated objects or just ID strings
             const idToCheck = typeof user === 'string' ? user : id
             return idToCheck === id
        })
      }

      return false
    })

    setFilteredNotices(filtered)
  }, [notices, currentUser])

  // Initial Data Load
  useEffect(() => {
    const loadData = async () => {
      await fetchNotices()
    }
    if (id) {
        loadData()
    }
  }, [id, currentPage, entriesPerPage])


  return (
    <div className=" bg-white p-6 rounded-xl shadow-lg">
      <div className="">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
            <Bell className="h-6 w-6 text-theme" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notice Board</h1>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <BlinkingDots size="large" color="bg-theme" />
            </div>
          ) : filteredNotices.length === 0 ? (
            <Card className="border border-slate-200 bg-white py-16 text-center shadow-sm">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <AlertCircle className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-slate-900">No notices found</h3>
                <p className="max-w-md text-slate-600">
                  There are no active notices available for you at this time.
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
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        {/* Scope Badge */}
                        {notice.noticeSetting === "all" ? (
                             <Badge className="bg-blue-500 hover:bg-blue-600 text-white flex gap-1 items-center">
                                <Globe className="w-3 h-3" /> Public Announcement
                             </Badge>
                        ) : (
                            <Badge className="bg-purple-500 hover:bg-purple-600 text-white flex gap-1 items-center">
                                <Lock className="w-3 h-3" /> Private Notice
                            </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {moment(notice.createdAt).format("DD MMM YYYY")} at{" "}
                          {moment(notice.createdAt).format("h:mm A")}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                            {notice.noticeDescription}
                        </p>
                    </div>

                    {/* Footer: Posted by */}
                    {notice.noticeBy && (
                      <div className="flex items-center justify-end border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-slate-400">Posted by:</span>
                            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-semibold text-slate-700">
                                {notice.noticeBy?.name}
                            </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
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