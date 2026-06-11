import type { Invoice } from "@/types/database";
import { execute, newId, query, queryOne } from "./connection";

type InvoiceRow = {
  id: string;
  subscription_id: string;
  stripe_invoice_id: string | null;
  amount: number;
  currency: string;
  status: string;
  paid_at: Date | null;
  created_at: Date;
};

export function mapInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    subscriptionId: row.subscription_id,
    stripeInvoiceId: row.stripe_invoice_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  };
}

export async function findInvoiceById(id: string): Promise<Invoice | null> {
  const row = await queryOne<InvoiceRow>("SELECT * FROM invoices WHERE id = ?", [id]);
  return row ? mapInvoice(row) : null;
}

export async function findInvoiceByStripeId(
  stripeInvoiceId: string
): Promise<Invoice | null> {
  const row = await queryOne<InvoiceRow>(
    "SELECT * FROM invoices WHERE stripe_invoice_id = ?",
    [stripeInvoiceId]
  );
  return row ? mapInvoice(row) : null;
}

export async function listInvoicesBySubscription(
  subscriptionId: string
): Promise<Invoice[]> {
  const rows = await query<InvoiceRow>(
    "SELECT * FROM invoices WHERE subscription_id = ? ORDER BY created_at DESC",
    [subscriptionId]
  );
  return rows.map(mapInvoice);
}

export type CreateInvoiceInput = {
  subscriptionId: string;
  stripeInvoiceId?: string | null;
  amount: number;
  currency?: string;
  status: string;
  paidAt?: Date | null;
};

export async function createInvoice(data: CreateInvoiceInput): Promise<Invoice> {
  const id = newId();
  await execute(
    `INSERT INTO invoices (
      id, subscription_id, stripe_invoice_id, amount, currency, status, paid_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.subscriptionId,
      data.stripeInvoiceId ?? null,
      data.amount,
      data.currency ?? "usd",
      data.status,
      data.paidAt ?? null,
    ]
  );
  const invoice = await findInvoiceById(id);
  if (!invoice) throw new Error("Failed to create invoice");
  return invoice;
}
