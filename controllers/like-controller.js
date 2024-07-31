const { prisma } = require("../prisma/prisma-client");

const LikeController = {
    likePost: async (req, res) => {
        try {
            const { postId } = req.body
            const userId = req.user.userId

            if(!postId) {
                return res.status(400).json({ error: 'Заповніть обов’язкові поля' })
            }

            const existingLike = await prisma.like.findFirst({
                where: { postId, userId }
            })

            if(existingLike) {
                return res.status(400).json({ error: 'Ви вже поставили лайк' })
            }

            const like = await prisma.like.create({
                data: { postId, userId }
            })

            res.status(200).json(like)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    unlikePost: async (req, res) => {
        try {
            const { id } = req.params
            const userId = req.user.userId

            if(!id) {
                return res.status(400).json({ error: 'Ви вже забрали лайк' })
            }

            const existingLike = await prisma.like.findFirst({
                where: { postId: id, userId }
            })

            if(!existingLike) {
                return res.status(400).json({ error: 'Неможливо поставити дізлайк' })
            }

            const like = await prisma.like.deleteMany({
                where: { postId: id, userId }
            })

            res.status(200).json(like)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    }
}

module.exports = LikeController