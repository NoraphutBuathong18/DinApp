import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestOtp, verifyOtp, uploadFile, analyzeFile, getHistory, chatWithAI, uploadAvatar } from '../api/client';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function mockFetch(status, body) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
    });
}

// mock where res.json() rejects (simulates unparseable body)
function mockFetchBrokenJson(status) {
    return vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.reject(new Error('parse error')),
    });
}

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    vi.restoreAllMocks();
});

// ──────────────────────────────────────────────
// requestOtp
// ──────────────────────────────────────────────
describe('requestOtp', () => {
    it('calls the correct endpoint with email', async () => {
        global.fetch = mockFetch(200, { message: 'OTP sent' });

        await requestOtp('test@example.com');

        expect(fetch).toHaveBeenCalledWith('/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com' }),
        });
    });

    it('returns the response body on success', async () => {
        global.fetch = mockFetch(200, { message: 'OTP sent' });

        const result = await requestOtp('test@example.com');
        expect(result).toEqual({ message: 'OTP sent' });
    });

    it('throws an error when response is not ok', async () => {
        global.fetch = mockFetch(400, { detail: 'Email not found' });

        await expect(requestOtp('bad@example.com')).rejects.toThrow('Email not found');
    });

    it('falls back to default message when response body is unparseable', async () => {
        global.fetch = mockFetchBrokenJson(400);
        await expect(requestOtp('bad@example.com')).rejects.toThrow('Failed to request OTP');
    });
});

// ──────────────────────────────────────────────
// verifyOtp
// ──────────────────────────────────────────────
describe('verifyOtp', () => {
    it('calls the correct endpoint with email and otp', async () => {
        global.fetch = mockFetch(200, { user: { email: 'test@example.com' }, access_token: 'abc123' });

        await verifyOtp('test@example.com', '123456');

        expect(fetch).toHaveBeenCalledWith('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', otp: '123456' }),
        });
    });

    it('returns user and token on success', async () => {
        const mockData = { user: { email: 'test@example.com' }, access_token: 'token_xyz' };
        global.fetch = mockFetch(200, mockData);

        const result = await verifyOtp('test@example.com', '123456');
        expect(result.user.email).toBe('test@example.com');
        expect(result.access_token).toBe('token_xyz');
    });

    it('throws an error on invalid OTP', async () => {
        global.fetch = mockFetch(401, { detail: 'Invalid OTP' });

        await expect(verifyOtp('test@example.com', '000000')).rejects.toThrow('Invalid OTP');
    });

    it('falls back to default message when response body is unparseable', async () => {
        global.fetch = mockFetchBrokenJson(401);
        await expect(verifyOtp('bad@example.com', '000000')).rejects.toThrow('Failed to verify OTP');
    });
});

// ──────────────────────────────────────────────
// Auth headers – getHistory uses Authorization header
// ──────────────────────────────────────────────
describe('getHistory (auth header)', () => {
    it('sends Authorization header when token exists in localStorage', async () => {
        localStorage.setItem('dinapp_token', 'mytoken123');
        global.fetch = mockFetch(200, []);

        await getHistory();

        const callArgs = fetch.mock.calls[0];
        expect(callArgs[1].headers).toMatchObject({
            Authorization: 'Bearer mytoken123',
        });
    });

    it('sends no Authorization header when token is absent', async () => {
        global.fetch = mockFetch(200, []);

        await getHistory();

        const callArgs = fetch.mock.calls[0];
        expect(callArgs[1].headers?.Authorization).toBeUndefined();
    });

    it('throws an error when response is not ok', async () => {
        global.fetch = mockFetch(500, { detail: "Server error" });
        await expect(getHistory()).rejects.toThrow('Failed to fetch history');
    });
});

// ──────────────────────────────────────────────
// uploadFile
// ──────────────────────────────────────────────
describe('uploadFile', () => {
    it('sends a POST request with FormData', async () => {
        global.fetch = mockFetch(200, { filename: 'soil.csv' });

        const file = new File(['a,b'], 'soil.csv', { type: 'text/csv' });
        const result = await uploadFile(file);

        expect(fetch).toHaveBeenCalledWith('/api/upload/', expect.objectContaining({ method: 'POST' }));
        expect(result).toEqual({ filename: 'soil.csv' });
    });

    it('throws on upload failure', async () => {
        global.fetch = mockFetch(422, { detail: 'Invalid file' });

        const file = new File(['bad'], 'bad.txt', { type: 'text/plain' });
        await expect(uploadFile(file)).rejects.toThrow('Invalid file');
    });

    it('falls back to "Upload failed" when error has no detail', async () => {
        global.fetch = mockFetch(500, {});
        const file = new File(['bad'], 'bad.csv', { type: 'text/csv' });
        await expect(uploadFile(file)).rejects.toThrow('Upload failed');
    });
});

// ──────────────────────────────────────────────
// analyzeFile
// ──────────────────────────────────────────────
describe('analyzeFile', () => {
    it('sends POST request with filename', async () => {
        global.fetch = mockFetch(200, { result: 'success' });
        const result = await analyzeFile('test.csv');
        expect(fetch).toHaveBeenCalledWith('/api/analyze/', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ filename: 'test.csv' })
        }));
        expect(result).toEqual({ result: 'success' });
    });

    it('throws on analysis failure', async () => {
        global.fetch = mockFetch(400, { detail: 'Analysis failed error' });
        await expect(analyzeFile('test.csv')).rejects.toThrow('Analysis failed error');
    });

    it('falls back to "Analysis failed" when error has no detail', async () => {
        global.fetch = mockFetch(500, {});
        await expect(analyzeFile('test.csv')).rejects.toThrow('Analysis failed');
    });
});

// ──────────────────────────────────────────────
// chatWithAI
// ──────────────────────────────────────────────
describe('chatWithAI', () => {
    it('sends POST request with message and context', async () => {
        global.fetch = mockFetch(200, { reply: 'hello' });
        const result = await chatWithAI('hi', 'some context');
        expect(fetch).toHaveBeenCalledWith('/api/chat/', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ message: 'hi', context: 'some context' })
        }));
        expect(result).toEqual({ reply: 'hello' });
    });

    it('throws on chat failure', async () => {
        global.fetch = mockFetch(500, { detail: 'Chat error' });
        await expect(chatWithAI('hi')).rejects.toThrow('Chat error');
    });

    it('falls back to "Chat failed" when error has no detail', async () => {
        global.fetch = mockFetch(500, {});
        await expect(chatWithAI('hi')).rejects.toThrow('Chat failed');
    });
});

// ──────────────────────────────────────────────
// uploadAvatar
// ──────────────────────────────────────────────
describe('uploadAvatar', () => {
    it('sends PUT request with base64Image', async () => {
        global.fetch = mockFetch(200, { success: true });
        const result = await uploadAvatar('data:image/png;base64,123');
        expect(fetch).toHaveBeenCalledWith('/api/users/me/avatar', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ profile_picture: 'data:image/png;base64,123' })
        }));
        expect(result).toEqual({ success: true });
    });

    it('throws on upload failure', async () => {
        global.fetch = mockFetch(400, { detail: 'Upload error' });
        await expect(uploadAvatar('bad data')).rejects.toThrow('Upload error');
    });

    it('falls back to "Failed to upload avatar" when json throws', async () => {
        global.fetch = mockFetchBrokenJson(400);
        await expect(uploadAvatar('bad data')).rejects.toThrow('Failed to upload avatar');
    });
});
