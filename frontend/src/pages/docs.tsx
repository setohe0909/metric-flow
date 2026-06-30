import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Database,
  ExternalLink,
  FileText,
  Globe2,
  Home,
  Search,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

type Language = 'en' | 'es';

type DocArticle = {
  category: string;
  title: string;
  description: string;
  href: string;
};

function getLanguage(pathname: string): Language {
  return pathname.startsWith('/docs/es') ? 'es' : 'en';
}

const copy = {
  en: {
    languageLabel: 'Español',
    languageHref: '/docs/es',
    home: 'Home',
    sectionTitle: 'MetricFlow Docs',
    versionLabel: 'Version: Open source',
    searchPlaceholder: 'Search documentation',
    sidebarGroups: [
      {
        title: 'Quickstart',
        items: [
          ['Get started', '#quickstart'],
          ['Feature catalog', '#features'],
          ['Configuration', '#configuration'],
        ],
      },
      {
        title: 'Use MetricFlow',
        items: [
          ['Datasources', '#datasource'],
          ['Query engine', '#queries'],
          ['Dashboards & schedules', '#dashboards'],
        ],
      },
      {
        title: 'Community',
        items: [
          ['Security hardening', '#security'],
          ['Contributing', '#contributing'],
          ['Publish docs', '#publishing'],
        ],
      },
    ],
    heroTitle: 'MetricFlow documentation',
    heroDescription:
      'Learn how to self-host MetricFlow, connect analytical data, build SQL-powered dashboards, and contribute safely to the open-source project.',
    primaryCta: 'Quickstart',
    secondaryCta: 'Overview',
    articlesTitle: 'Articles',
    categoryLabel: 'Category: All categories',
    articleSearch: 'Search articles',
    repoDocs: 'Repository docs live in /docs',
    quickPath: 'Quick path',
    steps: [
      'Start PostgreSQL with docker compose up -d.',
      'Run the backend from backend/ with npm run start:dev.',
      'Run the frontend from frontend/ with npm run dev.',
      'Open /setup once, then use /login for existing installations.',
    ],
    safetyTitle: 'Public documentation safety',
    safetyItems: [
      'Never publish .env values, tokens, credentials, customer data, screenshots with secrets, or query results.',
      'Use least-privilege database users in examples and tutorials.',
      'Keep English and Spanish documentation aligned when behavior changes.',
    ],
    publishingTitle: 'GitHub Pages publishing',
    publishingBody:
      'Publish this documentation from the default branch and the /docs folder in repository Settings → Pages.',
    articles: [
      {
        category: 'Get started',
        title: 'Install MetricFlow locally',
        description: 'Clone the repository, configure backend secrets, prepare Prisma, and run the API and frontend.',
        href: '#quickstart',
      },
      {
        category: 'Product',
        title: 'Feature catalog and roadmap gaps',
        description: 'Review implemented BI features: setup, roles, connectors, SQL editor, schedules, dashboards, widgets, sharing, and audit.',
        href: '#features',
      },
      {
        category: 'Configuration',
        title: 'Runtime and datasource configuration',
        description: 'Configure backend secrets, SMTP, frontend preferences, TestSprite, and connector-specific settings.',
        href: '#configuration',
      },
      {
        category: 'Security',
        title: 'Stage 5 hardening and read-only SQL',
        description: 'Understand tenant boundaries, secret validation, datasource policies, SQL Server hardening, audit, and public sharing safety.',
        href: '#security',
      },
      {
        category: 'Use MetricFlow',
        title: 'Run, cancel, save, and schedule SQL',
        description: 'Execute read-only SQL with timeout/cancellation, save reusable queries, and deliver CSV/HTML/JSON reports.',
        href: '#queries',
      },
      {
        category: 'Dashboard Studio',
        title: 'Pages, widgets, publishing, and sharing',
        description: 'Build multipage dashboards with configurable widgets, internal publishing, and revocable public share tokens.',
        href: '#dashboards',
      },
    ] satisfies DocArticle[],
  },
  es: {
    languageLabel: 'English',
    languageHref: '/docs/en',
    home: 'Inicio',
    sectionTitle: 'Docs de MetricFlow',
    versionLabel: 'Versión: Open source',
    searchPlaceholder: 'Buscar documentación',
    sidebarGroups: [
      {
        title: 'Inicio rápido',
        items: [
          ['Primeros pasos', '#quickstart'],
          ['Funcionalidades', '#features'],
          ['Configuración', '#configuration'],
        ],
      },
      {
        title: 'Usar MetricFlow',
        items: [
          ['Datasources', '#datasource'],
          ['Query engine', '#queries'],
          ['Dashboards y schedules', '#dashboards'],
        ],
      },
      {
        title: 'Comunidad',
        items: [
          ['Seguridad hardening', '#security'],
          ['Contribuir', '#contributing'],
          ['Publicar docs', '#publishing'],
        ],
      },
    ],
    heroTitle: 'Documentación de MetricFlow',
    heroDescription:
      'Aprende a self-hostear MetricFlow, conectar datos analíticos, construir dashboards con SQL y contribuir de forma segura al proyecto open source.',
    primaryCta: 'Inicio rápido',
    secondaryCta: 'Resumen',
    articlesTitle: 'Artículos',
    categoryLabel: 'Categoría: Todas las categorías',
    articleSearch: 'Buscar artículos',
    repoDocs: 'La documentación del repositorio vive en /docs',
    quickPath: 'Ruta rápida',
    steps: [
      'Inicia PostgreSQL con docker compose up -d.',
      'Ejecuta el backend desde backend/ con npm run start:dev.',
      'Ejecuta el frontend desde frontend/ con npm run dev.',
      'Abre /setup una vez; luego usa /login en instalaciones existentes.',
    ],
    safetyTitle: 'Seguridad del contenido público',
    safetyItems: [
      'Nunca publiques valores .env, tokens, credenciales, datos de clientes, capturas con secretos ni resultados de queries.',
      'Usa usuarios de base de datos con privilegios mínimos en ejemplos y tutoriales.',
      'Mantén alineadas las páginas en español e inglés cuando cambie el comportamiento.',
    ],
    publishingTitle: 'Publicación con GitHub Pages',
    publishingBody:
      'Publica esta documentación desde la rama principal y la carpeta /docs en Settings → Pages del repositorio.',
    articles: [
      {
        category: 'Primeros pasos',
        title: 'Instalar MetricFlow localmente',
        description: 'Clona el repositorio, configura secretos del backend, prepara Prisma y ejecuta API y frontend.',
        href: '#quickstart',
      },
      {
        category: 'Producto',
        title: 'Catálogo de funcionalidades y brechas',
        description: 'Revisa setup, roles, conectores, editor SQL, schedules, dashboards, widgets, sharing y auditoría.',
        href: '#features',
      },
      {
        category: 'Configuración',
        title: 'Runtime, datasources y verificación',
        description: 'Configura secretos backend, SMTP, preferencias frontend, TestSprite y settings por conector.',
        href: '#configuration',
      },
      {
        category: 'Seguridad',
        title: 'Stage 5 hardening y SQL de solo lectura',
        description: 'Entiende tenant boundaries, validación de secretos, políticas, SQL Server hardening, auditoría y sharing público.',
        href: '#security',
      },
      {
        category: 'Usar MetricFlow',
        title: 'Ejecutar, cancelar, guardar y programar SQL',
        description: 'Ejecuta SQL con timeout/cancelación, guarda consultas y entrega reportes CSV/HTML/JSON.',
        href: '#queries',
      },
      {
        category: 'Dashboard Studio',
        title: 'Páginas, widgets, publicación y sharing',
        description: 'Construye dashboards multipágina con widgets configurables, publicación interna y tokens públicos revocables.',
        href: '#dashboards',
      },
    ] satisfies DocArticle[],
  },
} as const;

