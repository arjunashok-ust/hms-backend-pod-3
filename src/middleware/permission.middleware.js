const Role = require('../models/role.model');

const permission = (...requiredPermissions) => {
    return async (req,res,next) => {
        try{
            const role = await Role.findOne({role_name: req.user.role});
            if(!role){
                return res.status(403).json({message: "Role not found."});
            }
            const userPermission = role.role_permissions;
            const hasPermission = requiredPermissions.every((permission) => {
                return userPermission.includes(permission);
            })
            if(!hasPermission){
                 return res.status(401).json({message: "You are not authorized to perform this action."})
            }
            next();
        }
        catch(err){
            console.error(err);
            return res.status(500).json({message: "Access Denied"});
        }
    } 
}

module.exports =  permission;