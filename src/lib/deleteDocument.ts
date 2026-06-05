import axiosInstance from "@/lib/axios";


export const deleteDocumentFromServer = async (fileUrl: string) => {
  try {
    if (!fileUrl) {
      console.warn("deleteDocumentFromServer skipped: No file URL provided.");
      return null;
    }

    const response = await axiosInstance.delete("/documents", {
      data: { fileUrl },
    });

    return response.data;
  } catch (error) {
    console.error("Error executing deleteDocumentFromServer helper:", error);
    throw error;
  }
};
