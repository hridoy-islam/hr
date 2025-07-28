"use server"

import moment from "moment"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import axiosInstance from "@/lib/axios"

// Calculate duration between clock in and clock out
const calculateDuration = (clockIn: string | null, clockOut: string | null): string => {
  if (!clockIn || !clockOut) return "0:00"

  const clockInTime = new Date(clockIn).getTime()
  const clockOutTime = new Date(clockOut).getTime()
  const durationMs = clockOutTime - clockInTime
  const durationMinutes = Math.floor(durationMs / (1000 * 60))

  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  return `${hours}:${minutes.toString().padStart(2, "0")}`
}

// Get attendance report for a date range
export async function getAttendanceReport(fromDate: string, toDate: string) {
  try {
   
    const response = await axiosInstance.get("/hr/attendance/", {
      params: {
        fromDate,
        toDate,
       
      },
    })

    // Process the response data
    return response.data.data.result || []
  } catch (error) {
    console.error("Error generating attendance report:", error)
    throw new Error("Failed to generate attendance report")
  }
}

// Get attendance history for a specific user
export async function getUserAttendanceHistory(userId: string, fromDate: string, toDate: string) {
  try {
    // Fetch user attendance history from API endpoint
    const response = await axiosInstance.get(`/hr/attendance?userId=${userId}`, {
      params: {
        fromDate,
        toDate,
      },
    })

    // Process the response data
    const attendanceRecords = response.data.data.result || []

    // Format the records if needed
    return attendanceRecords.map((record: any) => ({
      _id: record._id,
      date: moment(record.date || record.createdAt).format("MMM DD, YYYY"),
      clockIn: record.clockIn ? moment(record.clockIn).format("HH:mm") : "-",
      clockOut: record.clockOut ? moment(record.clockOut).format("HH:mm") : "-",
      duration: record.duration || calculateDuration(record.clockIn, record.clockOut),
      status: record.status || "absent",
      location: record.location,
      clockType: record.clockType,
      approvalStatus: record.approvalStatus,
      notes: record.notes,
      createdAt: moment(record.createdAt).format("MM-DD-YYYY"),
      source: record.source,
    }))
  } catch (error) {
    console.error("Error fetching user attendance history:", error)
    throw new Error("Failed to fetch user attendance history")
  }
}

