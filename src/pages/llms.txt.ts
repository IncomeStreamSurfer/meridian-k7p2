import type { APIRoute } from "astro";
import { anonClient } from "../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  const SITE = (import.meta.env.PUBLIC_SITE_URL ?? "https://meridian-k7p2.vercel.app").replace(/\/$/, "");
  const sb = anonClient();

  const pages = sb ? (await sb.from("pages").select("slug, title, meta_description").not("published_at", "is", null)).data : [];
  const articles = sb ? (await sb.from("content").select("slug, title, excerpt").not("published_at", "is", null).order("created_at", { ascending: false }).limit(20)).data : [];

  const lines: string[] = [];
  lines.push("# Meridian");
  lines.push("");
  lines.push("> A specialty coffee brand launching 2026 with direct-trade single-origin roasts and a subscription built around discovery.");
  lines.push("");
  lines.push("## Key pages");
  lines.push("");

  for (const p of (pages ?? [])) {
    const url = p.slug === "home" ? `${SITE}/` : `${SITE}/${p.slug}`;
    lines.push(`- [${p.title}](${url}): ${p.meta_description ?? ""}`);
  }

  if (articles && articles.length > 0) {
    lines.push("");
    lines.push("## Latest articles");
    lines.push("");
    for (const a of articles) {
      lines.push(`- [${a.title}](${SITE}/blog/${a.slug}): ${a.excerpt ?? ""}`);
    }
  }

  lines.push("");
  lines.push("## About");
  lines.push("");
  lines.push(`- [Full site content](${SITE}/llms-full.txt): Complete text of all Meridian pages for LLM ingestion.`);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
