const { prisma } = require("../prisma/prisma-client");

const PostController = {
    createPost: async (req, res) => {
        try {
            const { content } = req.body
            const authorId = req.user.userId

            if(!content) {
                return res.status(400).json({ error: 'Заповніть обов’язкові поля' })
            }

            const post = await prisma.post.create({
                data: { content, authorId }
            })

            res.status(200).json(post)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    getAllPosts: async (req, res) => {
        try {
            const userId = req.user.userId
            const posts = await prisma.post.findMany({
                include: {
                    likes: true,
                    comments: true,
                    author: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })

            const postWithLikeInfo = posts.map(post => ({
                ...post,
                likedByUser: post.likes.some(like => like.userId === userId)
            }))

            res.json(postWithLikeInfo)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    getPostById: async (req, res) => {
        try {
            const { id } = req.params
            const userId = req.user.userId

            const post = await prisma.post.findUnique({
                where: { id },
                include: {
                    comments: {
                        include: {
                            user: true
                        }
                    },
                    likes: true,
                    author: true
                }
            })

            if(!post) {
                return res.status(404).json({ error: 'Пост не знайдено' })
            }

            const postWithLikeInfo = { ...post, likedByUser: post.likes.some(like => like.userId === userId) }

            res.status(200).json(postWithLikeInfo)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    deletePost: async (req, res) => {
        try {
            const { id } = req.params

            const post = await prisma.post.findUnique({
                where: { id }
            })

            if(!post) {
                return res.status(404).json({ error: 'Пост не знайдено' })
            }

            if(post.authorId !== req.user.userId) {
                return res.status(403).json({ error: 'Немає доступу' })
            }

            const transaction = await prisma.$transaction([
                prisma.comment.deleteMany({ where: { postId: id } }),
                prisma.like.deleteMany({ where: { postId: id } }),
                prisma.post.delete({ where: { id } })
            ])

            res.status(200).json(transaction)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    }
}

module.exports = PostController