const multer = require('multer')
const crypto = require('node:crypto')

const fileTypes = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'text/plain': 'txt'
}

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = fileTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        },
        fileFilter: (req, file, callback) => {
            callback(null, !!fileTypes[file.mimetype])
        }
    }),
})

exports.upload = upload