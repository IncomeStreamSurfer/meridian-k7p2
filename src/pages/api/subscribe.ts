import type { APIRoute } from "astro";
import { serviceClient } from "../../lib/supabase";
import { hitOrReject } from "../../lib/rate-limit";
import { clampLen } from "../../lib/sanitize";

export const POST: APIRoute = async ({ request }) => {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { ok, retryAfterSec } = hitOrReject(ip);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Retry-After": String(retryAfterSec), "Content-Type": "application/json" },
    });
  }

  let email = "";
  let honeypot = "";
  let renderTs = 0;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    email = body.email ?? "";
    honeypot = body._hp_name ?? "";
    renderTs = Number(body._render_ts ?? 0);
  } else {
    const form = await request.formData();
    email = (form.get("email") as string) ?? "";
    honeypot = (form.get("_hp_name") as string) ?? "";
    renderTs = Number((form.get("_render_ts") as string) ?? "0");
  }

  // Honeypot check
  if (honeypot) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Timing check — must be at least 3s
  if (renderTs && Date.now() - renderTs < 3000) {
    return new Response(JSON.stringify({ error: "Submitted too fast" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  email = clampLen(email.trim().toLowerCase(), 254);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Please enter a valid email address." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const sb = serviceClient();
  if (!sb) {
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error } = await sb
    .from("subscribers")
    .insert({ email, source: "waitlist" });

  if (error) {
    if (error.code === "23505") {
      // Already subscribed — fake success
      return new Response(JSON.stringify({ ok: true, message: "You're already on the list!" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Something went wrong. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
