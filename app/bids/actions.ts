'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function submitBid(formData: FormData) {
  const supabase = await createClient();

  const { data: orgRows } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgRows?.[0]?.id;
  if (!orgId) {
    redirect('/dashboard?error=' + encodeURIComponent('Organizasyon bulunamadı'));
  }

  const projectId = formData.get('project_id') as string;
  const workItemId = formData.get('work_item_id') as string;
  const subcontractorId = formData.get('subcontractor_id') as string;
  const iscilik = formData.get('iscilik_fiyat') as string;
  const malzeme = formData.get('malzeme_fiyat') as string;
  const birim = formData.get('birim') as string;
  const miktar = formData.get('miktar') as string;

  const { data: comparison } = await supabase.rpc('compare_subcontractor_bid', {
    p_organization_id: orgId,
    p_project_id: projectId,
    p_work_item_id: workItemId,
    p_iscilik_fiyat: iscilik,
    p_malzeme_fiyat: malzeme,
    p_birim: birim,
    p_threshold_percent: '10',
  });

  const { error: insertError } = await supabase.from('contract_bids').insert({
    organization_id: orgId,
    project_id: projectId,
    work_item_id: workItemId,
    subcontractor_id: subcontractorId,
    iscilik_fiyat: iscilik,
    malzeme_fiyat: malzeme,
    birim,
    miktar: miktar || 1,
    durum: 'gonderildi',
  });

  if (insertError) {
    redirect('/dashboard?error=' + encodeURIComponent('Teklif kaydedilemedi: ' + insertError.message));
  }

  const warning = comparison?.warning === true;
  const msg = comparison?.message ?? '';
  redirect('/dashboard?success=' + encodeURIComponent('Teklif kaydedildi' + (warning ? ' | ⚠️ ' + msg : '')));
}
