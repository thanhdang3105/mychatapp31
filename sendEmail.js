const nodemailer = require('nodemailer');

async function sendMail(code, email) {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        // config mail server
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.MAIL_SECRET, // generated ethereal user
            pass: process.env.SECRET_PASSWORD, // generated ethereal password
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false,
        },
    });

    // send mail with defined transport object
    const html = `
    <h2>Cảm ơn bạn vì đã sử dụng sản phẩm của chúng tôi ❤</h2>
    <h3>Mã xác thực của bạn là:</h3>
    <h3>${code}</h3>
    Mã sẽ hết hạn sau 10p
    Nếu bạn không yêu cầu mã xác thực, bạn có thể bỏ qua email này.</br>
    Cảm ơn bạn!`;
    // send mail with defined transport object
    await transporter.sendMail({
        from: '"Noreply 👻" MyChatApp', // sender address
        to: email, // list of receivers
        subject: 'Xác thực ✔', // Subject line
        text: 'Chào bạn.', // plain text body
        html: html, // html body
    });
}

module.exports = { sendMail };
