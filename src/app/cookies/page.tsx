import type { Metadata } from "next";
import Link from "next/link";
import { CookieTable, LegalPage, ManageCookiesButton } from "@/presentation/components/content";
import { messages } from "@/presentation/i18n";
import { LEGAL_UPDATED_AT } from "@/presentation/i18n/messages/content";
import { routes } from "@/presentation/routes";

const copy = messages.content.cookies;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
};

export default function CookiesPage() {
  return (
    <LegalPage title={copy.title} updatedAt={LEGAL_UPDATED_AT}>
      <h2>1. Qué son las cookies y el almacenamiento local</h2>
      <p>
        Las cookies son pequeños archivos que una web guarda en tu navegador. El almacenamiento local (localStorage) y
        el almacenamiento de sesión (sessionStorage) son mecanismos parecidos que permiten guardar datos en tu
        dispositivo: los primeros se conservan hasta que se borran y los segundos desaparecen al cerrar la pestaña. En
        esta política usamos «cookies» para referirnos a todos ellos.
      </p>

      <h2>2. Qué cookies utilizamos</h2>
      <p>Distinguimos dos tipos:</p>
      <ul>
        <li>
          <strong>Necesarias:</strong> hacen funcionar el carrito, la compra y el registro de tu elección sobre las
          cookies. Están exentas de consentimiento (art. 22.2 de la Ley 34/2002, LSSI) y no se usan para seguirte.
        </li>
        <li>
          <strong>Analítica:</strong> las instala PostHog para ayudarnos a entender cómo se usa la tienda. Solo se
          instalan si las aceptas en el aviso de cookies; si no decides o las rechazas, la herramienta de analítica no
          llega a cargarse.
        </li>
      </ul>
      <p>
        En los nombres de PostHog, <code>&lt;clave&gt;</code> es el identificador público del proyecto de analítica de
        la tienda.
      </p>
      <CookieTable />
      <p>
        Si visitaste la tienda antes de su última actualización, es posible que tu navegador conserve la clave antigua{" "}
        <code>shopping-cart</code>. La próxima vez que cargues la tienda, su contenido se traslada a{" "}
        <code>bugout.cart</code> y la clave antigua se elimina.
      </p>
      <p>
        Cuando el pago se realiza con Shopify, su página de pago puede instalar sus propias cookies en el dominio de
        Shopify. Se rigen por la política de cookies de Shopify.
      </p>
      <p>
        No usamos cookies publicitarias ni de redes sociales. Los datos de analítica se tratan como se explica en la{" "}
        <Link href={routes.privacy}>política de privacidad</Link>.
      </p>

      <h2>3. Cómo cambiar tu elección</h2>
      <p>
        Puedes aceptar o rechazar la analítica en cualquier momento. Pulsa el botón para volver a abrir el aviso de
        cookies y elige de nuevo. Si retiras el consentimiento, dejamos de enviar datos de analítica y se restablece el
        identificador de PostHog.
      </p>
      <div className="my-6">
        <ManageCookiesButton />
      </div>

      <h2>4. Cómo gestionar las cookies desde el navegador</h2>
      <p>
        También puedes consultar, bloquear o borrar las cookies y los datos de los sitios web desde la configuración de
        tu navegador, normalmente en el apartado de privacidad o de datos de sitios. Ten en cuenta que, si bloqueas o
        borras el almacenamiento necesario, el carrito se vaciará y volveremos a preguntarte por las cookies.
      </p>

      <h2>5. Cambios en esta política</h2>
      <p>
        Actualizaremos esta política si cambian las cookies que utilizamos. Cuando el cambio afecte a tu consentimiento,
        volveremos a pedírtelo.
      </p>
    </LegalPage>
  );
}
