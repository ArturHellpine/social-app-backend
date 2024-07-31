const { prisma } = require("../prisma/prisma-client");

const FollowController = {
    followUser: async (req, res) => {
        try {
            const { followingId } = req.body
            const userId = req.user.userId

            if(followingId === userId) {
                return res.status(400).json({ error: 'Неможливо підписатись на себе' })
            }

            const existingFollow = await prisma.follows.findFirst({
                where: {
                    AND: [
                        { followerId: userId },
                        { followingId }
                    ]
                }
            })

            if(existingFollow) {
                return res.status(400).json({ error: 'Ви вже підписані' })
            }

            await prisma.follows.create({
                data: {
                    follower: { connect: { id: userId } },
                    following: { connect: { id: followingId } }
                }
            })

            res.status(201).json({ message: 'Ви успішно підписались' })

        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    unfollowUser: async (req, res) => {
        try {
            const { followingId } = req.body
            const userId = req.user.userId

            const follows = await prisma.follows.findFirst({
                where: {
                    AND: [
                        { followerId: userId },
                        { followingId }
                    ]
                }
            })

            if(!follows) {
                return res.status(404).json({ error: 'Ви не підписані' })
            }

            await prisma.follows.delete({
                where: { id: follows.id }
            })

            res.status(201).json({ message: 'Ви успішно відписались' })

        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    }
}

module.exports = FollowController