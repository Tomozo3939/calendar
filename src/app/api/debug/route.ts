import { NextResponse } from "next/server";

export async function GET() {
  const hasJson = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const hasB64 = !!process.env.GOOGLE_SA_KEY_BASE64;
  
  let jsonValid = false;
  let b64Valid = false;
  let clientEmail = "";
  
  if (hasJson) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
      jsonValid = !!parsed.private_key;
      clientEmail = parsed.client_email || "";
    } catch {}
  }
  
  if (hasB64) {
    try {
      const decoded = Buffer.from(process.env.GOOGLE_SA_KEY_BASE64!, "base64").toString("utf8");
      const parsed = JSON.parse(decoded);
      b64Valid = !!parsed.private_key;
      if (!clientEmail) clientEmail = parsed.client_email || "";
    } catch {}
  }
  
  return NextResponse.json({
    hasJson,
    hasB64,
    jsonValid,
    b64Valid,
    clientEmail: clientEmail.slice(0, 20) + "...",
  });
}
