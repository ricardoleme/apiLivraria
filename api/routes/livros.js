import express from 'express'
/* Importar a biblioteca do MongoDB */
import {MongoClient} from 'mongodb'
// Importa o express-validator
import { check, validationResult } from 'express-validator' 


/* Definido as variáveis de conexão */
const uri = 'mongodb://localhost:27017'
const client = new MongoClient(uri)
const dbName = 'livraria'
const router = express.Router()
// Função para conectar no banco de dados
async function connectToDatabase(){
    try{
        await client.connect()
        console.log(`Conectado ao database ${dbName}`)
    } catch(err){
        console.error(`Erro ao conectar: ${err.message}`)
    }
}


/* Definindo a rota /livros via método GET */
router.get('/', async(req, res)=> {
    try{
       await connectToDatabase()
       const db = client.db(dbName) 
       const livros = db.collection('livros') 
       let result = await livros.find().toArray()
       res.status(200).json(result)        
    } catch (err){
        res.status(500).json({"error": `${err.message}`})
    }
})

/* Definindo a rota /livros/:id via método GET */
router.get('/id/:id', async(req, res)=> {
    try{
       await connectToDatabase()
       const db = client.db(dbName) 
       const livros = db.collection('livros') 
       let result = await livros.find({'ISBN': req.params.id}).toArray()
       res.status(200).json(result)        
    } catch (err){
        res.status(500).json({"error": `${err.message}`})
    }
})

const validaLivro = [
    // Validação dos campos
    check('ISBN').isString({min:13, max:13}).withMessage('O ISBN deve conter 13 números'),
    check('titulo').notEmpty().withMessage('O título é obrigatório'),
    check('tituloEs').optional(), // Título em espanhol é opcional
    check('paginas').isInt({ min: 1 }).withMessage('Número de páginas deve ser um inteiro positivo'),
    check('lancamento').isISO8601().withMessage('A data de lançamento deve estar no formato YYYY-MM-DD'),
    check('generos').isArray().withMessage('Gêneros devem ser uma lista de strings'),
    check('editora').notEmpty().withMessage('A editora é obrigatória'),
    check('autores').isArray().withMessage('Autores devem ser uma lista de strings'),
    //https://www.htmlsymbols.xyz/unicode/U+2B50
    check('avaliacao').matches(/^[\u2B50]{1,5}$/).withMessage('A avaliação deve ser entre 1 e 5 estrelas (⭐⭐⭐⭐⭐)')
]

// Rota POST para adicionar um novo livro
router.post('/', validaLivro, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        await connectToDatabase()
        const db = client.db(dbName)
        const livros = db.collection('livros')

        // Pegando os dados do corpo da requisição
        const novoLivro = req.body

        // Inserindo o novo livro no banco
        const result = await livros.insertOne(novoLivro)

        // Retornando uma resposta de sucesso
        res.status(201).json({ message: 'Livro inserido com sucesso', id: result.insertedId })
    } catch (err) {
        res.status(500).json({ "error": `${err.message}` })
    }
})

// Rota PUT para editar um livro
router.put('/:isbn', validaLivro, async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        await connectToDatabase()
        const db = client.db(dbName)
        const livros = db.collection('livros')

          // Pegando o ISBN da URL e os dados do corpo da requisição
          const { isbn } = req.params
          const dadosAtualizados = req.body

        // Atualizando o livro no banco
        const result = await livros.updateOne(
            { ISBN: isbn }, // Critério de busca
            { $set: dadosAtualizados } // Atualizando apenas os campos fornecidos
        )

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Livro não encontrado' })
        }

        // Retornando uma resposta de sucesso
        res.status(200).json({ message: 'Livro atualizado com sucesso' })
    } catch (err) {
        res.status(500).json({ "error": `${err.message}` })
    }
})

// Rota DELETE para remover um livro
router.delete('/:isbn', async (req, res) => {
    try {
        await connectToDatabase()
        const db = client.db(dbName)
        const livros = db.collection('livros')

        // Pegando o ISBN da URL
        const { isbn } = req.params

        // Deletando o livro no banco
        const result = await livros.deleteOne({ ISBN: isbn })

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Livro não encontrado' })
        }

        // Retornando uma resposta de sucesso
        res.status(200).json({ message: 'Livro removido com sucesso' })
    } catch (err) {
        res.status(500).json({ "error": `${err.message}` })
    }
})



export default router