// Declarative field map for the Website CMS editor. Each section maps to a
// marketing page; `fields` edit scalar copy by dotted path, `arrays` edit the
// repeatable sections (each item saved as the whole array). Kinds: text (one
// line), ml (multiline), list (string[] as one-per-line).

export type CmsKind = "text" | "ml" | "list";

export interface CmsField {
  path: string;
  label: string;
  kind?: CmsKind;
}

export interface CmsGroup {
  title?: string;
  fields: CmsField[];
}

export interface CmsArrayField {
  key: string;
  label: string;
  kind?: CmsKind;
}

export interface CmsArray {
  path: string; // e.g. "careLevels"
  title: string;
  fields: CmsArrayField[];
}

export interface CmsSection {
  key: string;
  label: string;
  groups: CmsGroup[];
  arrays: CmsArray[];
  careersNote?: boolean;
}

export const CMS_SECTIONS: CmsSection[] = [
  {
    key: "home",
    label: "Home",
    groups: [
      {
        title: "Hero",
        fields: [
          { path: "hero.badge", label: "Badge" },
          { path: "hero.h1", label: "Heading", kind: "ml" },
          { path: "hero.sub", label: "Subheading", kind: "ml" },
          { path: "hero.cta1", label: "Primary button" },
          { path: "hero.cta2", label: "Secondary button" },
        ],
      },
      {
        title: "Welcome",
        fields: [
          { path: "welcome.eyebrow", label: "Eyebrow" },
          { path: "welcome.h2", label: "Heading", kind: "ml" },
          { path: "welcome.body", label: "Body", kind: "ml" },
          { path: "welcome.tags", label: "Tags (one per line)", kind: "list" },
        ],
      },
      {
        title: "Rooms section",
        fields: [
          { path: "homeRooms.eyebrow", label: "Eyebrow" },
          { path: "homeRooms.h2", label: "Heading" },
          { path: "homeRooms.note", label: "Note", kind: "ml" },
        ],
      },
      {
        title: "Life section",
        fields: [
          { path: "homeLife.eyebrow", label: "Eyebrow" },
          { path: "homeLife.h2", label: "Heading" },
        ],
      },
      {
        title: "Family portal band",
        fields: [
          { path: "family.h2", label: "Heading", kind: "ml" },
          { path: "family.body", label: "Body", kind: "ml" },
          { path: "family.checks", label: "Checklist (one per line)", kind: "list" },
          { path: "family.cta", label: "Button" },
          { path: "family.quote", label: "Sample update quote", kind: "ml" },
        ],
      },
      {
        title: "Testimonial",
        fields: [
          { path: "testimonial.quote", label: "Quote", kind: "ml" },
          { path: "testimonial.author", label: "Attribution" },
        ],
      },
      {
        title: "Enquiry",
        fields: [
          { path: "enquiry.h2", label: "Heading" },
          { path: "enquiry.body", label: "Body", kind: "ml" },
          { path: "enquiry.phone", label: "Phone" },
          { path: "enquiry.address", label: "Address" },
        ],
      },
    ],
    arrays: [
      {
        path: "hero.stats",
        title: "Hero stats",
        fields: [
          { key: "v", label: "Value" },
          { key: "l", label: "Label" },
        ],
      },
    ],
  },
  {
    key: "care",
    label: "Our rooms",
    groups: [
      {
        fields: [
          { path: "care.h1", label: "Heading" },
          { path: "care.intro", label: "Intro", kind: "ml" },
        ],
      },
    ],
    arrays: [
      {
        path: "careLevels",
        title: "Room styles",
        fields: [
          { key: "name", label: "Name" },
          { key: "wing", label: "Wing / tag" },
          { key: "desc", label: "Description", kind: "ml" },
          { key: "points", label: "Points (one per line)", kind: "list" },
        ],
      },
    ],
  },
  {
    key: "life",
    label: "Life here",
    groups: [
      {
        fields: [
          { path: "life.h1", label: "Heading" },
          { path: "life.sub", label: "Subheading", kind: "ml" },
          { path: "life.dayHeading", label: "Timeline heading" },
        ],
      },
    ],
    arrays: [
      {
        path: "features",
        title: "Feature cards",
        fields: [
          { key: "title", label: "Title" },
          { key: "desc", label: "Description", kind: "ml" },
        ],
      },
      {
        path: "dayTimeline",
        title: "A day at Wesley",
        fields: [
          { key: "time", label: "Time" },
          { key: "title", label: "Title" },
          { key: "desc", label: "Description", kind: "ml" },
        ],
      },
    ],
  },
  {
    key: "ourhome",
    label: "Our home",
    groups: [
      {
        fields: [
          { path: "ourhome.h1", label: "Heading" },
          { path: "ourhome.sub", label: "Subheading", kind: "ml" },
          { path: "ourhome.introH2", label: "Intro heading" },
          { path: "ourhome.introBody", label: "Intro body", kind: "ml" },
          { path: "ourhome.facHeading", label: "Facilities heading" },
          { path: "ourhome.roomStylesHeading", label: "Room styles heading" },
          { path: "ourhome.findH2", label: "Find-us heading" },
          { path: "ourhome.findBody", label: "Find-us body", kind: "ml" },
        ],
      },
    ],
    arrays: [
      {
        path: "facilities",
        title: "Facilities",
        fields: [
          { key: "title", label: "Title" },
          { key: "desc", label: "Description", kind: "ml" },
        ],
      },
      {
        path: "careWings",
        title: "Room styles",
        fields: [
          { key: "name", label: "Name" },
          { key: "care", label: "Care tag" },
          { key: "desc", label: "Description", kind: "ml" },
        ],
      },
    ],
  },
  {
    key: "careers",
    label: "Careers",
    careersNote: true,
    groups: [
      {
        fields: [
          { path: "careers.h1", label: "Heading" },
          { path: "careers.sub", label: "Subheading", kind: "ml" },
        ],
      },
    ],
    arrays: [
      {
        path: "benefits",
        title: "Benefits",
        fields: [
          { key: "title", label: "Title" },
          { key: "desc", label: "Description", kind: "ml" },
        ],
      },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    groups: [
      {
        fields: [
          { path: "contact.h1", label: "Heading" },
          { path: "contact.sub", label: "Subheading", kind: "ml" },
          { path: "contact.phone", label: "Phone" },
          { path: "contact.address", label: "Address" },
          { path: "contact.addressSub", label: "Address (suburb)" },
          { path: "contact.email", label: "Email" },
          { path: "contact.hours", label: "Visiting hours", kind: "ml" },
        ],
      },
    ],
    arrays: [],
  },
  {
    key: "footer",
    label: "Footer",
    groups: [{ fields: [{ path: "footer.blurb", label: "Blurb", kind: "ml" }] }],
    arrays: [],
  },
];
