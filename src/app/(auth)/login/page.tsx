"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loginUser } from "@/server/actions/auth.actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginUser, null);

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta do Marketing AI Studio.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3 bg-transparent border-t-0 p-(--card-spacing) pt-0">
          <SubmitButton />
          <p className="text-center text-sm text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/registrar" className="font-medium text-foreground underline underline-offset-2">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </form>
  );
}
