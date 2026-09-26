import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { BusinessIdentity, canPromiseReply, ContactChannel, LegalPage } from "@/presentation/components/content";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";
import { LEGAL_UPDATED_AT } from "@/presentation/i18n/messages/content";
import { routes } from "@/presentation/routes";

const copy = messages.content.privacy;

export const metadata: Metadata = {
  title: copy.title,
  description: copy.description,
};

interface Purpose {
  title: string;
  data: string;
  purpose: string;
  legalBasis: string;
  retention: string;
}

const purposes: Purpose[] = [
  {
    title: "Pedidos y compras",
    data: "nombre y apellidos, correo electrónico, teléfono, dirección de entrega, modalidad de envío, observaciones del pedido y productos comprados.",
    purpose: "gestionar tu pedido, entregarlo, emitir la factura y atender incidencias, devoluciones y garantías.",
    legalBasis:
      "la ejecución del contrato de compraventa (art. 6.1.b RGPD) y el cumplimiento de obligaciones legales fiscales y contables (art. 6.1.c RGPD).",
    retention:
      "mientras dure la relación contractual y, después, durante los plazos legales de conservación (hasta seis años para la documentación contable y mercantil) y de prescripción de posibles reclamaciones.",
  },
  {
    title: "Formulario de contacto",
    data: "nombre, correo electrónico, tema, asunto y mensaje.",
    purpose: "responder a tu consulta y, si se refiere a un pedido, gestionarla.",
    legalBasis:
      "nuestro interés legítimo en atender las consultas que recibimos (art. 6.1.f RGPD) y, cuando la consulta se refiere a un pedido, la ejecución del contrato (art. 6.1.b RGPD).",
    retention: "hasta resolver tu consulta y, después, durante el tiempo necesario para atender posibles reclamaciones.",
  },
  {
    title: "Newsletter",
    data: "correo electrónico.",
    purpose: "enviarte novedades y ofertas de la tienda.",
    legalBasis:
      "tu consentimiento (art. 6.1.a RGPD y art. 21 de la LSSI), que prestas al suscribirte o al marcar la casilla correspondiente durante la compra.",
    retention: "hasta que te des de baja o retires tu consentimiento.",
  },
  {
    title: "Analítica web",
    data: "un identificador seudónimo, las páginas que visitas, las acciones que realizas en la tienda (por ejemplo, ver un producto, añadirlo al carrito o avanzar en la compra), datos técnicos del navegador y del dispositivo, y la ubicación aproximada que puede deducirse de la dirección IP.",
    purpose: "elaborar estadísticas de uso para mejorar la tienda.",
    legalBasis:
      "tu consentimiento (art. 6.1.a RGPD y art. 22.2 de la LSSI). Sin tu consentimiento no se carga la herramienta de analítica ni se envía ningún dato.",
    retention:
      "las cookies de analítica caducan al cabo de un año; los datos de uso se conservan solo mientras sean necesarios para elaborar las estadísticas o hasta que retires tu consentimiento.",
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage title={copy.title} updatedAt={LEGAL_UPDATED_AT}>
      <p>
        En {siteConfig.name} tratamos tus datos personales de acuerdo con el Reglamento (UE) 2016/679 General de
        Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los
        derechos digitales (LOPDGDD). En esta página te explicamos qué datos tratamos, para qué y cuáles son tus
        derechos.
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <BusinessIdentity
        fallback={
          <p>
            Para contactar con el responsable del tratamiento, <ContactChannel />.
          </p>
        }
      />

      <h2>2. Qué datos tratamos y para qué</h2>
      <p>
        Solo tratamos los datos que nos facilitas o que se generan cuando usas la tienda, y únicamente para las
        finalidades que se indican a continuación. No elaboramos perfiles con efectos jurídicos ni tomamos decisiones
        automatizadas sobre ti.
      </p>
      {purposes.map((item) => (
        <Fragment key={item.title}>
          <h3>{item.title}</h3>
          <ul>
            <li>
              <strong>Datos:</strong> {item.data}
            </li>
            <li>
              <strong>Finalidad:</strong> {item.purpose}
            </li>
            <li>
              <strong>Base jurídica:</strong> {item.legalBasis}
            </li>
            <li>
              <strong>Conservación:</strong> {item.retention}
            </li>
          </ul>
        </Fragment>
      ))}

      <h3>Situación actual de la tienda</h3>
      <ul>
        <li>
          Si la tienda funciona en modo demostración, los datos que introduces al hacer un pedido no se envían a ningún
          servidor: se procesan en tu navegador y solo se conserva un resumen del último pedido en la sesión del
          navegador hasta que cierras la pestaña.
        </li>
        <li>
          Cuando la compra se realiza con Shopify, los datos del pedido y del pago se introducen directamente en la
          página de pago de Shopify.
        </li>
        <li>
          Los formularios de contacto y de newsletter todavía no están conectados a ningún servicio de correo: los
          datos se comprueban en tu navegador, pero no se envían ni se guardan. Actualizaremos esta política antes de
          conectarlos.
        </li>
        <li>Nunca recibimos ni almacenamos los datos de tu tarjeta de pago.</li>
      </ul>

      <h2>3. Destinatarios y encargados del tratamiento</h2>
      <p>No vendemos tus datos ni los cedemos a terceros para sus propios fines. Solo acceden a ellos:</p>
      <ul>
        <li>
          <strong>El proveedor de alojamiento web</strong>, que sirve las páginas de la tienda y trata los datos
          técnicos de conexión (como la dirección IP) necesarios para ello.
        </li>
        <li>
          <strong>PostHog Inc.</strong>, proveedor de analítica, con los datos alojados en su región de la Unión
          Europea. Solo recibe datos si aceptas las cookies de analítica. Las peticiones pasan por el propio dominio de
          la tienda antes de llegar a PostHog.
        </li>
        <li>
          <strong>Shopify</strong>, cuando se utiliza como plataforma de pago, y los proveedores de pago integrados en
          su checkout, para procesar el pedido y el cobro.
        </li>
        <li>
          <strong>Empresas de transporte</strong>, que reciben el nombre, la dirección y el teléfono necesarios para
          entregar tu pedido.
        </li>
        <li>
          <strong>Administraciones públicas</strong>, como la Agencia Tributaria, cuando exista una obligación legal.
        </li>
      </ul>
      <p>
        Los proveedores que tratan datos por nuestra cuenta lo hacen como encargados del tratamiento, con un contrato
        que les obliga a usarlos solo siguiendo nuestras instrucciones y a protegerlos.
      </p>

      <h2>4. Transferencias internacionales</h2>
      <p>
        Procuramos que tus datos se traten dentro del Espacio Económico Europeo. Algunos de nuestros proveedores, o sus
        subencargados, tienen sede fuera de él y podrían acceder a determinados datos. En ese caso, la transferencia
        solo se realiza con las garantías previstas en el RGPD: una decisión de adecuación de la Comisión Europea (como
        el Marco de Privacidad de Datos UE-EE. UU. para las empresas adheridas) o las cláusulas contractuales tipo
        aprobadas por la Comisión. Puedes pedirnos más información sobre estas garantías.
      </p>

      <h2>5. Tus derechos</h2>
      <p>En cualquier momento puedes ejercer los siguientes derechos:</p>
      <ul>
        <li>
          <strong>Acceso:</strong> saber si tratamos tus datos y obtener una copia.
        </li>
        <li>
          <strong>Rectificación:</strong> corregir los datos inexactos o incompletos.
        </li>
        <li>
          <strong>Supresión:</strong> pedir que eliminemos tus datos cuando ya no sean necesarios.
        </li>
        <li>
          <strong>Oposición:</strong> oponerte a los tratamientos basados en nuestro interés legítimo.
        </li>
        <li>
          <strong>Limitación:</strong> pedir que conservemos tus datos sin tratarlos mientras se resuelve una
          reclamación.
        </li>
        <li>
          <strong>Portabilidad:</strong> recibir los datos que nos has facilitado en un formato estructurado y de uso
          común.
        </li>
        <li>
          <strong>Retirada del consentimiento:</strong> retirar en cualquier momento el consentimiento que hayas dado,
          sin que ello afecte a los tratamientos anteriores. Para la analítica puedes hacerlo desde la{" "}
          <Link href={routes.cookies}>política de cookies</Link>.
        </li>
      </ul>
      <p>
        Para ejercerlos, <ContactChannel />.{" "}
        {canPromiseReply()
          ? "Te responderemos en el plazo de un mes."
          : "La normativa fija un plazo de un mes para atender estas solicitudes."}{" "}
        Si tenemos dudas razonables sobre tu identidad, podremos pedirte información adicional para confirmarla.
      </p>
      <p>
        Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia
        Española de Protección de Datos (<a href="https://www.aepd.es">www.aepd.es</a>).
      </p>

      <h2>6. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas adecuadas al riesgo para proteger tus datos. Entre otras: el carrito
        guardado en tu navegador solo contiene identificadores de producto y cantidades, la analítica permanece
        desactivada hasta que la aceptas y los datos de pago se introducen únicamente en la plataforma del proveedor de
        pago.
      </p>

      <h2>7. Menores de edad</h2>
      <p>
        La tienda no está dirigida a menores de 14 años y no tratamos conscientemente sus datos. Para comprar debes ser
        mayor de edad.
      </p>

      <h2>8. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política cuando cambien nuestros tratamientos o la normativa. Publicaremos cualquier
        cambio en esta página con su fecha de actualización y, si el cambio es relevante, te lo comunicaremos.
      </p>
    </LegalPage>
  );
}
