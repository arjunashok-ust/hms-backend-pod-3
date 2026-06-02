const authorizeRoles =
(...roles) => {

    return (req, res, next) => {

        // Check role exists

        if (
            !roles.includes(req.user.role)
        ) {

            return res.status(403).json({

                message:
                "Only Admin has access"

            });

        }

        next();

    };

};

module.exports =  {authorizeRoles};