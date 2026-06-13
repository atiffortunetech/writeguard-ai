"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Trash2, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Document {
  id: string;
  title: string;
  wordCount: number;
  updatedAt: string;
  createdAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDocuments(data);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const deleteDoc = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      <DashboardHeader title="Documents" description="Browse and manage all your writing documents" />
      <div className="dashboard-content">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button asChild>
            <Link href="/dashboard/editor/new"><Plus className="h-4 w-4" /> New Document</Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading documents...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-sm text-slate-500">No documents found.</p>
              <Button asChild><Link href="/dashboard/editor/new">Create document</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filtered.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50">
                <Link href={`/dashboard/editor/${doc.id}`} className="flex flex-1 items-center gap-4">
                  <FileText className="h-5 w-5 text-indigo-600" />
                  <div>
                    <p className="font-medium text-slate-900">{doc.title}</p>
                    <p className="text-sm text-slate-500">
                      {doc.wordCount} words · Updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{doc.wordCount}w</Badge>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteDoc(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
