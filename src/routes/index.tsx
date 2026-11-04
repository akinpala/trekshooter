import { createFileRoute } from "@tanstack/react-router";
import { BananaQuadrant } from "@/game/BananaQuadrant";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <BananaQuadrant />;
}
