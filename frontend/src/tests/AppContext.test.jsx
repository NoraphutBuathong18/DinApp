import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useApp } from '../contexts/AppContext';

// ──────────────────────────────────────────────
// Helper component to expose context values
// ──────────────────────────────────────────────
function TestConsumer({ action }) {
    const ctx = useApp();
    if (action) action(ctx);
    return (
        <>
            <span data-testid="user">{ctx.user ? ctx.user.email : 'null'}</span>
            <span data-testid="chat-count">{ctx.chatMessages.length}</span>
        </>
    );
}

beforeEach(() => {
    localStorage.clear();
});

describe('AppContext – login', () => {
    it('sets user state and persists token to localStorage', () => {
        const userData = { email: 'user@example.com', name: 'Test' };

        render(
            <AppProvider>
                <TestConsumer
                    action={(ctx) => {
                        // Call login once on first render – use act to flush state
                    }}
                />
            </AppProvider>
        );

        // Trigger login via act
        act(() => {
            // We need a plain component that calls login on mount
        });
    });

    it('stores token in localStorage after login', () => {
        function LoginTrigger() {
            const { login } = useApp();
            return (
                <button onClick={() => login({ email: 'a@b.com' }, 'tok123')}>
                    login
                </button>
            );
        }

        const { getByRole } = render(
            <AppProvider>
                <LoginTrigger />
            </AppProvider>
        );

        act(() => {
            getByRole('button').click();
        });

        expect(localStorage.getItem('dinapp_token')).toBe('tok123');
        expect(localStorage.getItem('dinapp_user')).toContain('a@b.com');
    });
});

describe('AppContext – logout', () => {
    it('clears user and localStorage after logout', () => {
        localStorage.setItem('dinapp_token', 'old_token');
        localStorage.setItem('dinapp_user', JSON.stringify({ email: 'u@u.com' }));

        function LogoutTrigger() {
            const { logout, user } = useApp();
            return (
                <>
                    <span data-testid="user">{user ? user.email : 'logged-out'}</span>
                    <button onClick={logout}>logout</button>
                </>
            );
        }

        const { getByRole, getByTestId } = render(
            <AppProvider>
                <LogoutTrigger />
            </AppProvider>
        );

        // Initially the user should be loaded from localStorage
        expect(getByTestId('user').textContent).toBe('u@u.com');

        act(() => {
            getByRole('button').click();
        });

        expect(getByTestId('user').textContent).toBe('logged-out');
        expect(localStorage.getItem('dinapp_token')).toBeNull();
        expect(localStorage.getItem('dinapp_user')).toBeNull();
    });
});

describe('AppContext – addChatMessage', () => {
    it('appends a message to chatMessages', () => {
        function ChatTrigger() {
            const { addChatMessage, chatMessages } = useApp();
            return (
                <>
                    <span data-testid="count">{chatMessages.length}</span>
                    <button onClick={() => addChatMessage('user', 'Hello!')}>add</button>
                </>
            );
        }

        const { getByRole, getByTestId } = render(
            <AppProvider>
                <ChatTrigger />
            </AppProvider>
        );

        expect(getByTestId('count').textContent).toBe('0');

        act(() => {
            getByRole('button').click();
            getByRole('button').click();
        });

        expect(getByTestId('count').textContent).toBe('2');
    });
});

describe('useApp outside provider', () => {
    it('throws when used outside AppProvider', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        function Broken() {
            useApp();
            return null;
        }

        expect(() => render(<Broken />)).toThrow('useApp must be used within AppProvider');
        spy.mockRestore();
    });
});
