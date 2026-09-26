import type { PricingPolicy } from "@/domain/entities/order/OrderPricing";
import { getContainer } from "@/infrastructure/config";
import { formatMoney, messages } from "@/presentation/i18n";
import { TableScroll, tableClasses } from "./TableScroll";

export interface PricingTableProps {
  /** Defaults to the store policy from the container. */
  policy?: PricingPolicy;
}

/** Every shipping rate of the pricing policy as an accessible table. */
export function PricingTable({ policy = getContainer().getPricingPolicy() }: PricingTableProps) {
  const copy = messages.content.pricingTable;
  return (
    <TableScroll label={copy.scrollHint}>
      <table className={tableClasses.table}>
        <caption className={tableClasses.caption}>{copy.caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={tableClasses.headCell}>{copy.method}</th>
            <th scope="col" className={tableClasses.headCell}>{copy.price}</th>
            <th scope="col" className={tableClasses.headCell}>{copy.delivery}</th>
          </tr>
        </thead>
        <tbody>
          {policy.shippingRates.map((rate) => (
            <tr key={rate.id}>
              <th scope="row" className={tableClasses.rowHeader}>{messages.common.shippingMethods[rate.id]}</th>
              <td className={tableClasses.cell}>
                <span className="block">{formatMoney(rate.price)}</span>
                {rate.freeFrom && (
                  <span className="block text-success">{copy.freeFrom(formatMoney(rate.freeFrom))}</span>
                )}
              </td>
              <td className={tableClasses.cell}>{copy.deliveryDays(rate.deliveryDays.min, rate.deliveryDays.max)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableScroll>
  );
}
