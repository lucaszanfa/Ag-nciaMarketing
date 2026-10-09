"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changeOwnPassword } from "@/server/actions/auth.actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" className="gap-2" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {pending ? "Salvando..." : "Trocar senha"}
    </Button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changeOwnPassword, null);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={8} required />
            </div>
          </div>
          {state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
          {state && "success" in state && <p className="text-sm text-primary">{state.success}</p>}
          <div>
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
