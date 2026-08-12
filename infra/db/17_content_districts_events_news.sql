-- =============================================================================
-- Cañete Marketplace — Contenido editorial: distritos, noticias, eventos
-- Archivo: 17_content_districts_events_news.sql
-- Aditivo: no modifica tablas existentes (tenants, orders, etc.)
-- Ejecutar después de 16_zelita_tenant.sql
-- =============================================================================

-- IMPORTANTE (Windows): Este archivo contiene caracteres UTF-8 (ñ, á, etc.).
-- En Windows, psql usa client_encoding=WIN1252 por defecto, lo que causa doble
-- encoding (mojibake) al aplicar migraciones. Forzamos UTF-8 aquí:
SET client_encoding TO 'UTF8';
SET search_path TO canete_marketplace, public;

-- =============================================================================
-- TABLA: districts (distritos de la provincia de Cañete)
-- =============================================================================

CREATE TABLE IF NOT EXISTS districts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(80)  NOT NULL UNIQUE,
    name            VARCHAR(120) NOT NULL,
    description     TEXT,
    image_url       VARCHAR(500),
    region          VARCHAR(80)  NOT NULL DEFAULT 'Cañete',
    sort_order      INT          NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DO $$ BEGIN
    CREATE TRIGGER trg_districts_updated_at
        BEFORE UPDATE ON districts
        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- TABLA: news (noticias del portal)
-- =============================================================================