// Generate PDF for the entire report
export async function generatePDF(fromDate: string, toDate: string, reportData: any[]) {
  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add a page
    const page = pdfDoc.addPage([842, 595]) // A4 landscape
    const { width, height } = page.getSize()

    // Add title
    page.drawText("Attendance Report", {
      x: 50,
      y: height - 50,
      size: 24,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    // Add date range
    page.drawText(`Period: ${fromDate} to ${toDate}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    // Add generation date
    page.drawText(`Generated on: ${moment().format("MMMM DD, YYYY HH:mm")}`, {
      x: 50,
      y: height - 100,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Add table headers
    const tableTop = height - 150
    const colWidths = [200, 120, 80, 80, 80, 80]
    const colStarts = [50]

    for (let i = 1; i < colWidths.length; i++) {
      colStarts[i] = colStarts[i - 1] + colWidths[i - 1]
    }

    // Draw header background
    page.drawRectangle({
      x: 50,
      y: tableTop - 20,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    })

    // Draw header text
    const headers = ["Employee", "Department", "Days Present", "Late Days", "Absent Days", "Total Hours"]
    headers.forEach((header, i) => {
      page.drawText(header, {
        x: colStarts[i] + 5,
        y: tableTop - 15,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      })
    })

    // Draw table rows
    let rowY = tableTop - 40
    reportData.forEach((user, index) => {
      // Add a new page if we're running out of space
      if (rowY < 50) {
        const newPage = pdfDoc.addPage([842, 595])
        rowY = height - 50

        // Draw header background on new page
        newPage.drawRectangle({
          x: 50,
          y: rowY - 20,
          width: colWidths.reduce((a, b) => a + b, 0),
          height: 20,
          color: rgb(0.9, 0.9, 0.9),
        })

        // Draw header text on new page
        headers.forEach((header, i) => {
          newPage.drawText(header, {
            x: colStarts[i] + 5,
            y: rowY - 15,
            size: 10,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          })
        })

        rowY -= 40
        const page = newPage
      }

      // Draw row background (alternating colors)
      page.drawRectangle({
        x: 50,
        y: rowY - 20,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95),
      })

      // Draw row data
      const rowData = [
        `${user.firstName} ${user.lastName}`,
        user.departmentId?.name || user.position || "N/A",
        user.attendanceCount.toString(),
        user.lateCount.toString(),
        user.absentCount.toString(),
        user.totalHours.toFixed(2),
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
    })

    // Add summary
    const summaryY = rowY - 40
    page.drawText("Summary", {
      x: 50,
      y: summaryY,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    const totalPresent = reportData.reduce((sum, user) => sum + user.attendanceCount, 0)
    const totalLate = reportData.reduce((sum, user) => sum + user.lateCount, 0)
    const totalAbsent = reportData.reduce((sum, user) => sum + user.absentCount, 0)
    const totalHours = reportData.reduce((sum, user) => sum + user.totalHours, 0)

    page.drawText(`Total Employees: ${reportData.length}`, {
      x: 50,
      y: summaryY - 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Total Present Days: ${totalPresent.toFixed(1)}`, {
      x: 50,
      y: summaryY - 40,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Total Late Days: ${totalLate}`, {
      x: 50,
      y: summaryY - 60,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Total Absent Days: ${totalAbsent}`, {
      x: 50,
      y: summaryY - 80,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    page.drawText(`Total Hours: ${totalHours.toFixed(2)}`, {
      x: 50,
      y: summaryY - 100,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save()

    // Create a blob and download
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Attendance_Report_${fromDate}_to_${toDate}.pdf`
    link.click()

    // Clean up
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
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add a page
    const page = pdfDoc.addPage([595, 842]) // A4 portrait
    const { width, height } = page.getSize()

    // Add title
    page.drawText(`Attendance Report: ${userName}`, {
      x: 50,
      y: height - 50,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    // Add date range
    page.drawText(`Period: ${fromDate} to ${toDate}`, {
      x: 50,
      y: height - 80,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    })

    // Add generation date
    page.drawText(`Generated on: ${moment().format("MMMM DD, YYYY HH:mm")}`, {
      x: 50,
      y: height - 100,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    })

    // Calculate summary statistics
    const presentDays = attendanceData.filter((r) => r.status === "present").length
    const lateDays = attendanceData.filter((r) => r.status === "late").length
    const absentDays = attendanceData.filter((r) => r.status === "absent").length
    const halfDays = attendanceData.filter((r) => r.status === "half-day").length

    const totalHours = attendanceData.reduce((total, record) => {
      if (record.duration && record.duration !== "-") {
        const [hours, minutes] = record.duration.split(":").map(Number)
        return total + hours + minutes / 60
      }
      return total
    }, 0)

    // Add summary section
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

    // Present Days Box
    page.drawRectangle({
      x: boxStartX,
      y: boxStartY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    })

    page.drawText("Present Days", {
      x: boxStartX + 10,
      y: boxStartY + boxHeight - 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    })

    page.drawText(presentDays.toString(), {
      x: boxStartX + 10,
      y: boxStartY + boxHeight - 45,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    // Late Days Box
    page.drawRectangle({
      x: boxStartX + boxWidth + boxGap,
      y: boxStartY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    })

    page.drawText("Late Days", {
      x: boxStartX + boxWidth + boxGap + 10,
      y: boxStartY + boxHeight - 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    })

    page.drawText(lateDays.toString(), {
      x: boxStartX + boxWidth + boxGap + 10,
      y: boxStartY + boxHeight - 45,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    // Absent Days Box
    page.drawRectangle({
      x: boxStartX + (boxWidth + boxGap) * 2,
      y: boxStartY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    })

    page.drawText("Absent Days", {
      x: boxStartX + (boxWidth + boxGap) * 2 + 10,
      y: boxStartY + boxHeight - 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    })

    page.drawText(absentDays.toString(), {
      x: boxStartX + (boxWidth + boxGap) * 2 + 10,
      y: boxStartY + boxHeight - 45,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    // Total Hours Box
    page.drawRectangle({
      x: boxStartX + (boxWidth + boxGap) * 3,
      y: boxStartY,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    })

    page.drawText("Total Hours", {
      x: boxStartX + (boxWidth + boxGap) * 3 + 10,
      y: boxStartY + boxHeight - 20,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    })

    page.drawText(totalHours.toFixed(2), {
      x: boxStartX + (boxWidth + boxGap) * 3 + 10,
      y: boxStartY + boxHeight - 45,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    })

    // Add table headers
    const tableTop = boxStartY - 30
    const colWidths = [120, 80, 80, 80, 100, 80]
    const colStarts = [50]

    for (let i = 1; i < colWidths.length; i++) {
      colStarts[i] = colStarts[i - 1] + colWidths[i - 1]
    }

    // Draw header background
    page.drawRectangle({
      x: 50,
      y: tableTop - 20,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: 20,
      color: rgb(0.9, 0.9, 0.9),
    })

    // Draw header text
    const headers = ["Date", "Clock In", "Clock Out", "Duration", "Status", "Method"]
    headers.forEach((header, i) => {
      page.drawText(header, {
        x: colStarts[i] + 5,
        y: tableTop - 15,
        size: 10,
        font: helveticaBold,
        color: rgb(0, 0, 0),
      })
    })

    // Draw table rows
    let rowY = tableTop - 40
    let currentPage = page

    attendanceData.forEach((record, index) => {
      // Add a new page if we're running out of space
      if (rowY < 50) {
        const newPage = pdfDoc.addPage([595, 842])
        currentPage = newPage
        rowY = height - 50

        // Draw header background on new page
        newPage.drawRectangle({
          x: 50,
          y: rowY - 20,
          width: colWidths.reduce((a, b) => a + b, 0),
          height: 20,
          color: rgb(0.9, 0.9, 0.9),
        })

        // Draw header text on new page
        headers.forEach((header, i) => {
          newPage.drawText(header, {
            x: colStarts[i] + 5,
            y: rowY - 15,
            size: 10,
            font: helveticaBold,
            color: rgb(0, 0, 0),
          })
        })

        rowY -= 40
        currentPage = newPage
      }

      // Draw row background (alternating colors)
      currentPage.drawRectangle({
        x: 50,
        y: rowY - 20,
        width: colWidths.reduce((a, b) => a + b, 0),
        height: 20,
        color: index % 2 === 0 ? rgb(1, 1, 1) : rgb(0.95, 0.95, 0.95),
      })

      // Draw row data
      const rowData = [
        record.date,
        record.clockIn,
        record.clockOut,
        record.duration,
        record.status.charAt(0).toUpperCase() + record.status.slice(1),
        record.clockType || "N/A",
      ]

      rowData.forEach((data, i) => {
        currentPage.drawText(data, {
          x: colStarts[i] + 5,
          y: rowY - 15,
          size: 10,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        })
      })

      rowY -= 20
    })

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save()

    // Create a blob and download
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${userName}_Attendance_${fromDate}_to_${toDate}.pdf`
    link.click()

    // Clean up
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error generating user PDF:", error)
    throw new Error("Failed to generate user PDF")
  }
}
