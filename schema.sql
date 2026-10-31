

CREATE TABLE IF NOT EXISTS products (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    category TEXT NOT NULL DEFAULT 'Другое',

    price REAL NOT NULL DEFAULT 0,

    description TEXT DEFAULT '',

    image TEXT DEFAULT '',

    stock INTEGER NOT NULL DEFAULT 1,

    active INTEGER NOT NULL DEFAULT 1,

    created_at TEXT DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE IF NOT EXISTS orders (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    phone TEXT NOT NULL,

    address TEXT DEFAULT '',

    comment TEXT DEFAULT '',

    items TEXT NOT NULL,

    total REAL NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'new',

    created_at TEXT DEFAULT CURRENT_TIMESTAMP

);

INSERT INTO products

(name, category, price, description, image, stock, active)

VALUES

(

    'Стул для дома',

    'Мебель',

    1900,

    'Удобный стул для кухни и дома.',

    'https://images.unsplash.com/photo-1503602642458-232111445657?w=800',

    1, 1

),

(

    'Обеденный стол',

    'Мебель',

    5900,

    'Практичный стол для семейных обедов.',

    'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800',

    1, 1

),

(

    'Шкаф для хранения',

    'Мебель',

    8900,

    'Вместительный шкаф для ваших вещей.',

    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800',

    1, 1

),

(

    'Полка настенная',

    'Для дома',

    990,

    'Удобная полка для хранения и декора.',

    'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800',

    1, 1

);
