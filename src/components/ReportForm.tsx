import { ActionForm, type FormState } from "@/components/ActionForm";
import { REPORT_REASONS } from "@/lib/legal";

type Reason = (typeof REPORT_REASONS)[number]["id"];

// The shared report form: a reason, details, and an optional email for a reply.
export function ReportForm({
  action,
  hidden,
  reasons,
  askEmail = true,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  hidden: Record<string, string>;
  reasons?: Reason[];
  askEmail?: boolean;
}) {
  const options = reasons ? REPORT_REASONS.filter((r) => reasons.includes(r.id)) : REPORT_REASONS;
  return (
    <ActionForm action={action} submitLabel="Send report">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div>
        <label className="label" htmlFor="reason">What&apos;s wrong?</label>
        <select className="input" id="reason" name="reason" required defaultValue="">
          <option value="" disabled>Choose…</option>
          {options.map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="details">What happened? (optional)</label>
        <textarea className="input min-h-24" id="details" name="details" maxLength={2000} placeholder="Dates, amounts, what they asked for. Don't include card or bank numbers." />
      </div>
      {askEmail && (
        <div>
          <label className="label" htmlFor="email">Your email (optional, if you want a reply)</label>
          <input className="input" id="email" name="email" type="email" />
        </div>
      )}
    </ActionForm>
  );
}
