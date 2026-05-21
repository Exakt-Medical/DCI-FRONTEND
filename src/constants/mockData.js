export const MOCK_COMPANIES = [
  { id: 1, code: "PIC-001", name: "Premier Insurance Corp", provider: "LTO", status: "Active", dateCreated: "2026-01-15", branch: "Main", address: "123 Ayala Ave, Makati City", logo: null },
  { id: 2, code: "FGI-002", name: "Fortune General Insurance", provider: "LTO", status: "Pending", dateCreated: "2026-02-20", branch: "Cebu Branch", address: "45 Colon St, Cebu City", logo: null },
  { id: 3, code: "MIC-003", name: "Malayan Insurance Co.", provider: "LTO", status: "Active", dateCreated: "2026-01-08", branch: "Davao", address: "78 JP Laurel Ave, Davao City", logo: null },
  { id: 4, code: "COC-004", name: "Country Bankers Insurance", provider: "LTO", status: "Inactive", dateCreated: "2023-12-01", branch: "BGC", address: "11th Ave, BGC, Taguig", logo: null },
  { id: 5, code: "SGI-005", name: "Standard Insurance Co.", provider: "LTO", status: "Declined", dateCreated: "2026-03-10", branch: "QC Branch", address: "12 Quezon Ave, QC", logo: null },
  { id: 6, code: "CAI-006", name: "Charter Ping An Insurance", provider: "LTO", status: "Deactivated", dateCreated: "2023-11-15", branch: "Ortigas", address: "ADB Ave, Mandaluyong", logo: null },
];

export const MOCK_TRANSACTIONS = [
  { id: 1, agent: "Maria Santos", company: "Premier Insurance Corp", assuredName: "Juan dela Cruz", authNo: "AUTH-2026-00123", dateCreated: "2026-06-01 09:14:32" },
  { id: 2, agent: "Pedro Reyes", company: "Malayan Insurance Co.", assuredName: "Rosa Magsaysay", authNo: "AUTH-2026-00124", dateCreated: "2026-06-01 09:45:11" },
  { id: 3, agent: "Ana Lim", company: "Fortune General Insurance", assuredName: "Carlos Aquino", authNo: "AUTH-2026-00125", dateCreated: "2026-06-01 10:02:47" },
  { id: 4, agent: "Jose Bautista", company: "Premier Insurance Corp", assuredName: "Elena Ramos", authNo: "AUTH-2026-00126", dateCreated: "2026-06-01 10:30:05" },
  { id: 5, agent: "Carla Torres", company: "Standard Insurance Co.", assuredName: "Miguel Fernandez", authNo: "AUTH-2026-00127", dateCreated: "2026-06-01 11:00:22" },
];

export const MOCK_VEHICLE = {
  plateNumber: "ABC 1234",
  mvFileNo: "MV-2019-00456789",
  engineNo: "4K-E123456",
  chassisNo: "JTDBE33K7Y0123456",
  makeModel: "Toyota Vios 1.3 E",
  yearModel: "2019",
  color: "Pearl White",
  bodyType: "Sedan",
  fuelType: "Gasoline",
  grossWeight: "1,405 kg",
  netWeight: "1,155 kg",
  mvType: "Private",
  orcrNo: "OR-2023-78901",
  registrationExpiry: "December 31, 2026",
};

export const MOCK_OWNER = {
  lastName: "Dela Cruz",
  firstName: "Juan",
  middleName: "Santos",
  address: "123 Rizal St, San Juan, Metro Manila",
  zipCode: "1500",
  contactNo: "09171234567",
  email: "juan.delacruz@email.com",
  tin: "123-456-789-000",
};

export const MOCK_INSURANCE = {
  insurer: "Premier Insurance Corp.",
  policyNo: "POL-CTPL-2026-00789",
  effectivityDate: "January 1, 2026",
  expiryDate: "December 31, 2026",
  coverageType: "CTPL - Compulsory Third Party Liability",
  sumInsured: "₱ 100,000.00",
  premium: "₱ 650.00",
  agentName: "Maria Santos",
};