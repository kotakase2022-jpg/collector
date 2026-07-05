"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type * as React from "react";

type SearchValue = string | number | null | undefined;

type ListFormStateLinkProps = Omit<React.ComponentProps<typeof Link>, "href" | "onClick"> & {
  href: string;
  formId: string;
  patch?: Record<string, SearchValue>;
  removeKeys?: string[];
};

export function ListFormStateLink({ href, formId, patch = {}, removeKeys = [], target, ...props }: ListFormStateLinkProps) {
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || (target && target !== "_self")) {
      return;
    }

    const form = document.getElementById(formId);
    if (!(form instanceof HTMLFormElement)) return;

    const url = new URL(href, window.location.href);
    const formData = new FormData(form);
    const formKeys = new Set<string>();

    for (const key of formData.keys()) {
      formKeys.add(key);
    }
    for (const key of formKeys) {
      url.searchParams.delete(key);
    }
    for (const [key, value] of formData.entries()) {
      if (typeof value !== "string") continue;
      const normalized = value.trim();
      if (normalized) url.searchParams.set(key, normalized);
    }
    for (const key of removeKeys) {
      url.searchParams.delete(key);
    }
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") {
        url.searchParams.delete(key);
        continue;
      }
      url.searchParams.set(key, String(value));
    }

    event.preventDefault();
    router.push(`${url.pathname}${url.search}${url.hash}`);
  }

  return <Link href={href} target={target} onClick={handleClick} {...props} />;
}
