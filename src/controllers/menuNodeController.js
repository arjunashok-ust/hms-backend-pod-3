const MenuNode = require("../models/MenuNode");

exports.createMenuNode = async (req, res) => {
  try {
    const { name, key, path, icon, parentId, rolesAllowed, order } = req.body;

    if (!name || !path || !rolesAllowed || rolesAllowed.length === 0) {
      return res.status(400).json({
        message: "name, path and rolesAllowed are required",
      });
    }

    const existing = await MenuNode.findOne({
      $or: [{ key }, { path }],
    });

    if (existing) {
      return res.status(400).json({
        message: "Menu with same key or path already exists",
      });
    }

    const menuNode = new MenuNode({
      name,
      key,
      path,
      icon,
      parentId: parentId || null,
      rolesAllowed,
      order: order || 0,
      isActive: true,
    });

    await menuNode.save();

    return res.status(201).json({
      message: "Menu node created successfully",
      data: menuNode,
    });
  } catch (error) {
    console.error("Create Menu Error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.deleteMenuNode = async (req, res) => {
  try {
    const { id } = req.params;

    const menuNode = await MenuNode.findById(id);

    if (!menuNode) {
      return res.status(404).json({
        message: "Menu node not found",
      });
    }

    const children = await MenuNode.find({ parentId: id });

    if (children.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete menu node with child items. Delete children first.",
      });
    }

    await MenuNode.findByIdAndDelete(id);

    return res.json({
      message: "Menu node deleted successfully",
    });
  } catch (error) {
    console.error("Delete Menu Error:", error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

exports.getSidebarMenu = async (req, res) => {
  try {
    const userRole = req.user.role.toUpperCase();

    const accessibleNodes = await MenuNode.find({
      isActive: true,
      rolesAllowed: { $in: [userRole] },
    }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      menuItems: accessibleNodes,
    });
  } catch (error) {
    console.error("Fetch Sidebar Menu Error:", error);
    res
      .status(500)
      .json({
        message: "Internal server error generating navigation configuration",
      });
  }
};

exports.getMenus = async (req, res) => {
  try {
    const menus = await MenuNode.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json(menus);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching menus", error: error.message });
  }
};

exports.checkPermission = async (req, res) => {
  try {
    const { path } = req.params;
    const { role } = req.user;
    const searchPath = path.startsWith("/") ? path : `/${path}`;

    const node = await MenuNode.findOne({ path: searchPath });

    if (!node) {
      return res.json({ allowed: false, message: "Route not defined" });
    }

    const isAllowed = node.rolesAllowed.includes(role.toUpperCase());
    res.json({ allowed: isAllowed });
  } catch (error) {
    console.error("Permission check error:", error);
    res.status(500).json({ allowed: false, message: "Internal server error" });
  }
};
