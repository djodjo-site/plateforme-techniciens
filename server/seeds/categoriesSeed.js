// server/seeds/categoriesSeed.js
const { CATEGORIES_COMPETENCES } = require('../config/constants');

const seedCategories = async () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('📂 CATÉGORIES DE COMPÉTENCES DISPONIBLES');
  console.log('═══════════════════════════════════════════════════');

  CATEGORIES_COMPETENCES.forEach((cat, i) => {
    console.log(`  ${String(i + 1).padStart(2, '0')}. ${cat}`);
  });

  console.log('═══════════════════════════════════════════════════');
  console.log(`   Total : ${CATEGORIES_COMPETENCES.length} catégories`);
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  return { nombre: CATEGORIES_COMPETENCES.length };
};

module.exports = seedCategories;