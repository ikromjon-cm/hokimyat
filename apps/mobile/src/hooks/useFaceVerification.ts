import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../services/api";

export function useFaceVerificationStatus() {
  return useQuery({
    queryKey: ["faceStatus"],
    queryFn: () => api.get("/face/status").then((r) => r.data),
  });
}

export function useUploadReferencePhoto() {
  return useMutation({
    mutationFn: (photoUri: string) => {
      const formData = new FormData();
      formData.append("photo", {
        uri: photoUri,
        type: "image/jpeg",
        name: "reference.jpg",
      } as any);
      return api.post("/face/reference-photo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  });
}

export function useVerifyFace() {
  return useMutation({
    mutationFn: (selfieUri: string) => {
      const formData = new FormData();
      formData.append("selfie", {
        uri: selfieUri,
        type: "image/jpeg",
        name: "selfie.jpg",
      } as any);
      return api.post("/face/verify", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }).then((r) => r.data);
    },
  });
}

export function useEmployeeDirectory() {
  return useQuery({
    queryKey: ["employeeDirectory"],
    queryFn: () => api.get("/admin/employees", { params: { limit: 200 } }).then((r) => r.data),
  });
}
