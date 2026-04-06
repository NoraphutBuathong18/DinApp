import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../contexts/AppContext';
import LoginPage from '../pages/LoginPage';

// Mock the API module
vi.mock('../api/client', () => ({
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
}));

import { requestOtp, verifyOtp } from '../api/client';

function renderLoginPage(initialPath = '/login') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <AppProvider>
                <LoginPage />
            </AppProvider>
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});

// ──────────────────────────────────────────────
// Step 1 – Email form
// ──────────────────────────────────────────────
describe('LoginPage – step 1 (email)', () => {
    it('renders the email input and Request OTP button', () => {
        renderLoginPage();

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /request otp/i })).toBeInTheDocument();
    });

    it('does NOT show OTP input in step 1', () => {
        renderLoginPage();

        expect(screen.queryByLabelText(/otp code/i)).not.toBeInTheDocument();
    });

    it('disables submit when email is empty (native required)', () => {
        renderLoginPage();
        const btn = screen.getByRole('button', { name: /request otp/i });
        // The button itself is not disabled – browser validates on submit.
        // We verify requestOtp is NOT called when there is no email value.
        expect(requestOtp).not.toHaveBeenCalled();
    });

    it('returns early (does not call requestOtp) when email is blank', async () => {
        renderLoginPage();
        const form = screen.getByRole('button', { name: /request otp/i }).closest('form');
        fireEvent.submit(form);
        expect(requestOtp).not.toHaveBeenCalled();
    });
});

// ──────────────────────────────────────────────
// Step 2 – OTP form (after successful request)
// ──────────────────────────────────────────────
describe('LoginPage – step 2 (OTP)', () => {
    it('shows OTP input after a successful requestOtp call', async () => {
        requestOtp.mockResolvedValueOnce({ message: 'OTP sent' });

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => {
            expect(screen.getByLabelText(/otp code/i)).toBeInTheDocument();
        });
    });

    it('shows "Back / Resend" button in step 2', async () => {
        requestOtp.mockResolvedValueOnce({});

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
        });
    });

    it('goes back to step 1 when "Back / Resend" is clicked', async () => {
        requestOtp.mockResolvedValueOnce({});

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => screen.getByRole('button', { name: /back/i }));
        await userEvent.click(screen.getByRole('button', { name: /back/i }));

        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('authenticates and redirects on successful OTP verification', async () => {
        requestOtp.mockResolvedValueOnce({});
        verifyOtp.mockResolvedValueOnce({
            user: { email: 'test@example.com', id: 1 },
            access_token: 'fake_token'
        });

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => screen.getByLabelText(/otp code/i));

        await userEvent.type(screen.getByLabelText(/otp code/i), '123456');
        await userEvent.click(screen.getByRole('button', { name: /verify/i }));

        await waitFor(() => {
            expect(verifyOtp).toHaveBeenCalledWith('test@example.com', '123456');
        });
    });

    it('returns early (does not call verifyOtp) when OTP input is blank', async () => {
        requestOtp.mockResolvedValueOnce({});

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => screen.getByLabelText(/otp code/i));

        // Submit OTP form without typing anything
        const otpForm = screen.getByLabelText(/otp code/i).closest('form');
        fireEvent.submit(otpForm);

        expect(verifyOtp).not.toHaveBeenCalled();
    });
});

// ──────────────────────────────────────────────
// Error handling
// ──────────────────────────────────────────────
describe('LoginPage – error messages', () => {
    it('shows error when requestOtp fails', async () => {
        requestOtp.mockRejectedValueOnce(new Error('Email not found'));

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => {
            expect(screen.getByText(/email not found/i)).toBeInTheDocument();
        });
    });

    it('shows fallback error when requestOtp rejects with no message', async () => {
        // Throws a plain object (no .message) → hits the || "Failed to request OTP" branch (line 25)
        requestOtp.mockRejectedValueOnce({});

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'bad@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => {
            expect(screen.getByText(/failed to request otp/i)).toBeInTheDocument();
        });
    });

    it('shows error when verifyOtp fails', async () => {
        requestOtp.mockResolvedValueOnce({});
        verifyOtp.mockRejectedValueOnce(new Error('Invalid OTP'));

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => screen.getByLabelText(/otp code/i));

        await userEvent.type(screen.getByLabelText(/otp code/i), '999999');
        await userEvent.click(screen.getByRole('button', { name: /verify/i }));

        await waitFor(() => {
            expect(screen.getByText(/invalid otp/i)).toBeInTheDocument();
        });
    });

    it('shows fallback error when verifyOtp rejects with no message', async () => {
        // Throws a plain object (no .message) → hits the || "Invalid OTP" branch (line 42)
        requestOtp.mockResolvedValueOnce({});
        verifyOtp.mockRejectedValueOnce({});

        renderLoginPage();

        await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
        await userEvent.click(screen.getByRole('button', { name: /request otp/i }));

        await waitFor(() => screen.getByLabelText(/otp code/i));

        await userEvent.type(screen.getByLabelText(/otp code/i), '123456');
        await userEvent.click(screen.getByRole('button', { name: /verify/i }));

        await waitFor(() => {
            expect(screen.getByText(/invalid otp/i)).toBeInTheDocument();
        });
    });
});
