export type Locale = 'en' | 'es' | 'fr' | 'de';

export const LOCALES: { code: Locale; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
];

export const DEFAULT_LOCALE: Locale = 'en';

export const translations: Record<Locale, Record<string, string>> = {
    en: {
        subscribe: 'Subscribe',
        login: 'Log In',
        register: 'Register',
        searchPlaceholder: 'Search...',
        whyTheDigiHubs: 'Why TheDigiHubs',
        contactUs: 'Contact Us',
        contact: 'Contact',
        platform: 'Platform',
        resources: 'Resources',
        partners: 'Partners',
        solutions: 'Solutions',
        forBuyers: 'For Buyers',
        forSuppliers: 'For Suppliers',
        searchMarketplace: 'Search Marketplace',
    },
    es: {
        subscribe: 'Suscribirse',
        login: 'Iniciar sesión',
        register: 'Registrarse',
        searchPlaceholder: 'Buscar...',
        whyTheDigiHubs: 'Por qué TheDigiHubs',
        contactUs: 'Contáctanos',
        contact: 'Contacto',
        platform: 'Plataforma',
        resources: 'Recursos',
        partners: 'Socios',
        solutions: 'Soluciones',
        forBuyers: 'Para Compradores',
        forSuppliers: 'Para Proveedores',
        searchMarketplace: 'Buscar Mercado',
    },
    fr: {
        subscribe: 'S’abonner',
        login: 'Connexion',
        register: 'S’inscrire',
        searchPlaceholder: 'Recherche...',
        whyTheDigiHubs: 'Pourquoi TheDigiHubs',
        contactUs: 'Contactez-nous',
        contact: 'Contact',
        platform: 'Plateforme',
        resources: 'Ressources',
        partners: 'Partenaires',
        solutions: 'Solutions',
        forBuyers: 'Pour les acheteurs',
        forSuppliers: 'Pour les fournisseurs',
        searchMarketplace: 'Rechercher le marché',
    },
    de: {
        subscribe: 'Abonnieren',
        login: 'Anmelden',
        register: 'Registrieren',
        searchPlaceholder: 'Suchen...',
        whyTheDigiHubs: 'Warum TheDigiHubs',
        contactUs: 'Kontakt',
        contact: 'Kontakt',
        platform: 'Plattform',
        resources: 'Ressourcen',
        partners: 'Partner',
        solutions: 'Lösungen',
        forBuyers: 'Für Einkäufer',
        forSuppliers: 'Für Lieferanten',
        searchMarketplace: 'Marktplatz durchsuchen',
    },
};

export function getLocaleFromSearchParams(searchParams: URLSearchParams | null): Locale {
    if (!searchParams) return DEFAULT_LOCALE;
    const lang = searchParams.get('lang');
    if (lang === 'en' || lang === 'es' || lang === 'fr' || lang === 'de') {
        return lang;
    }
    return DEFAULT_LOCALE;
}
