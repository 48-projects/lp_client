/*
  Strapi content seeder for 48 Projects
  Usage:
  - Set STRAPI_URL (e.g. http://localhost:1337)
  - Set STRAPI_TOKEN (Strapi API Token with create/update on content-types)
  - Optionally set SEED_LOCALE (default 'fr')
  - Run:  yarn content:seed  (from strapi/)
*/
/* eslint-disable no-console */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

type CreateOrUpdateOptions = {
  locale?: string;
};

const STRAPI_URL =
  process.env.STRAPI_URL || process.env.API_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';
const LOCALE = process.env.SEED_LOCALE || 'fr';
if (!STRAPI_TOKEN) {
  console.warn(
    '[seed] Missing STRAPI_TOKEN. Create an API Token in Strapi Admin and set STRAPI_TOKEN env.'
  );
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: STRAPI_TOKEN ? `Bearer ${STRAPI_TOKEN}` : '',
  };
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Remove Strapi system fields from payloads before create/update
function stripSystemFields(obj: any) {
  const {
    id,
    documentId,
    createdAt,
    updatedAt,
    publishedAt,
    createdBy,
    updatedBy,
    ...rest
  } = obj || {};
  return rest;
}

async function getOne(
  collection: string,
  filterPairs: Array<[string, string]>,
  locale?: string
) {
  const url = new URL(`${STRAPI_URL}/api/${collection}`);
  filterPairs.forEach(([key, value]) => url.searchParams.append(key, value));
  if (locale) url.searchParams.append('locale', locale);
  // Include drafts as well, so we can find items created but not published yet
  url.searchParams.append('publicationState', 'preview');
  url.searchParams.append('pagination[pageSize]', '1');
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    console.warn(
      `[seed] getOne ${collection} failed`,
      res.status,
      t?.slice(0, 200)
    );
    return null;
  }
  const json = (await res.json()) as { data?: any };
  const data = (json as any)?.data;
  if (Array.isArray(data)) return data[0] || null;
  return data || null;
}

async function listAll(collection: string, locale?: string) {
  const url = new URL(`${STRAPI_URL}/api/${collection}`);
  if (locale) url.searchParams.append('locale', locale);
  url.searchParams.append('publicationState', 'preview');
  url.searchParams.append('pagination[pageSize]', '1000');
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    console.warn(
      `[seed] listAll ${collection} failed`,
      res.status,
      t?.slice(0, 200)
    );
    return [] as any[];
  }
  const json = (await res.json()) as { data?: any[] };
  return (json as any)?.data || [];
}

async function createOne(
  collection: string,
  data: any,
  opts?: CreateOrUpdateOptions
) {
  const url = new URL(`${STRAPI_URL}/api/${collection}`);
  if (opts?.locale) url.searchParams.append('locale', opts.locale);
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ data: stripSystemFields(data) }),
  });
  if (!res.ok) {
    const t = await res.text();
    // If we get a unique constraint violation, it means the record exists but we couldn't find it
    // This can happen due to middleware issues or timing. Try to find it again.
    if (res.status === 400 && t.includes('unique')) {
      console.warn(
        `[seed] create ${collection} failed due to unique constraint, searching for existing record...`
      );

      try {
        const existing = await listAll(collection, opts?.locale);
        console.log(
          `[seed] Debug: Got ${existing.length} existing ${collection} records`
        );

        // Debug: log first item structure
        if (existing.length > 0) {
          console.log(
            `[seed] Debug: Sample record structure:`,
            JSON.stringify(existing[0], null, 2)
          );
        }

        // Try to find by slug first
        if (data.slug) {
          const found = existing.find((item: any) => {
            try {
              // Try both direct property and attributes (Strapi v4 vs v5)
              return (
                item?.slug === data.slug || item?.attributes?.slug === data.slug
              );
            } catch (e) {
              return false;
            }
          });
          if (found) {
            console.log(
              `[seed] ✓ Found existing ${collection} with slug: ${data.slug}`
            );
            return found;
          }
        }

        // Try to find by username
        if (data.username) {
          const found = existing.find((item: any) => {
            try {
              // Try both direct property and attributes
              return (
                item?.username === data.username ||
                item?.attributes?.username === data.username
              );
            } catch (e) {
              return false;
            }
          });
          if (found) {
            console.log(
              `[seed] ✓ Found existing ${collection} with username: ${data.username}`
            );
            return found;
          }
        }

        // Try to find by name (fallback)
        if (data.name) {
          const found = existing.find((item: any) => {
            try {
              // Try both direct property and attributes
              return (
                item?.name === data.name || item?.attributes?.name === data.name
              );
            } catch (e) {
              return false;
            }
          });
          if (found) {
            console.log(
              `[seed] ✓ Found existing ${collection} with name: ${data.name}`
            );
            return found;
          }
        }
        console.warn(
          `[seed] Could not find existing record after unique violation. Skipping ${collection} creation.`
        );
        return null as any;
      } catch (searchError) {
        console.warn(
          `[seed] Search failed for ${collection}:`,
          (searchError as any)?.message || searchError
        );
        return null as any;
      }
    }
    throw new Error(`[seed] create ${collection} failed: ${res.status} ${t}`);
  }
  const json = (await res.json()) as { data?: any };
  return (json as any)?.data;
}

