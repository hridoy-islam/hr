import moment from "moment"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import axiosInstance from "@/lib/axios"

// Calculate duration between clock in and clock out
const calculateDuration = (clockIn: string | null, clockOut: string | null): string => {
  if (!clockIn || !clockOut || clockIn === "-" || clockOut === "-") return "0:00"

  // Assuming format HH:mm
  const today = moment().format('YYYY-MM-DD');
  const start = moment(`${today} ${clockIn}`, 'YYYY-MM-DD HH:mm');
  const end = moment(`${today} ${clockOut}`, 'YYYY-MM-DD HH:mm');
  
  // Handle overnight
  if (end.isBefore(start)) {
    end.add(1, 'day');
  }
  
  const durationMs = end.diff(start);
  const durationMinutes = Math.floor(durationMs / (1000 * 60))

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  return `${hours}:${minutes.toString().padStart(2, "0")}`
}

// Get attendance report for a date range
export async function getAttendanceReport(fromDate: string, toDate: string,companyId:any) {
  try {
    const response = await axiosInstance.get("/hr/attendance", {
      params: {
        companyId,
        fromDate,
        toDate,
      },
    })
    return response.data.data.result || []
  } catch (error) {
    console.error("Error generating attendance report:", error)
    throw new Error("Failed to generate attendance report")
  }
}

// Get attendance history for a specific user
export async function getUserAttendanceHistory(userId: string, fromDate: string, toDate: string) {
  try {
    const response = await axiosInstance.get(`/hr/attendance?userId=${userId}`, {
      params: {
        fromDate,
        toDate,
      },
    })

    const attendanceRecords = response.data.data.result || []

    return attendanceRecords.map((record: any) => {
      const clockIn = record.clockIn ? moment(record.clockIn).format("HH:mm") : "-";
      const clockOut = record.clockOut ? moment(record.clockOut).format("HH:mm") : "-";
      return {
        _id: record._id,
        date: moment(record.date || record.createdAt).format("MMM DD, YYYY"),
        clockIn,
        clockOut,
        duration: record.duration || calculateDuration(clockIn, clockOut),
        status: record.status || "absent",
        location: record.location,
        clockType: record.clockType,
        approvalStatus: record.approvalStatus,
        notes: record.notes,
        createdAt: moment(record.createdAt).format("MM-DD-YYYY"),
        source: record.source,
      }
    })
  } catch (error) {
    console.error("Error fetching user attendance history:", error)
    throw new Error("Failed to fetch user attendance history")
  }
}

