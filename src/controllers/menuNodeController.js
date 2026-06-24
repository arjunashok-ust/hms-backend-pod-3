const MenuNode = require("../models/MenuNode");
const ERR = require("../utils/errors.utils");

exports.createMenuNode = async (req, res) => {
  const { name, key, path, icon, parentId, rolesAllowed, order } = req.body;

  if (!name || !path || !rolesAllowed || rolesAllowed.length === 0) {
    throw ERR.invalidRequest(
      "name, path and rolesAllowed are required",
      "MENU_NODE_REQUIRED_FIELDS",
    );
  }

  const existing = await MenuNode.findOne({ $or: [{ key }, { path }] });
  if (existing) {
    throw ERR.conflict(
      "Menu with same key or path already exists",
      "MENU_NODE_CONFLICT",
    );
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
};

exports.deleteMenuNode = async (req, res) => {
  const { id } = req.params;

  const menuNode = await MenuNode.findById(id);
  if (!menuNode)
    throw ERR.notFound("Menu node not found", "MENU_NODE_NOT_FOUND");

  const children = await MenuNode.find({ parentId: id });
  if (children.length > 0) {
    throw ERR.invalidRequest(
      "Cannot delete menu node with child items. Delete children first.",
      "MENU_NODE_HAS_CHILDREN",
    );
  }

  await MenuNode.findByIdAndDelete(id);

  return res.json({ message: "Menu node deleted successfully" });
};

exports.getSidebarMenu = async (req, res) => {
  const userRole = req.user.role?.toUpperCase();
  if (!userRole) {
    throw ERR.invalidRequest(
      "User role is required to generate sidebar menu",
      "USER_ROLE_REQUIRED",
    );
  }

  const accessibleNodes = await MenuNode.find({
    isActive: true,
    rolesAllowed: { $in: [userRole] },
  }).sort({ order: 1 });

  return res.status(200).json({ success: true, menuItems: accessibleNodes });
};

exports.getMenus = async (req, res) => {
  const menus = await MenuNode.find({ isActive: true }).sort({ order: 1 });
  res.status(200).json(menus);
};

exports.checkPermission = async (req, res) => {
  const { path } = req.params;
  const { role } = req.user;
  const searchPath = path.startsWith("/") ? path : `/${path}`;

  const node = await MenuNode.findOne({ path: searchPath });
  if (!node) {
    return res.json({ allowed: false, message: "Route not defined" });
  }

  const isAllowed = node.rolesAllowed.includes(role.toUpperCase());
  res.json({ allowed: isAllowed });
};
