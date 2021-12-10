const mailjet = require ('node-mailjet')
    .connect("c099e4a3201b60aa34ef53d1b27099c3", "0106380b73e26c815ef1be8e506b4063");

module.exports = function(email,resetToken,callback)
{
    const request = mailjet
        .post("send", {'version': 'v3.1'})
        .request({
            "Messages":[{
                "From": {
                    "Email": "prateek22012001@gmail.com",
                    "Name": "E-Commerce Website"
                },
                "To": [{
                    "Email": email,
                    "Name": "You"
                }],
                "Subject": "Reset Password Link",
                "TextPart": "Welcoming you on our website. To join us click below to complete registration process. Hurry up!",
                "HTMLPart": `Click on below given link to Reset Password</h3>
                <a href="http://localhost:3000/resetPassword/${resetToken}">Reset Password</a>`
            }]
        })
    request
        .then((result) => {
            callback(null,result.body)
        })
        .catch((err) => {
            callback(err.statusCode,null)
        })
}