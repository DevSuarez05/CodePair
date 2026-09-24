/**
 * @file seed.ts
 * @description Script de datos semilla reproducible para CodePair DB.
 *
 * Utiliza UPSERT (createOrUpdate) en todas las entidades para garantizar
 * que el script sea idempotente: puede ejecutarse múltiples veces sin
 * duplicar datos ni fallar.
 *
 * Orden de inserción (respeta FKs):
 *  1. Skills (catálogo independiente)
 *  2. Users  (admin + mentores + estudiantes)
 *  3. UserSkills (relación usuario ↔ habilidad)
 *  4. HelpRequests (solicitudes de ayuda)
 *  5. Sessions (sesiones vinculadas a requests)
 *  6. Feedbacks (evaluaciones post-sesión)
 *
 * Ejecución:
 *   npx prisma db seed
 *   — o —
 *   npm run db:seed  (desde apps/api/)
 */

import {
  PrismaClient,
  UserRole,
  UserStatus,
  HelpRequestStatus,
  HelpRequestPriority,
  SessionStatus,
  ProgrammingLanguage,
} from '@prisma/client';
import * as argon2 from 'argon2';

// ─── Client ───────────────────────────────────────────────────

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ─── Argon2 Options (aligned with auth.config.ts) ─────────────

const ARGON2_OPTIONS: argon2.Options & { raw?: false } = {
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

// ─── Helper: generate short room code ─────────────────────────

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ─── Helper: slugify skill name ───────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ═════════════════════════════════════════════════════════════
//  SEED DATA DEFINITIONS
// ═════════════════════════════════════════════════════════════

// ─── 1. Skills Catalog ────────────────────────────────────────

interface SkillSeed {
  name: string;
  category: string;
  description: string;
}

/**
 * Catálogo de habilidades iniciales requerido por el enunciado:
 * React, Node.js, SQL, MySQL, PostgreSQL, JWT, TypeScript, Python
 * + habilidades complementarias para enriquecer el marketplace.
 */
const SKILLS_CATALOG: SkillSeed[] = [
  // ── Requeridos explícitamente ──
  {
    name: 'React',
    category: 'Framework',
    description: 'Biblioteca de JavaScript para construir interfaces de usuario declarativas y reactivas.',
  },
  {
    name: 'Node.js',
    category: 'Runtime',
    description: 'Entorno de ejecución JavaScript del lado del servidor basado en el motor V8 de Chrome.',
  },
  {
    name: 'SQL',
    category: 'Database',
    description: 'Lenguaje estándar para gestión y consulta de bases de datos relacionales.',
  },
  {
    name: 'MySQL',
    category: 'Database',
    description: 'Sistema de gestión de bases de datos relacional de código abierto, ampliamente usado en producción.',
  },
  {
    name: 'PostgreSQL',
    category: 'Database',
    description: 'Sistema de bases de datos objeto-relacional avanzado con soporte para tipos de datos complejos.',
  },
  {
    name: 'JWT',
    category: 'Security',
    description: 'JSON Web Tokens: estándar para autenticación y autorización basada en tokens firmados.',
  },
  {
    name: 'TypeScript',
    category: 'Language',
    description: 'Superset tipado de JavaScript que mejora la mantenibilidad y reduce errores en tiempo de compilación.',
  },
  {
    name: 'Python',
    category: 'Language',
    description: 'Lenguaje de programación de alto nivel, interpretado, con énfasis en legibilidad del código.',
  },
  // ── Complementarios ──
  {
    name: 'JavaScript',
    category: 'Language',
    description: 'Lenguaje de programación dinámico, esencial para desarrollo web frontend y backend.',
  },
  {
    name: 'NestJS',
    category: 'Framework',
    description: 'Framework Node.js para construir APIs eficientes y escalables con TypeScript y arquitectura modular.',
  },
  {
    name: 'Next.js',
    category: 'Framework',
    description: 'Framework React para aplicaciones web con SSR, SSG, App Router y optimizaciones de producción.',
  },
  {
    name: 'Docker',
    category: 'DevOps',
    description: 'Plataforma de contenedores para empaquetar, distribuir y ejecutar aplicaciones de forma reproducible.',
  },
  {
    name: 'Git',
    category: 'DevOps',
    description: 'Sistema de control de versiones distribuido, estándar de la industria para colaboración en código.',
  },
  {
    name: 'Prisma',
    category: 'ORM',
    description: 'ORM moderno para Node.js/TypeScript con tipado seguro y migración declarativa de esquemas.',
  },
  {
    name: 'Data Structures',
    category: 'CS Fundamentals',
    description: 'Arrays, listas, árboles, grafos, heaps: estructuras fundamentales para el desarrollo de software.',
  },
  {
    name: 'Algorithms',
    category: 'CS Fundamentals',
    description: 'Búsqueda, ordenamiento, programación dinámica, grafos: algoritmos esenciales para entrevistas técnicas.',
  },
  {
    name: 'System Design',
    category: 'Architecture',
    description: 'Diseño de sistemas escalables: load balancing, caching, microservicios, bases de datos distribuidas.',
  },
  {
    name: 'REST APIs',
    category: 'Architecture',
    description: 'Diseño e implementación de APIs RESTful siguiendo principios de recursos, verbos HTTP y statelessness.',
  },
];

// ─── 2. Users ─────────────────────────────────────────────────

interface UserSeed {
  email: string;
  username: string;
  displayName: string;
  bio: string;
  role: UserRole;
  password: string;
  preferredLanguage: ProgrammingLanguage;
  githubUrl?: string;
}

const USERS_SEED: UserSeed[] = [
  // ── Admin ──
  {
    email: 'admin@codepair.dev',
    username: 'codepair_admin',
    displayName: 'CodePair Admin',
    bio: 'Administrador de la plataforma CodePair.',
    role: UserRole.ADMIN,
    password: 'Admin@CodePair2024!',
    preferredLanguage: ProgrammingLanguage.TYPESCRIPT,
    githubUrl: 'https://github.com/codepair',
  },
  // ── Mentores ──
  {
    email: 'alice.johnson@demo.com',
    username: 'alice_dev',
    displayName: 'Alice Johnson',
    bio: 'Senior Full-Stack Developer con 8 años de experiencia en React, Node.js y arquitecturas cloud. Apasionada por la mentoring y el pair programming.',
    role: UserRole.MENTOR,
    password: 'Demo@CodePair2024!',
    preferredLanguage: ProgrammingLanguage.TYPESCRIPT,
    githubUrl: 'https://github.com/alice-dev',
  },
  {
    email: 'carlos.mendez@demo.com',
    username: 'carlos_dba',
    displayName: 'Carlos Méndez',
    bio: 'Database Architect especializado en MySQL, PostgreSQL y optimización de queries. 10 años diseñando sistemas de datos a escala.',
    role: UserRole.MENTOR,
    password: 'Demo@CodePair2024!',
    preferredLanguage: ProgrammingLanguage.SQL,
    githubUrl: 'https://github.com/carlos-dba',
  },
  {
    email: 'priya.sharma@demo.com',
    username: 'priya_python',
    displayName: 'Priya Sharma',
    bio: 'Python Engineer y Data Scientist. Especialista en FastAPI, algoritmos y estructuras de datos. Gusto especial por preparar candidatos para entrevistas técnicas.',
    role: UserRole.MENTOR,
    password: 'Demo@CodePair2024!',
    preferredLanguage: ProgrammingLanguage.PYTHON,
    githubUrl: 'https://github.com/priya-python',
  },
  // ── Estudiantes ──
  {
    email: 'bob.smith@demo.com',
    username: 'bob_codes',
    displayName: 'Bob Smith',
    bio: 'Junior developer aprendiendo React y Node.js. Estudiante de último año de Ingeniería en Sistemas.',
    role: UserRole.STUDENT,
    password: 'Demo@CodePair2024!',
    preferredLanguage: ProgrammingLanguage.JAVASCRIPT,
    githubUrl: 'https://github.com/bob-codes',
  },
  {
    email: 'diana.torres@demo.com',
    username: 'diana_dev',
    displayName: 'Diana Torres',
    bio: 'Desarrolladora en transición desde marketing digital. Aprendiendo TypeScript y bases de datos relacionales.',
    role: UserRole.STUDENT,
    password: 'Demo@CodePair2024!',
    preferredLanguage: ProgrammingLanguage.TYPESCRIPT,
  },
  {
    email: 'marco.reyes@demo.com',
    username: 'marco_sql',
    displayName: 'Marco Reyes',
    bio: 'Analista de datos explorando MySQL y PostgreSQL. Busca mejorar habilidades en SQL avanzado y diseño de esquemas.',
    role: UserRole.STUDENT,
    password: 'Demo@CodePair2024!',
    preferredLanguage: ProgrammingLanguage.SQL,
  },
];

// ─── 3. UserSkill assignments ─────────────────────────────────

interface UserSkillSeed {
  userEmail: string;
  skillName: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  canMentor: boolean;
  yearsOfExperience?: number;
}

const USER_SKILLS_SEED: UserSkillSeed[] = [
  // Alice (Mentor — Full-Stack)
  { userEmail: 'alice.johnson@demo.com', skillName: 'React',       proficiency: 5, canMentor: true,  yearsOfExperience: 6 },
  { userEmail: 'alice.johnson@demo.com', skillName: 'TypeScript',  proficiency: 5, canMentor: true,  yearsOfExperience: 5 },
  { userEmail: 'alice.johnson@demo.com', skillName: 'Node.js',     proficiency: 5, canMentor: true,  yearsOfExperience: 7 },
  { userEmail: 'alice.johnson@demo.com', skillName: 'NestJS',      proficiency: 4, canMentor: true,  yearsOfExperience: 3 },
  { userEmail: 'alice.johnson@demo.com', skillName: 'JWT',         proficiency: 4, canMentor: true,  yearsOfExperience: 4 },
  { userEmail: 'alice.johnson@demo.com', skillName: 'REST APIs',   proficiency: 5, canMentor: true,  yearsOfExperience: 8 },

  // Carlos (Mentor — DBA)
  { userEmail: 'carlos.mendez@demo.com', skillName: 'MySQL',        proficiency: 5, canMentor: true,  yearsOfExperience: 10 },
  { userEmail: 'carlos.mendez@demo.com', skillName: 'PostgreSQL',   proficiency: 5, canMentor: true,  yearsOfExperience: 8  },
  { userEmail: 'carlos.mendez@demo.com', skillName: 'SQL',          proficiency: 5, canMentor: true,  yearsOfExperience: 10 },
  { userEmail: 'carlos.mendez@demo.com', skillName: 'System Design',proficiency: 4, canMentor: true,  yearsOfExperience: 6  },
  { userEmail: 'carlos.mendez@demo.com', skillName: 'Docker',       proficiency: 3, canMentor: false, yearsOfExperience: 3  },

  // Priya (Mentor — Python/Algorithms)
  { userEmail: 'priya.sharma@demo.com', skillName: 'Python',          proficiency: 5, canMentor: true,  yearsOfExperience: 7 },
  { userEmail: 'priya.sharma@demo.com', skillName: 'Algorithms',      proficiency: 5, canMentor: true,  yearsOfExperience: 6 },
  { userEmail: 'priya.sharma@demo.com', skillName: 'Data Structures',  proficiency: 5, canMentor: true,  yearsOfExperience: 6 },
  { userEmail: 'priya.sharma@demo.com', skillName: 'SQL',              proficiency: 3, canMentor: false, yearsOfExperience: 3 },

  // Bob (Estudiante)
  { userEmail: 'bob.smith@demo.com', skillName: 'JavaScript',  proficiency: 3, canMentor: false, yearsOfExperience: 1.5 },
  { userEmail: 'bob.smith@demo.com', skillName: 'React',       proficiency: 2, canMentor: false, yearsOfExperience: 0.5 },
  { userEmail: 'bob.smith@demo.com', skillName: 'Node.js',     proficiency: 2, canMentor: false, yearsOfExperience: 0.5 },
  { userEmail: 'bob.smith@demo.com', skillName: 'Git',         proficiency: 3, canMentor: false, yearsOfExperience: 2   },

  // Diana (Estudiante)
  { userEmail: 'diana.torres@demo.com', skillName: 'TypeScript',  proficiency: 2, canMentor: false, yearsOfExperience: 0.5 },
  { userEmail: 'diana.torres@demo.com', skillName: 'JavaScript',  proficiency: 3, canMentor: false, yearsOfExperience: 1   },
  { userEmail: 'diana.torres@demo.com', skillName: 'MySQL',       proficiency: 1, canMentor: false, yearsOfExperience: 0.3 },

  // Marco (Estudiante)
  { userEmail: 'marco.reyes@demo.com', skillName: 'SQL',        proficiency: 2, canMentor: false, yearsOfExperience: 1 },
  { userEmail: 'marco.reyes@demo.com', skillName: 'MySQL',      proficiency: 2, canMentor: false, yearsOfExperience: 0.8 },
  { userEmail: 'marco.reyes@demo.com', skillName: 'PostgreSQL', proficiency: 1, canMentor: false, yearsOfExperience: 0.2 },
];

// ─── 4. Help Requests ─────────────────────────────────────────

interface HelpRequestSeed {
  studentEmail: string;
  mentorEmail?: string;
  title: string;
  description: string;
  codeSnippet?: string;
  errorMessage?: string;
  language: ProgrammingLanguage;
  status: HelpRequestStatus;
  priority: HelpRequestPriority;
  estimatedMinutes?: number;
  skillNames: string[];
}

const HELP_REQUESTS_SEED: HelpRequestSeed[] = [
  // ── Request 1: Bob necesita ayuda con React hooks ──
  {
    studentEmail: 'bob.smith@demo.com',
    mentorEmail: 'alice.johnson@demo.com',
    title: 'useEffect se ejecuta infinitamente en loop',
    description:
      'Tengo un componente React que usa useEffect para hacer fetch de datos. El problema es que el efecto se está ejecutando en un loop infinito. He revisado las dependencias pero no entiendo por qué sigue disparándose. Necesito ayuda para entender el closure y el array de dependencias.',
    codeSnippet: `import { useState, useEffect } from 'react';

function UserList() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState({});

  useEffect(() => {
    fetch('/api/users?filter=' + JSON.stringify(filter))
      .then(res => res.json())
      .then(data => setUsers(data));
  }, [filter]); // ← El problema está aquí

  return <div>{users.map(u => <div key={u.id}>{u.name}</div>)}</div>;
}`,
    errorMessage: 'Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect.',
    language: ProgrammingLanguage.JAVASCRIPT,
    status: HelpRequestStatus.IN_PROGRESS,
    priority: HelpRequestPriority.HIGH,
    estimatedMinutes: 45,
    skillNames: ['React', 'JavaScript'],
  },

  // ── Request 2: Diana necesita ayuda con JWT ──
  {
    studentEmail: 'diana.torres@demo.com',
    mentorEmail: 'alice.johnson@demo.com',
    title: 'JWT token expira pero el usuario no es redirigido al login',
    description:
      'Implementé autenticación con JWT en mi app Next.js pero cuando el access token expira (15 minutos), la app no maneja el error 401 correctamente. El usuario ve datos vacíos en lugar de ser redirigido al login para renovar su sesión. Necesito implementar el refresh token correctamente.',
    codeSnippet: `// Mi interceptor de Axios actual
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response.status === 401) {
      // ¿Qué hago aquí para el refresh?
      console.log('Unauthorized');
    }
    return Promise.reject(error);
  }
);`,
    language: ProgrammingLanguage.TYPESCRIPT,
    status: HelpRequestStatus.OPEN,
    priority: HelpRequestPriority.MEDIUM,
    estimatedMinutes: 60,
    skillNames: ['JWT', 'TypeScript', 'Node.js'],
  },

  // ── Request 3: Marco necesita ayuda con SQL ──
  {
    studentEmail: 'marco.reyes@demo.com',
    mentorEmail: 'carlos.mendez@demo.com',
    title: 'Query MySQL muy lenta con JOIN en tablas grandes',
    description:
      'Tengo una query que hace JOIN entre tres tablas (orders, products, users) con más de 500,000 registros cada una. La query tarda más de 30 segundos. He leído sobre índices pero no sé cuáles agregar ni cómo analizar el EXPLAIN output. Necesito que alguien me explique cómo optimizarla.',
    codeSnippet: `SELECT 
  u.name,
  COUNT(o.id) as total_orders,
  SUM(o.total) as revenue
FROM orders o
  JOIN users u ON o.user_id = u.id
  JOIN order_items oi ON oi.order_id = o.id
  JOIN products p ON oi.product_id = p.id
WHERE o.created_at BETWEEN '2024-01-01' AND '2024-12-31'
  AND p.category = 'Electronics'
GROUP BY u.id, u.name
ORDER BY revenue DESC
LIMIT 20;`,
    errorMessage: 'Query execution time: 31.47s — Full table scan detected on orders (type: ALL)',
    language: ProgrammingLanguage.SQL,
    status: HelpRequestStatus.RESOLVED,
    priority: HelpRequestPriority.HIGH,
    estimatedMinutes: 90,
    skillNames: ['SQL', 'MySQL'],
  },

  // ── Request 4: Bob necesita ayuda con Node.js (abierta) ──
  {
    studentEmail: 'bob.smith@demo.com',
    title: 'No entiendo cómo manejar errores en async/await con Express',
    description:
      'Estoy construyendo una API REST con Express y Node.js. Cuando ocurre un error en mis route handlers async, Express no lo captura automáticamente y el servidor se cuelga o devuelve un error 500 sin mensaje útil. Quiero implementar un manejo de errores centralizado y entender cómo funciona el error middleware.',
    codeSnippet: `// Router actual (sin manejo de errores)
app.get('/users/:id', async (req, res) => {
  const user = await UserService.findById(req.params.id);
  if (!user) {
    res.status(404).json({ error: 'Not found' });
  }
  res.json(user);
});

// ¿Cómo implemento el middleware de error global?
app.use((err, req, res, next) => {
  // ???
});`,
    language: ProgrammingLanguage.JAVASCRIPT,
    status: HelpRequestStatus.OPEN,
    priority: HelpRequestPriority.MEDIUM,
    estimatedMinutes: 45,
    skillNames: ['Node.js', 'JavaScript', 'REST APIs'],
  },

  // ── Request 5: Diana necesita ayuda con Python (cancelada) ──
  {
    studentEmail: 'diana.torres@demo.com',
    title: 'Entender list comprehensions y generators en Python',
    description:
      'Vengo de JavaScript y no entiendo bien la diferencia entre list comprehensions, generator expressions y las funciones map/filter de Python. ¿Cuándo usar cada uno? ¿Cuál es más eficiente para procesar grandes listas?',
    language: ProgrammingLanguage.PYTHON,
    status: HelpRequestStatus.CANCELLED,
    priority: HelpRequestPriority.LOW,
    estimatedMinutes: 30,
    skillNames: ['Python', 'Algorithms'],
  },
];

// ─── 5. Sessions ──────────────────────────────────────────────

interface SessionSeed {
  hostEmail: string;
  participantEmail: string;
  requestTitle: string;        // Para vincular con la help_request correcta
  title: string;
  language: ProgrammingLanguage;
  status: SessionStatus;
  durationSeconds?: number;
  finalCode?: string;
}

const SESSIONS_SEED: SessionSeed[] = [
  // Sesión completada: Alice + Bob (React hooks)
  {
    hostEmail: 'alice.johnson@demo.com',
    participantEmail: 'bob.smith@demo.com',
    requestTitle: 'useEffect se ejecuta infinitamente en loop',
    title: 'Debugging React useEffect — Alice & Bob',
    language: ProgrammingLanguage.JAVASCRIPT,
    status: SessionStatus.ACTIVE,
    durationSeconds: 2700, // 45 min
    finalCode: `import { useState, useEffect, useCallback } from 'react';

// SOLUCIÓN: Usar useCallback para estabilizar la referencia de filter
// y memoizar el objeto para evitar el re-render infinito.

function UserList() {
  const [users, setUsers] = useState([]);
  const [filterConfig, setFilterConfig] = useState({ role: 'all' });

  // Memoizamos el string del filtro para comparación estable
  const filterKey = JSON.stringify(filterConfig);

  useEffect(() => {
    // El efecto solo se ejecuta cuando el filterKey (string) cambia
    const controller = new AbortController();
    
    fetch(\`/api/users?filter=\${filterKey}\`, { signal: controller.signal })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });

    // Cleanup: cancela el request si el componente se desmonta
    return () => controller.abort();
  }, [filterKey]); // Dependencia estable (string primitivo)

  return <div>{users.map(u => <div key={u.id}>{u.name}</div>)}</div>;
}`,
  },
  // Sesión completada: Carlos + Marco (SQL optimization)
  {
    hostEmail: 'carlos.mendez@demo.com',
    participantEmail: 'marco.reyes@demo.com',
    requestTitle: 'Query MySQL muy lenta con JOIN en tablas grandes',
    title: 'Optimización de queries MySQL — Carlos & Marco',
    language: ProgrammingLanguage.SQL,
    status: SessionStatus.COMPLETED,
    durationSeconds: 5400, // 90 min
    finalCode: `-- SOLUCIÓN: Índices compuestos + query reescrita con CTEs

-- 1. Índices agregados (ejecutar primero):
CREATE INDEX idx_orders_user_date     ON orders(user_id, created_at);
CREATE INDEX idx_order_items_order    ON order_items(order_id, product_id);
CREATE INDEX idx_products_category    ON products(category, id);

-- 2. Query optimizada con CTE para filtrar primero:
WITH filtered_orders AS (
  SELECT id, user_id, total
  FROM orders
  WHERE created_at BETWEEN '2024-01-01' AND '2024-12-31'
),
electronics_items AS (
  SELECT oi.order_id
  FROM order_items oi
  INNER JOIN products p ON oi.product_id = p.id
  WHERE p.category = 'Electronics'
)
SELECT 
  u.name,
  COUNT(DISTINCT fo.id) AS total_orders,
  SUM(fo.total)         AS revenue
FROM filtered_orders fo
  INNER JOIN electronics_items ei ON fo.id = ei.order_id
  INNER JOIN users u              ON fo.user_id = u.id
GROUP BY u.id, u.name
ORDER BY revenue DESC
LIMIT 20;

-- Resultado: 31.47s → 0.23s (reducción del 99.3%)`,
  },
];

// ─── 6. Feedbacks ─────────────────────────────────────────────

interface FeedbackSeed {
  sessionTitle: string;
  reviewerEmail: string;
  revieweeEmail: string;
  rating: 1 | 2 | 3 | 4 | 5;
  ratingCommunication?: 1 | 2 | 3 | 4 | 5;
  ratingKnowledge?: 1 | 2 | 3 | 4 | 5;
  ratingPunctuality?: 1 | 2 | 3 | 4 | 5;
  comment: string;
  wouldRecommend: boolean;
}

const FEEDBACKS_SEED: FeedbackSeed[] = [
  // Feedback de Marco → Carlos (sesión SQL)
  {
    sessionTitle: 'Optimización de queries MySQL — Carlos & Marco',
    reviewerEmail: 'marco.reyes@demo.com',
    revieweeEmail: 'carlos.mendez@demo.com',
    rating: 5,
    ratingCommunication: 5,
    ratingKnowledge: 5,
    ratingPunctuality: 5,
    comment: 'Carlos es un DBA increíble. No sólo me ayudó a optimizar la query de 31 segundos a 0.23 segundos, sino que me explicó EXACTAMENTE cómo funciona el query planner de MySQL y cómo leer EXPLAIN. Aprendí más en 90 minutos que en semanas leyendo tutoriales. ¡Totalmente recomendado!',
    wouldRecommend: true,
  },
  // Feedback de Carlos → Marco (sesión SQL)
  {
    sessionTitle: 'Optimización de queries MySQL — Carlos & Marco',
    reviewerEmail: 'carlos.mendez@demo.com',
    revieweeEmail: 'marco.reyes@demo.com',
    rating: 4,
    ratingCommunication: 5,
    ratingKnowledge: 3,
    ratingPunctuality: 4,
    comment: 'Marco llegó con el problema bien documentado y con el código listo. Eso facilitó mucho la sesión. Tiene buen potencial para SQL, necesita practicar más con EXPLAIN y profiling pero sus bases son sólidas. Fue una sesión muy productiva.',
    wouldRecommend: true,
  },
  // Feedback de Bob → Alice (sesión React)
  {
    sessionTitle: 'Debugging React useEffect — Alice & Bob',
    reviewerEmail: 'bob.smith@demo.com',
    revieweeEmail: 'alice.johnson@demo.com',
    rating: 5,
    ratingCommunication: 5,
    ratingKnowledge: 5,
    ratingPunctuality: 5,
    comment: 'Alice es una mentora fantástica. Me explicó el problema del closure y el sistema de referencias de JavaScript de una manera que finalmente lo entendí. Además me enseñó el patrón de AbortController que no conocía. Cien por ciento la recomendaría a cualquier dev que quiera mejorar en React.',
    wouldRecommend: true,
  },
];

// ═════════════════════════════════════════════════════════════
//  SEED FUNCTIONS
// ═════════════════════════════════════════════════════════════

async function seedSkills(): Promise<Map<string, string>> {
  console.log('\n📚 Seeding skills catalog...');
  const skillMap = new Map<string, string>(); // name → id

  for (const skill of SKILLS_CATALOG) {
    const record = await prisma.skill.upsert({
      where: { name: skill.name },
      update: {
        description: skill.description,
        category: skill.category,
        updatedAt: new Date(),
      },
      create: {
        name: skill.name,
        slug: slugify(skill.name),
        category: skill.category,
        description: skill.description,
        isActive: true,
      },
      select: { id: true, name: true },
    });
    skillMap.set(record.name, record.id);
  }

  console.log(`   ✅ ${SKILLS_CATALOG.length} skills upserted`);
  console.log(`   📋 Required skills: React, Node.js, SQL, MySQL, PostgreSQL, JWT, TypeScript, Python`);
  return skillMap;
}

async function seedUsers(): Promise<Map<string, string>> {
  console.log('\n👥 Seeding users...');
  const userMap = new Map<string, string>(); // email → id

  for (const userSeed of USERS_SEED) {
    const passwordHash = await argon2.hash(userSeed.password, ARGON2_OPTIONS);

    const record = await prisma.user.upsert({
      where: { email: userSeed.email },
      update: {
        displayName: userSeed.displayName,
        bio: userSeed.bio,
        githubUrl: userSeed.githubUrl ?? null,
        updatedAt: new Date(),
      },
      create: {
        email: userSeed.email,
        username: userSeed.username,
        displayName: userSeed.displayName,
        passwordHash,
        bio: userSeed.bio,
        githubUrl: userSeed.githubUrl ?? null,
        role: userSeed.role,
        status: UserStatus.ACTIVE,
        isEmailVerified: true,
        preferredLanguage: userSeed.preferredLanguage,
      },
      select: { id: true, email: true, role: true },
    });

    userMap.set(record.email, record.id);
    const roleIcon = { ADMIN: '🔑', MENTOR: '🎓', STUDENT: '📖' }[record.role];
    console.log(`   ${roleIcon} ${record.email}`);
  }

  return userMap;
}

async function seedUserSkills(
  userMap: Map<string, string>,
  skillMap: Map<string, string>,
): Promise<void> {
  console.log('\n🔗 Seeding user skills...');
  let count = 0;

  for (const us of USER_SKILLS_SEED) {
    const userId = userMap.get(us.userEmail);
    const skillId = skillMap.get(us.skillName);

    if (!userId || !skillId) {
      console.warn(`   ⚠️  Skipping: ${us.userEmail} / ${us.skillName} — not found`);
      continue;
    }

    await prisma.userSkill.upsert({
      // UNIQUE: unique_user_skill (userId + skillId)
      where: { unique_user_skill: { userId, skillId } },
      update: {
        proficiency: us.proficiency,
        canMentor: us.canMentor,
        yearsOfExperience: us.yearsOfExperience ?? null,
        updatedAt: new Date(),
      },
      create: {
        userId,
        skillId,
        proficiency: us.proficiency,
        canMentor: us.canMentor,
        yearsOfExperience: us.yearsOfExperience ?? null,
      },
    });
    count++;
  }

  console.log(`   ✅ ${count} user-skill records upserted`);
}

async function seedHelpRequests(
  userMap: Map<string, string>,
  skillMap: Map<string, string>,
): Promise<Map<string, string>> {
  console.log('\n🆘 Seeding help requests...');
  const requestMap = new Map<string, string>(); // title → id

  for (const req of HELP_REQUESTS_SEED) {
    const studentId = userMap.get(req.studentEmail);
    const mentorId = req.mentorEmail ? userMap.get(req.mentorEmail) : null;

    if (!studentId) {
      console.warn(`   ⚠️  Skipping request: student ${req.studentEmail} not found`);
      continue;
    }

    const timestamps: {
      acceptedAt?: Date;
      resolvedAt?: Date;
    } = {};

    if (req.status === HelpRequestStatus.IN_PROGRESS || req.status === HelpRequestStatus.RESOLVED) {
      timestamps.acceptedAt = new Date(Date.now() - 3600_000 * 2); // 2h ago
    }
    if (req.status === HelpRequestStatus.RESOLVED) {
      timestamps.resolvedAt = new Date(Date.now() - 3600_000);     // 1h ago
    }

    const record = await prisma.helpRequest.upsert({
      where: {
        // No hay unique key natural — usamos title+studentId como proxy para upsert
        // En producción se usaría el ID. Aquí creamos un unique via title para el seed.
        id: `seed-${slugify(req.title)}-${studentId}`.substring(0, 36),
      },
      update: {
        status: req.status,
        mentorId: mentorId ?? null,
        ...timestamps,
        updatedAt: new Date(),
      },
      create: {
        id: `seed-${slugify(req.title)}-${studentId}`.substring(0, 36),
        studentId,
        mentorId: mentorId ?? null,
        title: req.title,
        description: req.description,
        codeSnippet: req.codeSnippet ?? null,
        errorMessage: req.errorMessage ?? null,
        language: req.language,
        status: req.status,
        priority: req.priority,
        estimatedMinutes: req.estimatedMinutes ?? null,
        ...timestamps,
      },
      select: { id: true, title: true, status: true },
    });

    // Vincular skills con la help request
    for (const skillName of req.skillNames) {
      const skillId = skillMap.get(skillName);
      if (!skillId) continue;
      await prisma.helpRequestSkill.upsert({
        where: { helpRequestId_skillId: { helpRequestId: record.id, skillId } },
        update: {},
        create: { helpRequestId: record.id, skillId },
      });
    }

    requestMap.set(record.title, record.id);
    const statusIcon: Record<string, string> = {
      OPEN: '🟢', IN_PROGRESS: '🔵', RESOLVED: '✅', CANCELLED: '❌', EXPIRED: '⏰',
    };
    console.log(`   ${statusIcon[record.status] ?? '❓'} "${record.title}"`);
  }

  return requestMap;
}

async function seedSessions(
  userMap: Map<string, string>,
  requestMap: Map<string, string>,
): Promise<Map<string, string>> {
  console.log('\n💻 Seeding sessions...');
  const sessionMap = new Map<string, string>(); // title → id

  for (const sess of SESSIONS_SEED) {
    const hostId = userMap.get(sess.hostEmail);
    const participantId = userMap.get(sess.participantEmail);
    const requestId = requestMap.get(sess.requestTitle);

    if (!hostId) {
      console.warn(`   ⚠️  Skipping session: host ${sess.hostEmail} not found`);
      continue;
    }

    const sessionId = `seed-sess-${slugify(sess.title)}`.substring(0, 36);
    const startedAt = new Date(Date.now() - (sess.durationSeconds ?? 0) * 1000 - 3600_000);
    const endedAt = sess.status === SessionStatus.COMPLETED
      ? new Date(startedAt.getTime() + (sess.durationSeconds ?? 0) * 1000)
      : null;

    const record = await prisma.session.upsert({
      // UNIQUE: unique_request_session en requestId
      where: { id: sessionId },
      update: {
        status: sess.status,
        finalCode: sess.finalCode ?? null,
        endedAt,
        updatedAt: new Date(),
      },
      create: {
        id: sessionId,
        requestId: requestId ?? null,
        hostId,
        participantId: participantId ?? null,
        title: sess.title,
        language: sess.language,
        status: sess.status,
        roomCode: generateRoomCode(),
        isPrivate: false,
        startedAt,
        endedAt,
        durationSeconds: sess.durationSeconds ?? null,
        finalCode: sess.finalCode ?? null,
      },
      select: { id: true, title: true, status: true, roomCode: true },
    });

    sessionMap.set(record.title, record.id);
    console.log(`   💬 "${record.title}" [${record.status}] — Room: ${record.roomCode}`);
  }

  return sessionMap;
}

async function seedFeedbacks(
  userMap: Map<string, string>,
  sessionMap: Map<string, string>,
): Promise<void> {
  console.log('\n⭐ Seeding feedbacks...');
  let count = 0;

  for (const fb of FEEDBACKS_SEED) {
    const sessionId = sessionMap.get(fb.sessionTitle);
    const reviewerId = userMap.get(fb.reviewerEmail);
    const revieweeId = userMap.get(fb.revieweeEmail);

    if (!sessionId || !reviewerId || !revieweeId) {
      console.warn(`   ⚠️  Skipping feedback: missing references for "${fb.sessionTitle}"`);
      continue;
    }

    await prisma.feedback.upsert({
      // UNIQUE: unique_session_feedback (sessionId, reviewerId, revieweeId)
      where: {
        unique_session_feedback: { sessionId, reviewerId, revieweeId },
      },
      update: {
        rating: fb.rating,
        ratingCommunication: fb.ratingCommunication ?? null,
        ratingKnowledge: fb.ratingKnowledge ?? null,
        ratingPunctuality: fb.ratingPunctuality ?? null,
        comment: fb.comment,
        wouldRecommend: fb.wouldRecommend,
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        reviewerId,
        revieweeId,
        rating: fb.rating,
        ratingCommunication: fb.ratingCommunication ?? null,
        ratingKnowledge: fb.ratingKnowledge ?? null,
        ratingPunctuality: fb.ratingPunctuality ?? null,
        comment: fb.comment,
        wouldRecommend: fb.wouldRecommend,
      },
    });

    const stars = '⭐'.repeat(fb.rating);
    console.log(`   ${stars} ${fb.reviewerEmail} → ${fb.revieweeEmail}`);
    count++;
  }

  console.log(`   ✅ ${count} feedbacks seeded`);
}

// ═════════════════════════════════════════════════════════════
//  MAIN ENTRYPOINT
// ═════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║    CodePair DB — Seed Script v2           ║');
  console.log('║    Reproducible · Idempotent · Typed      ║');
  console.log('╚═══════════════════════════════════════════╝');

  // Verificar conexión a la base de datos
  await prisma.$queryRaw`SELECT 1`;
  console.log('\n✅ Database connection OK');

  // Ejecutar seeds en orden (respetando FKs)
  const skillMap  = await seedSkills();
  const userMap   = await seedUsers();
                    await seedUserSkills(userMap, skillMap);
  const requestMap = await seedHelpRequests(userMap, skillMap);
  const sessionMap = await seedSessions(userMap, requestMap);
                    await seedFeedbacks(userMap, sessionMap);

  // Resumen final
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║    ✅ Seed completado exitosamente         ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('\n📊 Resumen:');
  console.log(`   🏷️  Skills: ${SKILLS_CATALOG.length} (incl. React, Node.js, SQL, MySQL, PostgreSQL, JWT, TypeScript, Python)`);
  console.log(`   👥 Users: ${USERS_SEED.length} (1 admin, 3 mentors, 3 students)`);
  console.log(`   🔗 User Skills: ${USER_SKILLS_SEED.length} asignaciones`);
  console.log(`   🆘 Help Requests: ${HELP_REQUESTS_SEED.length} solicitudes`);
  console.log(`   💻 Sessions: ${SESSIONS_SEED.length} sesiones`);
  console.log(`   ⭐ Feedbacks: ${FEEDBACKS_SEED.length} evaluaciones`);
  console.log('\n🔐 Credenciales de acceso:');
  console.log('   admin@codepair.dev    → Admin@CodePair2024!');
  console.log('   alice.johnson@demo.com → Demo@CodePair2024! (MENTOR)');
  console.log('   carlos.mendez@demo.com → Demo@CodePair2024! (MENTOR)');
  console.log('   bob.smith@demo.com    → Demo@CodePair2024! (STUDENT)');
}

main()
  .catch((error) => {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
