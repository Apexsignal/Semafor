import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Přihlášení</h1>
        <p className="text-sm text-mozek-muted">
          Žádné heslo — napiš e-mail a pošleme ti odkaz k přihlášení.
        </p>
      </div>
      {searchParams.error && (
        <p className="text-sm text-mozek-bad">
          Odkaz už neplatí nebo se nepodařilo přihlášení dokončit. Zkus si vyžádat nový.
        </p>
      )}
      <div className="card p-4">
        <LoginForm />
      </div>
    </div>
  );
}