// Generate PDF for the entire report
export async function generatePDF(fromDate: string, toDate: string, reportData: any[]) {
  try {
    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add initial page
    let page = pdfDoc.addPage([842, 595]) // A4 landscape
    const { width, height } = page.getSize()

    // Add title
    page.drawText("Attendance Report", {
      x: 50,
      y: height - 50,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Period: ${fromDate} to ${toDate}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Generated on: ${moment().format("MMMM DD, YYYY HH:mm")}`, {
      x: 50,
      y: height - 100,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    const tableTop = height - 150
    const colWidths = [200, 120, 80, 80, 80, 80]
    const colStarts = [50]

    for (let i = 1; i < colWidths.length; i++) {
      colStarts[i] = colStarts[i - 1] + colWidths[i - 1]
    }

    // Function to draw headers
    const drawHeaders = (currentPage: any, yPos: number) => {
      currentPage.drawRectangle({
        x: 50,
        y: yPos - 20,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
      })

      const headers = ["Employee", "Department", "Days Present", "Late Days", "Absent Days", "Total Hours"]
      headers.forEach((header, i) => {
        currentPage.drawText(header, {
          x: colStarts[i] + 5,
          y: yPos - 15,
          size: 10,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        })
      })
    }

    drawHeaders(page, tableTop)

    let rowY = tableTop - 40

    for (let index = 0; index < reportData.length; index++) {
      const user = reportData[index];

      if (rowY < 50) {
        page = pdfDoc.addPage([842, 595])
        rowY = height - 50
        drawHeaders(page, rowY)
        rowY -= 40
      }

      // Draw row background
      page.drawRectangle({
        x: 50,
        y: rowY - 20,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95),
      })

      const rowData = [
        `${user.userId?.firstName || ''} ${user.userId?.lastName || ''}`,
        user.userId?.departmentId?.name || user.userId?.departmentId?.departmentName || user.userId?.position || "N/A",
        (user.attendanceCount || 0).toString(),
        (user.lateCount || 0).toString(),
        (user.absentCount || 0).toString(),
        (user.totalHours || 0).toFixed(2),
      ]

      rowData.forEach((data, i) => {
        page.drawText(data, {
          x: colStarts[i] + 5,
          y: rowY - 15,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        })
      })

      rowY -= 20
    }

    // Add summary logic if needed on the last page...
    
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Attendance_Report_${fromDate}_to_${toDate}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generating PDF:", error)
    throw new Error("Failed to generate PDF")
  }
}

// Generate PDF for an individual user
export async function generateUserPDF(
  userId: string,
  userName: string,
  fromDate: string,
  toDate: string,
  attendanceData: any[],
) {
  try {
    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    let page = pdfDoc.addPage([595, 842])
    const { width, height } = page.getSize()

    page.drawText(`Attendance Report: ${userName}`, {
      x: 50,
      y: height - 50,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Period: ${fromDate} to ${toDate}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Generated on: ${moment().format("MMMM DD, YYYY HH:mm")}`, {
      x: 50,
      y: height - 100,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Summary Calculations
    const presentDays = attendanceData.filter((r) => r.status === "present" || (r.clockIn && r.clockIn !== "-")).length
    const lateDays = attendanceData.filter((r) => r.status === "late").length
    const absentDays = attendanceData.filter((r) => r.status === "absent").length
    
    const totalHours = attendanceData.reduce((total, record) => {
      if (record.duration && record.duration !== "-" && record.duration !== "0:00") {
        const parts = record.duration.split(":");
        if (parts.length === 2) {
          const [hours, minutes] = parts.map(Number);
          return total + hours + minutes / 60;
        }
      }
      return total
    }, 0)

    page.drawText("Summary", {
      x: 50,
      y: height - 130,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    // Draw summary boxes
    const boxWidth = 120
    const boxHeight = 60
    const boxGap = 15
    const boxStartX = 50
    const boxStartY = height - 140 - boxHeight

    const drawBox = (x: number, title: string, value: string) => {
      page.drawRectangle({
        x,
        y: boxStartY,
        width: boxWidth,
        height: boxHeight,
        color: rgb(0.95, 0.95, 0.95),
        borderColor: rgb(0.8, 0.8, 0.8),
        borderWidth: 1,
      })
      page.drawText(title, {
        x: x + 10,
        y: boxStartY + boxHeight - 20,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
      })
      page.drawText(value, {
        x: x + 10,
        y: boxStartY + boxHeight - 45,
        size: 18,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      })
    }

    drawBox(boxStartX, "Present Days", presentDays.toString())
    drawBox(boxStartX + boxWidth + boxGap, "Late Days", lateDays.toString())
    drawBox(boxStartX + (boxWidth + boxGap) * 2, "Absent Days", absentDays.toString())
    drawBox(boxStartX + (boxWidth + boxGap) * 3, "Total Hours", totalHours.toFixed(2))

    // Table
    const tableTop = boxStartY - 30
    const colWidths = [120, 80, 80, 80, 100, 80]
    const colStarts = [50]

    for (let i = 1; i < colWidths.length; i++) {
      colStarts[i] = colStarts[i - 1] + colWidths[i - 1]
    }

    const drawTableHeaders = (currentPage: any, y: number) => {
      currentPage.drawRectangle({
        x: 50,
        y: y - 20,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: rgb(0.9, 0.9, 0.9),
      })
      const headers = ["Date", "Clock In", "Clock Out", "Duration", "Status", "Method"]
      headers.forEach((header, i) => {
        currentPage.drawText(header, {
          x: colStarts[i] + 5,
          y: y - 15,
          size: 10,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        })
      })
    }

    drawTableHeaders(page, tableTop)

    let rowY = tableTop - 40

    for (let i = 0; i < attendanceData.length; i++) {
      const record = attendanceData[i]

      if (rowY < 50) {
        page = pdfDoc.addPage([595, 842])
        rowY = height - 50
        drawTableHeaders(page, rowY)
        rowY -= 40
      }

      page.drawRectangle({
        x: 50,
        y: rowY - 20,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95),
      })

      const rowData = [
        record.date || record.createdAt || "N/A",
        record.clockIn,
        record.clockOut,
        record.duration,
        (record.status || "N/A").charAt(0).toUpperCase() + (record.status || "N/A").slice(1),
        record.clockType || "N/A",
      ]

      rowData.forEach((data, idx) => {
        page.drawText(String(data), {
          x: colStarts[idx] + 5,
          y: rowY - 15,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        })
      })

      rowY -= 20
    }

    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${userName}_Attendance_${fromDate}_to_${toDate}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generating user PDF:", error)
    throw new Error("Failed to generate user PDF")
  }
}