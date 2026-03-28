// app/api/opd-queue/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const today = () => new Date().toISOString().split("T")[0];

// ── GET — fetch queue status ─────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tokenId = searchParams.get("tokenId");

  if (tokenId) {
    // Patient checking their own position
    const { data: entry } = await getSupabase()
      .from("opd_queue")
      .select("*")
      .eq("id", tokenId)
      .single();

    if (!entry) return NextResponse.json({ error: "Token not found" }, { status: 404 });

    // Count patients waiting ahead
    const { count: waitingAhead } = await getSupabase()
      .from("opd_queue")
      .select("*", { count: "exact", head: true })
      .eq("queue_date", today())
      .eq("status", "waiting")
      .lt("token", entry.token);

    // Get currently serving token
    const { data: calledEntry } = await getSupabase()
      .from("opd_queue")
      .select("token")
      .eq("queue_date", today())
      .eq("status", "called")
      .order("called_at", { ascending: false })
      .limit(1)
      .single();

    const { count: totalWaiting } = await getSupabase()
      .from("opd_queue")
      .select("*", { count: "exact", head: true })
      .eq("queue_date", today())
      .eq("status", "waiting");

    return NextResponse.json({
      token: entry.token,
      name: entry.name,
      status: entry.status,
      waitingAhead: waitingAhead || 0,
      currentServing: calledEntry?.token || 0,
      totalWaiting: totalWaiting || 0,
    });
  }

  // Doctor view — full queue for today
  const { data: queue } = await getSupabase()
    .from("opd_queue")
    .select("*")
    .eq("queue_date", today())
    .order("token", { ascending: true });

  const { data: calledEntry } = await getSupabase()
    .from("opd_queue")
    .select("token")
    .eq("queue_date", today())
    .eq("status", "called")
    .order("called_at", { ascending: false })
    .limit(1)
    .single();

  const waiting = (queue || []).filter(q => q.status === "waiting");
  const done    = (queue || []).filter(q => q.status === "done");

  return NextResponse.json({
    queue: queue || [],
    currentServing: calledEntry?.token || 0,
    totalWaiting: waiting.length,
    totalToday: (queue || []).length,
    doneCount: done.length,
  });
}

// ── POST — queue actions ──────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();

  // ── Patient joins queue ──
  if (body.action === "join") {
    const name = (body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // Get next token number for today
    const { data: last } = await getSupabase()
      .from("opd_queue")
      .select("token")
      .eq("queue_date", today())
      .order("token", { ascending: false })
      .limit(1)
      .single();

    const nextToken = (last?.token || 0) + 1;

    const { data: entry, error } = await getSupabase()
      .from("opd_queue")
      .insert({
        token: nextToken,
        name,
        queue_date: today(),
        status: "waiting",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Count waiting ahead
    const { count: waitingAhead } = await getSupabase()
      .from("opd_queue")
      .select("*", { count: "exact", head: true })
      .eq("queue_date", today())
      .eq("status", "waiting")
      .lt("token", nextToken);

    const { data: calledEntry } = await getSupabase()
      .from("opd_queue")
      .select("token")
      .eq("queue_date", today())
      .eq("status", "called")
      .order("called_at", { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      success: true,
      id: entry.id,
      token: entry.token,
      name: entry.name,
      waitingAhead: (waitingAhead || 0),
      currentServing: calledEntry?.token || 0,
    });
  }

  // ── Doctor calls next patient ──
  if (body.action === "call_next") {
    // Mark any currently called as done first
    await getSupabase()
      .from("opd_queue")
      .update({ status: "done", done_at: new Date().toISOString() })
      .eq("queue_date", today())
      .eq("status", "called");

    // Get next waiting patient
    const { data: next } = await getSupabase()
      .from("opd_queue")
      .select("*")
      .eq("queue_date", today())
      .eq("status", "waiting")
      .order("token", { ascending: true })
      .limit(1)
      .single();

    if (!next) return NextResponse.json({ error: "No patients waiting" }, { status: 400 });

    await getSupabase()
      .from("opd_queue")
      .update({ status: "called", called_at: new Date().toISOString() })
      .eq("id", next.id);

    return NextResponse.json({ success: true, called: next });
  }

  // ── Doctor marks current as done ──
  if (body.action === "mark_done") {
    await getSupabase()
      .from("opd_queue")
      .update({ status: "done", done_at: new Date().toISOString() })
      .eq("id", body.id);
    return NextResponse.json({ success: true });
  }

  // ── Doctor resets queue ──
  if (body.action === "reset") {
    await getSupabase()
      .from("opd_queue")
      .delete()
      .eq("queue_date", today());
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}