"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Search, Upload, Users, X } from "lucide-react";
import {
  createContact,
  importContactsCsv,
  listContacts,
} from "@/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ContactRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  tags: string[];
  created_at: string;
};

export function ContactsClient({
  initialContacts,
  initialQuery,
  error: initialError,
}: {
  initialContacts: ContactRow[];
  initialQuery: string;
  error: string | null;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [query, setQuery] = useState(initialQuery);
  const [error, setError] = useState(initialError);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
  });

  function refreshList(q: string) {
    startTransition(async () => {
      const result = await listContacts({ q: q || undefined });
      if (result.error) {
        setError(result.error);
        return;
      }
      setContacts(result.data ?? []);
      setError(null);
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    router.push(`/contacts${params.size ? `?${params}` : ""}`);
    refreshList(query.trim());
  }

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl text-on-surface">Contacts</h1>
          <p className="mt-1 text-secondary">Manage leads and customers</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowImport(!showImport);
              setShowAdd(false);
            }}
          >
            <Upload className="size-4" />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setShowAdd(!showAdd);
              setShowImport(false);
            }}
          >
            <Plus className="size-4" />
            Add contact
          </Button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-secondary" />
          <Input
            className="border-secondary-container bg-surface-container-lowest pl-9"
            placeholder="Search by name, email, or company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          Search
        </Button>
      </form>

      {error ? <p className="mb-4 text-sm text-error">{error}</p> : null}

      {showAdd ? (
        <div className="mb-6 rounded-xl border border-secondary-container bg-surface-container-lowest p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-xl text-on-surface">New contact</h2>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="text-secondary hover:text-on-surface"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const result = await createContact(form);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setShowAdd(false);
                setForm({
                  first_name: "",
                  last_name: "",
                  email: "",
                  phone: "",
                  company: "",
                });
                refreshList(query.trim());
                router.refresh();
              });
            }}
          >
            <Input
              placeholder="First name"
              value={form.first_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_name: e.target.value }))
              }
              className="border-secondary-container bg-surface-container-lowest"
            />
            <Input
              placeholder="Last name"
              value={form.last_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, last_name: e.target.value }))
              }
              className="border-secondary-container bg-surface-container-lowest"
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="border-secondary-container bg-surface-container-lowest"
            />
            <Input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="border-secondary-container bg-surface-container-lowest"
            />
            <Input
              placeholder="Company"
              value={form.company}
              onChange={(e) =>
                setForm((f) => ({ ...f, company: e.target.value }))
              }
              className="border-secondary-container bg-surface-container-lowest sm:col-span-2"
            />
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save contact"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {showImport ? (
        <div className="mb-6 rounded-xl border border-secondary-container bg-surface-container-lowest p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-headline text-xl text-on-surface">Import CSV</h2>
            <button
              type="button"
              onClick={() => setShowImport(false)}
              className="text-secondary hover:text-on-surface"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>
          <p className="mb-3 text-sm text-secondary">
            Header row: first_name, last_name, email, phone, company, tags
          </p>
          <Textarea
            className="mb-4 min-h-32 border-secondary-container bg-surface-container-lowest font-mono text-sm"
            placeholder="first_name,last_name,email,phone,company,tags"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />
          <Button
            disabled={pending || !csvText.trim()}
            onClick={() => {
              startTransition(async () => {
                const result = await importContactsCsv(csvText);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setCsvText("");
                setShowImport(false);
                refreshList(query.trim());
                router.refresh();
              });
            }}
          >
            {pending ? "Importing…" : "Import contacts"}
          </Button>
        </div>
      ) : null}

      {contacts.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-xl border border-secondary-container bg-surface-container-lowest py-16 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container">
            <Users className="size-9 text-secondary/60" strokeWidth={1.25} />
          </div>
          <h2 className="font-headline mb-2 text-2xl text-on-surface">
            No contacts yet
          </h2>
          <p className="mb-6 max-w-sm text-secondary">
            Add a contact manually or import a CSV to populate your list.
          </p>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="size-4" />
            Add your first contact
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-secondary-container bg-surface-container-lowest">
          <Table>
            <TableHeader>
              <TableRow className="border-secondary-container bg-surface-container hover:bg-surface-container">
                <TableHead className="text-on-surface-variant">Name</TableHead>
                <TableHead className="text-on-surface-variant">Email</TableHead>
                <TableHead className="text-on-surface-variant">Company</TableHead>
                <TableHead className="text-on-surface-variant">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow
                  key={c.id}
                  className="border-secondary-container hover:bg-surface-container-low"
                >
                  <TableCell>
                    <Link
                      href={`/contacts/${c.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                        "Unnamed"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-secondary">
                    {c.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-secondary">
                    {c.company ?? "—"}
                  </TableCell>
                  <TableCell className="text-secondary">
                    {c.tags.length ? c.tags.join(", ") : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
