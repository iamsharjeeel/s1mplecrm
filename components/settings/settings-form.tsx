"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrganization } from "@/actions/orgs";
import { uploadOrgLogo } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Role } from "@/lib/permissions";
import { can } from "@/lib/permissions";

export function SettingsForm({
  orgName,
  logoUrl,
  role,
}: {
  orgName: string;
  logoUrl: string | null;
  role: Role;
}) {
  const router = useRouter();
  const [name, setName] = useState(orgName);
  const [logo, setLogo] = useState(logoUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canUpdate = can(role, "org:update");

  return (
    <div className="max-w-lg space-y-8">
      <form
        className="rounded-xl border border-secondary-container bg-surface-container-lowest p-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (!canUpdate) return;
          setError(null);
          setSuccess(null);
          startTransition(async () => {
            const result = await updateOrganization(name);
            if (result.error) {
              setError(result.error);
              return;
            }
            setSuccess("Organization name updated");
            router.refresh();
          });
        }}
      >
        <h2 className="font-headline mb-4 text-xl text-on-surface">
          Organization name
        </h2>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!canUpdate || pending}
          required
          className="mb-4 border-secondary-container bg-surface-container-lowest"
        />
        {canUpdate ? (
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save name"}
          </Button>
        ) : (
          <p className="text-sm text-secondary">
            You do not have permission to edit settings.
          </p>
        )}
      </form>

      <div className="rounded-xl border border-secondary-container bg-surface-container-lowest p-6">
        <h2 className="font-headline mb-4 text-xl text-on-surface">Logo</h2>
        {logo ? (
          <img
            src={logo}
            alt="Organization logo"
            className="mb-4 size-16 rounded border border-secondary-container object-contain"
          />
        ) : (
          <div className="mb-4 flex size-16 items-center justify-center rounded border border-secondary-container bg-surface-container text-xs text-secondary">
            No logo
          </div>
        )}
        {canUpdate ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setSuccess(null);
              const form = e.currentTarget;
              const fd = new FormData(form);
              startTransition(async () => {
                const result = await uploadOrgLogo(fd);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                if (result.data?.logo_url) {
                  setLogo(result.data.logo_url);
                }
                setSuccess("Logo uploaded");
                form.reset();
                router.refresh();
              });
            }}
          >
            <input
              type="file"
              name="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="mb-4 block w-full text-sm text-secondary file:mr-4 file:rounded file:border-0 file:bg-primary-container file:px-4 file:py-2 file:text-xs file:font-medium file:text-on-primary"
            />
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? "Uploading…" : "Upload logo"}
            </Button>
          </form>
        ) : null}
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}
      {success ? (
        <p className="text-sm text-primary-container">{success}</p>
      ) : null}
    </div>
  );
}
