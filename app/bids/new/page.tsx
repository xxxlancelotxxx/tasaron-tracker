import { createClient } from '@/lib/supabase/server';
import { submitBid } from '../actions';

export const dynamic = 'force-dynamic';

type Project = { id: string; name: string };
type WorkItem = { id: string; item_code: string; description: string; unit: string };
type Subcontractor = { id: string; company_name: string };

export default async function NewBidPage() {
  const supabase = await createClient();

  const [projects, workItems, subcontractors] = await Promise.all([
    supabase.from('projects').select('id, name').order('name'),
    supabase.from('work_items').select('id, item_code, description, unit').order('item_code'),
    supabase.from('subcontractors').select('id, company_name').order('company_name'),
  ]);

  const projList = (projects.data ?? []) as Project[];
  const wiList = (workItems.data ?? []) as WorkItem[];
  const subList = (subcontractors.data ?? []) as Subcontractor[];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl">
        <a href="/dashboard" className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-700">
          ← Geri dön
        </a>
        <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Yeni Taşeron Teklifi</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Fiyatı girin — sistem diğer şantiyelerle otomatik karşılaştırır ve pahalıysa uyarır.
        </p>

        <form action={submitBid} className="mt-6 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Proje / Şantiye</label>
              <select name="project_id" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                {projList.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Taşeron</label>
              <select name="subcontractor_id" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                {subList.map((s) => (
                  <option key={s.id} value={s.id}>{s.company_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">İş Kalemi</label>
            <select name="work_item_id" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              {wiList.map((w) => (
                <option key={w.id} value={w.id}>{w.item_code} — {w.description} ({w.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">İşçilik Fiyatı (₺)</label>
              <input name="iscilik_fiyat" type="number" step="0.01" min="0" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Malzeme Fiyatı (₺)</label>
              <input name="malzeme_fiyat" type="number" step="0.01" min="0" required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Birim</label>
              <input name="birim" type="text" required placeholder="m³, ton, m²..." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300">Miktar</label>
            <input name="miktar" type="number" step="0.0001" min="0" defaultValue="1" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Teklifi Gönder
          </button>
        </form>
      </div>
    </main>
  );
}
