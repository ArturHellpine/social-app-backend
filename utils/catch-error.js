const CatchError = (res) => {
    return res.status(500).json({ error: 'Помилка на сервері' })
}

module.exports = CatchError