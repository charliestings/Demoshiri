export interface Profile {
    id: string;
    full_name: string;
    email?: string;
    is_admin: boolean;
    kyc_status: string;
    kyc_match_score?: number;
    kyc_liveness_verified?: boolean;
    kyc_documents?: Record<string, string | null>;
    kyc_submitted_at?: string;
    created_at?: string;
    pan_number?: string;
    aadhar_number?: string;
    city?: string;
    monthly_income?: number;
}

export interface Loan {
    id: string;
    borrower_id: string;
    purpose: string;
    amount: number;
    interest_rate: number;
    duration_months: number;
    status: string;
    funded_amount?: number;
    profiles?: Profile;
    created_at?: string;
}

export interface Investment {
    id: string;
    investor_id: string;
    loan_id: string;
    amount: number;
    loans?: Loan;
}

export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    type: string;
    description: string;
    status: string;
    created_at: string;
}

export type AuthFieldErrors = {
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    occupation?: string;
    monthlyIncome?: string;
    role?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
};
