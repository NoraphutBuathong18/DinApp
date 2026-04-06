import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../contexts/AppContext';
import Navbar from '../components/Navbar';

function renderNavbar(path = '/') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <AppProvider>
                <Navbar />
            </AppProvider>
        </MemoryRouter>
    );
}

// ──────────────────────────────────────────────
// Landing routes  (/  /login  /signup)
// ──────────────────────────────────────────────
describe('Navbar – landing view', () => {
    it('shows Log in and Sign up links on /', () => {
        renderNavbar('/');

        expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });

    it('shows Log in link on /login', () => {
        renderNavbar('/login');
        expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    });

    it('does NOT show hamburger button on landing pages', () => {
        renderNavbar('/');
        expect(screen.queryByLabelText(/toggle menu/i)).not.toBeInTheDocument();
    });

    it('does NOT show Log out button on landing pages', () => {
        renderNavbar('/');
        expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
    });
});

// ──────────────────────────────────────────────
// Authenticated routes  (/dashboard etc.)
// ──────────────────────────────────────────────
describe('Navbar – authenticated view', () => {
    it('shows hamburger button on /dashboard', () => {
        renderNavbar('/dashboard');
        expect(screen.getByLabelText(/toggle menu/i)).toBeInTheDocument();
    });

    it('shows Log out button on /dashboard', () => {
        renderNavbar('/dashboard');
        expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
    });

    it('does NOT show Log in / Sign up links on /dashboard', () => {
        renderNavbar('/dashboard');
        expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
    });

    it('toggles sidebar when hamburger button is clicked', async () => {
        renderNavbar('/dashboard');
        const btn = screen.getByLabelText(/toggle menu/i);
        await userEvent.click(btn);
        expect(btn).toBeInTheDocument();
    });

    it('removes token and redirects on Log out click', async () => {
        const originalLocation = window.location;
        delete window.location;
        window.location = { href: '' };

        localStorage.setItem('token', 'dummy');
        renderNavbar('/dashboard');
        
        const logoutBtn = screen.getByRole('button', { name: /log out/i });
        await userEvent.click(logoutBtn);

        expect(localStorage.getItem('token')).toBeNull();
        expect(window.location.href).toBe('/login');

        window.location = originalLocation;
    });
});

// ──────────────────────────────────────────────
// Logo
// ──────────────────────────────────────────────
describe('Navbar – logo', () => {
    it('always renders the DinApp logo link', () => {
        renderNavbar('/');
        const logoLink = screen.getByRole('link', { name: /dinapp/i });
        expect(logoLink).toBeInTheDocument();
    });
});
