"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

const DOCUMENT_BUCKET = "documents";
const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

export async function approveTimesheet(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  await supabase.from("timesheets").update({ durum: "onaylandi", onay_tarihi: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/timesheets");
}

export async function rejectTimesheet(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  await supabase.from("timesheets").update({ durum: "reddedildi", onay_tarihi: new Date().toISOString() }).eq("id", id);
  revalidatePath("/dashboard/timesheets");
}

export async function submitTimesheet(formData: FormData) {
  const supabase = await createClient();

  const { data: org } = await supabase.from("organizations").select("id").limit(1).single();
  const orgId = org?.id;
  if (!orgId) return;

  const projectId = formData.get("project_id") as string;
  const subcontractorId = formData.get("subcontractor_id") as string;
  const workItemId = (formData.get("work_item_id") as string) || null;
  const tarih = formData.get("tarih") as string;
  const isciSayisi = Number(formData.get("isci_sayisi") as string) || 0;
  const adamSaat = Number(formData.get("adam_saat") as string) || 0;
  const kategori = (formData.get("kategori") as string) || "Türk";
  const direkIndirek = (formData.get("direk_indirek") as string) || "Direkt";
  const notlar = (formData.get("notlar") as string) || null;

  const { data: timesheet, error: timesheetError } = await supabase.from("timesheets").insert({
    organization_id: orgId,
    project_id: projectId,
    subcontractor_id: subcontractorId,
    work_item_id: workItemId,
    tarih,
    isci_sayisi: isciSayisi,
    adam_saat: adamSaat,
    kategori,
    direk_indirek: direkIndirek,
    notlar,
    durum: "onay_bekliyor",
  }).select("id").single();

  if (timesheetError || !timesheet) return;

  const evidence = formData.get("evidence");
  if (evidence instanceof File && evidence.size > 0) {
    if (evidence.size > MAX_DOCUMENT_BYTES) {
      revalidatePath("/dashboard/timesheets");
      return;
    }

    try {
      const admin = createAdminClient();
      const path = `${orgId}/${projectId}/timesheets/${timesheet.id}/${evidence.name}`;
      const upload = await admin.storage.from(DOCUMENT_BUCKET).upload(path, evidence, {
        contentType: evidence.type || "application/octet-stream",
        upsert: false,
      });

      if (!upload.error) {
        await admin.from("documents").insert({
          organization_id: orgId,
          project_id: projectId,
          work_item_id: workItemId,
          timesheet_id: timesheet.id,
          name: evidence.name,
          storage_path: path,
          doc_type: "diger",
          mime_type: evidence.type || null,
          size_bytes: evidence.size,
        });
      }
    } catch {
      // Intentional fallback: keep the timesheet when Storage is unavailable.
    }
  }

  revalidatePath("/dashboard/timesheets");
}
