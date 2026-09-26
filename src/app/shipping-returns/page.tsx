import type { Metadata } from "next";
import Link from "next/link";
import { getContainer } from "@/infrastructure/config";
import { canPromiseReply, ContactChannel, LegalPage, PricingTable } from "@/presentation/components/content";
import { siteConfig } from "@/presentation/config/site";
import { formatMoney, messages } from "@/presentation/i18n";
import { LEGAL_UPDATED_AT, LEGAL_WITHDRAWAL_DAYS } from "@/presentation/i18n/messages/content";
import { routes } from "@/presentation/routes";

const copy = messages.content.shipping;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
};

export default function ShippingReturnsPage() {
  const policy = getContainer().getPricingPolicy();
  const freeRates = policy.shippingRates.filter((rate) => rate.freeFrom !== null);
  const returnDays = siteConfig.returnWindowDays;
  const extendedWindow = returnDays > LEGAL_WITHDRAWAL_DAYS;
  const replies = canPromiseReply();

  return (
    <LegalPage title={copy.title} updatedAt={LEGAL_UPDATED_AT}>
      <h2>Zona de envío</h2>
      <p>
        Enviamos pedidos a la España peninsular y a las islas Baleares. Por ahora no realizamos envíos a Canarias, Ceuta,
        Melilla ni a otros países, porque nuestros precios incluyen el IVA, que no se aplica en esos territorios.
      </p>

      <h2>Tarifas y plazos de entrega</h2>
      <p>
        Puedes elegir entre las siguientes modalidades de envío. Todos los importes incluyen el IVA y verás el coste
        exacto del envío antes de confirmar tu pedido.
      </p>
      <PricingTable policy={policy} />
      {freeRates.length > 0 && (
        <ul>
          {freeRates.map((rate) => (
            <li key={rate.id}>
              El envío <strong>{messages.common.shippingMethods[rate.id].toLowerCase()}</strong> es gratuito en los
              pedidos cuyo importe de productos, IVA incluido, sea igual o superior a{" "}
              {rate.freeFrom && formatMoney(rate.freeFrom)}.
            </li>
          ))}
        </ul>
      )}

      <h3>Cómo se calculan los plazos</h3>
      <ul>
        <li>
          Los plazos se expresan en <strong>días laborables</strong>: de lunes a viernes, sin contar sábados, domingos
          ni festivos.
        </li>
        <li>Empiezan a contar a partir de la confirmación del pedido.</li>
        <li>
          Son plazos estimados. Pueden alargarse por causas ajenas a nosotros, como incidencias del transporte o
          condiciones meteorológicas adversas. Si tu pedido va a retrasarse, te lo comunicaremos.
        </li>
      </ul>

      <h2>Devoluciones</h2>
      <h3>Plazo para devolver un pedido</h3>
      {extendedWindow ? (
        <p>
          Tienes <strong>{returnDays} días naturales</strong> desde que recibes tu pedido para devolverlo sin necesidad
          de indicar el motivo. Este plazo amplía el derecho de desistimiento de {LEGAL_WITHDRAWAL_DAYS} días
          naturales que te reconoce el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios
          (Real Decreto Legislativo 1/2007, de 16 de noviembre).
        </p>
      ) : (
        <p>
          Tienes <strong>{LEGAL_WITHDRAWAL_DAYS} días naturales</strong> desde que recibes tu pedido para desistir de
          la compra sin necesidad de indicar el motivo, tal como establece el texto refundido de la Ley General para la
          Defensa de los Consumidores y Usuarios (Real Decreto Legislativo 1/2007, de 16 de noviembre).
        </p>
      )}
      <p>
        Si tu pedido llega en varios envíos, el plazo empieza a contar desde que recibes el último producto.
      </p>

      <h3>Estado de los productos</h3>
      <p>
        Devuelve los productos completos, con todos sus accesorios y, si es posible, en su embalaje original. Puedes
        examinarlos como lo harías en una tienda física, pero si los usas más allá de lo necesario para comprobar su
        naturaleza, sus características y su funcionamiento, podremos descontar del reembolso la depreciación
        resultante.
      </p>
      <p>
        Por razones de protección de la salud y de higiene, no se pueden devolver los productos precintados que hayas
        desprecintado tras la entrega, como alimentos de emergencia o material sanitario de un solo uso cuyo envase se
        haya abierto.
      </p>

      <h3>Cómo solicitar una devolución</h3>
      <ol>
        <li>
          Comunícanos tu decisión e indica tu número de pedido y los productos que quieres devolver:{" "}
          <ContactChannel topic="order" />.
        </li>
        <li>
          {replies
            ? "Te responderemos con las instrucciones y la dirección a la que debes enviar los productos."
            : "Cada solicitud se tramita con unas instrucciones y una dirección a la que enviar los productos."}
        </li>
        <li>
          Envía los productos bien embalados en un plazo máximo de {LEGAL_WITHDRAWAL_DAYS} días naturales desde que
          nos comunicas tu decisión.
        </li>
      </ol>
      <p>
        Si lo prefieres, puedes comunicarnos tu decisión con el modelo de formulario de desistimiento que encontrarás
        en las <Link href={routes.terms}>condiciones de venta</Link>, aunque no es obligatorio usarlo.
      </p>
      <p>
        Los gastos directos de la devolución corren a tu cargo, salvo que el producto sea defectuoso o no se corresponda
        con lo que pediste.
      </p>

      <h3>Reembolsos</h3>
      <ul>
        <li>
          Te reembolsaremos el importe en un plazo máximo de {LEGAL_WITHDRAWAL_DAYS} días naturales desde que nos
          comuniques tu decisión de desistir.
        </li>
        <li>
          Usaremos el mismo medio de pago que utilizaste en la compra, salvo que acuerdes expresamente otro, y el
          reembolso no te supondrá ningún coste.
        </li>
        <li>
          Podremos retener el reembolso hasta haber recibido los productos o hasta que nos envíes el justificante de
          su envío, según qué ocurra primero.
        </li>
        <li>
          Si devuelves el pedido completo, también te reembolsaremos los gastos de envío iniciales hasta el importe de
          la modalidad estándar. Si elegiste una modalidad más rápida, la diferencia no es reembolsable.
        </li>
      </ul>

      <h2>Productos defectuosos o erróneos</h2>
      <p>
        Si recibes un producto dañado, defectuoso o distinto del que pediste, <ContactChannel topic="order" />
        {replies && " y lo solucionaremos"}. Estos casos están cubiertos
        por la garantía legal de conformidad, que se explica en las{" "}
        <Link href={routes.terms}>condiciones de venta</Link>, y son independientes del plazo de devolución.
      </p>
    </LegalPage>
  );
}
