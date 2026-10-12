const isProduction = process.env.NODE_ENV === 'production';

const config = {
    isProduction,
    // base url of the REST api, used to build the links sent in emails
    publicApiUrl: process.env.PUBLIC_API_URL || 'https://hms.fortrancer.in/api',
    adminMail: process.env.ADMIN_MAIL,
    // the refresh token cookie must be secure + cross site in production (render serves https)
    refreshCookie: {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
    },
};

module.exports = config;
