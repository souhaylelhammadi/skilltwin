import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import CvUpload from "@/components/CvUpload";

export default async function Home() {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login");
  }

  const { user } = session;

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 sm:py-12 md:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col gap-4 mb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Bonjour, {user.first_name || user.email}
            </h1>
            <p className="text-sm text-gray-600 mt-1 sm:text-base">
              Bienvenue sur votre jumeau numérique professionnel.
            </p>
          </div>
          <LogoutButton />
        </div>

        <CvUpload />
      </div>
    </main>
  );
}
