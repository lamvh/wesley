import type { Activity, ActivityDay, Birthday } from "@/types/domain";

const a = (
  time: string,
  title: string,
  where: string,
  category: Activity["category"],
): Activity => ({ time, title, where, category });

const week: ActivityDay[] = [
  {
    dow: "Mon",
    date: "7",
    isToday: false,
    items: [
      a("9:30", "Morning stretch", "Rātā lounge", "move"),
      a("11:00", "Book club", "Library", "social"),
      a("2:00", "Movie matinée", "Cinema room", "social"),
      a("3:30", "Mahjong & cards", "Kōwhai lounge", "social"),
    ],
  },
  {
    dow: "Tue",
    date: "8",
    isToday: false,
    items: [
      a("9:30", "Podiatry clinic", "Sunroom · visiting", "care"),
      a("10:30", "Garden club", "Courtyard", "garden"),
      a("11:30", "Chair yoga", "Kōwhai lounge", "move"),
      a("2:30", "Piano & singalong", "Chapel", "music"),
    ],
  },
  {
    dow: "Wed",
    date: "9",
    isToday: false,
    items: [
      a("9:30", "Baking group", "Kitchen", "craft"),
      a("11:00", "Waiata & kapa haka", "Tōtara lounge", "music"),
      a("1:30", "Hair salon day", "Salon", "care"),
      a("3:00", "Happy hour", "Main lounge", "social"),
    ],
  },
  {
    dow: "Thu",
    date: "10",
    isToday: false,
    items: [
      a("10:00", "Craft circle", "Activity room", "craft"),
      a("11:30", "Tai chi", "Courtyard", "move"),
      a("1:30", "Bus outing — botanic gardens", "Meet foyer", "garden"),
    ],
  },
  {
    dow: "Fri",
    date: "11",
    isToday: true,
    items: [
      a("9:30", "Garden group", "Courtyard", "garden"),
      a("11:00", "Gentle exercise", "Rātā lounge", "move"),
      a("2:00", "Choir & singalong", "Chapel", "music"),
      a("2:30", "Mei’s 90th birthday tea", "Kōwhai lounge", "faith"),
      a("3:30", "Afternoon quiz", "Kōwhai lounge", "social"),
    ],
  },
  {
    dow: "Sat",
    date: "12",
    isToday: false,
    items: [
      a("10:00", "Farmers’ market trip", "Meet foyer", "garden"),
      a("2:00", "Film & popcorn", "Cinema room", "social"),
      a("3:30", "Devotions", "Chapel", "faith"),
    ],
  },
  {
    dow: "Sun",
    date: "13",
    isToday: false,
    items: [
      a("10:30", "Sunday service", "Chapel", "faith"),
      a("12:30", "Family lunch", "Dining room", "social"),
      a("3:00", "Afternoon concert", "Main lounge", "music"),
    ],
  },
];

const birthdays: Birthday[] = [
  { name: "Mei Lam", room: "Kōwhai 24", date: "Yesterday", initials: "ML", color: "#b06a5a", badge: "90th" },
  { name: "Henry Fitzgerald", room: "Rātā 07", date: "14 Jul", initials: "HF", color: "#2C3563", badge: "89th" },
  { name: "Dorothy Nguyen", room: "Kōwhai 21", date: "19 Jul", initials: "DN", color: "#8a6ba3", badge: "92nd" },
  { name: "Patricia Vaughan", room: "Rātā 05", date: "27 Jul", initials: "PV", color: "#B88A34", badge: "81st" },
];

export function getActivityWeek(): ActivityDay[] {
  return week;
}

export function getBirthdays(): Birthday[] {
  return birthdays;
}
