// Envío de correo transaccional vía Resend (https://resend.com).
// Si RESEND_API_KEY no está configurado, no hace nada (no-op) para que la app
// funcione sin cuenta de correo. Nunca lanza: los fallos de email no deben
// romper el flujo de onboarding.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email] RESEND_API_KEY no configurado — se omite el envío a ${input.to}`
      );
    }
    return;
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] Resend respondió ${res.status}: ${detail}`);
    }
  } catch (err) {
    console.error("[email] Error al enviar correo:", err);
  }
}

// Plantilla HTML mínima y consistente para los correos del onboarding.
export function emailLayout(opts: {
  heading: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<p style="margin:24px 0;"><a href="${opts.ctaUrl}" style="background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;display:inline-block;font-weight:600;">${opts.ctaLabel}</a></p>`
      : "";
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0f172a;">
    <h2 style="font-size:18px;">${opts.heading}</h2>
    <p style="font-size:15px;line-height:1.5;color:#334155;">${opts.body}</p>
    ${cta}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="font-size:12px;color:#94a3b8;">Panel de Onboarding — Programa de Telemedicina y Pruebas Diagnósticas</p>
  </div>`;
}
