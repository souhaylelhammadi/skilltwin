"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

type SkillEntry = {
  name: string;
  confidence_score: number;
};

type SkillsResponse = {
  total_skills: number;
  categories: Record<string, SkillEntry[]>;
};

async function fetchSkills(): Promise<SkillsResponse> {
  const response = await fetch("/api/profile/skills");
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Erreur lors du chargement du profil.");
  }

  return data;
}

function confidenceBadgeColor(score: number) {
  if (score >= 0.75) return "bg-green-100 text-green-700";
  if (score >= 0.55) return "bg-amber-100 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export default function ProfilePage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["profile-skills"],
    queryFn: fetchSkills,
  });

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="mx-auto w-full max-w-2xl">
        
         <a href="/"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au dashboard
        </a>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-gray-900" />
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Vos compétences détectées
          </h1>
        </div>

        {isLoading && (
          <p className="flex items-center gap-2 text-sm text-gray-600 mt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement de votre profil...
          </p>
        )}

        {isError && (
          <p className="text-sm text-red-600 mt-4">{(error as Error).message}</p>
        )}

        {data && data.total_skills === 0 && (
          <p className="text-sm text-gray-600 mt-4">
            Aucune compétence détectée pour l&apos;instant. Uploadez un CV
            depuis le dashboard pour lancer l&apos;analyse.
          </p>
        )}

        {data && data.total_skills > 0 && (
          <>
            <p className="text-sm text-gray-600 mt-1 mb-6">
              {data.total_skills} compétence{data.total_skills > 1 ? "s" : ""}{" "}
              détectée{data.total_skills > 1 ? "s" : ""} au total.
            </p>

            <div className="flex flex-col gap-6">
              {Object.entries(data.categories).map(([category, skills]) => (
                <div key={category}>
                  <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">
                    {category}
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill.name}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${confidenceBadgeColor(
                          skill.confidence_score
                        )}`}
                      >
                        {skill.name}
                        <span className="text-xs opacity-70">
                          {Math.round(skill.confidence_score * 100)}%
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}