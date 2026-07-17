import type {
  Benefit,
  CareWing,
  ContactInfo,
  Facility,
  Feature,
  JobRole,
  RoomStyle,
  TimelineStep,
} from "@/types/domain";

const roomStyles: RoomStyle[] = [
  {
    name: "VIP suite",
    wing: "VIP · Tōtara wing",
    slot: "vme-care1",
    desc: "Our finest rooms - spacious suites with a private ensuite, garden outlook and a few extra touches that make all the difference.",
    points: ["Largest rooms with private ensuite", "Premium furnishings & garden views", "Priority booking for outings & salon"],
  },
  {
    name: "Premium suite",
    wing: "Premium · Kōwhai wing",
    slot: "vme-care2",
    desc: "Generous private rooms with an ensuite and a sunny outlook - extra space and comfort with room to breathe.",
    points: ["Spacious room with private ensuite", "Sunny garden or courtyard outlook", "Extra seating & storage"],
  },
  {
    name: "Normal room",
    wing: "Comfort · Rātā wing",
    slot: "vme-care3",
    desc: "Warm, comfortable rooms with everything you need close at hand - the same caring team and full programme as every suite.",
    points: ["Comfortable, homely private room", "Bathroom & lounges close by", "Full activities & dining included"],
  },
];

const features: Feature[] = [
  { title: "Chef-prepared meals", desc: "Fresh, seasonal home cooking with every dietary need catered for, three times a day.", icon: "meals" },
  { title: "Activities & outings", desc: "A full weekly programme - from garden club to choir, craft circles and bus trips.", icon: "activities" },
  { title: "Landscaped gardens", desc: "Sunny courtyards and raised beds where green thumbs can potter to their heart’s content.", icon: "garden" },
  { title: "The family portal", desc: "Daily updates, photos and secure messaging keep whānau close, wherever they are.", icon: "family" },
  { title: "Physio & wellbeing", desc: "On-site physiotherapy, podiatry and a visiting GP keep everyone at their best.", icon: "wellbeing" },
  { title: "Hair salon & podiatry", desc: "Little luxuries matter - our on-site salon keeps everyone feeling their best.", icon: "salon" },
];

const dayTimeline: TimelineStep[] = [
  { time: "Morning", title: "A gentle start", desc: "Wake at your own pace, a hot breakfast to order, morning medications and a wander in the garden." },
  { time: "Midday", title: "Together at the table", desc: "A chef-prepared two-course lunch in the dining room, with every dietary need catered for." },
  { time: "Afternoon", title: "Something to look forward to", desc: "Choir, craft, exercise or an outing - plus afternoon tea and visits from whānau." },
  { time: "Evening", title: "Winding down", desc: "A lighter supper, a film or music in the lounge, and a calm, well-supported night." },
];

const facilities: Facility[] = [
  { title: "Landscaped gardens & courtyards", desc: "Sunny, sheltered spaces and raised beds for the keen gardeners." },
  { title: "Chef-run kitchen", desc: "Fresh, seasonal cooking prepared on site three times a day." },
  { title: "Chapel & lounges", desc: "Quiet spaces for reflection, services, films and singalongs." },
  { title: "Hair salon & therapy room", desc: "On-site salon, podiatry and physiotherapy." },
  { title: "Family & function room", desc: "A private space for birthdays and whānau gatherings." },
  { title: "Café & visitor lounge", desc: "A welcoming spot for a cuppa when family stay a while." },
];

const careWings: CareWing[] = [
  { name: "Rātā", care: "Normal", desc: "Our largest wing of warm, comfortable rooms - social, bright and independent, with care always close at hand." },
  { name: "Kōwhai", care: "Premium", desc: "Spacious premium rooms, each with a private ensuite and a sunny garden or courtyard outlook." },
  { name: "Tōtara", care: "VIP", desc: "Our finest VIP suites - the most space, the best views and a few extra touches throughout." },
];

const jobRoles: JobRole[] = [
  { title: "Registered Nurse", type: "Full-time · Kōwhai wing", desc: "Lead clinical care across a supportive, well-staffed wing." },
  { title: "Caregiver / Healthcare Assistant", type: "Full & part-time", desc: "Hands-on daily care - the heart of life at Wesley. Training provided." },
  { title: "Activities Coordinator", type: "Part-time", desc: "Plan and run our weekly programme, outings and celebrations." },
  { title: "Chef / Cook", type: "Full-time", desc: "Prepare fresh, seasonal meals our residents look forward to." },
];

const benefits: Benefit[] = [
  { title: "A real team", desc: "A small home, low ratios, and colleagues who have your back." },
  { title: "Grow with us", desc: "Paid training, NZQA support and a clear path to progress." },
  { title: "Work that matters", desc: "Genuine relationships with residents and their whānau." },
];

const testimonial = {
  quote:
    "Mum settled at Victoria in a way we didn't think possible. The team don't just care for her - they know her. That's everything.",
  author: "Katherine R. - daughter of a resident",
};

const stats: { value: string; label: string }[] = [
  { value: "54", label: "care suites" },
  { value: "1:5", label: "day carer ratio" },
  { value: "27 yrs", label: "caring for Tāmaki" },
];

const contactInfo: ContactInfo = {
  phone: "09 630 1998",
  address: "227 Mt Eden Rd",
  suburb: "Mt Eden, Tāmaki Makaurau",
  email: "hello@wesleymteden.nz",
  hours: "Every day, 9:00am – 7:00pm. Whānau are always welcome.",
};

export function getRoomStyles(): RoomStyle[] {
  return roomStyles;
}

export function getFeatures(): Feature[] {
  return features;
}

export function getDayTimeline(): TimelineStep[] {
  return dayTimeline;
}

export function getFacilities(): Facility[] {
  return facilities;
}

export function getCareWings(): CareWing[] {
  return careWings;
}

export function getJobRoles(): JobRole[] {
  return jobRoles;
}

export function getBenefits(): Benefit[] {
  return benefits;
}

export function getTestimonial(): { quote: string; author: string } {
  return testimonial;
}

export function getStats(): { value: string; label: string }[] {
  return stats;
}

export function getContactInfo(): ContactInfo {
  return contactInfo;
}
