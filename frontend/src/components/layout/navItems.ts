import { Flag, LayoutDashboard, ShieldAlert, Users } from 'lucide-react';

export const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/drivers', label: 'Drivers', icon: Users },
    { href: '/constructors', label: 'Constructors', icon: ShieldAlert },
    { href: '/races', label: 'Races', icon: Flag },
];

// Nested pages (like /drivers/44) keep their section highlighted.
export function isNavActive(pathname: string, href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
}
