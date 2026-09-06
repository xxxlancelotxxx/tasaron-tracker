import { Building2 } from 'lucide-react';
import { login, signup } from './actions';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-[0_4px_14px_rgba(37,99,235,0.35)]">
            <Building2 className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Taşeron Takip Sistemi
          </h1>
          <p className="mt-1.5 text-[13px] text-slate-500 dark:text-slate-400">
            Teknik Ofis · İhale Analizi · SPI/CPI Takibi
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          <form className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300"
              >
                E-posta
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="ornek@sirket.com"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-medium text-slate-700 dark:text-slate-300"
              >
                Şifre
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                formAction={login}
                className="h-10 flex-1 rounded-lg bg-blue-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 active:bg-blue-800"
              >
                Giriş Yap
              </button>
              <button
                formAction={signup}
                className="h-10 flex-1 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Kayıt Ol
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          Demo hesap için &quot;Kayıt Ol&quot; butonu ile kendi hesabınızı oluşturabilirsiniz.
        </p>
      </div>
    </div>
  );
}
