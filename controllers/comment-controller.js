const { prisma } = require("../prisma/prisma-client");

const CommentController = {
    createComment: async (req, res) => {
        try {
            const { postId, content } = req.body
            const userId = req.user.userId

            if(!postId || !content) {
                return res.status(400).json({ error: 'Заповніть обов’язкові поля' })
            }

            const comment = await prisma.comment.create({
                data: {
                    postId,
                    userId,
                    content
                }
            })

            res.status(200).json(comment)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    deleteComment: async (req, res) => {
        try {
            const { id } = req.params
            const userId = req.user.userId

            const comment = await prisma.comment.findUnique({
                where: { id }
            })

            if(!comment) {
                return res.status(404).json({ error: 'Коментар не знайдено' })
            }

            if(comment.userId !== userId) {
                return res.status(403).json({ error: 'Немає доступу' })
            }

            await prisma.comment.delete({
                where: { id }
            })

            res.status(200).json(comment)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    }
}

module.exports = CommentController