// A declarative suite of functions for writing markdown
// Call these components if you like

const Heading = (text, level = 1) => `${"#".repeat(level)} ${text}`;
const Image = (url, description = "") => `![${description}](${url})`;
const Gallery = images => images.join("\n");
const P = text => text;
const Markdown = (...children) => children.join("\n\n");

module.exports = {
  Heading,
  Image,
  Gallery,
  P,
  Markdown
};
