"use client";

// A form button that asks "are you sure?" before running a destructive server action.
export function ConfirmButton({
  action,
  message,
  children,
  className = "btn-outline py-1.5 text-red-700",
}: {
  action: () => Promise<void>;
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <button className={className}>{children}</button>
    </form>
  );
}
