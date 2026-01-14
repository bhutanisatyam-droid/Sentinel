
/**
 * Setu API Service (Mock / Sandbox)
 * Simulates the NSDL PAN Verification API provided by Setu.
 */

interface SetuResponse {
    status: 'VALID' | 'INVALID' | 'ERROR';
    data?: {
        pan: string;
        fullName: string;
        category: string;
    };
    message?: string;
}

export const SetuService = {
    /**
     * Verifies a PAN Number against the (Mock) Government Database.
     * @param panNumber The 10-character PAN string.
     */
    verifyPAN: async (panNumber: string): Promise<SetuResponse> => {
        // Simulate Network Latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        const cleanPAN = panNumber.toUpperCase();

        // 1. Sandbox Test Key for "INVALID" (Force Fail)
        if (cleanPAN === 'ABCDE1234B') {
            return {
                status: 'INVALID',
                message: 'PAN not found in NSDL Database.'
            };
        }

        // 2. DEMO MODE: Accept ANY Valid PAN Format
        // Regex: 5 Letters, 4 Numbers, 1 Letter
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

        if (panRegex.test(cleanPAN)) {
            return {
                status: 'VALID',
                data: {
                    pan: cleanPAN,
                    fullName: 'SENTINEL DEMO USER', // Generic Name
                    category: 'Individual'
                }
            };
        }

        // 3. Fallback: Invalid Format
        return {
            status: 'INVALID',
            message: `Invalid PAN Format. Please enter a valid PAN (e.g., ABCDE1234A).`
        };
    }
};
