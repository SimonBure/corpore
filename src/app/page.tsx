'use client';

import Image from "next/image";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "./components/LayoutDashboard";
import { ButtonPrimary } from "./components/ButtonPrimary";
import { StatsCard } from "./components/StatsCard";
import { GalleryGrid } from "./components/GalleryGrid";

const MOCK_GALLERY = [
  { date: "2024-01-10", img: "/public/file.svg" },
  { date: "2024-02-15", img: "/public/globe.svg" },
  { date: "2024-03-20", img: "/public/next.svg" },
  { date: "2024-04-25", img: "/public/vercel.svg" },
  { date: "2024-05-30", img: "/public/window.svg" },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <LayoutDashboard>
      {/* En-tête */}
      <header className="w-full flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <ButtonPrimary onClick={() => router.push("/session/new")}>
          Nouvelle Session
        </ButtonPrimary>
      </header>
      {/* Statistiques */}
      <section className="w-[80%] mx-auto mb-8">
        <StatsCard />
      </section>
      {/* Galerie évolution */}
      <section className="w-[80%] mx-auto">
        <h2 className="text-xl font-semibold mb-4">Galerie de l'évolution</h2>
        <GalleryGrid items={MOCK_GALLERY} />
      </section>
    </LayoutDashboard>
  );
}
