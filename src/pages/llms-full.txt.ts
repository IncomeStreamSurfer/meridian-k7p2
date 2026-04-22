import type { APIRoute } from "astro";
import { anonClient } from "../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const sb = anonClient();

  const pages = sb ? (await sb.from("pages").select("slug, title, body_html").not("published_at", "is", null)).data : [];

  const stripHtml = (html: string) =>
    html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const body = (pages ?? []).map(p =>
    `# ${p.title}\n\n${stripHtml(p.body_html ?? "")}\n\n---\n`
  ).join("\n");

  const header = `# Meridian — Full Site Content\n\nSpecialty coffee brand. Direct-trade single-origin roasts. Launching 2026.\n\n---\n\n`;

  return new Response(header + body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
