"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Route,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

type JobRole = {
  id: string;
  name: string;
  description: string;
};

type LearningStep = {
  skill: string;
  priority: "high" | "medium";
  reason: string;
  project_suggestion: string;
  weight: number;
};

type LearningPathResponse = {
  job_role: string;
  current_score: number;
  steps: LearningStep[];
};

async function fetchJobRoles(): Promise<JobRole[]> {
  const response = await fetch("/api/career/roles");
  if (!response.ok) {
    throw new Error("Erreur lors du chargement des métiers.");
  }
  return response.json();
}

async function fetchLearningPath(jobRoleId: string): Promise<LearningPathResponse> {
  const response = await fetch(`/api/learning-path/${jobRoleId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors du calcul du parcours.");
  }

  return data;
}

const PRIORITY_CONFIG = {
  high: {
    label: "Priorité haute",
    icon: <AlertTriangle className="h-4 w-4" />,
    badgeClass: "bg-red-100 text-red-700",
  },
  medium: {
    label: "Priorité moyenne",
    icon: <AlertCircle className="h-4 w-4" />,
    badgeClass: "bg-amber-100 text-amber-700",
  },
};

export default function LearningPathPage() {
  const [selectedJobRoleId, setSelectedJobRoleId] = useState<string | null>(null);

  const rolesQuery = useQuery({
    queryKey: ["job-roles"],
    queryFn: fetchJobRoles,
  });

  const pathQuery = useQuery({
    queryKey: ["learning-path", selectedJobRoleId],
    queryFn: () => fetchLearningPath(selectedJobRoleId as string),
    enabled: !!selectedJobRoleId,
  });

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="mx-auto w-full max-w-2xl">
        
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </a>

        <div className="flex items-center gap-2 mb-6">
          <Route className="h-5 w-5 text-gray-900" />
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Parcours de progression
          </h1>
        </div>

        {rolesQuery.isLoading && (
          <p className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des métiers...
          </p>
        )}

        {rolesQuery.data && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rolesQuery.data.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedJobRoleId(role.id)}
                className={`rounded-lg border p-4 text-left transition-colors ${
                  selectedJobRoleId === role.id
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <p className="font-medium text-gray-900">{role.name}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {role.description}
                </p>
              </button>
            ))}
          </div>
        )}

        {selectedJobRoleId && (
          <div className="mt-8">
            {pathQuery.isLoading && (
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération du parcours...
              </p>
            )}

            {pathQuery.isError && (
              <p className="text-sm text-red-600">
                {(pathQuery.error as Error).message}
              </p>
            )}

            {pathQuery.data && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {pathQuery.data.job_role}
                  </h2>
                  <span className="text-sm text-gray-600">
                    Score actuel : {pathQuery.data.current_score}%
                  </span>
                </div>

                {pathQuery.data.steps.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Félicitations, vous maîtrisez déjà toutes les compétences
                    clés pour ce métier !
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {pathQuery.data.steps.map((step, index) => {
                      const config = PRIORITY_CONFIG[step.priority];
                      return (
                        <div
                          key={step.skill}
                          className="rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-400">
                                {index + 1}.
                              </span>
                              <h3 className="font-medium text-gray-900">
                                {step.skill}
                              </h3>
                            </div>
                            <span
                              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badgeClass}`}
                            >
                              {config.icon}
                              {config.label}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mt-2">
                            {step.reason}
                          </p>

                          <div className="flex items-start gap-2 mt-3 rounded-md bg-gray-50 p-3">
                            <Lightbulb className="h-4 w-4 shrink-0 text-gray-500 mt-0.5" />
                            <p className="text-sm text-gray-700">
                              {step.project_suggestion}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