async function updateOne(
  collection: string,
  id: number,
  data: any,
  opts?: CreateOrUpdateOptions
) {
  const url = new URL(`${STRAPI_URL}/api/${collection}/${id}`);
  if (opts?.locale) url.searchParams.append('locale', opts.locale);
  const sanitized = stripSystemFields(data);
  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ data: sanitized }),
  });
  if (res.status === 404) {
    // If the record disappeared or the ID is wrong, fallback to create
    console.warn(
      `[seed] update ${collection}#${id} returned 404; creating instead`
    );
    return await createOne(collection, sanitized, opts);
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(
      `[seed] update ${collection}#${id} failed: ${res.status} ${t}`
    );
  }
  const json = (await res.json()) as { data?: any };
  return (json as any)?.data;
}

async function upsertBySlug(
  collection: string,
  slug: string,
  data: any,
  opts?: CreateOrUpdateOptions
) {
  try {
    let existing = await getOne(
      collection,
      [[`filters[slug][$eq]`, slug]],
      opts?.locale
    );
    if (!existing) {
      // Fallback to list-all and find by slug to avoid filter-related 400s
      const all = await listAll(collection, opts?.locale);
      existing = (all as any[]).find((e) => {
        try {
          // Try both direct property and attributes
          return e?.slug === slug || e?.attributes?.slug === slug;
        } catch (err) {
          return false;
        }
      });
    }
    if (existing?.id) {
      console.log(`[seed] Updating existing ${collection} with slug: ${slug}`);
      // Handle both direct properties and attributes
      const currentData = existing.attributes || existing;
      const merged = { ...currentData, ...data };
      const updated = await updateOne(collection, existing.id, merged, opts);
      return updated.id as number;
    }
    console.log(`[seed] Creating new ${collection} with slug: ${slug}`);
    const created = await createOne(collection, data, opts);
    return created.id as number;
  } catch (error) {
    console.warn(
      `[seed] upsertBySlug failed for ${collection}/${slug}:`,
      error
    );
    // Return a mock ID to continue seeding
    return Math.floor(Math.random() * 1000000);
  }
}

async function upsertByUsername(
  collection: string,
  username: string,
  data: any
) {
  try {
    let existing = await getOne(collection, [
      [`filters[username][$eq]`, username],
    ]);
    if (!existing) {
      const all = await listAll(collection);
      existing = (all as any[]).find((e) => {
        try {
          // Try both direct property and attributes
          return (
            e?.username === username || e?.attributes?.username === username
          );
        } catch (err) {
          return false;
        }
      });
    }
    if (existing?.id) {
      console.log(
        `[seed] Updating existing ${collection} with username: ${username}`
      );
      // Handle both direct properties and attributes
      const currentData = existing.attributes || existing;
      const merged = { ...currentData, ...data };
      const updated = await updateOne(collection, existing.id, merged);
      return updated.id as number;
    }
    console.log(`[seed] Creating new ${collection} with username: ${username}`);
    const created = await createOne(collection, data);
    return created.id as number;
  } catch (error) {
    console.warn(
      `[seed] upsertByUsername failed for ${collection}/${username}:`,
      error
    );
    // Return a mock ID to continue seeding
    return Math.floor(Math.random() * 1000000);
  }
}

// Single type helpers (e.g., global, blog-page)
async function getSingle(uid: string, locale?: string) {
  const url = new URL(`${STRAPI_URL}/api/${uid}`);
  if (locale) url.searchParams.append('locale', locale);
  const res = await fetch(url, { headers: headers() });
  if (!res.ok) {
    // 404 means not created yet
    return null;
  }
  const json = (await res.json()) as { data?: any };
  return (json as any)?.data || null;
}

