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
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}
