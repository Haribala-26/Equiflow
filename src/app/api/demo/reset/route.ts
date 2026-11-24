import { NextResponse } from "next/server";
import { getRepository } from "@/data/repository";

export async function POST() {
  const repo = getRepository();
  await repo.resetDemo();
  return NextResponse.json({ success: true, message: "Baseline demo dataset restored" });
}