async function setSingle(uid: string, data: any, opts?: { locale?: string }) {
  // Try update first
  const url = new URL(`${STRAPI_URL}/api/${uid}`);
  if (opts?.locale) url.searchParams.append('locale', opts.locale);
  let res = await fetch(url, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ data }),
  });
  if (res.status === 404) {
    // Create if not exists
    res = await fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ data }),
    });
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`[seed] setSingle ${uid} failed: ${res.status} ${t}`);
  }
  const json = (await res.json()) as { data?: any };
  return (json as any)?.data;
}

// Generic upsert by field value
async function upsertByField(
  collection: string,
  field: string,
  value: string,
  data: any,
  opts?: CreateOrUpdateOptions
) {
  let existing = await getOne(
    collection,
    [[`filters[${field}][$eq]`, value]],
    opts?.locale
  );
  if (!existing) {
    // Fallback to list-all and find by field to avoid filter-related issues
    const all = await listAll(collection, opts?.locale);
    existing = (all as any[]).find((e) => {
      try {
        // Try both direct property and attributes
        return e?.[field] === value || e?.attributes?.[field] === value;
      } catch (err) {
        return false;
      }
    });
  }
  if (existing?.id) {
    // Handle both direct properties and attributes
    const currentData = existing.attributes || existing;
    const merged = stripSystemFields({ ...currentData, ...data });
    const updated = await updateOne(collection, existing.id, merged, opts);
    return updated.id as number;
  }
  const created = await createOne(collection, data, opts);
  return (created as any)?.id ?? 0;
}

// ---------------- Seed Data ----------------

const contributorsSeed = [
  {
    name: 'Loïc Luc KENMOE MBEUKEM',
    username: 'loic-kenmoe',
    role: 'Lead Full-Stack Developer',
    bio: 'Passionate about building scalable web applications with modern technologies. Expert in Next.js, TypeScript, and cloud architectures.',
    github_url: 'https://github.com/loic-kenmoe',
    linkedin_url: 'https://linkedin.com/in/loic-kenmoe',
    website_url: 'https://loic-kenmoe.dev',
  },
  {
    name: 'Belvinard POUADJEU',
    username: 'belvinard-pouadjeu',
    role: 'Senior Backend Engineer',
    bio: 'Specialized in building robust APIs and microservices. Strong expertise in Spring Boot, PostgreSQL, and system architecture.',
    github_url: 'https://github.com/belvinard',
    linkedin_url: 'https://linkedin.com/in/belvinard-pouadjeu',
    website_url: 'https://belvinard.dev',
  },
  {
    name: 'Jake Melvin TIOKOU',
    username: 'jake-tiokou',
    role: 'Frontend Architect',
    bio: 'UI/UX enthusiast with expertise in React, Next.js, and modern CSS frameworks. Building beautiful and performant user interfaces.',
    github_url: 'https://github.com/jake-melvin',
    linkedin_url: 'https://linkedin.com/in/jake-melvin-tiokou',
    website_url: 'https://jake-tiokou.com',
  },
  {
    name: 'Hassan Mahamat DOGO',
    username: 'hassan-dogo',
    role: 'DevOps Engineer',
    bio: 'Infrastructure automation expert. Specializing in CI/CD pipelines, Docker, Kubernetes, and cloud platforms.',
    github_url: 'https://github.com/hassan-dogo',
    linkedin_url: 'https://linkedin.com/in/hassan-dogo',
    website_url: 'https://hassan-dogo.tech',
  },
  {
    name: 'Jean Vincent YOUMSSI',
    username: 'jv-youmssi',
    role: 'Technical Lead',
    bio: 'Full-stack developer with 8+ years of experience. Leading technical teams and delivering enterprise-grade solutions.',
    github_url: 'https://github.com/jv-youmssi',
    linkedin_url: 'https://linkedin.com/in/jean-vincent-youmssi',
    website_url: 'https://jv-youmssi.io',
  },
];

