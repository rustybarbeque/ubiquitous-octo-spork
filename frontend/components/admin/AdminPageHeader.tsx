interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Buttons on the right, e.g. "New item". */
  actions?: React.ReactNode;
}

/** The title row at the top of every admin screen. */
export default function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
