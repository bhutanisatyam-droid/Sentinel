export const API_URL = 'http://localhost:5000/api';

const getAuthHeaders = (): any => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
    async register(data: any) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const text = await res.text();
            try {
                throw JSON.parse(text);
            } catch (e) {
                throw { error: `Server Error ${res.status}: ${text}` };
            }
        }
        const json = await res.json();
        if (json.token) localStorage.setItem('token', json.token);
        return json;
    },

    async login(email: string, password: string) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw await res.json();
        const json = await res.json();
        if (json.token) localStorage.setItem('token', json.token);
        return json;
    },

    async getKYCStatus(userId: string) {
        const res = await fetch(`${API_URL}/kyc/status/${userId}`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async submitKYC(data: any) {
        const res = await fetch(`${API_URL}/kyc/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async validateDocument(data: FormData) {
        const res = await fetch(`${API_URL}/kyc/validate-document`, {
            method: 'POST',
            headers: { ...getAuthHeaders() }, // No Content-Type for FormData
            body: data,
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async verifyKYC(data: any) {
        const res = await fetch(`${API_URL}/kyc/verify`, {
            method: 'POST',
            headers: { ...getAuthHeaders() },
            body: data,
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async getTransactions(userId: string) {
        const res = await fetch(`${API_URL}/transactions/${userId}`, {
            headers: { ...getAuthHeaders() }
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async createTransaction(data: any) {
        const res = await fetch(`${API_URL}/transactions/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw await res.json();
        return res.json();
    },

    async deposit(userId: string, amount: number) {
        const res = await fetch(`${API_URL}/transactions/deposit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ userId, amount }),
        });
        if (!res.ok) throw await res.json();
        return res.json();
    }
};
