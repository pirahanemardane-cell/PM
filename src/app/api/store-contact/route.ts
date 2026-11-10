import { NextResponse } from "next/server";
import { getStoreContact } from "@/lib/store-contact";

export async function GET() {
  const c = await getStoreContact();
  return NextResponse.json({
    phone: c.phone,
    email: c.email,
    whatsapp: c.whatsapp,
    chatLabel: c.chatLabel,
  });
}
