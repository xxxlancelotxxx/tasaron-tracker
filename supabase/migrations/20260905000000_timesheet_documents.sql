ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS timesheet_id UUID REFERENCES public.timesheets(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_documents_timesheet
  ON public.documents (timesheet_id);

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;
