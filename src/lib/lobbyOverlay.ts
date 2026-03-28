export type LobbyOverlay =
  | null
  | { kind: "choice" }
  | { kind: "create"; via: "card" | "choice" }
  | { kind: "join"; via: "card" | "choice" };
