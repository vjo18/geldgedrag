import fs from "node:fs/promises";
import path from "node:path";
import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  const imagePath = path.resolve("public/astropaper-og.jpg");
  const buffer = await fs.readFile(imagePath);

  return new Response(new Uint8Array(buffer), {
    headers: { "Content-Type": "image/jpeg" },
  });
};
