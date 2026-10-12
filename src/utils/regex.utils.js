const escapeRegex = (text) => text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

const caseInsensitive = (text) => ({ $regex: escapeRegex(text), $options: 'i' });

module.exports = { escapeRegex, caseInsensitive };
