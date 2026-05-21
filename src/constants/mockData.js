// src/constants/mockData.js

export const MOCK_ASSIGNED_VOUCHERS = [
  {
    id: 1,
    voucherCode: "VCH-ABC123XYZ",
    productName: "Basic CTPL",
    premium: 560.00,
    assignedBy: "Juan Dela Cruz",
    assignedDate: "May 15, 2026",
    expiryDate: "May 15, 2027",
    status: "Active"
  },
  {
    id: 2,
    voucherCode: "VCH-DEF456UVW",
    productName: "Premium CTPL",
    premium: 850.00,
    assignedBy: "Maria Santos",
    assignedDate: "May 10, 2026",
    expiryDate: "May 10, 2027",
    status: "Active"
  },
  {
    id: 3,
    voucherCode: "VCH-GHI789RST",
    productName: "Motorcycle CTPL",
    premium: 350.00,
    assignedBy: "Pedro Reyes",
    assignedDate: "May 5, 2026",
    expiryDate: "Nov 5, 2026",
    status: "Active"
  },
  {
    id: 4,
    voucherCode: "VCH-JKL012MNO",
    productName: "Commercial Vehicle CTPL",
    premium: 1200.00,
    assignedBy: "Juan Dela Cruz",
    assignedDate: "Apr 28, 2026",
    expiryDate: "Apr 28, 2027",
    status: "Used"
  },
  {
    id: 5,
    voucherCode: "VCH-PQR345STU",
    productName: "Heavy Equipment CTPL",
    premium: 1800.00,
    assignedBy: "Maria Santos",
    assignedDate: "Apr 20, 2026",
    expiryDate: "Apr 20, 2027",
    status: "Expired"
  }
];

export const MOCK_PRODUCTS = [
  {
    id: 1,
    productName: "Basic CTPL",
    coverage: "Third Party Liability",
    price: 560.00,
    description: "Basic coverage for third party liability as required by LTO",
    validityDays: 365,
    insuranceCode: "PRIVATE CARS (INCLUDING JEEPS AND AUVS)",
    isActive: true
  },
  {
    id: 2,
    productName: "Premium CTPL",
    coverage: "Third Party Liability + Personal Accident",
    price: 850.00,
    description: "Enhanced coverage with personal accident insurance for driver",
    validityDays: 365,
    insuranceCode: "PRIVATE CARS (INCLUDING JEEPS AND AUVS)",
    isActive: true
  },
  {
    id: 3,
    productName: "Motorcycle CTPL",
    coverage: "Third Party Liability for Motorcycles",
    price: 350.00,
    description: "Affordable CTPL coverage for motorcycles",
    validityDays: 365,
    insuranceCode: "MOTORCYCLES",
    isActive: true
  },
  {
    id: 4,
    productName: "Commercial Vehicle CTPL",
    coverage: "Third Party Liability for Commercial Vehicles",
    price: 1200.00,
    description: "Comprehensive CTPL for commercial vehicles and fleets",
    validityDays: 365,
    insuranceCode: "COMMERCIAL VEHICLES",
    isActive: true
  },
  {
    id: 5,
    productName: "Heavy Equipment CTPL",
    coverage: "Third Party Liability for Heavy Equipment",
    price: 1800.00,
    description: "Specialized coverage for heavy equipment and machinery",
    validityDays: 365,
    insuranceCode: "HEAVY EQUIPMENT",
    isActive: true
  },
  {
    id: 6,
    productName: "Public Utility CTPL",
    coverage: "Third Party Liability for PUVs",
    price: 1450.00,
    description: "CTPL coverage for public utility vehicles, taxis, and jeepneys",
    validityDays: 365,
    insuranceCode: "TAXI/PUBLIC UTILITY VEHICLES",
    isActive: true
  }
];

export const MOCK_PURCHASE_HISTORY = [
  {
    id: "POL-20241201-001",
    policyNumber: "CTPL-2024-123456",
    voucherCode: "VCH-ABC123XYZ",
    productName: "Basic CTPL",
    premium: 560.00,
    purchaseDate: "Dec 1, 2024",
    expirationDate: "Dec 1, 2025",
    status: "Active",
    redeemedOn: null,
    insuranceCode: "PRIVATE CARS (INCLUDING JEEPS AND AUVS)"
  },
  {
    id: "POL-20241125-002",
    policyNumber: "CTPL-2024-789012",
    voucherCode: "VCH-DEF456UVW",
    productName: "Premium CTPL",
    premium: 850.00,
    purchaseDate: "Nov 25, 2024",
    expirationDate: "Nov 25, 2025",
    status: "Redeemed",
    redeemedOn: "Nov 26, 2024",
    insuranceCode: "PRIVATE CARS (INCLUDING JEEPS AND AUVS)"
  },
  {
    id: "POL-20241015-003",
    policyNumber: "CTPL-2024-345678",
    voucherCode: "VCH-GHI789RST",
    productName: "Motorcycle CTPL",
    premium: 350.00,
    purchaseDate: "Oct 15, 2024",
    expirationDate: "Apr 15, 2025",
    status: "Expired",
    redeemedOn: null,
    insuranceCode: "MOTORCYCLES"
  }
];

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

// Optional: Export all as a single object for convenience
export const MOCK_DATA = {
  assignedVouchers: MOCK_ASSIGNED_VOUCHERS,
  products: MOCK_PRODUCTS,
  purchaseHistory: MOCK_PURCHASE_HISTORY,
  companies: MOCK_COMPANIES,
  transactions: MOCK_TRANSACTIONS,
  vehicle: MOCK_VEHICLE,
  owner: MOCK_OWNER,
  insurance: MOCK_INSURANCE,
};