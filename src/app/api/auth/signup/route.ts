import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });

    // Ensure free plan exists and assign default subscription
    let freePlan = await prisma.plan.findUnique({ where: { tier: "FREE" } });
    if (!freePlan) {
      freePlan = await prisma.plan.create({
        data: {
          tier: "FREE",
          name: "Free",
          description: "Get started with essential writing checks",
          priceMonthly: 0,
          priceYearly: 0,
          aiCreditsMonthly: 50,
          maxDocuments: 5,
          maxBrandVoices: 0,
          features: [
            "Limited grammar checks",
            "Limited AI rewrites",
            "5 documents",
            "Basic tone detection",
          ],
        },
      });
    }

    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: freePlan.id,
        status: "ACTIVE",
      },
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
