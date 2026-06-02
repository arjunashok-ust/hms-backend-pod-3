const Node = require('../models/node');


exports.createNode = async (req, res) => {

    try {
        const node = await Node.create(req.body);
        return res.status(201).json({
            message: "Node created successfully",
            node
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error During Create Node"
        });
    }
};

exports.getNodesByRole = async (req, res) => {

    try {

        const role = req.user.role;
        const nodes = await Node.find({
            role: role
        }).sort({ order: 1 });
        console.log(req.user.role)
        return res.status(200).json(nodes);

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error During Get Nodes By Role"
        });
    }
};

exports.getAllNodes = async (req, res) => {

    try {
        const nodes = await Node.find()
            .sort({ order: 1 });
        return res.status(200).json(nodes);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: "Server Error During Get All Nodes"
        });
    }
};