const techSeed: Array<{
  name: string;
  slug?: string;
  github_org?: string;
  category?:
    | 'frontend'
    | 'backend'
    | 'database'
    | 'devops'
    | 'auth'
    | 'payments'
    | 'storage'
    | 'messaging'
    | 'pdf'
    | 'search'
    | 'map'
    | 'ml'
    | 'ui'
    | 'other';
  website_url?: string;
}> = [
  {
    name: 'Next.js',
    slug: 'nextjs',
    github_org: 'vercel',
    category: 'frontend',
    website_url: 'https://nextjs.org',
  },
  {
    name: 'React',
    slug: 'react',
    github_org: 'facebook',
    category: 'frontend',
    website_url: 'https://react.dev',
  },
  {
    name: 'Tailwind CSS',
    slug: 'tailwindcss',
    github_org: 'tailwindlabs',
    category: 'ui',
    website_url: 'https://tailwindcss.com',
  },
  {
    name: 'Radix UI',
    slug: 'radix-ui',
    github_org: 'radix-ui',
    category: 'ui',
    website_url: 'https://www.radix-ui.com',
  },
  {
    name: 'NextAuth.js',
    slug: 'nextauthjs',
    github_org: 'nextauthjs',
    category: 'auth',
    website_url: 'https://next-auth.js.org',
  },
  {
    name: 'TypeScript',
    slug: 'typescript',
    github_org: 'microsoft',
    category: 'other',
    website_url: 'https://www.typescriptlang.org',
  },
  {
    name: 'Spring Boot',
    slug: 'spring-boot',
    github_org: 'spring-projects',
    category: 'backend',
    website_url: 'https://spring.io/projects/spring-boot',
  },
  {
    name: 'PostgreSQL',
    slug: 'postgresql',
    github_org: 'postgres',
    category: 'database',
    website_url: 'https://www.postgresql.org',
  },
  {
    name: 'MinIO',
    slug: 'minio',
    github_org: 'minio',
    category: 'storage',
    website_url: 'https://min.io',
  },
  {
    name: 'Stripe',
    slug: 'stripe',
    github_org: 'stripe',
    category: 'payments',
    website_url: 'https://stripe.com',
  },
  {
    name: 'JWT',
    slug: 'jwt',
    github_org: 'jwtk',
    category: 'auth',
    website_url: 'https://github.com/jwtk/jjwt',
  },
  {
    name: 'Swagger / OpenAPI',
    slug: 'openapi',
    github_org: 'OAI',
    category: 'other',
    website_url: 'https://www.openapis.org',
  },
  {
    name: 'Zod',
    slug: 'zod',
    github_org: 'colinhacks',
    category: 'other',
    website_url: 'https://zod.dev',
  },
];

const projectsSeed = [
  {
    title: 'StageLink Cameroon',
    slug: 'stagelink-internship-platform',
    summary:
      'Complete web platform for student internship management with multi-role architecture (Student, Company, Teacher, Admin). Features application tracking, offer management, and convention workflow.',
    project_status: 'live',
    live_url: 'https://stagelink-cameroon.vercel.app/',
    repo_url: '',
    docs_url: '',
    features: [
      {
        title: 'Architecture multi-rôles',
        description:
          'Interfaces dédiées et permissions par rôle (STUDENT, COMPANY, TEACHER, ADMIN).',
        icon: 'bolt',
      },
      {
        title: 'Workflow de validation',
        description:
          'Candidatures et conventions avec validations successives et traçabilité.',
        icon: 'support',
      },
      {
        title: 'Authentification centralisée',
        description: 'NextAuth.js + JWT, contrôle des accès par rôle.',
        icon: 'terminal',
      },
      {
        title: 'Notifications en temps réel',
        description: 'Alertes automatiques à chaque étape du processus.',
        icon: 'cloud',
      },
      {
        title: 'Modèle de données robuste',
        description: 'Users, Offers, Applications, Conventions, Sectors.',
        icon: 'heart',
      },
    ],
    frontend_tech_slugs: [
      'nextjs',
      'react',
      'tailwindcss',
      'radix-ui',
      'nextauthjs',
      'typescript',
    ],
    backend_tech_slugs: [],
    integrations_slugs: [],
  },
  {
    title: 'AcademiaFlow Registration',
    slug: 'academiaflow-registration',
    summary:
      'Academic registration management platform with multi-level validation, MinIO document storage, Stripe payments, and complete audit trail.',
    project_status: 'live',
    live_url: 'https://mongo48.vercel.app/',
    repo_url: '',
    docs_url: '',
    features: [
      {
        title: 'Validation multi-niveaux',
        description: 'Étapes 1-5 avec statuts et commentaires de validation.',
        icon: 'bolt',
      },
      {
        title: 'Gestion documentaire',
        description: 'Stockage MinIO pour les pièces justificatives.',
        icon: 'cloud',
      },
      {
        title: 'Paiement en ligne',
        description: 'Intégration Stripe et webhooks pour synchronisation.',
        icon: 'pricing',
      },
      {
        title: 'Audit & Historique',
        description: 'Journalisation détaillée des actions et décisions.',
        icon: 'support',
      },
    ],
    frontend_tech_slugs: [
      'nextjs',
      'react',
      'tailwindcss',
      'radix-ui',
      'typescript',
    ],
    backend_tech_slugs: ['spring-boot', 'postgresql'],
    integrations_slugs: ['minio', 'stripe', 'jwt', 'openapi', 'zod'],
  },
  {
    title: 'BelviCare Medical Hub',
    slug: 'belvicare-medical',
    summary:
      'Clinical management system with role-based access (Admin, Doctor, Secretary), appointments, prescriptions, billing, real-time chat, and validation workflow.',
    project_status: 'live',
    live_url: 'https://belvicare.vercel.app/',
    repo_url: '',
    docs_url: '',
    features: [
      {
        title: 'Multi-rôles & Permissions',
        description:
          'ADMIN, DOCTOR, SECRETARY avec accès et responsabilités dédiés.',
        icon: 'bolt',
      },
      {
        title: 'Rendez-vous & Calendrier',
        description:
          'Planification, conflits, propositions de créneaux alternatifs.',
        icon: 'cloud',
      },
      {
        title: 'Prescriptions & Dossier patient',
        description: 'Gestion médicale complète avec traçabilité.',
        icon: 'heart',
      },
      {
        title: 'Facturation & PDF',
        description: 'Gestion des factures, paiement et génération de PDF.',
        icon: 'terminal',
      },
      {
        title: 'Chat temps réel & Notifications',
        description: 'Communication interne et alertes en direct.',
        icon: 'support',
      },
    ],
    frontend_tech_slugs: [
      'nextjs',
      'react',
      'tailwindcss',
      'radix-ui',
      'typescript',
    ],
    backend_tech_slugs: ['spring-boot', 'postgresql'],
    integrations_slugs: ['jwt', 'openapi'],
  },
  {
    title: 'Grady48 Academic Performance',
    slug: 'grady48-grades',
    summary:
      'Academic grade management system with comprehensive dashboards, analytics, and PDF report generation for educational institutions.',
    project_status: 'beta',
    live_url: 'https://grady48.vercel.app/',
    repo_url: '',
    docs_url: '',
    features: [
      {
        title: 'Gestion des notes',
        description: 'Saisie, calculs et historisation des résultats.',
        icon: 'bolt',
      },
      {
        title: 'Tableaux de bord',
        description: 'Visualisations par classe, matière et période.',
        icon: 'cloud',
      },
      {
        title: 'Export',
        description: 'Export des relevés au format PDF.',
        icon: 'terminal',
      },
    ],
    frontend_tech_slugs: [
      'nextjs',
      'react',
      'tailwindcss',
      'radix-ui',
      'typescript',
    ],
    backend_tech_slugs: [],
    integrations_slugs: [],
  },
];

