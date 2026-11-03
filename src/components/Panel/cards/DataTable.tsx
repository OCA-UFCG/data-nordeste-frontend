export type DataTableContent = {
  caption: string;
  columns: string[];
  rows: string[][];
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
          {content.columns.map((column, index) => (
            <th
              key={column}
              scope="col"
              className={`py-2 font-semibold ${index ? "text-right" : "pr-3"} ${index > 1 ? "pl-3" : ""}`}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {content.rows.map(([label, ...values]) => (
          <tr key={label} className="border-b border-grey-100">
            <th scope="row" className="py-1.5 pr-3 font-normal">
              {label}
            </th>
            {values.map((value, index) => (
              <td
                key={index}
                className={`py-1.5 text-right tabular-nums ${index ? "pl-3" : ""}`}
              >
                {value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
