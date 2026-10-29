export type DataTableContent = {
  caption: string;
  columns: [string, string];
  rows: [string, string][];
};

export const DataTable = ({
  content,
  className = "h-64 sm:h-72",
}: {
  content: DataTableContent;
  className?: string;
}) => (
  <div className={`overflow-auto ${className}`}>
    <table className="w-full text-left text-sm text-grey-1100">
      <caption className="sr-only">{content.caption}</caption>
      <thead className="sticky top-0 bg-white">
        <tr className="border-b border-grey-300">
          <th scope="col" className="py-2 pr-3 font-semibold">
            {content.columns[0]}
          </th>
          <th scope="col" className="py-2 text-right font-semibold">
            {content.columns[1]}
          </th>
        </tr>
      </thead>
      <tbody>
        {content.rows.map(([label, value]) => (
          <tr key={label} className="border-b border-grey-100">
            <th scope="row" className="py-1.5 pr-3 font-normal">
              {label}
            </th>
            <td className="py-1.5 text-right tabular-nums">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
