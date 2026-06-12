import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSubscription, createUser, ensureFreePlan, findUserByEmail } from "@/lib/db";
import { signUpSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signUpSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      name,
      email,
      passwordHash,
    });

    // Ensure free plan exists and assign default subscription
    const freePlan = await ensureFreePlan();

    await createSubscription({
      userId: user.id,
      planId: freePlan.id,
      status: "ACTIVE",
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    const message = error instanceof Error ? error.message : "Failed to create account";

    if (message.includes("doesn't exist") || message.includes("Unknown table")) {
      return NextResponse.json(
        {
          error:
            "Database tables missing. Import mysql/writeguard-full-setup.sql in Hostinger phpMyAdmin.",
        },
        { status: 503 }
      );
    }

    if (
      message.includes("Access denied")
    ) {
      return NextResponse.json(
        {
          error:
            "MySQL rejected the password. Reset the database user password in Hostinger → Databases, update MYSQL_PASSWORD, then Restart the app.",
        },
        { status: 503 }
      );
    }

    if (
      message.includes("timed out") ||
      message.includes("ETIMEDOUT") ||
      message.includes("ECONNREFUSED")
    ) {
      return NextResponse.json(
        {
          error: process.env.VERCEL
            ? "Cannot reach Hostinger MySQL from Vercel. Enable Remote MySQL in hPanel, allow host %, set DB_HOST to srvXXXX.hstgr.io (not 127.0.0.1)."
            : "Cannot connect to MySQL. Set DB_HOST=127.0.0.1 on Hostinger, or remote hostname on Vercel.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
