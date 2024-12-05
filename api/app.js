const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');  // Importar o método v4 do uuid para gerar IDs únicos

// Iniciar o app
const app = express();


// Middleware
app.use(bodyParser.json());
app.use(cors());

// Caminho do arquivo onde as sugestões serão armazenadas
const sugestoesFilePath = path.join(__dirname, 'sugestoes.json');

// Função para ler as sugestões do arquivo
function lerSugestoes() {
    try {
        const data = fs.readFileSync(sugestoesFilePath, 'utf8');
        return JSON.parse(data);  // Lê o conteúdo e converte de volta para JSON
    } catch (err) {
        console.log('Erro ao ler o arquivo de sugestões:', err);
        return [];  // Se não existir o arquivo ou der erro, retorna um array vazio
    }
}

// Função para salvar as sugestões no arquivo
function salvarSugestoes(sugestoes) {
    try {
        fs.writeFileSync(sugestoesFilePath, JSON.stringify(sugestoes, null, 2), 'utf8');
        console.log('Sugestões salvas no arquivo!');
    } catch (err) {
        console.log('Erro ao salvar sugestões no arquivo:', err);
    }
}

// Rota para adicionar uma sugestão
app.post('/api/sugestoes', (req, res) => {
    const { nome, bairro, rua, residuo, observacao } = req.body;

    // Verificar se algum campo está faltando
    if (!nome || !bairro || !rua || !residuo) {
        return res.status(400).send({ message: 'Todos os campos (nome, bairro, rua, residuo) são obrigatórios.' });
    }

    try {
        // Ler as sugestões do arquivo
        const sugestoes = lerSugestoes();

        // Criar uma nova sugestão com um ID único gerado pelo uuid
        const novaSugestao = { 
            _id: uuidv4(),  // Gerar um ID único
            nome, 
            bairro, 
            rua,
            residuo, 
            observacao: observacao || ''  // Se a observação não for fornecida, salvar como string vazia
        };

        // Adicionar a nova sugestão ao array de sugestões
        sugestoes.push(novaSugestao);

        // Salvar as sugestões atualizadas no arquivo
        salvarSugestoes(sugestoes);

        res.status(201).send({ message: 'Sugestão recebida!' });
    } catch (err) {
        res.status(500).send({ message: 'Erro ao salvar sugestão', error: err });
    }
});

// Rota para listar todas as sugestões
app.get('/api/sugestoes', (req, res) => {
    try {
        const sugestoes = lerSugestoes();  // Carregar sugestões do arquivo
        res.status(200).json(sugestoes);
    } catch (err) {
        res.status(500).send({ message: 'Erro ao carregar sugestões', error: err });
    }
});

// Rota para adicionar a observação
app.post('/api/sugestoes/observacao', (req, res) => {
    const { id, observacao } = req.body;

    if (!id || !observacao) {
        return res.status(400).send({ message: 'ID e observação são obrigatórios.' });
    }

    try {
        // Ler as sugestões do arquivo
        const sugestoes = lerSugestoes();

        // Encontrar a sugestão pelo ID
        const sugestao = sugestoes.find(sugestao => sugestao._id === id);

        if (!sugestao) {
            return res.status(404).send({ message: 'Sugestão não encontrada' });
        }

        // Atualizar a observação
        sugestao.observacao = observacao;

        // Salvar as sugestões com a observação atualizada
        salvarSugestoes(sugestoes);

        res.status(200).send({ message: 'Observação salva com sucesso!' });
    } catch (err) {
        res.status(500).send({ message: 'Erro ao salvar observação', error: err });
    }
});

// Rota para deletar uma sugestão
app.delete('/api/sugestoes/:id', (req, res) => {
    const { id } = req.params;

    try {
        // Ler as sugestões do arquivo
        let sugestoes = lerSugestoes();

        // Encontrar a sugestão a ser deletada pelo ID
        const index = sugestoes.findIndex(sugestao => sugestao._id === id);

        if (index === -1) {
            return res.status(404).send({ message: 'Sugestão não encontrada' });
        }

        // Remover a sugestão do array
        sugestoes.splice(index, 1);

        // Salvar as sugestões atualizadas no arquivo
        salvarSugestoes(sugestoes);

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

// Iniciar o servidor na porta 3000
//app.listen(3000, () => {
//    console.log('Servidor rodando na porta 3000');
    
// Exportando para o Vercel
const serverless = require('serverless-http');
module.exports.handler = serverless(app);  // Exporta a função handler para o Vercel

});
