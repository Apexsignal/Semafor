import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseAuthClient } from "@/lib/supabase";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface SubscriptionRow {
  status: string;
  current_period_end: string | null;
}

async function getActiveSubscription(): Promise<SubscriptionRow | null> {
  const supabase = getSupabaseAuthClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("status", "active")
    .maybeSingle();
  return (data as SubscriptionRow | null) ?? null;
}

export default async function AccountPage() {
  const supabase = getSupabaseAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/prihlaseni");

  const subscription = await getActiveSubscription();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Můj účet</h1>
        <p className="mt-1 text-sm text-mozek-muted">{user.email}</p>
      </div>

      <div className="card flex flex-col gap-3 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mozek-muted">Předplatné</h2>
        {subscription ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="badge bg-mozek-good/15 text-mozek-good">Aktivní</span>
              {subscription.current_period_end && (
                <span className="text-sm text-mozek-muted">
                  obnoví se {formatDate(subscription.current_period_end)}
                </span>
              )}
            </div>
            <p className="text-sm text-mozek-muted">
              Máš plný přístup ke všem nápadům. Zrušení předplatného zatím
              řešíme ručně — napiš nám na kontaktní e-mail.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="badge bg-mozek-border/60 text-mozek-muted">Žádné aktivní předplatné</span>
            </div>
            <p className="text-sm text-mozek-muted">
              Placený přístup teprve spouštíme — online platba přes Stripe
              zatím není zapnutá. Přihlas se na čekací listinu na hlavní
              stránce a ozveme se, jakmile bude předplatné dostupné.
            </p>
            <Link href="/" className="btn w-fit">
              Zpátky na čekací listinu
            </Link>
          </div>
        )}
      </div>

      <div className="card flex flex-col gap-2 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-mozek-muted">Zdarma k vyzkoušení</h2>
        <p className="text-sm text-mozek-muted">
          I bez předplatného můžeš vidět jeden plně rozpracovaný nápad —
          najdeš ho na dashboardu pod štítkem „Zdarma&ldquo;.
        </p>
      </div>
    </div>
  );
}
