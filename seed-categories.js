const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const cats = [
  { name: 'Udang', slug: 'udang' },
  { name: 'Ikan Laut', slug: 'ikan laut' },
  { name: 'Ikan Air Tawar', slug: 'ikan air tawar' },
  { name: 'Hasil Laut', slug: 'hasil laut' },
  { name: 'Lainnya', slug: 'lainnya' },
];
Promise.all(cats.map(c => p.productCategory.upsert({ where: { slug: c.slug }, create: c, update: {} })))
  .then(() => { console.log('Categories seeded!'); return p.$disconnect(); })
  .catch(e => { console.error(e); return p.$disconnect(); });
