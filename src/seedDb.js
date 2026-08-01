require('dotenv').config();
const pool = require('./db');

const corretores = [
  { name: 'Adriana', manager: 'Ricardo', creci: 'SP123456' },
  { name: 'Bruno', manager: 'Ricardo', creci: 'SP234567' },
  { name: 'Camila', manager: 'Ricardo', creci: 'SP345678' },
  { name: 'Diego', manager: 'Ricardo', creci: 'SP456789' },
  { name: 'Elaine', manager: 'Ricardo', creci: 'SP567890' },
  { name: 'Fabio', manager: 'Fernanda', creci: 'SP678901' },
  { name: 'Giovana', manager: 'Fernanda', creci: 'SP789012' },
  { name: 'Henrique', manager: 'Fernanda', creci: 'SP890123' },
  { name: 'Isabela', manager: 'Fernanda', creci: 'SP901234' },
  { name: 'Jonas', manager: 'Fernanda', creci: 'SP012345' },
  { name: 'Karla', manager: 'Marcelo', creci: 'SP111222' },
  { name: 'Leonardo', manager: 'Marcelo', creci: 'SP222333' },
  { name: 'Mariana', manager: 'Marcelo', creci: 'SP333444' },
  { name: 'Nicolas', manager: 'Marcelo', creci: 'SP444555' },
  { name: 'Olivia', manager: 'Marcelo', creci: 'SP555666' },
  { name: 'Patricia', manager: 'Juliana', creci: 'SP666777' },
  { name: 'Rafael', manager: 'Juliana', creci: 'SP777888' },
  { name: 'Sandra', manager: 'Juliana', creci: 'SP888999' },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function seedDb() {
  // Apagar dados existentes
  await pool.query('DELETE FROM draws');
  await pool.query('DELETE FROM users');
  console.log('Dados anteriores apagados!');

  // Inserir corretores
  for (const c of corretores) {
    await pool.query(
      'INSERT INTO users (name, manager, creci) VALUES ($1, $2, $3)',
      [c.name, c.manager, c.creci]
    );
  }
  console.log('Corretores inseridos!');

  // Simular 30 dias de sorteios
  const hoje = new Date();
  
  for (let dia = 29; dia >= 0; dia--) {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - dia);
    data.setHours(9, 0, 0, 0);

    // Entre 10 e 16 corretores por dia
    const quantidade = Math.floor(Math.random() * 7) + 10;
    const participantes = shuffleArray(corretores).slice(0, quantidade);
    const sorteio = shuffleArray(participantes);
    const round = 30 - dia;

    for (let i = 0; i < sorteio.length; i++) {
      const c = sorteio[i];
      await pool.query(
        'INSERT INTO draws (user_id, name, manager, creci, position, round, drawn_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          corretores.findIndex(x => x.name === c.name) + 1,
          c.name,
          c.manager,
          c.creci,
          i + 1,
          round,
          data.toISOString()
        ]
      );
    }

    console.log(`Rodada ${round} — ${data.toLocaleDateString('pt-BR')} — ${sorteio.length} participantes`);
  }

  console.log('\nBanco populado com sucesso!');
  await pool.end();
}

seedDb().catch(console.error);