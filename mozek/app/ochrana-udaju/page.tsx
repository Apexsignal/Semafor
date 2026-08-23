import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zásady zpracování osobních údajů — BRAIN ENGINE",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Zásady zpracování osobních údajů</h1>
        <p className="mt-1 text-xs text-mozek-muted">Platnost od 22. 8. 2026</p>
      </div>

      <div className="card flex flex-col gap-6 p-5 text-sm leading-relaxed text-mozek-text sm:p-6">
        <section>
          <h2 className="mb-2 text-base font-semibold">1. Správce údajů</h2>
          <p className="text-mozek-muted">
            [Jméno a příjmení / obchodní firma], IČO: 05010276 (dále jen
            &bdquo;Správce&ldquo;).
            <br />
            Kontakt: [e-mail]
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">2. Jaké údaje zpracováváme</h2>
          <ul className="list-disc space-y-1 pl-5 text-mozek-muted">
            <li>E-mailová adresa — při registraci, waitlistu a pro komunikaci o účtu.</li>
            <li>Fakturační údaje — jméno, adresa, případně IČO, pokud si vyžádáte fakturu.</li>
            <li>
              Údaje o platbě zpracovává výhradně platební brána Stripe —
              Správce čísla platebních karet nikdy nevidí ani neukládá.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">3. Účel zpracování</h2>
          <ul className="list-disc space-y-1 pl-5 text-mozek-muted">
            <li>poskytnutí přístupu ke službě a správa uživatelského účtu,</li>
            <li>zpracování plateb a vystavení faktur,</li>
            <li>komunikace o novinkách, pokud k tomu dáte souhlas.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">4. Právní základ</h2>
          <ul className="list-disc space-y-1 pl-5 text-mozek-muted">
            <li>plnění smlouvy — čl. 6 odst. 1 písm. b) GDPR,</li>
            <li>plnění zákonných povinností (účetnictví) — čl. 6 odst. 1 písm. c) GDPR,</li>
            <li>oprávněný zájem, případně souhlas u marketingové komunikace.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">5. Doba uchování</h2>
          <ul className="list-disc space-y-1 pl-5 text-mozek-muted">
            <li>údaje spojené s aktivním účtem — po dobu trvání účtu,</li>
            <li>účetní doklady — 10 let (zákonná povinnost).</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">6. Příjemci údajů (zpracovatelé)</h2>
          <ul className="list-disc space-y-1 pl-5 text-mozek-muted">
            <li>Supabase — databáze a přihlašování,</li>
            <li>Stripe — zpracování plateb,</li>
            <li>Resend — odesílání e-mailů,</li>
            <li>Netlify — hosting webu.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">7. Vaše práva</h2>
          <p>
            Máte právo na přístup k údajům, jejich opravu, výmaz, omezení
            zpracování, přenositelnost a vznesení námitky proti zpracování.
            Žádosti zasílejte na [e-mail].
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">8. Cookies</h2>
          <p>
            Web používá pouze technické cookies nutné pro přihlášení
            (udržení relace) — žádné sledovací ani reklamní cookies
            nepoužíváme.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">9. Kontakt a stížnosti</h2>
          <p>
            V případě nespokojenosti se zpracováním osobních údajů se
            můžete obrátit na Úřad pro ochranu osobních údajů
            (uoou.gov.cz).
          </p>
        </section>
      </div>
    </div>
  );
}
