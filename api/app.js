const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');  // Importar o método v4 do uuid para gerar IDs únicos
const { Client } = require('pg');

// Conectar ao banco de dados Neon usando a URL de conexão do banco
const client = new Client({
  connectionString: process.env.DATABASE_URL, // Variável de ambiente com a URL de conexão
});

client.connect()
  .then(() => {
    console.log('Conectado ao banco de dados Neon');
  })
  .catch((err) => {
    console.error('Erro ao conectar ao banco de dados:', err);
  });

// Iniciar o app
const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Função para salvar as sugestões no banco de dados
async function salvarSugestoes(sugestoes) {
  try {
    // Inserir sugestões no banco
    for (const sugestao of sugestoes) {
      const { nome, bairro, rua, residuo, observacao, _id } = sugestao;
      await client.query(
        'INSERT INTO sugestoes(id, nome, bairro, rua, residuo, observacao) VALUES($1, $2, $3, $4, $5, $6)',
        [_id, nome, bairro, rua, residuo, observacao || '']
      );
    }
    console.log('Sugestões salvas no banco de dados!');
  } catch (err) {
    console.error('Erro ao salvar sugestões no banco de dados:', err);
  }
}

// Função para ler as sugestões do banco de dados
async function lerSugestoes() {
  try {
    const result = await client.query('SELECT * FROM sugestoes');
    return result.rows;
  } catch (err) {
    console.error('Erro ao ler sugestões do banco de dados:', err);
    return [];
  }
}

// Rota para adicionar uma sugestão
app.post('/api/sugestoes', async (req, res) => {
  const { nome, bairro, rua, residuo, observacao } = req.body;

  // Verificar se algum campo está faltando
  if (!nome || !bairro || !rua || !residuo) {
    return res.status(400).send({ message: 'Todos os campos (nome, bairro, rua, residuo) são obrigatórios.' });
  }

  try {
    // Criar uma nova sugestão com um ID único gerado pelo uuid
    const novaSugestao = { 
      _id: uuidv4(),  // Gerar um ID único
      nome, 
      bairro, 
      rua,
      residuo, 
      observacao: observacao || ''  // Se a observação não for fornecida, salvar como string vazia
    };

    // Salvar a nova sugestão no banco de dados
    await salvarSugestoes([novaSugestao]);

    res.status(201).send({ message: 'Sugestão recebida!' });
  } catch (err) {
    res.status(500).send({ message: 'Erro ao salvar sugestão', error: err });
  }
});

// Rota para listar todas as sugestões
app.get('/api/sugestoes', async (req, res) => {
  try {
    const sugestoes = await lerSugestoes();  // Carregar sugestões do banco de dados
    res.status(200).json(sugestoes);
  } catch (err) {
    res.status(500).send({ message: 'Erro ao carregar sugestões', error: err });
  }
});

// Rota para adicionar a observação
app.post('/api/sugestoes/observacao', async (req, res) => {
  const { id, observacao } = req.body;

  if (!id || !observacao) {
    return res.status(400).send({ message: 'ID e observação são obrigatórios.' });
  }

  try {
    // Atualizar a observação no banco de dados
    await client.query(
      'UPDATE sugestoes SET observacao = $1 WHERE id = $2',
      [observacao, id]
    );
    res.status(200).send({ message: 'Observação salva com sucesso!' });
  } catch (err) {
    res.status(500).send({ message: 'Erro ao salvar observação', error: err });
  }
});

// Rota para deletar uma sugestão
app.delete('/api/sugestoes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Deletar a sugestão do banco de dados
    await client.query('DELETE FROM sugestoes WHERE id = $1', [id]);

    res.status(200).send({ message: 'Sugestão deletada com sucesso!' });
  } catch (err) {
    res.status(500).send({ message: 'Erro ao deletar sugestão', error: err });
  }
});

// Dados de login do administrador (você pode usar um banco de dados posteriormente)
const adminCredenciais = {
  username: "greentech",
  password: "12greentech34",
};

// Rota de login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === adminCredenciais.username && password === adminCredenciais.password) {
    return res.status(200).send({ message: "Login bem-sucedido" });
  }
  res.status(401).send({ message: "Credenciais inválidas" });
});

// Exportando para o Vercel
const serverless = require('serverless-http');
module.exports.handler = serverless(app);  // Exporta a função handler para o Vercel

// Iniciar o servidor na porta 3000
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
