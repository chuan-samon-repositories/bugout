import { messages } from "@/presentation/i18n";
import { TableScroll, tableClasses } from "./TableScroll";

/** Every cookie and browser-storage entry the shop uses. */
export function CookieTable() {
  const copy = messages.content.cookieTable;
  return (
    <TableScroll label={copy.scrollHint}>
      <table className={`${tableClasses.table} min-w-[48rem]`}>
        <caption className={tableClasses.caption}>{copy.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={tableClasses.headCell}>{copy.name}</th>
            <th scope="col" className={tableClasses.headCell}>{copy.provider}</th>
            <th scope="col" className={tableClasses.headCell}>{copy.purpose}</th>
            <th scope="col" className={tableClasses.headCell}>{copy.category}</th>
            <th scope="col" className={tableClasses.headCell}>{copy.duration}</th>
          </tr>
        </thead>
        <tbody>
          {copy.items.map((item) => (
            <tr key={item.name}>
              <th scope="row" className={tableClasses.rowHeader}>
                <code className="break-all font-mono text-xs">{item.name}</code>
                <span className="mt-1 block text-xs font-normal text-muted">{item.storage}</span>
              </th>
              <td className={tableClasses.cell}>{item.provider}</td>
              <td className={tableClasses.cell}>{item.purpose}</td>
              <td className={tableClasses.cell}>{copy.categories[item.category]}</td>
              <td className={tableClasses.cell}>{item.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
