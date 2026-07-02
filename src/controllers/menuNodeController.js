const MenuNode = require("../models/MenuNode");
const ERR = require("../utils/errors.utils");

const normalizeRoles = (roles) =>
  Array.isArray(roles)
    ? roles.map((role) =>
        typeof role === "string" ? role.trim().toUpperCase() : role,
      )
    : [];

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

exports.createMenuNode = async (req, res) => {
  const { name, key, path, icon, parentId, rolesAllowed, order } = req.body;

  if (!name || !path || !icon) {
    throw ERR.invalidRequest(
      "name, path and icon are required",
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
    rolesAllowed: normalizeRoles(rolesAllowed),
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

  const normalizedRole = escapeRegex(userRole);
  const accessibleNodes = await MenuNode.find({
    isActive: true,
    rolesAllowed: { $in: [new RegExp(`^${normalizedRole}$`, "i")] },
  }).sort({ order: 1 });

  return res.status(200).json({ success: true, menuItems: accessibleNodes });
};

exports.getMenus = async (req, res) => {
  try {
    // If the request URL has ?all=true, fetch everything. Otherwise, only fetch active.
    const fetchAll = req.query.all === "true";
    const filter = fetchAll ? {} : { isActive: true };

    const menus = await MenuNode.find(filter).sort({ order: 1 });

    res.status(200).json(menus);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching menu nodes", error: error.message });
  }
};

exports.checkPermission = async (req, res) => {
  const { path } = req.params;
  const { role } = req.user;
  const searchPath = path.startsWith("/") ? path : `/${path}`;

  const node = await MenuNode.findOne({ path: searchPath });
  if (!node) {
    return res.json({ allowed: false, message: "Route not defined" });
  }

  const normalizedRole = role?.toUpperCase();
  const isAllowed = (node.rolesAllowed || []).some(
    (allowedRole) => allowedRole?.toUpperCase() === normalizedRole,
  );
  res.json({ allowed: isAllowed });
};

exports.updateMenuNode = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedNode = await MenuNode.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true },
    );

    if (!updatedNode)
      return res.status(404).json({ message: "Menu node not found" });
    res.status(200).json({
      success: true,
      data: updatedNode,
      message: "Node updated successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating menu node", error: error.message });
  }
};
