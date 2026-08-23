import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Obchodní podmínky — BRAIN ENGINE",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Obchodní podmínky</h1>
        <p className="mt-1 text-xs text-mozek-muted">Platnost od 22. 8. 2026</p>
      </div>

      <div className="card flex flex-col gap-6 p-5 text-sm leading-relaxed text-mozek-text sm:p-6">
        <section>
          <h2 className="mb-2 text-base font-semibold">1. Základní ustanovení</h2>
          <p>
            Tyto obchodní podmínky upravují vzájemná práva a povinnosti mezi
            poskytovatelem služby Brain Engine a uživatelem, který službu
            využívá.
          </p>
          <p className="mt-2 text-mozek-muted">
            Poskytovatel: [Jméno a příjmení / obchodní firma], IČO: 05010276,
            se sídlem [doplnit adresu] (dále jen &bdquo;Poskytovatel&ldquo;).
            <br />
            Kontakt: [e-mail]
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">2. Popis služby</h2>
          <p>
            Brain Engine je automatizovaný systém, který pomocí AI agenta
            denně vyhledává a rozpracovává podnikatelské příležitosti pro
            evropský trh. Poskytovatel v jeho rámci nabízí:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-mozek-muted">
            <li>přístup k databázi nápadů formou měsíčního předplatného,</li>
            <li>rezervaci konkrétního nápadu,</li>
            <li>zakázkový vývoj vybraného nápadu na míru.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">3. Předplatné — přístup k databázi</h2>
          <ul className="list-disc space-y-1 pl-5 text-mozek-muted">
            <li>Cena: 4 900 Kč měsíčně, platba probíhá přes platební bránu Stripe.</li>
            <li>Předplatné se automaticky obnovuje každý měsíc, dokud jej uživatel nezruší.</li>
            <li>Zrušit lze kdykoliv; přístup zůstává aktivní do konce už zaplaceného období.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">4. Rezervace nápadu</h2>
          <ul className="list-disc space-y-1 pl-5 text-mozek-muted">
            <li>Cena: 2 000 Kč, jednorázová platba, vyžaduje aktivní předplatné.</li>
            <li>Po zaplacení je nápad exkluzivně vyhrazen danému uživateli a odstraněn z veřejné nabídky ostatním.</li>
            <li>Rezervace je trvalá a nevratná — nevrací se zpět do nabídky ani při zrušení předplatného.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">5. Zakázkový vývoj</h2>
          <ul className="list-disc space-y-1 pl-5 text-mozek-muted">
            <li>Cena a rozsah se stanovují individuálně podle konkrétního nápadu.</li>
            <li>Podmínky upravuje samostatná smlouva o dílo, podepsaná elektronicky.</li>
            <li>Platba: 100 % předem, nebo 50 % záloha a 50 % po dokončení.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">6. Odstoupení od smlouvy</h2>
          <p>
            V souladu s § 1837 písm. l) občanského zákoníku bere uživatel na
            vědomí, že u digitálního obsahu a služby dodané se souhlasem
            uživatele před uplynutím lhůty pro odstoupení od smlouvy nemá
            právo od smlouvy odstoupit, pokud s okamžitým poskytnutím
            výslovně souhlasil a byl poučen, že tím právo na odstoupení
            pozbývá. Tento souhlas se vyžaduje před dokončením platby.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">7. Odpovědnost</h2>
          <p>
            Poskytovatel negarantuje, že vygenerované nápady budou úspěšné
            nebo ziskové. Nápady představují AI-generovaný odhad založený na
            veřejně dostupných datech, nikoliv investiční ani podnikatelské
            poradenství. Čísla označená jako &bdquo;ODHAD&ldquo; jsou vždy
            jen odhadem, ne příslibem výsledku.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">8. Ochrana osobních údajů</h2>
          <p>
            Zpracování osobních údajů upravují samostatné{" "}
            <a href="/ochrana-udaju" className="text-mozek-accent underline">
              Zásady zpracování osobních údajů
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold">9. Závěrečná ustanovení</h2>
          <p>
            Tyto podmínky se řídí právním řádem České republiky.
            Poskytovatel si vyhrazuje právo podmínky měnit; o podstatných
            změnách bude uživatele informovat e-mailem.
          </p>
        </section>
      </div>
    </div>
  );
}
