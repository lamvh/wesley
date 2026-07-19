// Default marketing copy for the public site. This is the "code default" layer
// the Website CMS merges DB overrides over (see lib/data/site-content.ts).
// It holds editable COPY only — fixed presentation (feature icons, photo slots)
// stays in the components and is zipped with these entries by index.
// Ported from the Claude Design `siteContentDefaults` (v1.2). Em dashes are
// rendered as hyphens per the project convention.

import type { IconName } from "@/components/shared/icons";

// Fixed presentation paired with the editable copy by index — the CMS edits
// title/desc, these stay in code. Feature cards get an icon; room-style cards a
// photo slot. Both lists are the same length/order as the content arrays.
export const FEATURE_ICONS: IconName[] = [
  "meals",
  "activities",
  "garden",
  "family",
  "wellbeing",
  "salon",
];
export const CARE_SLOTS = ["vme-care1", "vme-care2", "vme-care3"];

export interface SiteStat {
  v: string;
  l: string;
}

export interface SiteCopyItem {
  title: string;
  desc: string;
}

export interface SiteCareLevel {
  name: string;
  wing: string;
  desc: string;
  points: string[];
}

export interface SiteTimelineStep {
  time: string;
  title: string;
  desc: string;
}

export interface SiteCareWing {
  name: string;
  care: string;
  desc: string;
}

export interface SiteContent {
  hero: {
    badge: string;
    h1: string;
    sub: string;
    cta1: string;
    cta2: string;
    stats: SiteStat[];
  };
  welcome: { eyebrow: string; h2: string; body: string; tags: string[] };
  homeRooms: { eyebrow: string; h2: string; note: string };
  homeLife: { eyebrow: string; h2: string };
  family: {
    h2: string;
    body: string;
    checks: string[];
    cta: string;
    quote: string;
  };
  testimonial: { quote: string; author: string };
  enquiry: { h2: string; body: string; phone: string; address: string };
  care: { h1: string; intro: string };
  life: { h1: string; sub: string; dayHeading: string };
  ourhome: {
    h1: string;
    sub: string;
    introH2: string;
    introBody: string;
    facHeading: string;
    roomStylesHeading: string;
    findH2: string;
    findBody: string;
  };
  careers: { h1: string; sub: string };
  contact: {
    h1: string;
    sub: string;
    phone: string;
    address: string;
    addressSub: string;
    email: string;
    hours: string;
  };
  footer: { blurb: string };
  careLevels: SiteCareLevel[];
  features: SiteCopyItem[];
  dayTimeline: SiteTimelineStep[];
  facilities: SiteCopyItem[];
  careWings: SiteCareWing[];
  benefits: SiteCopyItem[];
}