const panelStyle = {
  backgroundColor: '#f4f4f0',
  border: '2px solid #23251d',
  boxShadow: '5px 5px 0px 0px #23251d',
};

const flatPanelStyle = {
  backgroundColor: '#eeefe9',
  border: '2px solid #23251d',
};

export default function Docs() {
  const { pathname } = useLocation();
  const language = getLanguage(pathname);
  const t = copy[language];

  return (
    <main className="min-h-screen bg-grid-dots" style={{ backgroundColor: '#eeefe9', color: '#23251d' }}>
      <header
        className="sticky top-0 z-30 border-b-2 px-3 py-3 backdrop-blur sm:px-5"
        style={{ backgroundColor: 'rgba(238, 239, 233, 0.96)', borderColor: '#23251d' }}
      >
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-3 xl:grid-cols-[minmax(210px,auto)_minmax(280px,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/docs" className="flex min-w-max items-center gap-2 text-base font-black tracking-tight sm:text-lg">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: '#23251d', color: '#f7a501', boxShadow: '3px 3px 0 #f7a501' }}
              >
                <Database className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                Metric<span style={{ color: '#f7a501' }}>Flow Docs</span>
              </span>
            </Link>

            <span className="hidden h-8 w-px bg-[#23251d]/25 md:block" aria-hidden="true" />

            <button
              type="button"
              className="hidden h-11 items-center gap-2 rounded-2xl px-4 text-sm font-black transition-transform hover:-translate-y-0.5 lg:inline-flex"
              style={{ ...flatPanelStyle, boxShadow: '2px 2px 0 #23251d' }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: '#f7a501', border: '1px solid #23251d' }} />
              {t.versionLabel}
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <label className="relative order-3 min-w-0 xl:order-none" htmlFor="docs-search">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
            <input
              id="docs-search"
              type="search"
              className="h-11 w-full rounded-2xl px-11 pr-4 text-sm font-bold outline-none transition-shadow placeholder:text-[#6b6e62] focus:shadow-[3px_3px_0_#f7a501]"
              style={{ ...flatPanelStyle, backgroundColor: '#f4f4f0' }}
              placeholder={t.searchPlaceholder}
            />
          </label>

          <div className="flex min-w-0 items-center justify-start gap-2 overflow-x-auto pb-1 xl:justify-end xl:overflow-visible xl:pb-0">
            <Link
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#f7a501]/40"
              style={{ ...flatPanelStyle, boxShadow: '2px 2px 0 #23251d' }}
              to={t.languageHref}
              aria-label={`Switch language to ${t.languageLabel}`}
            >
              <Globe2 className="h-4 w-4 text-[#f7a501]" aria-hidden="true" />
              <span>{language.toUpperCase()}</span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Link>

            <a
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#f7a501]/40"
              style={{ backgroundColor: '#f7a501', border: '2px solid #23251d', color: '#23251d', boxShadow: '2px 2px 0 #23251d' }}
              href="https://github.com/setohe0909/metric-flow"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              GitHub
            </a>

            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-[#f7a501]/40"
              style={{ backgroundColor: '#23251d', border: '2px solid #23251d', color: '#f7a501', boxShadow: '2px 2px 0 #f7a501' }}
              aria-label="Theme settings"
            >
              <Sun className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className="hidden min-h-[calc(100vh-66px)] border-r-2 p-5 lg:sticky lg:top-[66px] lg:block lg:self-start"
          style={{ borderColor: '#23251d', backgroundColor: 'rgba(238, 239, 233, 0.9)' }}
        >
          <Link to="/docs" className="mb-8 flex items-center gap-2 text-sm font-black">
            <Home className="h-4 w-4" aria-hidden="true" /> {t.home}
          </Link>
          <h2 className="mb-6 text-2xl font-black">{t.sectionTitle}</h2>
          <nav className="space-y-6" aria-label="Docs sidebar">
            {t.sidebarGroups.map((group) => (
              <section key={group.title}>
                <h3 className="mb-3 text-sm font-black uppercase tracking-[0.12em]" style={{ color: '#6b6e62' }}>
                  {group.title}
                </h3>
                <ul className="space-y-2">
                  {group.items.map(([label, href]) => (
                    <li key={href}>
                      <a className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-[#f7a501]/25" href={href}>
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>
        </aside>

        <div>
          <section className="relative overflow-hidden border-b-2 px-5 py-12 sm:px-10 lg:px-16 lg:py-20" style={{ borderColor: '#23251d' }}>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,680px)_1fr] lg:items-center">
              <div>
                <p
                  className="mb-5 inline-flex rounded-full px-3 py-1 text-sm font-black"
                  style={{ backgroundColor: '#f7a501', border: '2px solid #23251d' }}
                >
                  <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" /> {t.repoDocs}
                </p>
                <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                  {t.heroTitle}
                </h1>
                <p className="mt-6 max-w-2xl text-lg font-bold leading-8" style={{ color: '#55584e' }}>
                  {t.heroDescription}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a className="btn-retro-primary px-5 py-3" href="#quickstart">
                    {t.primaryCta}
                  </a>
                  <a className="btn-retro-secondary px-5 py-3" href="#articles">
                    {t.secondaryCta}
                  </a>
                </div>
              </div>

              <div className="relative hidden min-h-[340px] lg:block" aria-hidden="true">
                <div
                  className="absolute right-8 top-2 h-64 w-64 rotate-12 rounded-[3rem]"
                  style={{ backgroundColor: '#f7a501', border: '3px solid #23251d', boxShadow: '10px 10px 0 #23251d' }}
                />
                <div
                  className="absolute right-28 top-16 h-60 w-60 -rotate-12 rounded-full"
                  style={{ backgroundColor: '#eeefe9', border: '3px solid #23251d', boxShadow: '8px 8px 0 #f7a501' }}
                />
                <div
                  className="absolute right-0 top-28 h-40 w-72 -rotate-12 rounded-[2rem] p-6"
                  style={{ backgroundColor: '#23251d', color: '#eeefe9', boxShadow: '8px 8px 0 #f7a501' }}
                >
                  <FileText className="mb-5 h-9 w-9 text-[#f7a501]" />
                  <p className="text-2xl font-black leading-tight">SQL → dashboards → docs</p>
                </div>
              </div>
            </div>
          </section>

          <section id="articles" className="px-5 py-10 sm:px-10 lg:px-16">
            <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <h2 className="text-3xl font-black">{t.articlesTitle}</h2>
                <button type="button" className="inline-flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-black" style={flatPanelStyle}>
                  {t.categoryLabel}
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <label className="relative w-full xl:w-72" htmlFor="article-search">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="article-search"
                  type="search"
                  className="w-full rounded-xl px-10 py-2 text-sm font-semibold outline-none transition-shadow focus:shadow-[3px_3px_0_#f7a501]"
                  style={flatPanelStyle}
                  placeholder={t.articleSearch}
                />
              </label>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              {t.articles.map((article) => (
                <a
                  key={article.title}
                  id={article.href === '#quickstart' ? undefined : article.href.slice(1)}
                  href={article.href}
                  className="group flex min-h-[220px] flex-col rounded-2xl p-6 transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#f7a501]"
                  style={panelStyle}
                >
                  <span
                    className="mb-6 w-fit rounded-full px-3 py-1 text-xs font-black"
                    style={{ backgroundColor: '#e4e5dc', border: '2px solid #23251d' }}
                  >
                    {article.category}
                  </span>
                  <h3 className="text-2xl font-black leading-tight group-hover:underline">{article.title}</h3>
                  <p className="mt-4 font-semibold leading-7" style={{ color: '#55584e' }}>
                    {article.description}
                  </p>
                </a>
              ))}
            </div>
          </section>

          <section className="grid gap-6 px-5 pb-12 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-16">
            <article id="quickstart" className="rounded-3xl p-6" style={panelStyle}>
              <h2 className="text-2xl font-black">{t.quickPath}</h2>
              <ol className="mt-5 space-y-4">
                {t.steps.map((step) => (
                  <li key={step} className="flex gap-3 font-semibold">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" style={{ color: '#f7a501' }} aria-hidden="true" />
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </article>

            <aside id="security" className="rounded-3xl p-6" style={{ ...panelStyle, backgroundColor: '#fff8df' }}>
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <ShieldCheck className="h-6 w-6" aria-hidden="true" /> {t.safetyTitle}
              </h2>
              <ul className="mt-5 list-disc space-y-3 pl-5 font-semibold">
                {t.safetyItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          </section>

          <section id="publishing" className="px-5 pb-16 sm:px-10 lg:px-16">
            <div className="rounded-3xl p-6" style={panelStyle}>
              <h2 className="text-2xl font-black">{t.publishingTitle}</h2>
              <p className="mt-3 font-semibold leading-7" style={{ color: '#55584e' }}>
                {t.publishingBody}
              </p>
              <a
                className="mt-5 inline-flex rounded-xl px-4 py-2 font-black"
                style={{ backgroundColor: '#f7a501', border: '2px solid #23251d', boxShadow: '3px 3px 0px 0px #23251d' }}
                href="https://docs.github.com/en/pages"
                target="_blank"
                rel="noreferrer"
              >
                GitHub Pages docs
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
