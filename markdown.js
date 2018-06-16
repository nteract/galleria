// A declarative suite of functions for writing markdown
// Call these components if you like

const Heading = (text, level = 1) => `${"#".repeat(level)} ${text}\n`;
const Image = (url, description = "") => `!${Link(url, description)}\n`;
const Link = (url, description = "") => `[${description}](${url})\n`;
const Gallery = (images = []) => images.join("\n");
const P = text => text;
const Markdown = (...children) => children.join("\n");

module.exports = {
  Heading,
  Image,
  Gallery,
  Link,
  P,
  Markdown
};
