"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function InviteRedirect() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      router.replace(`/consent?token=${encodeURIComponent(token)}`);
    } else {
      router.replace(`/consent`);
    }
  }, [token, router]);

  return null;
}