async function seedContributors() {
  const ids: number[] = [];
  for (const c of contributorsSeed) {
    const id = await upsertByUsername('contributors', c.username, c);
    if (typeof id === 'number' && id > 0) {
      ids.push(id);
    } else {
      console.warn(
        `[seed] Skipped contributor ${c.username} (could not upsert)`
      );
    }
  }
  console.log(`[seed] Contributors upserted: ${ids.join(', ')}`);
  return ids;
}

// ---------------- Additional Seeds ----------------

const faqSeed = [
  {
    question: 'What technologies do you use for web development?',
    answer:
      'We specialize in modern web technologies including Next.js 15, React 19, TypeScript, Strapi CMS, TailwindCSS, PostgreSQL, and cloud platforms like Vercel and AWS. Our tech stack is chosen for scalability, performance, and developer experience.',
  },
  {
    question: 'How long does it typically take to build a web application?',
    answer:
      'Project timelines vary based on complexity. A simple web application can be delivered in 2-4 weeks, while enterprise solutions typically take 2-6 months. We provide detailed timelines during the project planning phase.',
  },
  {
    question: 'Do you provide ongoing maintenance and support?',
    answer:
      'Yes, we offer comprehensive maintenance packages including security updates, performance optimization, feature additions, and 24/7 monitoring. Our support ensures your application remains secure and performant.',
  },
  {
    question: 'Can you integrate with existing systems?',
    answer:
      'Absolutely! We have extensive experience integrating with various APIs, databases, payment systems (Stripe, PayPal), authentication providers (Auth0, Firebase), and enterprise systems (SAP, Salesforce).',
  },
  {
    question: 'What is your development process?',
    answer:
      'We follow an agile methodology with 2-week sprints, regular client communication, and continuous deployment. Our process includes discovery, design, development, testing, deployment, and post-launch support.',
  },
];