export const SITE_CONTENT_DEFAULTS: SiteContent = {
  hero: {
    badge: "Boutique aged care · Est. 1998",
    h1: "A warm place to call home, in the heart of Mt Eden",
    sub: "Boutique rest-home care in three room styles - VIP, premium and comfortable - with the garden, kitchen and whānau warmth that make a house a home.",
    cta1: "Book a visit",
    cta2: "Explore our rooms",
    stats: [
      { v: "54", l: "care suites" },
      { v: "1:5", l: "day carer ratio" },
      { v: "27 yrs", l: "caring for Tāmaki" },
    ],
  },
  welcome: {
    eyebrow: "Haere mai · Welcome",
    h2: "Care that begins with the person, not the paperwork",
    body: "At Wesley we keep things small on purpose. Our team learns the little things - how you take your tea, the crossword you never miss, the family who visit on Sundays - because those details are what make a place feel like home.",
    tags: [
      "Registered nurses on site 24/7",
      "Chef-prepared meals",
      "Whānau always welcome",
    ],
  },
  homeRooms: {
    eyebrow: "Our rooms",
    h2: "Three room styles, one caring team",
    note: "Choose the room that suits you best - whichever you pick, the same warm, registered-nurse-led team looks after you.",
  },
  homeLife: { eyebrow: "Life at Wesley", h2: "Days full of small, good things" },
  family: {
    h2: "Stay close, wherever you are",
    body: "Our new family portal keeps whānau in the loop - daily photos and updates from carers, upcoming visits, activity sign-ups and secure messaging with the care team.",
    checks: [
      "Daily wellbeing updates & photos",
      "Book visits and join activities",
      "Message the care team securely",
    ],
    cta: "Preview the family portal",
    quote:
      "“Peggy joined the garden group this morning and picked the first of the sweet peas - she was thrilled. Ate a good lunch and is resting well. 🌿”",
  },
  testimonial: {
    quote:
      "Mum settled at Victoria in a way we didn't think possible. The team don't just care for her - they know her. That's everything.",
    author: "Katherine R. - daughter of a resident",
  },
  enquiry: {
    h2: "Come and see for yourself",
    body: "Book a no-obligation visit, or call our team for a warm, honest chat about care options for your loved one.",
    phone: "09 630 1998",
    address: "227 Mt Eden Rd",
  },
  care: {
    h1: "Three room styles, one caring team",
    intro:
      "A boutique rest home with three styles of room - VIP, premium and comfortable - so you can choose the space that suits. Every room is looked after by the same warm, registered-nurse-led team.",
  },
  life: {
    h1: "Days full of small, good things",
    sub: "Good food, good company and something to look forward to every day. Here's a little of what life looks like at Wesley.",
    dayHeading: "A day at Wesley",
  },
  ourhome: {
    h1: "A boutique home in the heart of Mt Eden",
    sub: "Fifty-four suites wrapped around sunny gardens and shared spaces made for company.",
    introH2: "Built around people, not corridors",
    introBody:
      "We keep Wesley deliberately small. Corridors are short and easy to navigate, lounges are warm and lived-in, and the garden is never more than a few steps away. It's a place that feels like home from the first visit.",
    facHeading: "Facilities",
    roomStylesHeading: "Our three room styles",
    findH2: "227 Mt Eden Rd",
    findBody:
      "Mt Eden, Tāmaki Makaurau - a short walk from the village, with off-street parking for visitors.",
  },
  careers: {
    h1: "Come and do work that matters",
    sub: "We're a small, close team who genuinely care - for our residents and for each other. If that sounds like you, we'd love to talk.",
  },
  contact: {
    h1: "Come and see for yourself",
    sub: "Book a no-obligation visit, or call our team for a warm, honest chat about care options for your loved one.",
    phone: "09 630 1998",
    address: "227 Mt Eden Rd",
    addressSub: "Mt Eden, Tāmaki Makaurau",
    email: "hello@wesleymteden.nz",
    hours: "Every day, 9:00am – 7:00pm.\nWhānau are always welcome.",
  },
  footer: {
    blurb:
      "Boutique aged residential care in the heart of Mt Eden, Tāmaki Makaurau. Certified by the Ministry of Health.",
  },
  careLevels: [
    {
      name: "VIP suite",
      wing: "Rest home care",
      desc: "Our finest rooms - spacious suites with a private ensuite, garden outlook and a few extra touches that make all the difference.",
      points: [
        "Largest rooms with private ensuite",
        "Premium furnishings & garden views",
        "Priority booking for outings & salon",
      ],
    },
    {
      name: "Premium suite",
      wing: "Rest home care",
      desc: "Generous private rooms with an ensuite and a sunny outlook - extra space and comfort with room to breathe.",
      points: [
        "Spacious room with private ensuite",
        "Sunny garden or courtyard outlook",
        "Extra seating & storage",
      ],
    },
    {
      name: "Standard room",
      wing: "Rest home care",
      desc: "Warm, comfortable rooms with everything you need close at hand - the same caring team and full programme as every suite.",
      points: [
        "Comfortable, homely private room",
        "Bathroom & lounges close by",
        "Full activities & dining included",
      ],
    },
  ],
  features: [
    {
      title: "Chef-prepared meals",
      desc: "Fresh, seasonal home cooking with every dietary need catered for, three times a day.",
    },
    {
      title: "Activities & outings",
      desc: "A full weekly programme - from garden club to choir, craft circles and bus trips.",
    },
    {
      title: "Landscaped gardens",
      desc: "Sunny courtyards and raised beds where green thumbs can potter to their heart's content.",
    },
    {
      title: "The family portal",
      desc: "Daily updates, photos and secure messaging keep whānau close, wherever they are.",
    },
    {
      title: "Physio & wellbeing",
      desc: "On-site physiotherapy, podiatry and a visiting GP keep everyone at their best.",
    },
    {
      title: "Hair salon & podiatry",
      desc: "Little luxuries matter - our on-site salon keeps everyone feeling their best.",
    },
  ],
  dayTimeline: [
    {
      time: "Morning",
      title: "A gentle start",
      desc: "Wake at your own pace, a hot breakfast to order, morning medications and a wander in the garden.",
    },
    {
      time: "Midday",
      title: "Together at the table",
      desc: "A chef-prepared two-course lunch in the dining room, with every dietary need catered for.",
    },
    {
      time: "Afternoon",
      title: "Something to look forward to",
      desc: "Choir, craft, exercise or an outing - plus afternoon tea and visits from whānau.",
    },
    {
      time: "Evening",
      title: "Winding down",
      desc: "A lighter supper, a film or music in the lounge, and a calm, well-supported night.",
    },
  ],
  facilities: [
    {
      title: "Landscaped gardens & courtyards",
      desc: "Sunny, sheltered spaces and raised beds for the keen gardeners.",
    },
    {
      title: "Chef-run kitchen",
      desc: "Fresh, seasonal cooking prepared on site three times a day.",
    },
    {
      title: "Chapel & lounges",
      desc: "Quiet spaces for reflection, services, films and singalongs.",
    },
    {
      title: "Hair salon & therapy room",
      desc: "On-site salon, podiatry and physiotherapy.",
    },
    {
      title: "Family & function room",
      desc: "A private space for birthdays and whānau gatherings.",
    },
    {
      title: "Café & visitor lounge",
      desc: "A welcoming spot for a cuppa when family stay a while.",
    },
  ],
  careWings: [
    {
      name: "Standard",
      care: "Rest home",
      desc: "Warm, comfortable private rooms with everything close at hand and care always nearby.",
    },
    {
      name: "Premium",
      care: "Rest home",
      desc: "Spacious rooms, each with a private ensuite and a sunny garden or courtyard outlook.",
    },
    {
      name: "VIP",
      care: "Rest home",
      desc: "Our finest suites - the most space, the best views and a few extra touches throughout.",
    },
  ],
  benefits: [
    {
      title: "A real team",
      desc: "A small home, low ratios, and colleagues who have your back.",
    },
    {
      title: "Grow with us",
      desc: "Paid training, NZQA support and a clear path to progress.",
    },
    {
      title: "Work that matters",
      desc: "Genuine relationships with residents and their whānau.",
    },
  ],
};
