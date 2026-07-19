"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { saveSiteContent, resetSiteContent } from "@/lib/actions/site-content";
import { CMS_SECTIONS, type CmsArray } from "@/lib/website-cms-config";
import type { SiteContent } from "@/lib/mock-data/site-content-defaults";
import { CmsField } from "./cms-field";

type Content = Record<string, unknown>;

function getPath(obj: Content, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (n, k) => (n == null ? undefined : (n as Content)[k]),
    obj,
  );
}

// Immutable set at a dotted path (objects cloned along the way; the leaf value
// is replaced — used for scalar copy and for whole-array section writes).
function setByPath(obj: Content, path: string, value: unknown): Content {
  const parts = path.split(".");
  const clone: Content = { ...obj };
  let node = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const child = node[parts[i]];
    node[parts[i]] =
      child && typeof child === "object" && !Array.isArray(child)
        ? { ...(child as Content) }
        : {};
    node = node[parts[i]] as Content;
  }
  node[parts[parts.length - 1]] = value;
  return clone;
}

export function WebsiteCms({ initial }: { initial: SiteContent }) {
  const [content, setContent] = useState<Content>(initial as unknown as Content);
  const [active, setActive] = useState(CMS_SECTIONS[0].key);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const section = CMS_SECTIONS.find((s) => s.key === active) ?? CMS_SECTIONS[0];

  // Debounced persist keyed by save path, so rapid typing collapses to one write.
  const queueSave = (key: string, path: string, value: unknown) => {
    clearTimeout(timers.current[key]);
    setStatus("saving");
    timers.current[key] = setTimeout(async () => {
      await saveSiteContent(path, value);
      setStatus("saved");
    }, 500);
  };

  const setScalar = (path: string, value: unknown) => {
    setContent((prev) => setByPath(prev, path, value));
    queueSave(path, path, value);
  };

  const setArrayItem = (
    arr: CmsArray,
    index: number,
    key: string,
    value: unknown,
  ) => {
    const list = (getPath(content, arr.path) as Content[]) ?? [];
    const next = list.map((it, i) => (i === index ? { ...it, [key]: value } : it));
    setContent((prev) => setByPath(prev, arr.path, next));
    queueSave(arr.path, arr.path, next);
  };

  const onReset = async () => {
    if (!confirm("Reset all website content to the original text?")) return;
    setStatus("saving");
    await resetSiteContent();
    location.reload();
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[1.6px] text-bronze-text">
            Marketing site
          </div>
          <h1 className="mt-1.5 font-serif text-[34px] font-medium tracking-[-0.3px] text-ink">
            Website content
          </h1>
          <p className="mt-1.5 text-[15.5px] text-ink-muted">
            Edit the public site copy here - changes save automatically and
            update the live pages.
          </p>
        </div>
        <div className="flex items-center gap-[10px]">
          <span className="text-[12.5px] text-ink-faint">
            {status === "saving" ? "Saving…" : status === "saved" ? "Saved ✓" : ""}
          </span>
          <button
            type="button"
            onClick={onReset}
            className="rounded-[11px] border border-line-soft bg-cream-2 px-4 py-[11px] text-[14px] font-semibold text-ink-nav hover:bg-cream"
          >
            Reset to defaults
          </button>
          <Link
            href="/"
            target="_blank"
            className="rounded-[11px] bg-navy px-4 py-[11px] text-[14px] font-semibold text-cream hover:bg-navy/90"
          >
            Preview page ↗
          </Link>
        </div>
      </div>

      <div className="mt-[26px] grid grid-cols-[212px_1fr] items-start gap-[22px] max-md:grid-cols-1">
        <div className="sticky top-4 flex flex-col gap-0.5 rounded-2xl border border-line bg-cream-2 p-[10px] max-md:static">
          {CMS_SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              className={cn(
                "rounded-[10px] px-[14px] py-[9px] text-left text-[14px] font-semibold",
                s.key === active ? "bg-navy text-cream" : "text-ink-nav hover:bg-cream",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex min-w-0 flex-col gap-[18px]">
          <h2 className="font-serif text-[24px] font-semibold text-ink">
            {section.label}
          </h2>

          {section.careersNote && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line-strong bg-navy-tint px-[18px] py-[14px] text-[14px] text-navy">
              Open roles are managed on the Staff page.
            </div>
          )}

          {section.groups.map((group, gi) => (
            <div
              key={gi}
              className="rounded-2xl border border-line bg-cream-2 px-6 py-[22px]"
            >
              {group.title && (
                <div className="mb-4 text-[11.5px] font-bold uppercase tracking-[1px] text-bronze">
                  {group.title}
                </div>
              )}
              <div className="flex flex-col gap-[14px]">
                {group.fields.map((f) => {
                  const raw = getPath(content, f.path);
                  const value =
                    f.kind === "list"
                      ? ((raw as string[]) ?? []).join("\n")
                      : String(raw ?? "");
                  return (
                    <CmsField
                      key={f.path}
                      label={f.label}
                      kind={f.kind}
                      value={value}
                      onChange={(v) =>
                        setScalar(f.path, f.kind === "list" ? v.split("\n") : v)
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {section.arrays.map((arr) => {
            const list = (getPath(content, arr.path) as Content[]) ?? [];
            return (
              <div
                key={arr.path}
                className="rounded-2xl border border-line bg-cream-2 px-6 py-[22px]"
              >
                <div className="mb-4 text-[11.5px] font-bold uppercase tracking-[1px] text-bronze">
                  {arr.title}
                </div>
                <div className="flex flex-col gap-5">
                  {list.map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-[14px] rounded-xl border border-line-soft bg-cream p-[16px]"
                    >
                      {arr.fields.map((af) => {
                        const raw = item[af.key];
                        const value =
                          af.kind === "list"
                            ? ((raw as string[]) ?? []).join("\n")
                            : String(raw ?? "");
                        return (
                          <CmsField
                            key={af.key}
                            label={af.label}
                            kind={af.kind}
                            value={value}
                            onChange={(v) =>
                              setArrayItem(
                                arr,
                                i,
                                af.key,
                                af.kind === "list" ? v.split("\n") : v,
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
