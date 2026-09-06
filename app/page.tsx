import Link from 'next/link';
import { ArrowRight, BarChart3, Building2, LineChart, Scale } from 'lucide-react';

const features = [
  {
    icon: Scale,
    title: 'Fiyat Karşılaştırma',
    desc: 'Aynı iş kaleminde farklı şantiyelerdeki geçmiş teklifleri otomatik kıyaslayın.',
  },
  {
    icon: BarChart3,
    title: 'Taşeron Performansı',
    desc: 'SPI/CPI bazlı performans puanı ile taşeronlarınızı objektif sıralayın.',
  },
  {
    icon: LineChart,
    title: 'Haftalık EVM Raporu',
    desc: 'PV, EV, AC değerleriyle haftalık ilerlemeyi grafik üzerinde izleyin.',
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-100 dark:bg-slate-950">
      <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Building2 className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-sm font-semibold text-slate-900 dark:text-white">Taşeron Takip Sistemi</span>
        </div>
        <Link
          href="/login"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Giriş Yap
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          Teknik Ofis Platformu
        </span>
        <h1 className="mt-6 max-w-2xl text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl sm:leading-tight">
          Şantiye verisi, tek panelden yönetilir.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
          Şantiyeler arası fiyat karşılaştırma, taşeron performans takibi ve haftalık
          SPI/CPI ilerleme raporları — hepsi tek panelde.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Giriş Yap
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Kayıt Ol
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-4xl gap-4 text-left sm:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
              >
                <span className="inline-flex rounded-lg bg-blue-50 p-2 text-blue-600 ring-1 ring-inset ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
