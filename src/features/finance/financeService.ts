import { receivablesMock } from "./mock";

import type { Receivable } from "./types";


function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function listReceivables(): Promise<Receivable[]> {
  await wait(600); // simula API
  return receivablesMock;
}