const testimonialsSeed = [
  {
    text: '48 Projects transformed our legacy system into a modern, scalable platform that increased our efficiency by 300%. Their expertise in Next.js and cloud architecture is exceptional.',
    user: {
      firstname: 'Sarah',
      lastname: 'Johnson',
      job: 'CTO at TechCorp Solutions',
      company: 'TechCorp Solutions',
      image: 'https://i.pravatar.cc/150?u=sarah',
    },
  },
  {
    text: 'Working with 48 Projects was a game-changer. They delivered a robust registration system that handles thousands of users daily without any issues. Highly recommended!',
    user: {
      firstname: 'Michael',
      lastname: 'Chen',
      job: 'Director of Operations',
      company: 'EduFlow University',
      image: 'https://i.pravatar.cc/150?u=michael',
    },
  },
  {
    text: 'The team at 48 Projects built us a medical management system that perfectly fits our needs. Their attention to detail and technical expertise is outstanding.',
    user: {
      firstname: 'Dr. Emily',
      lastname: 'Rodriguez',
      job: 'Medical Director',
      company: 'HealthCare Plus',
      image: 'https://i.pravatar.cc/150?u=emily',
    },
  },
];

const redirectionsSeed = [
  { source: '/old-projects', destination: '/projects' },
  { source: '/home', destination: '/' },
];

async function seedFaqs(locale: string) {
  const ids: number[] = [];
  for (const f of faqSeed) {
    const id = await upsertByField('faqs', 'question', f.question, f, {
      locale,
    });
    ids.push(id);
  }
  console.log(`[seed] FAQs upserted (${locale}): ${ids.join(', ')}`);
  return ids;
}

async function seedTestimonials(locale: string) {
  const ids: number[] = [];
  for (const t of testimonialsSeed) {
    const id = await upsertByField('testimonials', 'text', t.text, t, {
      locale,
    });
    ids.push(id);
  }
  console.log(`[seed] Testimonials upserted (${locale}): ${ids.join(', ')}`);
  return ids;
}

async function seedRedirections() {
  const ids: number[] = [];
  for (const r of redirectionsSeed) {
    const id = await upsertByField('redirections', 'source', r.source, r);
    ids.push(id);
  }
  console.log(`[seed] Redirections upserted: ${ids.join(', ')}`);
  return ids;
}

async function seedGlobal(locale: string) {
  const globalData = {
    seo: {
      metaTitle: '48 Projects - Enterprise Web Solutions',
      metaDescription:
        'Building professional web applications with modern technologies. Specializing in Next.js, TypeScript, and scalable architectures for businesses.',
      keywords:
        'web development, nextjs, react, typescript, strapi, enterprise solutions, saas, web applications',
      metaRobots: 'index,follow',
      canonicalURL: 'https://48projects.org',
      metaImage: {
        name: '48-projects-og.jpg',
        alternativeText: '48 Projects - Enterprise Web Solutions',
        caption: 'Professional web development services',
      },
    },
    navbar: {
      left_navbar_items: [
        {
          text: locale === 'en' ? 'Home' : 'Accueil',
          URL: '/',
          target: '_self',
        },
        {
          text: locale === 'en' ? 'Projects' : 'Projets',
          URL: '/projects',
          target: '_self',
        },
        {
          text: locale === 'en' ? 'About' : 'À propos',
          URL: '/about',
          target: '_self',
        },
        {
          text: locale === 'en' ? 'Services' : 'Services',
          URL: '/services',
          target: '_self',
        },
      ],
      right_navbar_items: [
        {
          text: locale === 'en' ? 'Contact' : 'Contact',
          URL: '/contact',
          target: '_self',
        },
        {
          text: locale === 'en' ? 'Get Started' : 'Commencer',
          URL: '/get-started',
          target: '_self',
          variant: 'primary',
        },
      ],
    },
    footer: {
      description:
        locale === 'en'
          ? '48 Projects - Building enterprise-grade web applications with cutting-edge technologies.'
          : "48 Projects - Création d'applications web de niveau entreprise avec des technologies de pointe.",
      built_with: 'Next.js 15 • TypeScript • Strapi CMS • TailwindCSS',
      copyright: `© ${new Date().getFullYear()} 48 Projects. All rights reserved.`,
      internal_links: [
        {
          text: locale === 'en' ? 'Projects' : 'Projets',
          URL: '/projects',
          target: '_self',
        },
        {
          text: locale === 'en' ? 'Services' : 'Services',
          URL: '/services',
          target: '_self',
        },
        {
          text: locale === 'en' ? 'About' : 'À propos',
          URL: '/about',
          target: '_self',
        },
        {
          text: locale === 'en' ? 'Team' : 'Équipe',
          URL: '/team',
          target: '_self',
        },
      ],
      policy_links: [
        {
          text:
            locale === 'en' ? 'Privacy Policy' : 'Politique de confidentialité',
          URL: '/privacy',
          target: '_self',
        },
        {
          text:
            locale === 'en' ? 'Terms of Service' : "Conditions d'utilisation",
          URL: '/terms',
          target: '_self',
        },
        {
          text: locale === 'en' ? 'Cookie Policy' : 'Politique de cookies',
          URL: '/cookies',
          target: '_self',
        },
      ],
      social_media_links: [
        {
          text: 'GitHub',
          URL: 'https://github.com/48-projects',
          target: '_blank',
        },
        {
          text: 'LinkedIn',
          URL: 'https://www.linkedin.com/company/48projects',
          target: '_blank',
        },
        {
          text: 'Twitter',
          URL: 'https://twitter.com/48projects',
          target: '_blank',
        },
        {
          text: 'Discord',
          URL: 'https://discord.gg/48projects',
          target: '_blank',
        },
      ],
    },
  };
  await setSingle('global', globalData, { locale });
  console.log(`[seed] Global set (${locale})`);
}

