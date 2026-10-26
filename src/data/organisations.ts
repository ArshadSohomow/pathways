import type { Organisation, Service } from "../types";

// All organisations, services, phone numbers and addresses are fictional.
// Phone numbers use the Ofcom drama-reserved ranges (01632 960xxx, 020 7946 0xxx).

export const organisations: Organisation[] = [
  {
    id: "org-willowmere",
    name: "Willowmere Medical Practice",
    organisationType: "GP practice",
    jurisdiction: "England, UK",
    location: "Northvale",
    sector: "NHS",
    contactDetails: { phone: "01632 960 112", address: "4 Fernhill Road, Northvale NV3 2PL", hours: "Mon–Fri 08:00–18:30" },
  },
  {
    id: "org-northvale-hosp",
    name: "Northvale General Hospital",
    organisationType: "NHS hospital trust",
    jurisdiction: "England, UK",
    location: "Northvale",
    sector: "NHS",
    contactDetails: { phone: "01632 960 400", address: "Ashby Lane, Northvale NV1 7QT", hours: "Switchboard 24 hours" },
  },
  {
    id: "org-northvale-comm",
    name: "Northvale Community Health Services",
    organisationType: "Community health services",
    jurisdiction: "England, UK",
    location: "Northvale and surrounding villages",
    sector: "NHS",
    contactDetails: { phone: "01632 960 520", address: "Riverside Centre, Mill Street, Northvale NV2 4HD", hours: "Mon–Fri 09:00–17:00" },
  },
  {
    id: "org-ambulance",
    name: "Greater Vale Ambulance Service",
    organisationType: "Ambulance service",
    jurisdiction: "England, UK",
    location: "Regional",
    sector: "NHS",
    contactDetails: { phone: "01632 960 999 (records enquiries only)" },
  },
  {
    id: "org-larchfield",
    name: "Larchfield Private Clinic",
    organisationType: "Private provider",
    jurisdiction: "England, UK",
    location: "Kestrel Park",
    sector: "Private",
    contactDetails: { phone: "020 7946 0381", email: "appointments@larchfield.example", address: "12 Orchard Mews, Kestrel Park KP4 9RT", hours: "Mon–Sat 08:00–20:00" },
  },
  {
    id: "org-marazul",
    name: "Clínica Mar Azul",
    organisationType: "Overseas provider",
    jurisdiction: "Spain",
    location: "Valencia, Spain",
    sector: "Overseas",
    contactDetails: { phone: "+34 960 000 214 (fictional)", email: "info@marazul.example" },
  },
  {
    id: "org-heronbridge",
    name: "Heronbridge Surgery",
    organisationType: "GP practice",
    jurisdiction: "England, UK",
    location: "Heronbridge",
    sector: "NHS",
    contactDetails: { phone: "01632 960 731", address: "The Green, Heronbridge HB1 1AA", hours: "Mon–Fri 08:00–18:00" },
  },
  {
    id: "org-lisbon",
    name: "Hospital da Ribeira (Lisbon)",
    organisationType: "Overseas provider",
    jurisdiction: "Portugal",
    location: "Lisbon, Portugal",
    sector: "Overseas",
    contactDetails: { phone: "+351 210 000 118 (fictional)" },
  },
];

export const services: Service[] = [
  { id: "svc-gp", organisationId: "org-willowmere", name: "General practice", serviceType: "Primary care", description: "Day-to-day care, prescriptions, blood test monitoring and referrals to specialists." },
  { id: "svc-gastro", organisationId: "org-northvale-hosp", name: "Gastroenterology outpatients", serviceType: "Specialist outpatient clinic", description: "Specialist clinic for conditions affecting the stomach and bowel.", contactDetails: { phone: "01632 960 433" } },
  { id: "svc-endoscopy", organisationId: "org-northvale-hosp", name: "Endoscopy unit", serviceType: "Diagnostics", description: "Camera tests such as colonoscopy." },
  { id: "svc-ed", organisationId: "org-northvale-hosp", name: "Emergency Department", serviceType: "Emergency care", description: "Urgent assessment and treatment, open 24 hours." },
  { id: "svc-amu", organisationId: "org-northvale-hosp", name: "Acute Medical Unit (Ward 7)", serviceType: "Inpatient ward", description: "Short-stay ward for people admitted as an emergency." },
  { id: "svc-ward12", organisationId: "org-northvale-hosp", name: "Gastroenterology ward (Ward 12)", serviceType: "Inpatient ward", description: "Specialist ward for bowel and liver conditions." },
  { id: "svc-ibdnurse", organisationId: "org-northvale-comm", name: "Community IBD nursing", serviceType: "Community nursing", description: "Specialist nurses supporting people with inflammatory bowel disease at home and by phone.", contactDetails: { phone: "01632 960 545" } },
  { id: "svc-cmht", organisationId: "org-northvale-comm", name: "Riverside Community Mental Health Team", serviceType: "Community mental health", description: "Assessment and short-term support for people experiencing mental health difficulties.", contactDetails: { phone: "01632 960 560" } },
  { id: "svc-rheum", organisationId: "org-northvale-hosp", name: "Rheumatology outpatients", serviceType: "Specialist outpatient clinic", description: "Specialist clinic for joint and muscle conditions." },
  { id: "svc-amb", organisationId: "org-ambulance", name: "Emergency ambulance", serviceType: "Pre-hospital care", description: "Emergency response and transport to hospital." },
  { id: "svc-diet", organisationId: "org-larchfield", name: "Private dietetics", serviceType: "Private outpatient", description: "Private consultations with a registered dietitian (self-funded)." },
  { id: "svc-marazul", organisationId: "org-marazul", name: "Urgent care clinic", serviceType: "Overseas urgent care", description: "Walk-in urgent care clinic." },
  // Patient 2
  { id: "svc-gp-heron", organisationId: "org-heronbridge", name: "General practice", serviceType: "Primary care", description: "Day-to-day care and referrals." },
  { id: "svc-ortho", organisationId: "org-northvale-hosp", name: "Trauma & orthopaedics (Ward 4)", serviceType: "Inpatient ward", description: "Ward for people recovering from fractures and bone surgery." },
  { id: "svc-rehab", organisationId: "org-northvale-comm", name: "Community rehabilitation team", serviceType: "Community rehabilitation", description: "Physiotherapists and occupational therapists supporting recovery at home.", contactDetails: { phone: "01632 960 580" } },
  { id: "svc-falls", organisationId: "org-northvale-comm", name: "Falls prevention service", serviceType: "Community service", description: "Assessment and support to reduce the risk of falls." },
  // Patient 3
  { id: "svc-resp", organisationId: "org-northvale-hosp", name: "Respiratory outpatients", serviceType: "Specialist outpatient clinic", description: "Specialist clinic for asthma and other lung conditions." },
  { id: "svc-lisbon", organisationId: "org-lisbon", name: "Emergency service", serviceType: "Overseas emergency care", description: "Hospital emergency service." },
  { id: "svc-physio-priv", organisationId: "org-larchfield", name: "Private physiotherapy", serviceType: "Private outpatient", description: "Self-funded physiotherapy sessions." },
];
