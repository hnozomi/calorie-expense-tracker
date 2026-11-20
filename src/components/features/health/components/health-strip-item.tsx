type Props = {
  label: string;
  // null when the day has no value
  value: string | null;
  // What to show instead of a missing value (未取得, or — when the read failed)
  missing: string;
  hasSeparator?: boolean;
};

export const HealthStripItem = ({
  label,
  value,
  missing,
  hasSeparator = false,
}: Props) => (
  <span className="whitespace-nowrap">
    {hasSeparator && (
      <span aria-hidden="true" className="mr-2 text-muted-foreground">
        ・
      </span>
    )}
    <span className="text-muted-foreground">{label}</span>{" "}
    {value === null ? (
      <span className="text-muted-foreground">{missing}</span>
    ) : (
      <span className="font-semibold text-foreground">{value}</span>
    )}
  </span>
);
