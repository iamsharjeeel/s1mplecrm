"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signInWithMagicLink, type AuthActionResult } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const initial: AuthActionResult = { data: null, error: null };

export function SignInForm() {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signIn,
    initial,
  );
  const [magicState, magicAction, magicPending] = useActionState(
    signInWithMagicLink,
    initial,
  );

  const magicSent = magicState.data?.sent === true;

  return (
    <Card className="w-full max-w-md border-border/60 shadow-none">
      <CardHeader>
        <CardTitle className="text-2xl tracking-tight">Sign in</CardTitle>
        <CardDescription>Welcome back to S1mpleCRM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form action={passwordAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
            />
          </div>
          {passwordState.error ? (
            <p className="text-sm text-destructive">{passwordState.error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={passwordPending}>
            {passwordPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or magic link</span>
          </div>
        </div>

        <form action={magicAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="magic-email">Email</Label>
            <Input
              id="magic-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
            />
          </div>
          {magicState.error ? (
            <p className="text-sm text-destructive">{magicState.error}</p>
          ) : null}
          {magicSent ? (
            <p className="text-sm text-muted-foreground">
              Check your email for a sign-in link.
            </p>
          ) : null}
          <Button
            type="submit"
            variant="outline"
            className="w-full"
            disabled={magicPending}
          >
            {magicPending ? "Sending…" : "Send magic link"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/sign-up" className="ml-1 text-foreground underline-offset-4 hover:underline">
          Sign up
        </Link>
      </CardFooter>
    </Card>
  );
}
