const socket = io => {
    io.on('connection', client => {
        console.log("New client connected")

        client.on('data', data => {
            console.log("data: ")
            console.log(data)
        })

        
    })
}

module.exports = socket