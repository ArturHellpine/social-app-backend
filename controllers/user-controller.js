const { prisma } = require("../prisma/prisma-client");
const bcrypt = require("bcryptjs")
const Jdenticon = require("jdenticon")
const path = require("path");
const fs = require("fs")
const jwt = require("jsonwebtoken")

const UserController = {
    register: async (req, res) => {
        try {
            const { email, password, name } = req.body

            if(!email || !password || !name) {
                return res.status(400).json({ error: 'Заповніть обов’язкові поля' })
            }

            const existUser = await prisma.user.findUnique({
                where: { email }
            })

            if(existUser) {
                return res.status(400).json({ error: 'Користувач з таким e-mail вже існує' })
            }

            const hashedPassword = await bcrypt.hash(password, 10)

            const png = Jdenticon.toPng(`${name}${Date.now()}`, 200)
            const avatarName = `${name}_${Date.now()}.png`
            const avatarPath = path.join(__dirname, '/../uploads', avatarName)
            fs.writeFileSync(avatarPath, png)

            const user = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    avatarUrl: `/uploads/${avatarName}`
                }
            })

            res.status(200).json(user)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body

            if(!email || !password) {
                return res.status(400).json({ error: 'Заповніть обов’язкові поля' })
            }

            const user = await prisma.user.findUnique({
                where: { email }
            })

            if(!user) {
                return res.status(400).json({ error: 'Невірний логін або пароль' })
            }

            const valid = await bcrypt.compare(password, user.password)

            if(!valid) {
                return res.status(400).json({ error: 'Невірний логін або пароль' })
            }

            const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY)

            res.status(200).json({ token })
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    getUserById: async (req, res) => {
        try {
            const { id } = req.params
            const userId = req.user.userId

            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    followers: true,
                    following: true
                }
            })

            if(!user) {
                return res.status(404).json({ error: 'Користувача не знайдено' })
            }

            const isFollowing = await prisma.follows.findFirst({
                where: {
                    AND: [
                        { followerId: userId },
                        { followingId: id }
                    ]
                }
            })

            res.json({...user, isFollowing: Boolean(isFollowing)})
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    updateUser: async (req, res) => {
        try {
            const { id } = req.params
            const { email, name, dateOfBirth, bio, location } = req.body

            let filePath

            if(req.file && req.file.path) {
                filePath = req.file.path
            }

            if(id !== req.user.userId) {
                return res.status(403).json({ error: 'Немає доступа' })
            }

            if(email) {
                const existingUser = await prisma.user.findFirst({
                    where: { email: email }
                })

                if(existingUser && existingUser.id !== parseInt(id)) {
                    return res.status(400).json({ error: 'E-mail вже зайнятий' })
                }
            }

            const user = await prisma.user.update({
                where: { id },
                data: {
                    email: email || undefined,
                    name: name || undefined,
                    avatarUrl: filePath ? `/${filePath}` : undefined,
                    dateOfBirth: dateOfBirth || undefined,
                    bio: bio || undefined,
                    location: location || undefined
                }
            })

            res.json(user)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },

    current: async (req, res) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.user.userId },
                include: {
                    followers: {
                        include: {
                            follower: true
                        }
                    },
                    following: {
                        include: {
                            following: true
                        }
                    }
                }
            })

            if(!user) {
                return res.status(404).json({ error: 'Користувача не знайдено' })
            }

            res.status(200).json(user)
        } catch (error) {
            console.log(error)
            res.status(500).json({ error: 'Невідома помилка на сервері' })
        }
    },
}

module.exports = UserController
