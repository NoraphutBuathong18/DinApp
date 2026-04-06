import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider, useApp } from '../contexts/AppContext';
import Layout from '../components/Layout';

// Layout renders Navbar, conditionally Sidebar, UserManual, and <Outlet />.
// We stub heavy child components so tests stay focused on Layout logic.

vi.mock('../components/Navbar', () => ({
    default: () => <nav data-testid="navbar" />,
}));

vi.mock('../components/Sidebar', () => ({
    default: () => <aside data-testid="sidebar" />,
}));

vi.mock('../components/UserManual', () => ({
    default: () => <div data-testid="user-manual" />,
}));

function renderLayout(path = '/') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <AppProvider>
                <Layout />
            </AppProvider>
        </MemoryRouter>
    );
}

describe('Layout – structure', () => {
    it('always renders Navbar', () => {
        renderLayout('/');
        expect(screen.getByTestId('navbar')).toBeInTheDocument();
    });

    it('always renders UserManual', () => {
        renderLayout('/');
        expect(screen.getByTestId('user-manual')).toBeInTheDocument();
    });
});

describe('Layout – Sidebar visibility', () => {
    it('does NOT render Sidebar on landing page (/)', () => {
        renderLayout('/');
        expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('does NOT render Sidebar on /login', () => {
        renderLayout('/login');
        expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('does NOT render Sidebar on /signup', () => {
        renderLayout('/signup');
        expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    });

    it('renders Sidebar on /dashboard', () => {
        renderLayout('/dashboard');
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('renders Sidebar on /advice', () => {
        renderLayout('/advice');
        expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });
});

describe('Layout – main element classes', () => {
    it('adds layout__main--with-sidebar class on authenticated routes', () => {
        const { container } = renderLayout('/dashboard');
        const main = container.querySelector('main');
        expect(main.className).toContain('layout__main--with-sidebar');
    });

    it('does NOT add layout__main--with-sidebar on landing routes', () => {
        const { container } = renderLayout('/');
        const main = container.querySelector('main');
        expect(main.className).not.toContain('layout__main--with-sidebar');
    });

    it('adds layout__main--sidebar-open when sidebar is open', async () => {
        function ContextToggler() {
            const { setSidebarOpen } = useApp();
            return <button onClick={() => setSidebarOpen(true)}>Open Sidebar</button>;
        }
        
        const { container } = render(
            <MemoryRouter initialEntries={['/dashboard']}>
                <AppProvider>
                    <ContextToggler />
                    <Layout />
                </AppProvider>
            </MemoryRouter>
        );
        
        const main = container.querySelector('main');
        expect(main.className).not.toContain('layout__main--sidebar-open');
        
        const btn = screen.getByText('Open Sidebar');
        await userEvent.click(btn);

        expect(main.className).toContain('layout__main--sidebar-open');
    });
});
