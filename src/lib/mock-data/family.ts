import type { FamilyPost, Message, Visit } from "@/types/domain";

const familyFeed: FamilyPost[] = [
  {
    resident: "Peggy Whitcombe",
    by: "Aroha (RN)",
    time: "2 hours ago",
    tag: "Wellbeing",
    initials: "PW",
    color: "#6E875E",
    photoSlot: "vme-feed1",
    text: "Peggy joined the garden group this morning and picked the first of the sweet peas — she was absolutely thrilled. She ate a good lunch and is resting comfortably this afternoon. 🌿",
  },
  {
    resident: "George Aleki",
    by: "Grace (activities)",
    time: "4 hours ago",
    tag: "Activity",
    initials: "GA",
    color: "#b06a5a",
    text: "George led the choir today and knew every word to the old hymns. Lovely to see him so at home with us.",
  },
  {
    resident: "Bill Toop",
    by: "Mere (carer)",
    time: "Yesterday",
    tag: "Wellbeing",
    initials: "WT",
    color: "#5b8f9a",
    photoSlot: "vme-feed2",
    text: "Bill settled in his favourite window seat for the cricket, with Miso the cat for company. A calm, happy afternoon.",
  },
];

const visits: Visit[] = [
  { mon: "Sun", day: "12", who: "The Whitcombe family", detail: "Visiting Peggy · 2:00pm" },
  { mon: "Mon", day: "13", who: "Katherine R.", detail: "Visiting Joan · 10:30am" },
  { mon: "Wed", day: "15", who: "Aleki whānau", detail: "Taking George out · 11:00am" },
  { mon: "Thu", day: "16", who: "Dr Anaru", detail: "GP round · Rātā wing" },
];

const messages: Message[] = [
  { from: "David W. (Peggy’s son)", time: "1h ago", text: "Thank you for the update — she looks so happy in the photo!" },
  { from: "Katherine R.", time: "Yesterday", text: "Could we bring Joan’s birthday cake on Monday? Around 15 people." },
  { from: "Aleki whānau", time: "2 days ago", text: "Confirming pick-up at 11 on Wednesday. Thank you all." },
];

export function getFamilyFeed(): FamilyPost[] {
  return familyFeed;
}

export function getVisits(): Visit[] {
  return visits;
}

export function getMessages(): Message[] {
  return messages;
}
