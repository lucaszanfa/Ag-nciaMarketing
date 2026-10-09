"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/server/actions/auth.actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Enviando..." : "Criar conta"}
    </Button>
  );
}

export default function RegisterPage() {
  const [state, formAction] = useActionState(registerUser, null);
  const success = state && "success" in state ? state.success : null;

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Depois de se cadastrar, um administrador precisa aprovar seu acesso antes que você consiga entrar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {success ? (
            <p className="rounded-lg bg-primary/10 p-3 text-sm text-primary">{success}</p>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" autoComplete="name" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
              </div>
              {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 bg-transparent border-t-0 p-(--card-spacing) pt-0">
          {!success && <SubmitButton />}
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}