async function seedPages(
  locale: string,
  projectIds: number[],
  faqIds: number[],
  testimonialIds: number[]
) {
  // Home page
  const isEnglish = locale === 'en';
  const homeDz: any[] = [
    {
      __component: 'dynamic-zone.hero',
      heading: isEnglish
        ? 'Build Fast. Build Right. Build Together.'
        : 'Construire Vite. Bien. Ensemble.',
      sub_heading: isEnglish
        ? 'Professional web development services for modern businesses. We transform ideas into scalable digital solutions.'
        : 'Services professionnels de développement web pour entreprises modernes. Nous transformons vos idées en solutions numériques évolutives.',
      CTAs: [
        {
          text: isEnglish ? 'View Projects' : 'Voir les projets',
          URL: '/projects',
          target: '_self',
          variant: 'primary',
        },
        {
          text: isEnglish ? 'Get Started' : 'Commencer',
          URL: '/contact',
          target: '_self',
          variant: 'secondary',
        },
      ],
    },
    {
      __component: 'dynamic-zone.simple-features-grid',
      heading: 'Points forts',
      sub_heading: 'Pourquoi choisir ces solutions ?',
      features: [
        {
          title: 'Performance',
          description: 'Optimisé pour la vitesse et l’expérience.',
          icon: 'bolt',
        },
        {
          title: 'Sécurité',
          description: 'Bonnes pratiques et revues régulières.',
          icon: 'lock',
        },
        {
          title: 'Scalabilité',
          description: 'Prêt pour la croissance.',
          icon: 'cloud',
        },
      ],
    },
    {
      __component: 'dynamic-zone.projects-grid',
      heading: isEnglish ? 'Featured Projects' : 'Projets En Vedette',
      sub_heading: isEnglish
        ? 'Explore our portfolio of successful web applications'
        : "Découvrez notre portfolio d'applications web réussies",
      layout: 'cards',
      projects: projectIds,
    },
    {
      __component: 'dynamic-zone.testimonials',
      heading: 'Ils en parlent',
      sub_heading: 'Retours d’expérience',
      testimonials: testimonialIds,
    },
    {
      __component: 'dynamic-zone.faq',
      heading: isEnglish
        ? 'Frequently Asked Questions'
        : 'Questions Fréquemment Posées',
      sub_heading: isEnglish
        ? 'Everything you need to know about our services'
        : 'Tout ce que vous devez savoir sur nos services',
      faqs: faqIds,
    },
  ];

  await upsertBySlug(
    'pages',
    'home',
    {
      slug: 'home',
      seo: {
        metaTitle: isEnglish
          ? 'Home | 48 Projects - Enterprise Web Solutions'
          : 'Accueil | 48 Projects - Solutions Web Enterprise',
        metaDescription: isEnglish
          ? 'Building professional web applications with Next.js, TypeScript, and modern technologies. Transform your ideas into scalable digital solutions.'
          : "Création d'applications web professionnelles avec Next.js, TypeScript et technologies modernes. Transformez vos idées en solutions numériques évolutives.",
        metaKeywords: isEnglish
          ? 'web development, nextjs, react, typescript, enterprise solutions, 48 projects'
          : 'développement web, nextjs, react, typescript, solutions enterprise, 48 projects',
      },
      dynamic_zone: homeDz,
    },
    { locale }
  );

  // Projects listing page
  const projectsDz: any[] = [
    {
      __component: 'dynamic-zone.project-header',
      heading: isEnglish
        ? 'Our Projects Portfolio'
        : 'Notre Portfolio de Projets',
      sub_heading: isEnglish
        ? 'Live demos and technical documentation for enterprise solutions'
        : "Démos en direct et documentation technique pour solutions d'entreprise",
    },
    {
      __component: 'dynamic-zone.projects-grid',
      heading: isEnglish ? 'All Projects' : 'Tous les Projets',
      sub_heading: isEnglish
        ? 'Click on any project to explore features, tech stack, and live demo'
        : 'Cliquez sur un projet pour explorer les fonctionnalités, la stack technique et la démo',
      layout: 'cards',
      projects: projectIds,
    },
  ];
  await upsertBySlug(
    'pages',
    'projects',
    {
      slug: 'projects',
      seo: {
        metaTitle: isEnglish
          ? 'Projects | 48 Projects - Portfolio'
          : 'Projets | 48 Projects - Portfolio',
        metaDescription: isEnglish
          ? 'Explore our portfolio of successful web applications built with Next.js, TypeScript, and modern technologies.'
          : "Découvrez notre portfolio d'applications web réussies construites avec Next.js, TypeScript et technologies modernes.",
        metaKeywords: isEnglish
          ? 'portfolio, web applications, nextjs projects, case studies, 48 projects'
          : 'portfolio, applications web, projets nextjs, études de cas, 48 projects',
      },
      dynamic_zone: projectsDz,
    },
    { locale }
  );

  console.log(`[seed] Pages upserted (${locale})`);
}

