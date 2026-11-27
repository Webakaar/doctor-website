import crypto from "node:crypto";
import type { SupabaseClient, User as SupabaseAuthUser } from "@supabase/supabase-js";
import {
  getSupabaseAdminClient,
  getSupabaseAnonClient,
  isSupabaseConfigured
} from "@/lib/db/supabase-client";
import type { UserRole } from "@/types/hospital";

export interface EnsureSupabaseAuthUserInput {
  email: string;
  password?: string;
  fullName?: string;
  phone?: string;
  role?: UserRole;
  emailConfirm?: boolean;
}

export interface EnsureSupabaseAuthUserResult {
  authUserId: string;
  created: boolean;
}

export async function findSupabaseAuthUserByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<SupabaseAuthUser | null> {
  const normalized = email.trim().toLowerCase();
  const perPage = 200;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage
    });
    if (error) {
      throw new Error(`Supabase Auth listUsers failed: ${error.message}`);
    }
    const users = data?.users || [];
    const match = users.find((u) => u.email?.toLowerCase() === normalized);
    if (match) return match;
    if (users.length < perPage) break;
  }

  return null;
}

export async function ensureSupabaseAuthUser(
  input: EnsureSupabaseAuthUserInput
): Promise<EnsureSupabaseAuthUserResult | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const email = input.email.trim().toLowerCase();
  const role = input.role || "patient";
  const emailConfirm = input.emailConfirm ?? true;
  const fullName = input.fullName?.trim();
  const phone = input.phone?.trim();

  const existing = await findSupabaseAuthUserByEmail(supabase, email);
  if (existing) {
    const nextUserMeta: Record<string, unknown> = {
      ...(existing.user_metadata || {}),
      role
    };
    if (fullName) nextUserMeta.full_name = fullName;
    if (phone) nextUserMeta.phone = phone;

    const { data, error } = await supabase.auth.admin.updateUserById(
      existing.id,
      {
        email_confirm: emailConfirm,
        ...(input.password ? { password: input.password } : {}),
        user_metadata: nextUserMeta,
        app_metadata: {
          ...(existing.app_metadata || {}),
          role
        }
      }
    );

    if (error) {
      throw new Error(`Supabase Auth updateUserById failed: ${error.message}`);
    }

    return {
      authUserId: data.user.id,
      created: false
    };
  }

  const passwordToSet =
    input.password || crypto.randomBytes(18).toString("base64url");

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: passwordToSet,
    email_confirm: emailConfirm,
    user_metadata: {
      full_name: fullName || email.split("@")[0],
      phone: phone || "",
      role
    },
    app_metadata: {
      role
    }
  });

  if (error) {
    const raced = await findSupabaseAuthUserByEmail(supabase, email);
    if (raced) {
      return {
        authUserId: raced.id,
        created: false
      };
    }
    throw new Error(`Supabase Auth createUser failed: ${error.message}`);
  }

  return {
    authUserId: data.user.id,
    created: true
  };
}

export async function updateSupabaseAuthPassword(params: {
  email: string;
  authUserId?: string;
  newPassword: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;

  const targetId =
    params.authUserId ||
    (await findSupabaseAuthUserByEmail(supabase, params.email))?.id;

  if (!targetId) return false;

  const { error } = await supabase.auth.admin.updateUserById(targetId, {
    password: params.newPassword,
    email_confirm: true
  });

  if (error) {
    throw new Error(`Supabase Auth password update failed: ${error.message}`);
  }
  return true;
}

export async function verifyPasswordWithSupabaseAuth(
  email: string,
  password: string
): Promise<boolean> {
  const anon = getSupabaseAnonClient();
  if (!anon) return false;

  const { data, error } = await anon.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  return Boolean(!error && data?.user);
}

export async function generateSupabaseEmailOtp(params: {
  email: string;
  fullName?: string;
  role?: UserRole;
}): Promise<{ otpCode: string; authUserId: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const email = params.email.trim().toLowerCase();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      data: {
        ...(params.fullName ? { full_name: params.fullName } : {}),
        role: params.role || "patient"
      }
    }
  });

  if (error) {
    throw new Error(`Supabase Auth generateLink failed: ${error.message}`);
  }

  const otpCode = data?.properties?.email_otp?.trim();
  const authUserId = data?.user?.id;
  if (!otpCode || !authUserId) {
    throw new Error("Supabase Auth did not return an email OTP code.");
  }

  return { otpCode, authUserId };
}

export async function verifySupabaseEmailOtpCode(params: {
  email: string;
  code: string;
}): Promise<{ authUserId: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const anon = getSupabaseAnonClient();
  if (!anon) return null;

  const { data, error } = await anon.auth.verifyOtp({
    email: params.email.trim().toLowerCase(),
    token: params.code.trim(),
    type: "email"
  });

  if (error || !data?.user?.id) {
    return null;
  }

  return { authUserId: data.user.id };
}
