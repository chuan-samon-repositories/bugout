import type { Metadata } from "next";
import Link from "next/link";
import { getContainer } from "@/infrastructure/config";
import { BusinessIdentity, canPromiseReply, ContactChannel, LegalPage } from "@/presentation/components/content";
import { siteConfig } from "@/presentation/config/site";
import { formatNumber, messages } from "@/presentation/i18n";
import { LEGAL_UPDATED_AT, LEGAL_WITHDRAWAL_DAYS } from "@/presentation/i18n/messages/content";
import { routes } from "@/presentation/routes";

const copy = messages.content.terms;
const GUARANTEE_YEARS = 3;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
};

export default function TermsPage() {
  const policy = getContainer().getPricingPolicy();
  const taxPercent = formatNumber(policy.taxRate * 100);
  const sellerName = siteConfig.legal.name ?? siteConfig.name;
  const replies = canPromiseReply();

  return (
    <LegalPage title={copy.title} updatedAt={LEGAL_UPDATED_AT}>
      <h2>1. Objeto y ámbito de aplicación</h2>
      <p>
        Estas condiciones regulan la venta de los productos ofrecidos en la tienda online {siteConfig.name} a
        consumidores con domicilio de entrega en la España peninsular o en las islas Baleares. Al realizar un pedido declaras haberlas leído y aceptado. Se
        aplica la versión vigente en el momento en que haces tu pedido.
      </p>
      <p>
        Si la tienda funciona en modo demostración, no se procesa ningún pedido real, no se realiza ningún cobro y no
        se envía ningún producto.
      </p>

      <h2>2. Identificación del vendedor</h2>
      <BusinessIdentity
        fallback={
          <p>
            Para cualquier consulta sobre la tienda o tus pedidos, <ContactChannel />.
          </p>
        }
      />

      <h2>3. Precios e impuestos</h2>
      <ul>
        <li>Los precios se muestran en euros e incluyen el IVA ({taxPercent} %).</li>
        <li>
          Los gastos de envío se indican por separado y se suman antes de que confirmes el pedido. Consulta las tarifas
          en <Link href={routes.shippingReturns}>envíos y devoluciones</Link>.
        </li>
        <li>
          El precio aplicable es el que figura en la tienda en el momento de realizar el pedido. Si detectamos un error
          evidente en un precio, te avisaremos antes de enviar el pedido y podrás confirmarlo con el precio correcto o
          cancelarlo sin coste.
        </li>
      </ul>

      <h2>4. Proceso de compra</h2>
      <ol>
        <li>Añade los productos que quieras al carrito.</li>
        <li>Inicia la compra desde el carrito e introduce tus datos de contacto y la dirección de entrega.</li>
        <li>Elige la modalidad de envío y revisa el resumen del pedido con el importe total.</li>
        <li>Confirma el pedido. Hasta ese momento puedes corregir cualquier dato o volver al carrito.</li>
      </ol>
      <p>
        El contrato se formaliza en español cuando confirmas el pedido. Te enviaremos una confirmación a la dirección
        de correo electrónico que nos indiques. Guardamos el documento electrónico del pedido y puedes solicitarnos una
        copia en cualquier momento.
      </p>

      <h2>5. Pago</h2>
      <p>
        El pago se procesa en la plataforma segura del proveedor de pago que utiliza la tienda en cada momento (por
        ejemplo, el checkout de Shopify). Los medios de pago disponibles se muestran antes de confirmar la compra. En
        ningún momento recibimos ni almacenamos los datos de tu tarjeta.
      </p>

      <h2>6. Envío y entrega</h2>
      <p>
        Enviamos a la España peninsular y a las islas Baleares con las modalidades, precios y plazos indicados en{" "}
        <Link href={routes.shippingReturns}>envíos y devoluciones</Link>. Salvo que se indique otro plazo, entregaremos
        tu pedido como máximo en 30 días naturales desde su confirmación. Si no podemos cumplir el plazo, te
        informaremos y podrás cancelar el pedido con el reembolso íntegro de lo pagado. El riesgo de pérdida o daño de
        los productos pasa a ti en el momento de la entrega.
      </p>

      <h2>7. Derecho de desistimiento</h2>
      <p>
        Como consumidor, dispones de un plazo de {LEGAL_WITHDRAWAL_DAYS} días naturales desde la recepción del pedido para desistir de la
        compra sin indicar el motivo, conforme a los artículos 102 y siguientes del texto refundido de la Ley General
        para la Defensa de los Consumidores y Usuarios (Real Decreto Legislativo 1/2007).
        {siteConfig.returnWindowDays > LEGAL_WITHDRAWAL_DAYS &&
          ` Nuestra política de devoluciones amplía este plazo a ${siteConfig.returnWindowDays} días naturales.`}{" "}
        Las condiciones, las excepciones, el procedimiento y los plazos de reembolso se detallan en{" "}
        <Link href={routes.shippingReturns}>envíos y devoluciones</Link>. Al final de estas condiciones encontrarás el
        modelo de formulario de desistimiento.
      </p>

      <h2>8. Garantía legal de conformidad</h2>
      <p>
        Todos los productos cuentan con la garantía legal de conformidad de {GUARANTEE_YEARS} años desde la entrega
        prevista en el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios. Si un producto
        no es conforme con el contrato, puedes elegir entre su reparación o su sustitución, salvo que la opción elegida
        resulte imposible o desproporcionada. Cuando ninguna de las dos sea posible, podrás pedir una rebaja del precio o
        la resolución del contrato. Se presume que la falta de conformidad que se manifieste en los dos primeros años
        desde la entrega ya existía cuando recibiste el producto.
      </p>
      <p>
        Algunos productos incluyen además una garantía comercial, indicada en su ficha, que se suma a la garantía legal
        y no la sustituye.
      </p>

      <h2>9. Responsabilidad</h2>
      <p>
        Nuestros kits están pensados para ayudarte en una emergencia, pero no sustituyen las instrucciones de los
        servicios de emergencia ni de las autoridades de protección civil. En una situación de peligro, llama al 112.
        Utiliza cada producto conforme a sus instrucciones y comprueba periódicamente la fecha de caducidad de los
        alimentos, el agua y el material sanitario.
      </p>
      <p>
        Respondemos de los daños causados por el incumplimiento de estas condiciones en los términos previstos por la
        ley. Nada de lo dispuesto aquí limita los derechos que la normativa de protección de los consumidores te
        reconoce.
      </p>

      <h2>10. Atención al cliente y reclamaciones</h2>
      <p>
        Para enviarnos cualquier consulta, queja o reclamación, <ContactChannel topic="order" />.{" "}
        {replies
          ? "Te responderemos lo antes posible y, en todo caso, dentro de los plazos legales."
          : "Las reclamaciones se atienden dentro de los plazos legales."}{" "}
        También tienes a tu disposición hojas de reclamaciones oficiales
        {replies ? ", que puedes solicitarnos por el mismo medio." : "."}
      </p>
      <p>
        Si no quedas satisfecho con nuestra respuesta, puedes acudir a los servicios de consumo de tu comunidad autónoma
        o de tu ayuntamiento, o solicitar la mediación del Sistema Arbitral de Consumo. La plataforma europea de
        resolución de litigios en línea (ODR) dejó de funcionar el 20 de julio de 2025, por lo que ya no es posible
        presentar reclamaciones a través de ella.
      </p>

      <h2>11. Legislación aplicable y jurisdicción</h2>
      <p>
        Estas condiciones se rigen por la legislación española. Para cualquier controversia, como consumidor puedes
        acudir a los juzgados y tribunales de tu domicilio.
      </p>

      <h2>12. Modificación de las condiciones</h2>
      <p>
        Podemos actualizar estas condiciones para adaptarlas a cambios legales o del servicio. Los cambios se aplican a
        los pedidos realizados después de su publicación en esta página; cada pedido se rige por la versión vigente
        cuando lo hiciste.
      </p>

      <h2>13. Modelo de formulario de desistimiento</h2>
      <p>Solo tienes que completar y enviarnos este formulario si deseas desistir del contrato.</p>
      <div className="my-6 rounded-lg border border-sand bg-sand/40 px-4 sm:px-6 [&>:first-child]:mt-4 [&>:last-child]:mb-4 sm:[&>:first-child]:mt-6 sm:[&>:last-child]:mb-6">
        <p>
          A la atención de {sellerName}
          {siteConfig.legal.address ? `, ${siteConfig.legal.address}` : ""}
          {siteConfig.contactEmail ? `, ${siteConfig.contactEmail}` : ""}:
        </p>
        <p>
          Por la presente le comunico/comunicamos (*) que desisto de mi/desistimos de nuestro (*) contrato de venta del
          siguiente bien:
        </p>
        <p>Pedido el/recibido el (*):</p>
        <p>Nombre del consumidor o de los consumidores:</p>
        <p>Domicilio del consumidor o de los consumidores:</p>
        <p>Firma del consumidor o de los consumidores (solo si el presente formulario se presenta en papel):</p>
        <p>Fecha:</p>
        <p className="text-sm text-muted">(*) Táchese lo que no proceda.</p>
      </div>
    </LegalPage>
  );
}
