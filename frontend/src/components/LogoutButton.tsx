"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

async function logoutRequest() {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    throw new Error("Erreur lors de la déconnexion.");
  }
  return response.json();
}

export default function LogoutButton() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: logoutRequest,
    onSuccess: () => {
      router.push("/login");
      router.refresh();
    },
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
    >
      <LogOut className="h-4 w-4" />
      {mutation.isPending ? "..." : "Se déconnecter"}
    </button>
  );
}