CREATE TABLE IF NOT EXISTS news (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(160) NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    summary         VARCHAR(500),
    content         TEXT,
    image_url       VARCHAR(500),
    category        VARCHAR(60)  NOT NULL DEFAULT 'Comunidad',
    district_id     UUID         REFERENCES districts(id) ON DELETE SET NULL,
    published_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DO $$ BEGIN
    CREATE TRIGGER trg_news_updated_at
        BEFORE UPDATE ON news
        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================================================
-- TABLA: events (eventos y festividades)
-- =============================================================================

CREATE TABLE IF NOT EXISTS events (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    slug            VARCHAR(160) NOT NULL UNIQUE,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    image_url       VARCHAR(500),
    category        VARCHAR(60)  NOT NULL DEFAULT 'Festividad',
    district_id     UUID         REFERENCES districts(id) ON DELETE SET NULL,
    event_date      DATE         NOT NULL,
    start_time      TIME,
    end_time        TIME,
    location        VARCHAR(200),
    is_featured     BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

DO $$ BEGIN
    CREATE TRIGGER trg_events_updated_at
        BEFORE UPDATE ON events
        FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_news_published_at ON news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events (event_date ASC);

-- =============================================================================
-- SEED: los 16 distritos de la provincia de Cañete
-- =============================================================================

INSERT INTO districts (slug, name, description, region, sort_order) VALUES
    ('san-vicente-de-canete', 'San Vicente de Cañete', 'Capital de la provincia, con playas, historia y la mejor tradición gastronómica de la costa sur.', 'Cañete', 1),
    ('lunahuana',             'Lunahuaná',             'Aventura, naturaleza y turismo vivencial junto al río Cañete: canotaje, viñedos y buena mesa.', 'Cañete', 2),
    ('cerro-azul',            'Cerro Azul',            'Playas y todo el año perfecto para surf, pesca artesanal y relax frente al mar.', 'Cañete', 3),
    ('asia',                  'Asia',                  'Playas exclusivas, vida nocturna y balnearios reconocidos en el verano limeño.', 'Cañete', 4),
    ('imperial',              'Imperial',              'Corazón comercial y de servicios del valle, con productos y ferias locales.', 'Cañete', 5),
    ('quilmana',              'Quilmaná',              'Tradición, cultura y gente amable en medio de campiñas y chacras productivas.', 'Cañete', 6),
    ('mala',                  'Mala',                  'Historia, arquitectura y buen clima, puerta de entrada al valle desde el norte.', 'Cañete', 7),
    ('nuevo-imperial',        'Nuevo Imperial',        'Naturaleza y paisajes de campo, ideal para el turismo rural y agroturismo.', 'Cañete', 8),
    ('zuniga',                'Zúñiga',                'Historia milenaria y arquitectura tradicional en la parte alta del valle.', 'Cañete', 9),
    ('pacaran',               'Pacarán',               'Clima cálido, viñedos y tradición pisquera en plena cuenca del río Cañete.', 'Cañete', 10),
    ('calango',               'Calango',               'Pueblo tranquilo de campiñas, ideal para el descanso y la vida de campo.', 'Cañete', 11),
    ('chilca',                'Chilca',                'Balnearios, humedales y aguas termales cerca de Lima.', 'Cañete', 12),
    ('coayllo',               'Coayllo',               'Pequeño valle escondido, naturaleza y tranquilidad rural.', 'Cañete', 13),
    ('san-antonio',           'San Antonio',           'Costa y campo unidos, con paisajes agrícolas y acceso al litoral.', 'Cañete', 14),
    ('san-luis',              'San Luis',              'Distrito agrícola con tradición frutícola en el valle de Cañete.', 'Cañete', 15),
    ('santa-cruz-de-flores',  'Santa Cruz de Flores',  'Uno de los distritos más pequeños del valle, campiña y vida tranquila.', 'Cañete', 16)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SEED: noticias iniciales (contenido editorial de ejemplo, editable desde BD)
-- =============================================================================

INSERT INTO news (slug, title, summary, content, category, district_id, published_at) VALUES
    ('fiesta-de-la-virgen-de-la-asuncion-2025',
     'Fiesta de la Virgen de la Asunción 2025',
     'Conoce la programación oficial de una de las festividades más importantes de San Vicente de Cañete.',
     'La Fiesta de la Virgen de la Asunción reúne cada año a devotos y visitantes en San Vicente de Cañete, con procesiones, ferias gastronómicas y actividades culturales para toda la familia.',
     'Festividades', (SELECT id FROM districts WHERE slug = 'san-vicente-de-canete'), now() - interval '5 days'),
    ('festival-gastronomico-del-camaron',
     'Festival Gastronómico del Camarón',
     'Las mejores propuestas con camarón de río se reúnen en Lunahuaná para celebrar la tradición culinaria del valle.',
     'Restaurantes y productores locales de Lunahuaná presentan sus mejores platos a base de camarón de río, acompañados de shows folclóricos y venta de productos regionales.',
     'Gastronomía', (SELECT id FROM districts WHERE slug = 'lunahuana'), now() - interval '10 days'),
    ('feria-artesanal-y-cultural-de-quilmana',
     'Feria Artesanal y Cultural de Quilmaná',
     'Artesanos y productores locales exponen lo mejor de su trabajo en una feria pensada para toda la familia.',
     'La feria reúne artesanía, productos agrícolas y presentaciones culturales representativas de Quilmaná y sus alrededores.',
     'Cultura', (SELECT id FROM districts WHERE slug = 'quilmana'), now() - interval '15 days'),
    ('nueva-ruta-turistica-camino-del-inca',
     'Nueva ruta turística: Camino del Inca en Cañete',
     'Una nueva ruta turística invita a descubrir el patrimonio histórico del Valle de Cañete a pie y en bicicleta.',
     'La ruta conecta distintos vestigios arqueológicos e históricos del valle, promoviendo el turismo sostenible y el trabajo con guías locales.',
     'Turismo', NULL, now() - interval '20 days')
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SEED: eventos y festividades iniciales
-- =============================================================================

INSERT INTO events (slug, title, description, category, district_id, event_date, start_time, location, is_featured) VALUES
    ('fiesta-de-la-virgen-de-la-asuncion',
     'Fiesta de la Virgen de la Asunción',
     'Procesión, misa central y feria gastronómica en honor a la patrona de San Vicente de Cañete.',
     'Festividad', (SELECT id FROM districts WHERE slug = 'san-vicente-de-canete'), CURRENT_DATE + interval '5 days', '10:00', 'Plaza de Armas, San Vicente de Cañete', true),
    ('festival-gastronomico-del-camaron-evento',
     'Festival Gastronómico del Camarón',
     'Restaurantes de Lunahuaná presentan sus mejores platos a base de camarón de río.',
     'Gastronomía', (SELECT id FROM districts WHERE slug = 'lunahuana'), CURRENT_DATE + interval '15 days', '11:00', 'Malecón de Lunahuaná', true),
    ('feria-artesanal-y-cultural-de-quilmana-evento',
     'Feria Artesanal y Cultural de Quilmaná',
     'Exposición y venta de artesanía y productos locales, con presentaciones culturales.',
     'Cultura', (SELECT id FROM districts WHERE slug = 'quilmana'), CURRENT_DATE + interval '28 days', '09:00', 'Plaza principal de Quilmaná', false),
    ('calendario-de-fiestas-patrias-en-canete',
     'Calendario de Fiestas Patrias en Cañete',
     'Actividades, desfiles y celebraciones por Fiestas Patrias en distintos distritos del valle.',
     'Festividad', NULL, CURRENT_DATE + interval '35 days', '08:00', 'Todo el Valle de Cañete', false)
ON CONFLICT (slug) DO NOTHING;