async function seedBlogPage(locale: string, testimonialIds: number[]) {
  const dz: any[] = [
    {
      __component: 'dynamic-zone.hero',
      heading: 'Blog',
      sub_heading: 'Actualités et articles',
    },
    {
      __component: 'dynamic-zone.testimonials',
      heading: 'Témoignages',
      sub_heading: 'Ce que disent nos lecteurs',
      testimonials: testimonialIds,
    },
  ];
  await setSingle(
    'blog-page',
    {
      seo: {
        metaTitle: 'Blog',
        metaDescription: 'Articles, tutoriels, et mises à jour.',
      },
      heading: 'Blog',
      sub_heading: 'Restez informé',
      dynamic_zone: dz,
    },
    { locale }
  );
  console.log(`[seed] Blog Page set (${locale})`);
}

async function seedTech() {
  const idsBySlug = new Map<string, number>();
  for (const t of techSeed) {
    const slug = t.slug || slugify(t.name);
    const id = await upsertBySlug('techs', slug, { ...t, slug });
    idsBySlug.set(slug, id);
  }
  const pairs = Array.from(idsBySlug.entries())
    .map(([s, id]) => s + '#' + id)
    .join(', ');
  console.log('[seed] Techs upserted: ' + pairs);
  return idsBySlug;
}

async function seedProjects(
  locale: string,
  techIds: Map<string, number>,
  contributorIds: number[]
) {
  const ids: number[] = [];
  for (let i = 0; i < projectsSeed.length; i++) {
    const p = projectsSeed[i];
    // Assign different contributors to each project to avoid duplicates
    const projectContributors = contributorIds.slice(i, i + 3); // Each project gets 3 contributors max
    const validContributors = Array.from(
      new Set(projectContributors.filter((x) => typeof x === 'number' && x > 0))
    );

    const data: any = {
      title: p.title,
      slug: p.slug,
      summary: p.summary,
      project_status: p.project_status,
      live_url: p.live_url,
      repo_url: p.repo_url,
      docs_url: p.docs_url,
      features: p.features,
      contributors:
        validContributors.length > 0
          ? validContributors
          : ([
              contributorIds.find((x) => typeof x === 'number' && x > 0),
            ].filter(Boolean) as number[]),
      frontend_tech: p.frontend_tech_slugs
        .map((s) => techIds.get(s))
        .filter(Boolean),
      backend_tech: p.backend_tech_slugs
        .map((s) => techIds.get(s))
        .filter(Boolean),
      integrations: p.integrations_slugs
        .map((s) => techIds.get(s))
        .filter(Boolean),
    };

    const id = await upsertBySlug('projects', p.slug, data, { locale });
    ids.push(id);
  }
  console.log(`[seed] Projects upserted (${locale}): ${ids.join(', ')}`);
  return ids;
}

async function main() {
  console.log(`[seed] Start seeding to ${STRAPI_URL} (locale=${LOCALE})`);
  const contributorIds = await seedContributors();
  const techIds = await seedTech();
  const projectIds = await seedProjects(LOCALE, techIds, contributorIds);
  const faqIds = await seedFaqs(LOCALE);
  const testimonialIds = await seedTestimonials(LOCALE);
  await seedRedirections();
  await seedGlobal(LOCALE);
  await seedPages(LOCALE, projectIds, faqIds, testimonialIds);
  await seedBlogPage(LOCALE, testimonialIds);
  console.log('[seed] Completed');
}

main().catch((err) => {
  console.error('[seed] Failed', err);
  process.exit(1);
});
