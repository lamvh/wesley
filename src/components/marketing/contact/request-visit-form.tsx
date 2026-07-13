"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fieldClass =
  "h-auto rounded-[11px] border-field bg-cream px-4 py-[14px] text-[15px] text-ink placeholder:text-ink-faint md:text-[15px]";

const roomOptions = [
  "VIP suite",
  "Premium suite",
  "Normal room",
  "Not sure yet",
];

// Request-a-visit form. Controlled inputs; submit is inert this phase.
export function RequestVisitForm() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Inert this phase — no network or persistence.
    console.log({ name, contact, room, message });
  }

  return (
    <div className="rounded-[20px] border border-line bg-cream-2 p-[34px]">
      <h2 className="mb-[18px] font-serif text-[24px] font-semibold">
        Request a visit
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
        />
        <Input
          placeholder="Phone or email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className={fieldClass}
        />
        <Select value={room} onValueChange={setRoom}>
          <SelectTrigger
            className={`w-full data-placeholder:text-ink-faint ${fieldClass}`}
          >
            <SelectValue placeholder="Room of interest…" />
          </SelectTrigger>
          <SelectContent className="bg-cream-2">
            {roomOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          placeholder="How can we help?"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`min-h-0 resize-none ${fieldClass}`}
        />
        <Button
          type="submit"
          className="h-auto w-full rounded-[11px] bg-navy py-[15px] text-[16px] font-semibold text-cream hover:bg-navy/90"
        >
          Request a visit
        </Button>
      </form>
    </div>
  );
}
