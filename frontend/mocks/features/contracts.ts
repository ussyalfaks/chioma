/**
 * Mock Contract Data
 */

export interface ContractParty {
  name: string;
  walletAddress: string;
  role: 'USER' | 'ADMIN';
}

export interface Contract {
  id: string;
  propertyName: string;
  propertyAddress: string;
  party1: ContractParty;
  party2: ContractParty;
  party3?: ContractParty;
  rentAmount: string;
  securityDeposit: string;
  commissionRate: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'TERMINATED';
  stage: 'DRAFT' | 'SIGNED' | 'DEPOSIT_LOCKED' | 'ACTIVE' | 'COMPLETED';
  stellarTxHash?: string;
  createdAt: string;
  terms: string;
}

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'CTR-2024-001',
    propertyName: 'Sunrise Apartments - Unit 4B',
    propertyAddress: '12 Victoria Island Rd, Lagos, Nigeria',
    party1: {
      name: 'Chief Emeka Okonkwo',
      walletAddress: 'GBXK...7F2D',
      role: 'USER',
    },
    party2: {
      name: 'Adaeze Nwankwo',
      walletAddress: 'GCPD...9A1E',
      role: 'USER',
    },
    party3: {
      name: 'Sarah Jenks',
      walletAddress: 'GDQF...3B8C',
      role: 'USER',
    },
    rentAmount: '$1,200,000 USDC',
    securityDeposit: '$600,000 USDC',
    commissionRate: '10%',
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    status: 'ACTIVE',
    stage: 'DEPOSIT_LOCKED',
    stellarTxHash: 'a3f8c1...d94e72',
    createdAt: '2024-05-15',
    terms: `LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on this 1st day of June, 2024, by and between:

PARTY 1: Chief Emeka Okonkwo
PARTY 2: Adaeze Nwankwo
PARTY 3: Sarah Jenks (Chioma Platform Agent #8839)

PROPERTY: Sunrise Apartments - Unit 4B, 12 Victoria Island Rd, Lagos, Nigeria

1. TERM: The lease term shall commence on June 1, 2024 and terminate on May 31, 2025.

2. RENT: Party 2 agrees to pay $1,200,000 USDC per annum, payable via Stellar network in monthly installments of $100,000 USDC.

3. SECURITY DEPOSIT: A security deposit of $600,000 USDC shall be held in escrow via Stellar multi-signature transaction. The deposit shall be released within 30 days of lease termination, subject to property inspection.

4. COMMISSION: Party 3 shall receive a commission of 10% of the annual rent, distributed automatically via smart contract upon successful lease execution.

5. MAINTENANCE: Party 1 is responsible for structural repairs. Party 2 is responsible for routine maintenance and keeping the premises in good condition.

6. DISPUTE RESOLUTION: Any disputes shall be resolved through the Chioma platform arbitration process.

7. TERMINATION: Either party may terminate with 30 days written notice.`,
  },
  {
    id: 'CTR-2024-002',
    propertyName: 'Glover Road Residence - Suite A',
    propertyAddress: 'Glover Road, Ikoyi, Lagos, Nigeria',
    party1: {
      name: 'James Adebayo',
      walletAddress: 'GDEF...4K9L',
      role: 'USER',
    },
    party2: {
      name: 'Chioma Okafor',
      walletAddress: 'GHIJ...5M0N',
      role: 'USER',
    },
    rentAmount: '$800,000 USDC',
    securityDeposit: '$400,000 USDC',
    commissionRate: '8%',
    startDate: '2024-07-01',
    endDate: '2025-06-30',
    status: 'ACTIVE',
    stage: 'ACTIVE',
    stellarTxHash: 'b4g9d2...e05f83',
    createdAt: '2024-06-20',
    terms: `LEASE AGREEMENT

This Lease Agreement ("Agreement") is entered into on this 1st day of July, 2024, by and between:

PARTY 1: James Adebayo
PARTY 2: Chioma Okafor

PROPERTY: Glover Road Residence - Suite A, Ikoyi, Lagos, Nigeria

1. TERM: The lease term shall commence on July 1, 2024 and terminate on June 30, 2025.

2. RENT: Party 2 agrees to pay $800,000 USDC per annum, payable via Stellar network in monthly installments of $66,667 USDC.

3. SECURITY DEPOSIT: A security deposit of $400,000 USDC shall be held in escrow.

4. MAINTENANCE: Standard maintenance responsibilities apply as per Chioma platform guidelines.

5. DISPUTE RESOLUTION: Any disputes shall be resolved through the Chioma platform arbitration process.`,
  },
];
