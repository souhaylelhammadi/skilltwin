"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Target,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FlaskConical,
} from "lucide-react";

type JobRole = {
  id: string;
  name: string;
  description: string;
};

type ScoredSkill = {
  name: string;
  weight: number;
  confidence_score?: number;
  simulated?: boolean;
};

type CareerScoreResponse = {
  job_role: string;
  score: number;
  mastered: ScoredSkill[];
  to_improve: ScoredSkill[];
  missing: ScoredSkill[];
};

async function fetchJobRoles(): Promise<JobRole[]> {
  const response = await fetch("/api/career/roles");
  if (!response.ok) {
    throw new Error("Erreur lors du chargement des métiers.");
  }
  return response.json();
}

async function fetchCareerScore(jobRoleId: string): Promise<CareerScoreResponse> {
  const response = await fetch(`/api/career/score/${jobRoleId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors du calcul du score.");
  }

  return data;
}

async function simulateScore(
  jobRoleId: string,
  skillNames: string[]
): Promise<CareerScoreResponse> {
  const response = await fetch(`/api/career/simulate/${jobRoleId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skill_names: skillNames }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors de la simulation.");
  }

  return data;
}

function SkillList({
  title,
  skills,
  icon,
  colorClass,
}: {
  title: string;
  skills: ScoredSkill[];
  icon: React.ReactNode;
  colorClass: string;
}) {
  if (skills.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className={`flex items-center gap-1.5 text-sm font-semibold ${colorClass}`}>
        {icon}
        {title} ({skills.length})
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {skills.map((skill) => (
          <span
            key={skill.name}
            className={`rounded-full px-3 py-1 text-sm ${
              skill.simulated
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {skill.name}
            {skill.simulated ? " (simulé)" : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CareerPage() {
  const [selectedJobRoleId, setSelectedJobRoleId] = useState<string | null>(null);
  const [selectedSkillsToSimulate, setSelectedSkillsToSimulate] = useState<string[]>([]);
  const [simulationResult, setSimulationResult] = useState<CareerScoreResponse | null>(null);

  const rolesQuery = useQuery({
    queryKey: ["job-roles"],
    queryFn: fetchJobRoles,
  });

  const scoreQuery = useQuery({
    queryKey: ["career-score", selectedJobRoleId],
    queryFn: () => fetchCareerScore(selectedJobRoleId as string),
    enabled: !!selectedJobRoleId,
  });

  const simulationMutation = useMutation({
    mutationFn: () =>
      simulateScore(selectedJobRoleId as string, selectedSkillsToSimulate),
    onSuccess: (data) => {
      setSimulationResult(data);
    },
  });

  function handleSelectJobRole(id: string) {
    setSelectedJobRoleId(id);
    setSelectedSkillsToSimulate([]);
    setSimulationResult(null);
  }

  function toggleSkillSimulation(skillName: string) {
    setSimulationResult(null);
    setSelectedSkillsToSimulate((prev) =>
      prev.includes(skillName)
        ? prev.filter((s) => s !== skillName)
        : [...prev, skillName]
    );
  }

  const simulatableSkills = [
    ...(scoreQuery.data?.missing || []),
    ...(scoreQuery.data?.to_improve || []),
  ];

  const displayedResult = simulationResult || scoreQuery.data;

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
          <Target className="h-5 w-5 text-gray-900" />
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Career Score
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
                onClick={() => handleSelectJobRole(role.id)}
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
          <div className="mt-8 rounded-lg border border-gray-200 p-4 sm:p-6">
            {scoreQuery.isLoading && (
              <p className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calcul du score...
              </p>
            )}

            {scoreQuery.isError && (
              <p className="text-sm text-red-600">
                {(scoreQuery.error as Error).message}
              </p>
            )}

            {displayedResult && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {displayedResult.job_role}
                    {simulationResult ? " (simulation)" : ""}
                  </h2>
                  <span className="text-2xl font-bold text-gray-900">
                    {displayedResult.score}%
                  </span>
                </div>

                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-gray-900 transition-all"
                    style={{ width: `${displayedResult.score}%` }}
                  />
                </div>

                <SkillList
                  title="Compétences maîtrisées"
                  skills={displayedResult.mastered}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  colorClass="text-green-700"
                />
                <SkillList
                  title="À améliorer"
                  skills={displayedResult.to_improve}
                  icon={<AlertCircle className="h-4 w-4" />}
                  colorClass="text-amber-700"
                />
                <SkillList
                  title="Compétences manquantes"
                  skills={displayedResult.missing}
                  icon={<XCircle className="h-4 w-4" />}
                  colorClass="text-red-700"
                />
              </>
            )}

            {simulatableSkills.length > 0 && (
              <div className="mt-6 rounded-lg bg-blue-50 p-4">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-blue-900">
                  <FlaskConical className="h-4 w-4" />
                  Simuler l&apos;apprentissage de compétences
                </h3>
                <p className="text-sm text-blue-800 mt-1 mb-3">
                  Cochez des compétences pour voir leur impact sur votre score.
                </p>

                <div className="flex flex-wrap gap-2">
                  {simulatableSkills.map((skill) => (
                    <label
                      key={skill.name}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm ${
                        selectedSkillsToSimulate.includes(skill.name)
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-blue-300 bg-white text-blue-800"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkillsToSimulate.includes(skill.name)}
                        onChange={() => toggleSkillSimulation(skill.name)}
                        className="sr-only"
                      />
                      {skill.name}
                    </label>
                  ))}
                </div>

                <button
                  onClick={() => simulationMutation.mutate()}
                  disabled={
                    selectedSkillsToSimulate.length === 0 ||
                    simulationMutation.isPending
                  }
                  className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {simulationMutation.isPending
                    ? "Calcul..."
                    : "Simuler le nouveau score"}
                </button>

                {simulationResult && (
                  <button
                    onClick={() => {
                      setSimulationResult(null);
                      setSelectedSkillsToSimulate([]);
                    }}
                    className="mt-3 ml-2 text-sm text-blue-700 underline"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
