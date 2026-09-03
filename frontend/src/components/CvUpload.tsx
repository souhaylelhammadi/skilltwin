"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UploadCloud, Loader2, CheckCircle2, XCircle, ArrowRight, FileText } from "lucide-react";

type DocumentStatus = "uploaded" | "processing" | "processed" | "failed";

type DocumentResponse = {
  id: string;
  original_filename: string;
  status: DocumentStatus;
  extracted_text?: string | null;
};

async function uploadCv(file: File): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/documents/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors de l'upload.");
  }

  return data;
}

async function fetchDocument(id: string): Promise<DocumentResponse> {
  const response = await fetch(`/api/documents/${id}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors de la récupération du document.");
  }

  return data;
}

const STATUS_CONFIG: Record<DocumentStatus, { label: string; icon: React.ReactNode; color: string }> = {
  uploaded: {
    label: "En attente de traitement...",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: "text-gray-600",
  },
  processing: {
    label: "Analyse en cours...",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    color: "text-gray-600",
  },
  processed: {
    label: "Analyse terminée",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-green-600",
  },
  failed: {
    label: "Échec de l'analyse",
    icon: <XCircle className="h-4 w-4" />,
    color: "text-red-600",
  },
};

export default function CvUpload() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadCv,
    onSuccess: (data) => {
      setDocumentId(data.id);
    },
  });

  const statusQuery = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => fetchDocument(documentId as string),
    enabled: !!documentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "processed" || status === "failed") {
        return false;
      }
      return 2000;
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  }

  const currentStatus = statusQuery.data?.status;
  const statusConfig = currentStatus ? STATUS_CONFIG[currentStatus] : null;

  return (
    <div className="rounded-lg border border-gray-200 p-4 sm:p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-2 sm:text-lg">
        Votre CV
      </h2>

      {!documentId && (
        <>
          <p className="text-sm text-gray-600 mb-4 sm:text-base">
            Uploadez votre CV (PDF ou DOCX, 5 Mo max) pour que SkillTwin
            analyse vos compétences.
          </p>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-300 px-4 py-8 text-center hover:border-gray-400">
            <UploadCloud className="h-8 w-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Cliquez pour sélectionner un fichier
            </span>
            <span className="text-xs text-gray-500">PDF ou DOCX</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              disabled={uploadMutation.isPending}
              className="hidden"
            />
          </label>
        </>
      )}

      {uploadMutation.isError && (
        <p className="text-sm text-red-600 mt-2">
          {(uploadMutation.error as Error).message}
        </p>
      )}

      {uploadMutation.isPending && (
        <p className="flex items-center gap-2 text-sm text-gray-600 mt-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Envoi du fichier...
        </p>
      )}

      {documentId && currentStatus && statusConfig && (
        <div className="mt-2">
          <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <FileText className="h-4 w-4 shrink-0 text-gray-500" />
            <span className="truncate">
              {statusQuery.data?.original_filename}
            </span>
          </p>
          <p
            className={`flex items-center gap-2 text-sm mt-1 ${statusConfig.color}`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </p>

          {currentStatus === "processed" && (
            
             <a href="/profile"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-gray-900 underline"
            >
              Voir mon profil de compétences
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}