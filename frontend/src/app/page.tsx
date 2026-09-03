import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function Home() {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <main className="flex min-h-screen flex-col items-center bg-white px-6 py-16">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bonjour, {user.first_name || user.email} 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Bienvenue sur votre jumeau numérique professionnel.
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Prochaine étape
          </h2>
          <p className="text-gray-600">
            Uploadez votre CV pour que SkillTwin analyse vos compétences.
          </p>
        </div>
      </div>
    </main>
  );
}
